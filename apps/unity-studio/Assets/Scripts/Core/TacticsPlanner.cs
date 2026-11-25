using System;
using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    /// <summary>Ground-plane point (x, z) in metres. Kept tiny so Core stays free of UnityEngine.</summary>
    public readonly struct Vec2
    {
        public readonly float X, Z;
        public Vec2(float x, float z) { X = x; Z = z; }
        public static Vec2 operator +(Vec2 a, Vec2 b) => new Vec2(a.X + b.X, a.Z + b.Z);
        public static Vec2 operator -(Vec2 a, Vec2 b) => new Vec2(a.X - b.X, a.Z - b.Z);
        public static Vec2 operator *(Vec2 a, float k) => new Vec2(a.X * k, a.Z * k);
        public float Length => (float)Math.Sqrt(X * X + Z * Z);
        public static float Distance(Vec2 a, Vec2 b) => (a - b).Length;
        public Vec2 Normalized { get { float l = Length; return l > 1e-6f ? new Vec2(X / l, Z / l) : new Vec2(0, 0); } }
        public override string ToString() => $"({X:0.0}, {Z:0.0})";
    }

    /// <summary>An axis-aligned obstacle seen from above, e.g. a crate or wall collider's bounds.</summary>
    public readonly struct CoverBox
    {
        public readonly float MinX, MinZ, MaxX, MaxZ, Height;
        public readonly bool Usable;   // false for glass, thin fences, trees, pass-through props

        public CoverBox(float minX, float minZ, float maxX, float maxZ, float height, bool usable = true)
        { MinX = minX; MinZ = minZ; MaxX = maxX; MaxZ = maxZ; Height = height; Usable = usable; }

        public Vec2 Center => new Vec2((MinX + MaxX) / 2, (MinZ + MaxZ) / 2);
        public float HalfX => (MaxX - MinX) / 2;
        public float HalfZ => (MaxZ - MinZ) / 2;
    }

    public enum CombatBehavior { Cover, Push, Flank, Suppress, Hold }

    public struct PlanResult
    {
        public bool HasGoal;
        public Vec2 Goal;
        public bool InCover;      // the goal is a cover spot (peek / hide there)
        public bool Retreat;      // fell back: switch the brain to RETREAT and call the squad
        public bool Replanned;    // the 2.5–5.5 s re-plan happened this call (grenade decisions hang off this, like the web game)
    }

    /// <summary>Combat movement planning ported from Enemies.findCover() / Enemies.plan() in the web game.
    /// The engine layer supplies the obstacles near the enemy and the goals other enemies already took;
    /// randomness comes from an injected System.Random so tests are repeatable.</summary>
    public sealed class TacticsPlanner
    {
        public const float MinCoverHeight = 0.95f;   // must hide a crouched body
        public const float MaxCoverHalfSize = 16f;   // whole buildings are not "cover"
        public const float StandOff = 0.75f;         // metres behind the obstacle's edge
        public const float TakenRadius = 1.6f;       // two enemies never share a spot

        public readonly CombatBehavior Behavior;
        public int Side { get; private set; } = 1;   // which way to step or flank next (+1 / -1)
        public bool Retreated { get; private set; }
        public float PlanTimer { get; private set; }
        readonly Random _rng;

        public TacticsPlanner(CombatBehavior behavior, Random rng = null) { Behavior = behavior; _rng = rng ?? new Random(); }

        public static CombatBehavior BehaviorFor(EnemyType t) =>
            t == EnemyType.Assault ? CombatBehavior.Push :
            t == EnemyType.Elite ? CombatBehavior.Flank :
            t == EnemyType.Heavy ? CombatBehavior.Suppress :
            t == EnemyType.Sniper ? CombatBehavior.Hold : CombatBehavior.Cover;

        /// <summary>Best spot behind an obstacle as seen from <paramref name="threat"/>, searched around <paramref name="center"/>:
        /// close to the enemy and about <paramref name="wantDist"/> from the threat. Null when nothing fits.</summary>
        public static Vec2? FindCover(Vec2 self, Vec2 threat, Vec2 center, float radius, float wantDist,
            IReadOnlyList<CoverBox> boxes, IReadOnlyList<Vec2> takenGoals = null)
        {
            Vec2? best = null; float bestScore = float.MaxValue;
            foreach (var c in boxes)
            {
                if (!c.Usable || c.Height < MinCoverHeight || c.HalfX > MaxCoverHalfSize || c.HalfZ > MaxCoverHalfSize) continue;
                var cc = c.Center;
                if (Vec2.Distance(cc, center) > radius + Math.Max(c.HalfX, c.HalfZ)) continue;
                var away = (cc - threat).Normalized;                                // from the threat through the box
                if (away.Length < 0.5f) continue;
                float ext = Math.Min(c.HalfX / Math.Max(1e-3f, Math.Abs(away.X)), c.HalfZ / Math.Max(1e-3f, Math.Abs(away.Z))) + StandOff;
                var p = cc + away * ext;                                             // just past the far edge
                bool taken = false;
                if (takenGoals != null) foreach (var g in takenGoals) if (Vec2.Distance(g, p) < TakenRadius) { taken = true; break; }
                if (taken) continue;
                float score = Vec2.Distance(p, self) + Math.Abs(Vec2.Distance(p, threat) - wantDist) * 0.6f;
                if (score < bestScore) { bestScore = score; best = p; }
            }
            return best;
        }

        /// <summary>Called every think-tick while in COMBAT. Returns a new movement goal when it is time to re-plan
        /// (every 2.5–5.5 s, or at once when hurt below a third of its health).</summary>
        public PlanResult Plan(float dt, Vec2 self, Vec2 threat, float hpFraction, bool inCoverNow, bool seesTarget,
            IReadOnlyList<CoverBox> boxes, IReadOnlyList<Vec2> takenGoals = null)
        {
            var r = new PlanResult();
            if (Behavior == CombatBehavior.Hold) return r;
            float dist = Vec2.Distance(self, threat);

            if (hpFraction < 0.33f && !Retreated && (Behavior == CombatBehavior.Cover || Behavior == CombatBehavior.Push) && _rng.NextDouble() < 0.7)
            {
                Retreated = true;
                var back = (self - threat).Normalized;
                var c = FindCover(self, threat, self + back * 18f, 16f, dist + 18f, boxes, takenGoals);
                r.HasGoal = true; r.Goal = c ?? self + back * 20f; r.InCover = c.HasValue; r.Retreat = true;
                return r;
            }

            PlanTimer -= dt;
            if (PlanTimer > 0) return r;
            PlanTimer = 2.5f + (float)_rng.NextDouble() * 3f;
            r.Replanned = true;

            Vec2? goal = null; bool cover = Behavior != CombatBehavior.Suppress;
            switch (Behavior)
            {
                case CombatBehavior.Cover:
                    if (!inCoverNow || !seesTarget || dist < 8f) goal = FindCover(self, threat, self, 24f, Clamp(dist, 18f, 45f), boxes, takenGoals);
                    if (!goal.HasValue && !inCoverNow)
                    {
                        var fwd = (threat - self).Normalized; var sideStep = new Vec2(-fwd.Z, fwd.X) * (4f * Side);
                        goal = self + sideStep; cover = false;
                    }
                    Side = -Side;
                    break;
                case CombatBehavior.Push:
                    if (dist > 16f)
                    {
                        float k = Math.Min(14f, dist - 12f) / dist;
                        var step = self + (threat - self) * k;
                        goal = FindCover(self, threat, step, 12f, 14f, boxes, takenGoals);
                        if (!goal.HasValue) { goal = step; cover = false; }
                    }
                    else goal = FindCover(self, threat, self, 12f, 12f, boxes, takenGoals);
                    break;
                case CombatBehavior.Flank:
                {
                    double a = Math.Atan2(self.X - threat.X, self.Z - threat.Z) + Side * (0.7 + _rng.NextDouble() * 0.5);
                    float rad = Clamp(dist * 0.75f, 12f, 26f);
                    var f = new Vec2(threat.X + (float)Math.Sin(a) * rad, threat.Z + (float)Math.Cos(a) * rad);
                    goal = FindCover(self, threat, f, 12f, rad, boxes, takenGoals);
                    if (!goal.HasValue) { goal = f; cover = false; }
                    if (_rng.NextDouble() < 0.3) Side = -Side;
                    break;
                }
                case CombatBehavior.Suppress:
                    if (dist > 24f) goal = self + (threat - self) * 0.3f;
                    break;
            }
            if (goal.HasValue) { r.HasGoal = true; r.Goal = goal.Value; r.InCover = cover; }
            return r;
        }

        static float Clamp(float v, float lo, float hi) => v < lo ? lo : v > hi ? hi : v;
    }

    /// <summary>Peek / hide rhythm while sitting in cover (web: e.peekT): hidden 0.9–2.7 s, exposed 1.4–3.0 s.</summary>
    public sealed class PeekCycle
    {
        public bool Hidden { get; private set; }
        float _t;
        readonly Random _rng;
        public PeekCycle(Random rng = null) { _rng = rng ?? new Random(); }

        public void Reset() { Hidden = false; _t = 0; }

        public bool Tick(float dt)
        {
            _t -= dt;
            if (_t <= 0)
            {
                Hidden = !Hidden;
                _t = Hidden ? 0.9f + (float)_rng.NextDouble() * 1.8f : 1.4f + (float)_rng.NextDouble() * 1.6f;
            }
            return Hidden;
        }
    }
}

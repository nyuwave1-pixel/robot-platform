using System;
using System.Collections.Generic;
using System.Linq;

namespace SpecialSoldier.Core
{
    /// <summary>What happened during a mission (web: Missions.newStats). Grading is the web game's G.onMissionComplete.</summary>
    public sealed class MissionStats
    {
        public int Kills, Headshots, Shots, Hits, Alarms, Deaths, Intel;
        public float Score, Time;

        public int AccuracyPercent => Shots > 0 ? (int)Math.Round(Hits * 100.0 / Shots, MidpointRounding.AwayFromZero) : 0;

        /// <summary>Accuracy ≥45% 2 pts (≥25% 1), no alarm 2 (one 1), no death 2 (one 1), headshots ≥30% of kills 1.
        /// 7+ = S, 5+ = A, 3+ = B, else C.</summary>
        public int GradePoints
        {
            get
            {
                int acc = AccuracyPercent, pts = 0;
                pts += acc >= 45 ? 2 : acc >= 25 ? 1 : 0;
                pts += Alarms == 0 ? 2 : Alarms == 1 ? 1 : 0;
                pts += Deaths == 0 ? 2 : Deaths == 1 ? 1 : 0;
                pts += Headshots >= Kills * 0.3 ? 1 : 0;
                return pts;
            }
        }

        public char Grade { get { int p = GradePoints; return p >= 7 ? 'S' : p >= 5 ? 'A' : p >= 3 ? 'B' : 'C'; } }

        /// <summary>Reward points the BIT PARK / RobotVerse portal credits for the grade (web: postMessage game_result).</summary>
        public int PortalRp => Grade switch { 'S' => 60, 'A' => 45, 'B' => 30, _ => 15 };

        /// <summary>Kill score (web: Enemies.damage → stats.score += type.score × 1.5 for a headshot).</summary>
        public void AddKill(int typeScore, bool headshot) { Kills++; if (headshot) Headshots++; Score += typeScore * (headshot ? 1.5f : 1f); }
    }

    public enum ObjectiveKind { Kill, Reach, Interact, Defend, Any }

    /// <summary>One mission objective (web: MISSIONS[i].objectives[k]). For Any, every part must be done, in any order.</summary>
    public sealed class Objective
    {
        public ObjectiveKind Kind;
        public string Text, Group, Label;
        public Vec2 At;
        public float Radius = 2.6f, Hold, Time;
        public List<Objective> Parts;
        public bool Done { get; internal set; }

        public static Objective Kill(string group, string text) => new Objective { Kind = ObjectiveKind.Kill, Group = group, Text = text };
        public static Objective Reach(Vec2 at, float radius, string text) => new Objective { Kind = ObjectiveKind.Reach, At = at, Radius = radius, Text = text };
        public static Objective Interact(Vec2 at, string label, float hold, string text, float radius = 2.6f) => new Objective { Kind = ObjectiveKind.Interact, At = at, Label = label, Hold = hold, Radius = radius, Text = text };
        public static Objective Defend(float seconds, string text) => new Objective { Kind = ObjectiveKind.Defend, Time = seconds, Text = text };
        public static Objective Any(string text, params Objective[] parts) => new Objective { Kind = ObjectiveKind.Any, Text = text, Parts = parts.ToList() };
    }

    /// <summary>What the engine tells the mission each frame.</summary>
    public interface IMissionWorld
    {
        Vec2 PlayerPosition { get; }
        bool InteractHeld { get; }          // the interact key is held this frame
        int Alive(string group);            // living enemies in a group
    }

    /// <summary>Runs a list of objectives in order (web: Missions.update / advance / partDone / objText).
    /// Engine-free: the Unity GameDirector feeds it an IMissionWorld each frame.</summary>
    public sealed class MissionRunner
    {
        public readonly string Code, Name;
        public readonly IReadOnlyList<Objective> Objectives;
        public readonly MissionStats Stats = new MissionStats();
        public int Index { get; private set; }
        public bool Complete => Index >= Objectives.Count;
        public Objective Current => Complete ? null : Objectives[Index];
        public float HoldProgress { get; private set; }     // 0..1 while holding an interact
        public float DefendLeft { get; private set; }
        public Objective HoldTarget { get; private set; }
        public event Action<Objective> ObjectiveCompleted, PartCompleted;
        public event Action MissionCompleted;

        public MissionRunner(string code, string name, params Objective[] objectives)
        {
            Code = code; Name = name; Objectives = objectives;
            Start();
        }

        void Start() { if (Current?.Kind == ObjectiveKind.Defend) DefendLeft = Current.Time; }

        public void Tick(float dt, IMissionWorld w)
        {
            if (Complete) return;
            Stats.Time += dt;
            var o = Current;
            HoldTarget = null;
            switch (o.Kind)
            {
                case ObjectiveKind.Any:
                    foreach (var p in o.Parts) if (!p.Done && Check(p, dt, w)) { p.Done = true; HoldProgress = 0; PartCompleted?.Invoke(p); }
                    if (o.Parts.All(p => p.Done)) Advance();
                    break;
                case ObjectiveKind.Defend:
                    DefendLeft -= dt;
                    if (DefendLeft <= 0) Advance();
                    break;
                default:
                    if (Check(o, dt, w)) Advance();
                    break;
            }
            if (HoldTarget == null) HoldProgress = 0;
        }

        bool Check(Objective o, float dt, IMissionWorld w)
        {
            switch (o.Kind)
            {
                case ObjectiveKind.Kill: return w.Alive(o.Group) == 0;
                case ObjectiveKind.Reach: return Vec2.Distance(w.PlayerPosition, o.At) < o.Radius;
                case ObjectiveKind.Interact:
                    if (Vec2.Distance(w.PlayerPosition, o.At) > o.Radius) return false;
                    HoldTarget = o;
                    if (!w.InteractHeld) { HoldProgress = 0; return false; }   // letting go starts the hold over (web: interact hold)
                    HoldProgress += dt / Math.Max(0.01f, o.Hold);
                    return HoldProgress >= 1f;
                default: return false;
            }
        }

        void Advance()
        {
            var done = Current; done.Done = true; HoldProgress = 0;
            Index++;
            ObjectiveCompleted?.Invoke(done);
            if (Complete) MissionCompleted?.Invoke(); else Start();
        }

        /// <summary>HUD line for the current objective (web: objText): "Clear the compound — 3 left", any-order checklists, defend timer.</summary>
        public string ObjectiveText(IMissionWorld w)
        {
            var o = Current;
            if (o == null) return "MISSION COMPLETE";
            switch (o.Kind)
            {
                case ObjectiveKind.Any:
                    return o.Text + ": " + string.Join("   ", o.Parts.Select(p => (p.Done ? "✓ " : "○ ") + (p.Kind == ObjectiveKind.Kill && !p.Done ? $"{p.Text} ({w.Alive(p.Group)})" : p.Text)));
                case ObjectiveKind.Kill: return $"{o.Text} — {w.Alive(o.Group)} left";
                case ObjectiveKind.Defend: return $"{o.Text} — {Math.Max(0, (int)Math.Ceiling(DefendLeft)) / 60}:{Math.Max(0, (int)Math.Ceiling(DefendLeft)) % 60:00}";
                default: return o.Text;
            }
        }
    }
}

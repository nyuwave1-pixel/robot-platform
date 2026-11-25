using System;

namespace SpecialSoldier.Core
{
    public enum AlertState { Patrol, Suspicious, Search, Combat, Retreat }

    /// <summary>Per-type enemy tuning (same numbers as ENEMY_TYPES in apps/special-soldier/src/game/enemies.js).</summary>
    public sealed class EnemyType
    {
        public readonly string Id, Name;
        public readonly float Hp, Armor, Speed, Spread, Rpm, GunDamage, Vision, Fov, React;
        public readonly int BurstMin, BurstMax;
        public readonly bool Grenades;            // web: grenades: true (COBRA ELITE, COMMANDER VIPER)

        public EnemyType(string id, string name, float hp, float armor, float speed, float spread, int burstMin, int burstMax, float rpm,
            float gunDamage, float vision, float fov, float react, bool grenades = false)
        {
            Id = id; Name = name; Hp = hp; Armor = armor; Speed = speed; Spread = spread; BurstMin = burstMin; BurstMax = burstMax;
            Rpm = rpm; GunDamage = gunDamage; Vision = vision; Fov = fov; React = react; Grenades = grenades;
        }

        public static readonly EnemyType Sentry = new EnemyType("guard", "SENTRY", 90, 0, 3.6f, 3.3f, 2, 4, 520, 11, 72, 1.9f, 0.9f);
        public static readonly EnemyType Assault = new EnemyType("assault", "ASSAULT", 110, 35, 4.7f, 3.7f, 4, 7, 680, 10, 78, 2.0f, 0.7f);
        public static readonly EnemyType Sniper = new EnemyType("sniper", "SNIPER", 80, 0, 2.6f, 0.45f, 1, 1, 30, 58, 190, 1.3f, 1.7f);
        public static readonly EnemyType Heavy = new EnemyType("heavy", "HEAVY GUNNER", 260, 160, 2.1f, 4.6f, 10, 18, 600, 10, 75, 1.9f, 1.1f);
        public static readonly EnemyType Elite = new EnemyType("elite", "COBRA ELITE", 150, 90, 4.9f, 2.3f, 3, 5, 700, 13, 92, 2.2f, 0.5f, grenades: true);
        public static readonly EnemyType[] All = { Sentry, Assault, Sniper, Heavy, Elite };
    }

    /// <summary>What the enemy perceived this think-tick. Filled in by the engine layer (raycasts, distances).</summary>
    public struct Perception
    {
        public bool SeesTarget;          // inside vision range + cone (or very close) AND line of sight
        public float Distance;           // metres to the target
        public bool TargetSprinting;
        public float NoiseRadius;        // radius of the loudest noise the target made this tick (0 = silent)
    }

    /// <summary>Awareness meter + finite state machine: PATROL → SUSPICIOUS → SEARCH → COMBAT ↔ RETREAT.
    /// Ported from Enemies.perceive() in the web game, with the random parts removed so it is deterministic and testable.</summary>
    public sealed class AwarenessBrain
    {
        public readonly EnemyType Type;
        public AlertState State { get; private set; } = AlertState.Patrol;
        public float Detect { get; private set; }
        public float StateTime { get; private set; }
        public float SinceSeen { get; private set; } = float.PositiveInfinity;
        public bool Alerted { get; private set; }
        public bool Hold { get; set; }               // snipers / turret posts never leave their spot
        public float DifficultyDetect { get; set; } = 1f;
        public event Action<AlertState, AlertState> StateChanged;

        public AwarenessBrain(EnemyType type) { Type = type ?? throw new ArgumentNullException(nameof(type)); }

        /// <summary>Advances the brain by <paramref name="dt"/> seconds (the web game thinks every 0.13–0.45 s).</summary>
        public void Tick(float dt, in Perception p)
        {
            float vision = Type.Vision; // the web game also scales this by weather/night; the slice uses clear daylight
            if (p.SeesTarget)
            {
                SinceSeen = 0;
                if (State < AlertState.Combat)
                    Detect += dt * (1.35f - p.Distance / vision) * 0.95f * DifficultyDetect / Type.React * (Alerted ? 1.8f : 1f) * (p.TargetSprinting ? 1.5f : 1f);
            }
            else SinceSeen += dt;

            if (p.NoiseRadius > 0 && p.Distance < p.NoiseRadius * DifficultyDetect && State < AlertState.Combat)
                Detect = Math.Max(Detect, 0.42f) + dt * 0.5f;

            if (Detect < 0) Detect = 0;

            switch (State)
            {
                case AlertState.Patrol:
                case AlertState.Suspicious:
                case AlertState.Search:
                    if (Detect >= 1) { Engage(); return; }
                    break;
            }

            StateTime += dt;
            switch (State)
            {
                case AlertState.Patrol:
                    if (Detect > 0.35f) Set(AlertState.Suspicious);
                    else Detect = Math.Max(0, Detect - dt * 0.12f); // slow bleed-off so a glimpse is forgotten (slice addition)
                    break;
                case AlertState.Suspicious:
                    if (StateTime > 2.2f)
                    {
                        if (Detect > 0.3f && !Hold) Set(AlertState.Search);
                        else if (StateTime > 5f) Set(AlertState.Patrol);
                    }
                    break;
                case AlertState.Search:
                    if (StateTime > 18f) { Set(AlertState.Patrol); Detect = 0.2f; }
                    break;
                case AlertState.Combat:
                    if (SinceSeen > (Hold ? 12f : 6f)) { Set(AlertState.Search); Detect = 0.6f; } // below 1, or it would re-engage at once
                    break;
                case AlertState.Retreat:
                    if (StateTime > 7f) Set(AlertState.Combat);
                    break;
            }
        }

        /// <summary>Squad alert / heard a gunshot nearby: jump straight to SEARCH.</summary>
        public void Alert(float detectFloor = 0.5f)
        {
            Alerted = true; Detect = Math.Max(Detect, detectFloor);
            if (State < AlertState.Search) Set(AlertState.Search);
        }

        /// <summary>Took damage from the target: always fight back.</summary>
        public void OnDamaged() { SinceSeen = 0; if (State != AlertState.Combat) Engage(); }

        /// <summary>Low health: fall back to cover for a while, then return to combat.</summary>
        public void Retreat() { if (State == AlertState.Combat) Set(AlertState.Retreat); }

        void Engage() { Detect = 1; Alerted = true; Set(AlertState.Combat); }

        void Set(AlertState s)
        {
            if (s == State) return;
            var old = State; State = s; StateTime = 0;
            StateChanged?.Invoke(old, s);
        }
    }
}

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
        public int Score => Id switch { "guard" => 100, "assault" => 150, "sniper" => 200, "heavy" => 300, "elite" => 350, _ => 100 };   // web: type.score

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
        public float VisionRange;        // metres this enemy can see right now (AwarenessBrain.VisionRange); 0 = the type's base vision
    }

    public enum Stance { Stand = 0, Crouch = 1, Prone = 2 }

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

        /// <summary>How far this enemy sees right now (web: Enemies.perceive `vr`): base vision × (1 − night × 0.5) × stance
        /// (stand 1, crouch 0.72, prone 0.5) × difficulty × 1.25 when alerted × 1.5 if your light is on × (1 − min(0.3, rain × 0.2));
        /// in COMBAT never below 90 % of the base vision.</summary>
        public float VisionRange(float night, Stance stance, float rain, bool flashlight = false)
        {
            float vr = Type.Vision * (1f - night * 0.5f) * StanceFactor(stance) * DifficultyDetect * (Alerted ? 1.25f : 1f)
                       * (flashlight ? 1.5f : 1f) * (1f - Math.Min(0.3f, rain * 0.2f));
            if (State == AlertState.Combat) vr = Math.Max(vr, Type.Vision * 0.9f);
            return vr;
        }

        public static float StanceFactor(Stance s) => s == Stance.Prone ? 0.5f : s == Stance.Crouch ? 0.72f : 1f;

        /// <summary>Advances the brain by <paramref name="dt"/> seconds (the web game thinks every 0.13–0.45 s).
        /// Same order as the web: sight raises the meter (or it bleeds off at 0.18/s while unseen), noise, then one transition.</summary>
        public void Tick(float dt, in Perception p)
        {
            float vision = p.VisionRange > 0 ? p.VisionRange : Type.Vision;
            if (p.SeesTarget)
            {
                SinceSeen = 0;
                if (State < AlertState.Combat)
                    Detect += dt * (1.35f - p.Distance / vision) * 0.95f * DifficultyDetect / Type.React * (Alerted ? 1.8f : 1f) * (p.TargetSprinting ? 1.5f : 1f);
            }
            else
            {
                SinceSeen += dt;
                Detect = Math.Max(0, Detect - dt * 0.18f);   // web: forgets a glimpse; also drains during COMBAT so SEARCH starts near 0
            }

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
                    break;
                case AlertState.Suspicious:
                    if (StateTime > 2.2f)
                    {
                        if (Detect > 0.3f && !Hold) Set(AlertState.Search);
                        else if (StateTime > 5f) Set(AlertState.Patrol);
                    }
                    break;
                case AlertState.Search:
                    if (StateTime > 18f) Set(AlertState.Patrol);
                    break;
                case AlertState.Combat:
                    if (SinceSeen > (Hold ? 12f : 6f)) Set(AlertState.Search);   // the meter has drained by now (web behaviour)
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

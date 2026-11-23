namespace SpecialSoldier.Core
{
    /// <summary>Campaign difficulty (same numbers as DIFFICULTY in apps/special-soldier/src/core/save.js).
    /// Detect scales how fast enemies notice you, React scales their reaction and burst pauses,
    /// Acc scales their spread (higher = worse aim) and Dmg scales the damage you take.</summary>
    public sealed class Difficulty
    {
        public readonly string Id, Label;
        public readonly float Detect, React, Acc, Dmg;

        Difficulty(string id, string label, float detect, float react, float acc, float dmg)
        { Id = id; Label = label; Detect = detect; React = react; Acc = acc; Dmg = dmg; }

        public static readonly Difficulty Recruit = new Difficulty("recruit", "RECRUIT", 0.7f, 1.5f, 1.6f, 0.6f);
        public static readonly Difficulty Regular = new Difficulty("regular", "REGULAR", 1.0f, 1.0f, 1.0f, 1.0f);
        public static readonly Difficulty Veteran = new Difficulty("veteran", "VETERAN", 1.3f, 0.65f, 0.7f, 1.45f);
        public static readonly Difficulty[] All = { Recruit, Regular, Veteran };

        public static Difficulty FromId(string id)
        {
            foreach (var d in All) if (d.Id == id) return d;
            return Regular;
        }

        /// <summary>Seconds an enemy waits after entering combat before its first burst (web: Enemies.engage).
        /// <paramref name="roll01"/> is a random 0..1; <paramref name="spotted"/> = it saw you rather than heard you.</summary>
        public float ReactionDelay(EnemyType type, float roll01, bool spotted)
            => type.React * React * (0.7f + roll01 * 0.6f) * (spotted ? 1f : 0.6f);

        /// <summary>Spread in degrees for one enemy shot (web: Enemies.shoot): worse while the enemy moves
        /// and during its first 1.2 s of combat.</summary>
        public float ShotSpread(EnemyType type, bool shooterMoving, float combatTime)
            => type.Spread * Acc * (shooterMoving ? 1.6f : 1f) * (combatTime < 1.2f ? 1.8f : 1f);
    }
}

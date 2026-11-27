using System;

namespace SpecialSoldier.Core
{
    /// <summary>SQUAD 07 team-mates (web squad.js): formation follow, hold fire until contact, nearest visible target, short bursts,
    /// down and self-revive. Island coordinates; the player's yaw is the web camera yaw (forward = (−sin, −cos)).</summary>
    public static class Squad
    {
        public static readonly string[] Names = { "REAPER", "NOMAD", "ATLAS" };
        /// <summary>Formation offsets (web OFFS): left/right and behind you.</summary>
        public static readonly (double x, double z)[] Offsets = { (-2.6, 3.2), (2.6, 3.8), (0, 6.4) };
        public const float GunDamage = 8, RangeStart = 50, RangeEnd = 140, MinMul = 0.6f;
        public const double MaxHp = 200, RegenPerSecond = 4, DownSeconds = 18, ReviveHp = 120;
        public const double TargetRange = 60, ThinkEvery = 0.4, ShotEvery = 0.1, AimTolerance = 0.25, TurnRate = 6;
        public const float StrayRoundFactor = 0.35f, BlastFactor = 0.5f;
        public static readonly string[] Barks = { "Tango down.", "Target neutralised.", "One less.", "Clear on my side." };

        /// <summary>web: goal = player + offset turned by the player's yaw.</summary>
        public static (double x, double z) FormationGoal(double px, double pz, double yaw, int i)
        {
            double s = Math.Sin(yaw), c = Math.Cos(yaw); var o = Offsets[i];
            return (px + o.x * c + o.z * s, pz - o.x * s + o.z * c);
        }

        /// <summary>web: move when farther than 1.6 m (14 m while fighting), at min(7.2, 1.5 + 1.2·distance) m/s.</summary>
        public static double FollowSpeed(double distance, bool fighting) => distance > (fighting ? 14 : 1.6) ? Math.Min(7.2, 1.5 + distance * 1.2) : 0;

        /// <summary>web: too far (75 m) or on another level (15 m): teleport back into formation.</summary>
        public static bool NeedsRegroup(double distance, double heightGap) => distance > 75 || Math.Abs(heightGap) > 15;

        /// <summary>web: before "weapons free" only enemies already in combat are fair game.</summary>
        public static bool MayEngage(bool weaponsFree, AlertState enemyState) => weaponsFree || enemyState >= AlertState.Combat;

        /// <summary>web: bursts of 2–4 rounds (2 + ⌊rand·3⌋), then a 1.4–3.6 s pause.</summary>
        public static int BurstLength(double r) => 2 + (int)(r * 3);
        public static double PauseAfterBurst(double r) => 1.4 + r * 2.2;

        /// <summary>web aim error: horizontal (r − 0.5)·0.11·√d·3 m, vertical (r − 0.5)·2.2 m (added to the aim vector).</summary>
        public static double AimErrorSide(double r, double distance) => (r - 0.5) * 0.11 * Math.Sqrt(distance) * 3;
        public static double AimErrorUp(double r) => (r - 0.5) * 2.2;

        public static double DamageAt(double dist) =>
            dist <= RangeStart ? GunDamage : dist >= RangeEnd ? GunDamage * MinMul : GunDamage * (1 - (1 - MinMul) * ((dist - RangeStart) / (RangeEnd - RangeStart)));
    }
}

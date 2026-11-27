using System;

namespace SpecialSoldier.Core
{
    /// <summary>3D point / vector in metres (Y up), so grenade maths stays free of UnityEngine.</summary>
    public readonly struct Vec3
    {
        public readonly float X, Y, Z;
        public Vec3(float x, float y, float z) { X = x; Y = y; Z = z; }
        public static Vec3 operator +(Vec3 a, Vec3 b) => new Vec3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
        public static Vec3 operator -(Vec3 a, Vec3 b) => new Vec3(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
        public static Vec3 operator *(Vec3 a, float k) => new Vec3(a.X * k, a.Y * k, a.Z * k);
        public float Length => (float)Math.Sqrt(X * X + Y * Y + Z * Z);
        public static float Distance(Vec3 a, Vec3 b) => (a - b).Length;
        public override string ToString() => $"({X:0.00}, {Y:0.00}, {Z:0.00})";
    }

    /// <summary>Grenade and explosion rules ported from apps/special-soldier/src/game/fx.js (grenade, explode)
    /// and weapons.js (throwGrenade).</summary>
    public static class Explosives
    {
        public const float Gravity = 9.81f;
        public const float HandGrenadeRadius = 7.5f, HandGrenadeDamage = 170f, HandGrenadeFuse = 2.8f;
        public const float EnemyGrenadeFuse = 2.9f, EnemyFlightTime = 1.5f;
        public const float Bounce = 0.38f;                      // speed kept after each bounce
        public const float ThrowSpeed = 17f, ThrowLift = 4.5f, ThrowCooldown = 0.9f;
        public const float SelfDamageFactor = 0.6f;             // your own grenade hurts you 60%
        public const float CoverFactor = 0.25f;                 // behind a wall (and > 1.5 m away) you take 25%
        public const float HearingRadius = 170f;

        /// <summary>Damage at <paramref name="distance"/> from the blast: linear falloff to zero at the radius,
        /// cut to 25% when something solid is in between (unless within 1.5 m).</summary>
        public static float Damage(float distance, bool lineOfSight, float radius = HandGrenadeRadius, float baseDamage = HandGrenadeDamage)
        {
            if (distance > radius) return 0f;
            float k = 1f - distance / radius;
            if (distance > 1.5f && !lineOfSight) k *= CoverFactor;
            return baseDamage * k;
        }

        /// <summary>Player throw (web: weapons.throwGrenade): look direction × 17 m/s, plus 4.5 m/s up, plus the player's own velocity.</summary>
        public static Vec3 PlayerThrowVelocity(Vec3 lookDir, Vec3 playerVelocity) =>
            lookDir * ThrowSpeed + new Vec3(0, ThrowLift, 0) + playerVelocity;

        /// <summary>Enemy lob (web: Enemies.plan): the launch velocity that lands on <paramref name="target"/> after
        /// <paramref name="flightTime"/> seconds under gravity, ignoring drag and bounces.</summary>
        public static Vec3 LobVelocity(Vec3 from, Vec3 target, float flightTime = EnemyFlightTime) =>
            new Vec3((target.X - from.X) / flightTime,
                     (target.Y - from.Y + 0.5f * Gravity * flightTime * flightTime) / flightTime,
                     (target.Z - from.Z) / flightTime);

        /// <summary>Ballistic position after <paramref name="t"/> seconds (no collisions).</summary>
        public static Vec3 PositionAt(Vec3 from, Vec3 velocity, float t) =>
            new Vec3(from.X + velocity.X * t, from.Y + velocity.Y * t - 0.5f * Gravity * t * t, from.Z + velocity.Z * t);
    }

    /// <summary>When an enemy with grenades throws one (web: Enemies.plan): every combat re-plan lowers a cooldown by 3;
    /// it throws when the cooldown is spent, the target is 9–34 m away and either hiding in cover or out of sight for
    /// under 8 s. Each throw resets the cooldown to 14.</summary>
    public sealed class GrenadeDecision
    {
        public const float MinRange = 9f, MaxRange = 34f, Cooldown = 14f, PerPlan = 3f, LostSightWindow = 8f;
        public float CooldownLeft { get; private set; }

        public bool ShouldThrow(float distance, bool targetInCover, bool seesTarget, float sinceSeen)
        {
            CooldownLeft -= PerPlan;
            if (CooldownLeft > 0) return false;
            if (distance <= MinRange || distance >= MaxRange) return false;
            if (!(targetInCover || (!seesTarget && sinceSeen < LostSightWindow))) return false;
            CooldownLeft = Cooldown;
            return true;
        }
    }
}

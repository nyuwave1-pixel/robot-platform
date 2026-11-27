using System;

namespace SpecialSoldier.Core
{
    /// <summary>A Mission 04 security camera (web missions.js MISSIONS[3].tick + build.js buildFacility cameras): it sweeps
    /// ±0.7 rad, sees you within 15 m inside its cone (cos angle > 0.55) with line of sight, fills a meter
    /// (0.9/s standing, 0.5/s crouched, drains 0.4/s, max 1.5) and locks the facility down at 1.2. Shooting it (10 hp) stops it.
    /// Island coordinates (web): yaw 0 looks along +z.</summary>
    public sealed class SecurityCam
    {
        public const double Range = 15, ConeCos = 0.55, Alarm = 1.2, Max = 1.5, FillStanding = 0.9, FillCrouched = 0.5, Drain = 0.4;
        public readonly double X, Z, Phase;
        public double Detect { get; private set; }
        public bool Dead { get; set; }

        /// <param name="phase">web: the camera's local x (cx), which offsets its sweep.</param>
        public SecurityCam(double x, double z, double phase) { X = x; Z = z; Phase = phase; }

        /// <summary>web: g.rotation.y = sin(t * 0.7 + cx) * 0.7.</summary>
        public double Yaw(double time) => Math.Sin(time * 0.7 + Phase) * 0.7;

        /// <summary>Inside range and cone (line of sight is the engine's job).</summary>
        public bool InView(double px, double pz, double time)
        {
            double dx = px - X, dz = pz - Z, d = Math.Sqrt(dx * dx + dz * dz);
            if (d >= Range) return false;
            return Math.Cos(Math.Atan2(dx, dz) - Yaw(time)) > ConeCos;
        }

        /// <summary>Advances the meter; true the moment it reaches the alarm level.</summary>
        public bool Step(double dt, bool sees, bool crouched)
        {
            if (Dead) return false;
            bool before = Detect >= Alarm;
            Detect = Math.Max(0, Math.Min(Max, Detect + (sees ? dt * (crouched ? FillCrouched : FillStanding) : -dt * Drain)));
            return !before && Detect >= Alarm;
        }
    }
}

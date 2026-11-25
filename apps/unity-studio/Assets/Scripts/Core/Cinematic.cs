using System;

namespace SpecialSoldier.Core
{
    /// <summary>One camera move of a mission intro (web cinematics.js shot): island coordinates, seconds, caption, field of view.</summary>
    public sealed class CinematicShot
    {
        public readonly double[] From, To, Look; public readonly double Dur, Fov; public readonly string Text;
        /// <summary>Relative shots (web cam(k) with R(dx, dy, dz)): From / To / Look are offsets from a moving anchor (the boat), the move is
        /// linear in k, and the camera never goes below 0.9 m.</summary>
        public bool Relative;
        public double[] LookTo;   // relative shots whose look point also moves (else Look)
        public string Radio = "";
        public CinematicShot(double[] from, double[] to, double[] look, double dur, string text, double fov = 50) { From = from; To = to; Look = look; Dur = dur; Text = text ?? ""; Fov = fov; }
    }

    /// <summary>Plays a list of shots the web way (cinematics.js update): each shot eases from → to with smoothstep, the camera looks
    /// at the shot's point, a fade covers the first 0.25 s and the last 0.7 s; Enter / Space skips.</summary>
    public sealed class Cinematic
    {
        readonly CinematicShot[] _shots;
        /// <summary>Total time since the start (relative shots read the anchor at this time).</summary>
        public double Time { get; private set; }
        /// <summary>Anchor for relative shots: time → (x, y, z) in island coordinates.</summary>
        public Func<double, double[]> Anchor;
        public int Index { get; private set; }
        public double ShotTime { get; private set; }
        public bool Done => Index >= _shots.Length;
        public CinematicShot Current => Done ? null : _shots[Index];

        public Cinematic(CinematicShot[] shots) { _shots = shots ?? new CinematicShot[0]; }

        public static double Smooth(double k) => k * k * (3 - 2 * k);

        /// <summary>Advances time; returns the camera position, look point and whether the screen should be faded out.</summary>
        public (double[] pos, double[] look, bool fade) Step(double dt)
        {
            if (Done) return (null, null, false);
            ShotTime += dt; Time += dt;
            var s = _shots[Index];
            double k = Math.Min(1, Math.Max(0, ShotTime / s.Dur)), e = s.Relative ? k : Smooth(k);
            var p = new[] { s.From[0] + (s.To[0] - s.From[0]) * e, s.From[1] + (s.To[1] - s.From[1]) * e, s.From[2] + (s.To[2] - s.From[2]) * e };
            double[] look = s.Look ?? s.To;
            if (s.Relative)
            {
                var a = Anchor != null ? Anchor(Time) : new double[3];
                var lo = s.LookTo == null ? s.Look : new[] { s.Look[0] + (s.LookTo[0] - s.Look[0]) * k, s.Look[1] + (s.LookTo[1] - s.Look[1]) * k, s.Look[2] + (s.LookTo[2] - s.Look[2]) * k };
                p = new[] { a[0] + p[0], Math.Max(0.9, a[1] + p[1]), a[2] + p[2] };
                look = new[] { a[0] + lo[0], Math.Max(0.9, a[1] + lo[1]), a[2] + lo[2] };
            }
            bool last = Index == _shots.Length - 1;
            bool fade = (Index == 0 && ShotTime < 0.25) || (last && s.Dur - ShotTime < 0.7);
            var result = (p, look, fade);
            if (ShotTime >= s.Dur) { Index++; ShotTime = 0; }
            return result;
        }

        public void Skip() => Index = _shots.Length;
    }

    /// <summary>Mission 01's intro (web cinematics.js playBoatIntro): SCENE 01 — DEEP SEA INFILTRATION → SCENE 02 — BEACH LANDING.
    /// The assault boat runs 35 s from 760 m out to the beach (z 331.5); six shots ride with it.</summary>
    public static class BoatIntro
    {
        public const double Seconds = 35, StartZ = 760, BeachZ = 331.5;

        /// <summary>web tick: k = t / 35; z = Z0 − (Z0 − Z1)·k(1.7 − 0.7k); x = sin(3.2k)·5·(1 − k) + 3.2·smooth(0.7, 1, k); y = sea level.</summary>
        public static double[] BoatAt(double t)
        {
            double k = Math.Min(Seconds, Math.Max(0, t)) / Seconds;
            double z = StartZ - (StartZ - BeachZ) * (k * (1.7 - 0.7 * k));
            double x = Math.Sin(k * 3.2) * 5 * (1 - k) + 3.2 * IslandTerrain.Smooth(0.7, 1, k);
            return new[] { x, 0.0, z };
        }

        static double[] V(double x, double y, double z) => new[] { x, y, z };
        static CinematicShot Rel(double dur, double fov, string text, double[] from, double[] to, double[] look, double[] lookTo = null, string radio = "")
            => new CinematicShot(from, to, look, dur, text, fov) { Relative = true, LookTo = lookTo, Radio = radio };

        /// <summary>The six shots as boat-relative moves (web cam(k) = R(a + k·b)).</summary>
        public static CinematicShot[] Shots() => new[]
        {
            Rel(6.5, 46, "PACIFIC OCEAN · 04:30 — 2 KM SOUTH OF THE TARGET ISLAND", V(26, 13, 44), V(20, 10, 36), V(0, 0, -70)),
            Rel(6, 38, "COMMAND: \"Bravo Team, this is Command. Your mission begins now.\"", V(4, 1.5, -13), V(-3, 1.5, -11), V(0, 1.1, 0), radio: "COMMAND: Bravo Team, this is Command. Your mission begins now."),
            Rel(6, 42, "SQUAD 07 — SIX OPERATORS · ASSAULT BOAT \"MAKO\"", V(-10, 1.3, 3), V(-8.5, 2.1, -4), V(0, 0.9, -0.5)),
            Rel(6.5, 50, "COMMAND: \"Approaching enemy territory. Maintain radio silence.\"", V(1.6, 2.7, 8.5), V(1.0, 2.7, 6.5), V(0, 2.2, -60), radio: "COMMAND: Approaching enemy territory. Maintain radio silence."),
            Rel(4.5, 34, "REAPER: \"Night vision on. Weapons tight until the boss says otherwise.\"", V(0.25, 1.55, -3.6), V(0.55, 1.55, -3.6), V(0.4, 1.25, 1)),
            Rel(5.5, 55, "SOUTH BEACH — ENEMY COAST AHEAD", V(-4.5, 2.2, 8), V(-3.5, 2.8, 6), V(0, 1.4, -30)),
        };
    }
}

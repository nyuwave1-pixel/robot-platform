using System;

namespace SpecialSoldier.Core
{
    /// <summary>One camera move of a mission intro (web cinematics.js shot): island coordinates, seconds, caption, field of view.</summary>
    public sealed class CinematicShot
    {
        public readonly double[] From, To, Look; public readonly double Dur, Fov; public readonly string Text;
        public CinematicShot(double[] from, double[] to, double[] look, double dur, string text, double fov = 50) { From = from; To = to; Look = look; Dur = dur; Text = text ?? ""; Fov = fov; }
    }

    /// <summary>Plays a list of shots the web way (cinematics.js update): each shot eases from → to with smoothstep, the camera looks
    /// at the shot's point, a fade covers the first 0.25 s and the last 0.7 s; Enter / Space skips.</summary>
    public sealed class Cinematic
    {
        readonly CinematicShot[] _shots;
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
            ShotTime += dt;
            var s = _shots[Index];
            double k = Math.Min(1, Math.Max(0, ShotTime / s.Dur)), e = Smooth(k);
            var p = new[] { s.From[0] + (s.To[0] - s.From[0]) * e, s.From[1] + (s.To[1] - s.From[1]) * e, s.From[2] + (s.To[2] - s.From[2]) * e };
            bool last = Index == _shots.Length - 1;
            bool fade = (Index == 0 && ShotTime < 0.25) || (last && s.Dur - ShotTime < 0.7);
            var result = (p, s.Look ?? s.To, fade);
            if (ShotTime >= s.Dur) { Index++; ShotTime = 0; }
            return result;
        }

        public void Skip() => Index = _shots.Length;
    }
}

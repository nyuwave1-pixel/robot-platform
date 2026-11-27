using System;
using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    /// <summary>HUD maths shared by the Unity UI Toolkit HUD, ported from apps/special-soldier/src/ui/hud.js:
    /// compass heading, minimap projection (70 m radius, rotates with the player, objective clamped to the rim),
    /// awareness label, crosshair gap, radar visibility. Angles are degrees, 0 = north (+Z), clockwise (east = +X = 90).</summary>
    public static class HudMath
    {
        public const float MinimapRange = 70f;        // web: R / scale = 70 m
        public const float MinimapRimInset = 10f / 88f; // web: marker clamped to R − 10 of R = 88 px
        public const float RadarMarkedSeconds = 30f, RadarFiredSeconds = 2.5f;

        public static float Wrap360(float deg) { deg %= 360f; return deg < 0 ? deg + 360f : deg; }
        public static float Wrap180(float deg) { deg = Wrap360(deg); return deg > 180f ? deg - 360f : deg; }

        /// <summary>Compass heading of a forward vector on the ground plane.</summary>
        public static float Heading(float forwardX, float forwardZ) => Wrap360((float)(Math.Atan2(forwardX, forwardZ) * 180.0 / Math.PI));

        /// <summary>Compass bearing from one ground point to another.</summary>
        public static float Bearing(Vec2 from, Vec2 to) => Heading(to.X - from.X, to.Z - from.Z);

        /// <summary>How far a bearing is to the right (+) or left (−) of where you look, −180..180.</summary>
        public static float Relative(float heading, float bearing) => Wrap180(bearing - heading);

        /// <summary>Position on a compass strip that shows ±<paramref name="halfSpan"/>° around the heading: −1 (left edge) .. 1, or null when off the strip.</summary>
        public static float? CompassX(float heading, float bearing, float halfSpan = 90f)
        {
            float r = Relative(heading, bearing);
            return Math.Abs(r) > halfSpan ? (float?)null : r / halfSpan;
        }

        static readonly string[] Points = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" };
        public static string Cardinal(float deg) => Points[(int)Math.Round(Wrap360(deg) / 45f) % 8];
        public static string HeadingText(float deg) => ((int)Math.Round(Wrap360(deg)) % 360).ToString("000") + "°";

        /// <summary>Minimap position of a world point: (0,0) is the player, radius 1 is <paramref name="range"/> metres, y grows downward
        /// (screen convention) and the player's forward is up. With <paramref name="clampToRim"/> the point is pulled onto the rim
        /// (objective marker); <paramref name="outside"/> reports whether it was beyond the map.</summary>
        public static (float x, float y) MinimapPoint(Vec2 player, float heading, Vec2 target, out bool outside, float range = MinimapRange, bool clampToRim = false)
        {
            double a = -heading * Math.PI / 180.0, dx = target.X - player.X, dz = target.Z - player.Z;
            double rx = (dx * Math.Cos(a) + dz * Math.Sin(a)) / range;     // rotate the world so heading points up
            double rz = (-dx * Math.Sin(a) + dz * Math.Cos(a)) / range;
            float x = (float)rx, y = (float)-rz, len = (float)Math.Sqrt(x * x + y * y);
            float rim = 1f - MinimapRimInset;
            outside = len > (clampToRim ? rim : 1f);
            if (clampToRim && len > rim) { x *= rim / len; y *= rim / len; }
            return (x, y);
        }

        /// <summary>Web awareness meter: COMBAT when anyone is engaging, else DETECTED (&gt;0.75), SUSPICIOUS (&gt;0.3), HIDDEN.</summary>
        public static (string label, string cls, float fill) Awareness(float maxDetect, int inCombat)
        {
            if (inCombat > 0) return ($"COMBAT · {inCombat} ENGAGING", "combat", 1f);
            float f = Math.Max(0, Math.Min(1, maxDetect));
            if (maxDetect > 0.75f) return ("DETECTED", "warn", f);
            if (maxDetect > 0.3f) return ("SUSPICIOUS", "sus", f);
            return ("HIDDEN", "", f);
        }

        /// <summary>Gap between the crosshair arms in pixels at 1080p (web: 4 + spreadDeg × 7).</summary>
        public static float CrosshairGap(float spreadDeg) => 4f + spreadDeg * 7f;

        /// <summary>Enemies show on the radar for 30 s after being tagged or 2.5 s after they fire (web: enemyVisible).</summary>
        public static bool OnRadar(float sinceMarked, float sinceFired) => sinceMarked < RadarMarkedSeconds || sinceFired < RadarFiredSeconds;

        public static string Clock(float seconds) { int s = Math.Max(0, (int)seconds); return $"{s / 60}:{s % 60:00}"; }
        public static string Distance(float metres) => metres < 1000 ? $"{Math.Round(metres):0} m" : $"{metres / 1000:0.0} km";
    }

    /// <summary>Red arcs around the crosshair pointing where hits came from (web: hitFrom — 1.6 s, alpha = min(1, time left)).</summary>
    public sealed class DamageIndicators
    {
        public const float Life = 1.6f;
        public readonly struct Arc { public readonly float Bearing, Alpha; public Arc(float b, float a) { Bearing = b; Alpha = a; } }
        readonly List<(float bearing, float t)> _items = new List<(float, float)>();

        public void Add(float bearing) => _items.Add((HudMath.Wrap360(bearing), Life));

        public void Tick(float dt)
        {
            for (int i = _items.Count - 1; i >= 0; i--) { var it = _items[i]; it.t -= dt; if (it.t <= 0) _items.RemoveAt(i); else _items[i] = it; }
        }

        /// <summary>Live arcs as angles relative to the current heading (0 = in front, 180 = behind).</summary>
        public IEnumerable<Arc> Relative(float heading)
        {
            foreach (var it in _items) yield return new Arc(HudMath.Relative(heading, it.bearing), Math.Min(1f, it.t));
        }

        public int Count => _items.Count;
    }

    /// <summary>Top-right kill feed (web: killFeed — newest last, at most 5 lines, each for 4.5 s).</summary>
    public sealed class KillFeed
    {
        public const int Max = 5; public const float Life = 4.5f;
        readonly List<(string text, float t)> _lines = new List<(string, float)>();
        public void Add(string callsign, string victim, bool headshot)
        {
            _lines.Add(($"{callsign} {(headshot ? "◎ HEADSHOT" : "▸")} {victim}", Life));
            while (_lines.Count > Max) _lines.RemoveAt(0);
        }
        public void Tick(float dt)
        {
            for (int i = _lines.Count - 1; i >= 0; i--) { var l = _lines[i]; l.t -= dt; if (l.t <= 0) _lines.RemoveAt(i); else _lines[i] = l; }
        }
        public IReadOnlyList<string> Lines { get { var r = new List<string>(); foreach (var l in _lines) r.Add(l.text); return r; } }
    }
}

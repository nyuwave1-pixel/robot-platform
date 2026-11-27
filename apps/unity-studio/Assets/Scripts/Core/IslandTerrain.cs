using System;

namespace SpecialSoldier.Core
{
    /// <summary>The web game's island, so both SPECIAL SOLDIER versions stand on the same ground. A line-by-line port of
    /// apps/special-soldier/src/world/terrain.js (rawHeight, FLATS, splatAt) and the value noise in src/core/util.js
    /// (hash, noise2, fbm, smooth). IslandTerrainTests checks hundreds of points against numbers the JavaScript produced.
    /// Coordinates are the web game's: metres, island centre (0, 0), y up, the base flat around (0, −95) at 16 m.</summary>
    public static class IslandTerrain
    {
        public const float Size = 1200f;       // web SIZE
        public const int WebGrid = 240;        // web N (5 m cells)
        /// <summary>Where the Unity slice sits on the island: world (0, 0, 0) is island (0, 16, −95), the middle of the base flat
        /// (270 × 200 m at 16 m), so the slice's 160 m arena (walls at ±80 m) is completely on flat ground.</summary>
        public const double SliceIslandX = 0, SliceIslandY = 16, SliceIslandZ = -95;

        /// <summary>Island (web, three.js: right-handed, +z toward the viewer) → Unity world (left-handed). z is flipped — the same
        /// conversion SkyPreset.SunDirUnity uses — otherwise the Unity island would be a mirror image of the web island.
        /// Island (0, 16, −95) lands on world (0, 0, 0).</summary>
        public static (double x, double y, double z) ToWorld(double ix, double iy, double iz) => (ix - SliceIslandX, iy - SliceIslandY, -(iz - SliceIslandZ));
        public static (double x, double y, double z) ToIsland(double wx, double wy, double wz) => (wx + SliceIslandX, wy + SliceIslandY, -wz + SliceIslandZ);

        public readonly struct Flat
        {
            public readonly double X0, X1, Z0, Z1, H, M; public readonly string Kind;   // double: 2.2f ≠ 2.2 would shift heights by ~5e-8 m
            public Flat(double x0, double x1, double z0, double z1, double h, double m, string kind) { X0 = x0; X1 = x1; Z0 = z0; Z1 = z1; H = h; M = m; Kind = kind; }
            public double CenterX => (X0 + X1) / 2; public double CenterZ => (Z0 + Z1) / 2;
        }

        /// <summary>Flattened building areas: base, airfield, port, comms relay (web FLATS).</summary>
        public static readonly Flat[] Flats =
        {
            new Flat(-135, 135, -195, 5, 16, 35, "base"),
            new Flat(-70, 270, -335, -240, 7, 30, "air"),
            new Flat(-20, 130, -420, -345, 2.2, 20, "port"),
            new Flat(-175, -105, 115, 185, 13, 25, "comms"),
        };

        public static Flat Get(string kind) { foreach (var f in Flats) if (f.Kind == kind) return f; throw new ArgumentException(kind); }

        // ---- util.js ----
        static double Clamp(double v, double a, double b) => v < a ? a : v > b ? b : v;
        static double Lerp(double a, double b, double t) => a + (b - a) * t;
        public static double Smooth(double e0, double e1, double x) { double t = Clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

        /// <summary>JS: h = imul(x|0, 374761393) + imul(y|0, 668265263); h = imul(h ^ (h >>> 13), 1274126177); ((h ^ (h >>> 16)) >>> 0) / 2^32.</summary>
        static double Hash(int x, int y)
        {
            unchecked
            {
                int h = x * 374761393 + y * 668265263;
                h = (h ^ (int)((uint)h >> 13)) * 1274126177;
                return (uint)(h ^ (int)((uint)h >> 16)) / 4294967296.0;
            }
        }

        public static double Noise2(double x, double y)
        {
            double xf0 = Math.Floor(x), yf0 = Math.Floor(y);
            int xi = (int)xf0, yi = (int)yf0;
            double xf = x - xf0, yf = y - yf0, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
            return Lerp(Lerp(Hash(xi, yi), Hash(xi + 1, yi), u), Lerp(Hash(xi, yi + 1), Hash(xi + 1, yi + 1), u), v);
        }

        public static double Fbm(double x, double y, int oct = 4)
        {
            double a = 0.5, f = 1, s = 0, n = 0;
            for (int i = 0; i < oct; i++) { s += a * Noise2(x * f, y * f); n += a; a *= 0.5; f *= 2.03; }
            return s / n;
        }

        // ---- terrain.js ----
        public static double FlatDist(in Flat f, double x, double z) =>
            Math.Sqrt(Sq(Math.Max(Math.Max(f.X0 - x, 0), x - f.X1)) + Sq(Math.Max(Math.Max(f.Z0 - z, 0), z - f.Z1)));
        static double Sq(double v) => v * v;

        /// <summary>Island height in metres at (x, z); sea floor is −7, the shoreline about 0–2.</summary>
        public static double Height(double x, double z)
        {
            double r = Math.Sqrt(x * x + z * z), ang = Math.Atan2(z, x);
            double R = 430 + 30 * Math.Sin(ang * 3 + 1) + 18 * Math.Sin(ang * 7);
            double rn = r / R;
            double h = -7 + Smooth(1.0, 0.74, rn) * 9.2;
            double inland = Smooth(0.8, 0.45, rn);
            h += inland * (Fbm(x * 0.006 + 10, z * 0.006 + 7, 5) * 34 - 6) + inland * Fbm(x * 0.03, z * 0.03, 3) * 3;
            h += Smooth(-150, -300, x) * Smooth(0.97, 0.7, rn) * 22;
            foreach (var f in Flats) h = Lerp(h, f.H, 1 - Smooth(0, f.M, FlatDist(f, x, z)));
            return h;
        }

        /// <summary>Material weights [sand, grass, rock, concrete] (web splatAt): sand below ~3 m, rock on slopes, concrete on the flats.</summary>
        public static (double sand, double grass, double rock, double concrete) Splat(double x, double z)
        {
            double h = Height(x, z);
            double slope = Math.Abs(Height(x + 3, z) - h) + Math.Abs(Height(x, z + 3) - h);
            double wS = Smooth(3.4, 2.0, h), wR = (1 - wS) * Smooth(2.6, 4.2, slope), wC = 0;
            foreach (var f in Flats) { double d = FlatDist(f, x, z); if (d < 6) wC = Math.Max(wC, 1 - d / 6); }
            wS *= 1 - wC; wR *= 1 - wC;
            return (wS, Math.Max(0, 1 - wS - wR - wC), wR, wC);
        }

        /// <summary>Heights on an n×n grid covering the island (row = z, column = x, south-west corner first), for a Unity
        /// Terrain heightmap (n = 2^k + 1). Also returns the min/max used to normalise them.</summary>
        public static float[,] HeightGrid(int n, out float min, out float max)
        {
            var g = new float[n, n]; min = float.MaxValue; max = float.MinValue;
            double step = Size / (n - 1);
            for (int r = 0; r < n; r++)
                for (int c = 0; c < n; c++)
                {
                    float h = (float)Height(-Size / 2 + c * step, -Size / 2 + r * step);
                    g[r, c] = h; if (h < min) min = h; if (h > max) max = h;
                }
            return g;
        }
    }
}

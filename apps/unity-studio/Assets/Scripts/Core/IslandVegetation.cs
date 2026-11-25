using System;
using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    /// <summary>Where the island's trees, palms, rocks and ferns grow — a line-by-line port of
    /// apps/special-soldier/src/world/vegetation.js (own random stream VEG_SEED, mulberry32 from util.js) and of the height grid
    /// World uses (terrain.js gridHeights / heightAtGrid: Float32 heights every 5 m, bilinear). IslandVegetationTests compares
    /// the whole layout with numbers the JavaScript produced.</summary>
    public static class IslandVegetation
    {
        public const uint Seed = 0x5eed7e3;
        public const double WaterfallX = 190, WaterfallZ = 150;

        public readonly struct Item
        {
            public readonly double X, Y, Z, R, S, Tx, Tz;   // position, yaw (rad), scale, tilt x/z (rad)
            public Item(double x, double y, double z, double r, double s, double tx, double tz) { X = x; Y = y; Z = z; R = r; S = s; Tx = tx; Tz = tz; }
        }

        public sealed class Layout
        {
            public readonly List<Item> Trunks = new List<Item>(), Palms = new List<Item>(), Rocks = new List<Item>(), Ferns = new List<Item>();
        }

        /// <summary>util.js mulberry(seed): the web game's 32-bit PRNG, bit-exact.</summary>
        public sealed class Mulberry
        {
            int _a;
            public Mulberry(uint seed) { _a = unchecked((int)seed); }
            public double Next()
            {
                unchecked
                {
                    _a = _a + 0x6d2b79f5;
                    int t = (_a ^ (int)((uint)_a >> 15)) * (1 | _a);
                    t = (t + (t ^ (int)((uint)t >> 7)) * (61 | t)) ^ t;
                    return (uint)(t ^ (int)((uint)t >> 14)) / 4294967296.0;
                }
            }
        }

        /// <summary>terrain.js gridHeights(): (N+1)² Float32 heights, row = z.</summary>
        public static float[] GridHeights()
        {
            int n = IslandTerrain.WebGrid; double cell = IslandTerrain.Size / n;
            var h = new float[(n + 1) * (n + 1)];
            for (int r = 0; r <= n; r++) for (int c = 0; c <= n; c++) h[r * (n + 1) + c] = (float)IslandTerrain.Height(-IslandTerrain.Size / 2 + c * cell, -IslandTerrain.Size / 2 + r * cell);
            return h;
        }

        /// <summary>terrain.js heightAtGrid(): bilinear on the Float32 grid (World.heightAt).</summary>
        public static double HeightAt(float[] h, double x, double z)
        {
            int n = IslandTerrain.WebGrid; double cell = IslandTerrain.Size / n;
            double fx = Clamp((x + IslandTerrain.Size / 2) / cell, 0, n - 0.001), fz = Clamp((z + IslandTerrain.Size / 2) / cell, 0, n - 0.001);
            int c = (int)fx, r = (int)fz; double u = fx - c, v = fz - r; int i = r * (n + 1) + c;
            return Lerp(Lerp(h[i], h[i + 1], u), Lerp(h[i + n + 1], h[i + n + 2], u), v);
        }

        static double Clamp(double v, double a, double b) => v < a ? a : v > b ? b : v;
        static double Lerp(double a, double b, double t) => a + (b - a) * t;

        public static bool InFlat(double x, double z, double pad = 8)
        {
            foreach (var f in IslandTerrain.Flats) if (x > f.X0 - pad && x < f.X1 + pad && z > f.Z0 - pad && z < f.Z1 + pad) return true;
            return false;
        }

        /// <summary>vegetationLayout(): same draws in the same order as the JavaScript, so the same seed gives the same island.</summary>
        public static Layout Build(float[] heights = null, uint seed = Seed)
        {
            heights ??= GridHeights();
            var rnd = new Mulberry(seed); var L = new Layout();
            double At(double x, double z) => HeightAt(heights, x, z);
            for (int i = 0; i < 5200; i++)
            {
                double x = (rnd.Next() - 0.5) * 860, z = (rnd.Next() - 0.5) * 860, h = At(x, z);
                if (h < 2.8 || InFlat(x, z, 6)) continue;
                double dens = IslandTerrain.Fbm(x * 0.012 + 3, z * 0.012, 2); if (dens < 0.36) continue;
                if (Math.Abs(x) < 5 + IslandTerrain.Fbm(z * 0.05, 1, 2) * 4 && z > 0 && z < 300) continue;
                if (Hypot(x - WaterfallX, z - WaterfallZ) < 16) continue;
                L.Trunks.Add(new Item(x, h - 0.3, z, rnd.Next() * 6, 0.8 + rnd.Next() * 0.9, (rnd.Next() - 0.5) * 0.12, (rnd.Next() - 0.5) * 0.12));
            }
            for (int i = 0; i < 900; i++)
            {
                double a = rnd.Next() * Math.PI * 2, r = 300 + rnd.Next() * 110, x = Math.Cos(a) * r, z = Math.Sin(a) * r, h = At(x, z);
                if (h < 1.1 || h > 5 || InFlat(x, z, 4)) continue; if (Math.Abs(x) < 7 && z > 300) continue;
                L.Palms.Add(new Item(x, h - 0.3, z, rnd.Next() * 6, 0.8 + rnd.Next() * 0.6, (rnd.Next() - 0.5) * 0.3, (rnd.Next() - 0.5) * 0.3));
            }
            for (int i = 0; i < 420; i++)
            {
                double x = (rnd.Next() - 0.5) * 900, z = (rnd.Next() - 0.5) * 900, h = At(x, z);
                if (h < -1.5 || InFlat(x, z, 3)) continue;
                double r = rnd.Next() * 6, s = 0.5 + rnd.Next() * rnd.Next() * 3.2, tx = rnd.Next(), tz = rnd.Next();   // JS evaluates left to right
                L.Rocks.Add(new Item(x, h - 0.3, z, r, s, tx, tz));
            }
            for (int i = 0; i < 9000; i++)
            {
                double x = (rnd.Next() - 0.5) * 820, z = (rnd.Next() - 0.5) * 820, h = At(x, z);
                if (h < 2.6 || InFlat(x, z, 1)) continue;
                L.Ferns.Add(new Item(x, h - 0.05, z, rnd.Next() * 6, 0.6 + rnd.Next() * 1.1, 0, 0));
            }
            return L;
        }

        /// <summary>JS Math.hypot for two values (sqrt of the sum of squares).</summary>
        static double Hypot(double a, double b) => Math.Sqrt(a * a + b * b);
    }
}

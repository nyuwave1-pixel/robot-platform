using System;
using System.Collections.Generic;
using System.Linq;

namespace SurvivalWorld.Core
{
    /// <summary>SURVIVAL WORLD rules — a C# port of the web prototype apps/game-lab/survival-world/src/logic.js (the source of
    /// truth). Engine-free (no UnityEngine), seeded: a world is rebuilt from its seed, and the parity fixture
    /// (Tools~/gen-survival-fixture.mjs) checks heights, biomes, resource nodes, spawn and a wolf night against the web code.
    /// Units: metres, seconds; the island's x/z are the web game's x/z (the Unity view maps them, this file does not).</summary>
    public static class SurvivalRules
    {
        public const double World = 420, Island = 165, Day = 360, NightFrom = 0.79, NightTo = 0.23, Reach = 2.6;

        // ------------------------------------------------------------ seeded noise (bit-exact with the JS: 32-bit integer maths)
        public static double Hash2(long seed, double ix, double iz)
        {
            unchecked
            {
                uint h = (uint)(int)seed ^ (uint)((int)ix * 374761393) ^ (uint)((int)iz * 668265263);
                h = (h ^ (h >> 13)) * 1274126177u;
                return (h ^ (h >> 16)) / 4294967296.0;
            }
        }
        static double Fade(double t) => t * t * (3 - 2 * t);
        static double VNoise(long seed, double x, double z)
        {
            double ix = Math.Floor(x), iz = Math.Floor(z), fx = Fade(x - ix), fz = Fade(z - iz);
            double a = Hash2(seed, ix, iz), b = Hash2(seed, ix + 1, iz), c = Hash2(seed, ix, iz + 1), d = Hash2(seed, ix + 1, iz + 1);
            return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
        }
        static double Fbm(long seed, double x, double z, int oct = 4)
        {
            double s = 0, amp = 0.5, f = 1;
            for (int i = 0; i < oct; i++) { s += amp * VNoise(seed + i * 101, x * f, z * f); f *= 2; amp *= 0.5; }
            return s;
        }
        static double Smooth(double a, double b, double x) { double t = Math.Max(0, Math.Min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

        /// <summary>Terrain height, water level 0 (web heightAt).</summary>
        public static double HeightAt(long seed, double x, double z)
        {
            double r = Math.Sqrt(x * x + z * z), ang = Math.Atan2(z, x);
            double R = Island * (1 + 0.12 * Math.Sin(ang * 3 + (seed % 7)) + 0.07 * Math.Sin(ang * 5 + (seed % 13)));
            double shore = Smooth(1.05, 0.78, r / R);
            double hills = Fbm(seed, x * 0.012, z * 0.012) * 34 - 9, detail = Fbm(seed + 77, x * 0.05, z * 0.05, 3) * 3;
            return -6 + shore * (7 + Math.Max(0, hills) + detail);
        }
        public static string BiomeAt(long seed, double x, double z) => BiomeAt(seed, x, z, HeightAt(seed, x, z));
        public static string BiomeAt(long seed, double x, double z, double h) =>
            h < 0.2 ? "water" : h < 1.6 ? "beach" : h > 17 ? "rock" : Fbm(seed + 9, x * 0.02, z * 0.02, 3) > 0.52 ? "forest" : "grass";

        // ------------------------------------------------------------ content
        public sealed class NodeDef { public int Hp; public Dictionary<string, int> Drop, BonusDrop; public string BonusTool; public double Regrow; }
        public static readonly Dictionary<string, NodeDef> Nodes = new Dictionary<string, NodeDef>
        {
            ["tree"] = new NodeDef { Hp = 3, Drop = new Dictionary<string, int> { ["wood"] = 2 }, BonusTool = "axe", BonusDrop = new Dictionary<string, int> { ["wood"] = 4 }, Regrow = 240 },
            ["rock"] = new NodeDef { Hp = 4, Drop = new Dictionary<string, int> { ["stone"] = 2 }, BonusTool = "pickaxe", BonusDrop = new Dictionary<string, int> { ["stone"] = 4 }, Regrow = 300 },
            ["bush"] = new NodeDef { Hp = 1, Drop = new Dictionary<string, int> { ["berry"] = 2, ["fiber"] = 2 }, Regrow = 120 },
        };
        public sealed class ItemDef { public string Ko, En; public int Food, Hurt, Dmg; public bool Tool, Place; }
        public static readonly Dictionary<string, ItemDef> Items = new Dictionary<string, ItemDef>
        {
            ["wood"] = new ItemDef { Ko = "나무", En = "Wood" }, ["stone"] = new ItemDef { Ko = "돌", En = "Stone" }, ["fiber"] = new ItemDef { Ko = "섬유", En = "Fiber" },
            ["berry"] = new ItemDef { Ko = "열매", En = "Berries", Food = 12 }, ["meat"] = new ItemDef { Ko = "날고기", En = "Raw meat", Food = 10, Hurt = 5 },
            ["cooked"] = new ItemDef { Ko = "구운 고기", En = "Cooked meat", Food = 38 },
            ["axe"] = new ItemDef { Ko = "돌도끼", En = "Stone axe", Tool = true, Dmg = 9 }, ["pickaxe"] = new ItemDef { Ko = "곡괭이", En = "Pickaxe", Tool = true, Dmg = 7 },
            ["spear"] = new ItemDef { Ko = "나무 창", En = "Wooden spear", Tool = true, Dmg = 15 },
            ["campfire"] = new ItemDef { Ko = "모닥불", En = "Campfire", Place = true }, ["wall"] = new ItemDef { Ko = "나무 벽", En = "Wooden wall", Place = true },
        };
        public sealed class Recipe { public Dictionary<string, int> Need; public bool NearFire; }
        public static readonly Dictionary<string, Recipe> Recipes = new Dictionary<string, Recipe>
        {
            ["axe"] = new Recipe { Need = new Dictionary<string, int> { ["wood"] = 3, ["stone"] = 2 } },
            ["pickaxe"] = new Recipe { Need = new Dictionary<string, int> { ["wood"] = 3, ["stone"] = 3 } },
            ["spear"] = new Recipe { Need = new Dictionary<string, int> { ["wood"] = 4, ["fiber"] = 3 } },
            ["campfire"] = new Recipe { Need = new Dictionary<string, int> { ["wood"] = 5, ["stone"] = 4 } },
            ["wall"] = new Recipe { Need = new Dictionary<string, int> { ["wood"] = 6 } },
            ["cooked"] = new Recipe { Need = new Dictionary<string, int> { ["meat"] = 1 }, NearFire = true },
        };
        public static class Wolf { public const double Hp = 30, Speed = 4.4, Bite = 8, Every = 1.3, Sense = 45, Fear = 7; public const int MaxAtNight = 4; }

        // ------------------------------------------------------------ state
        public sealed class ResourceNode { public int Id; public string Kind; public double X, Z, Y, RespawnAt; public int Hp; }
        public sealed class WolfState { public int Id; public double X, Z, Hp, Cd; }
        public sealed class Structure { public string Kind; public double X, Z, Rot; }
        public sealed class Player { public double X, Z, Hp = 100, Hunger = 100, Thirst = 100, Warmth = 100, Stamina = 100, HitCd; public bool Alive = true; }
        public sealed class Game
        {
            public long Seed; public uint Rng; public double Time; public int Day = 1, WolfSeq, Kills;
            public List<ResourceNode> Nodes = new List<ResourceNode>(); public double SpawnX, SpawnZ;
            public Player P = new Player(); public Dictionary<string, int> Inv = new Dictionary<string, int>();
            public List<Structure> Structures = new List<Structure>(); public List<WolfState> Wolves = new List<WolfState>();
            public int Get(string k) => Inv.TryGetValue(k, out var n) ? n : 0;
        }

        public static double Rand(Game g)
        {
            unchecked
            {
                uint a = g.Rng + 0x6d2b79f5u, t = a;
                t = (uint)((int)(t ^ (t >> 15)) * (int)(t | 1));
                t ^= t + (uint)((int)(t ^ (t >> 7)) * (int)(t | 61));
                g.Rng = a;
                return (t ^ (t >> 14)) / 4294967296.0;
            }
        }

        /// <summary>Resource nodes on a jittered grid + the spawn point (web makeWorld).</summary>
        public static void MakeWorld(Game g)
        {
            long seed = g.Seed; const double step = 6; int n = 0; g.Nodes.Clear();
            for (double x = -World / 2; x < World / 2; x += step)
                for (double z = -World / 2; z < World / 2; z += step)
                {
                    double jx = x + Hash2(seed + 3, x, z) * step, jz = z + Hash2(seed + 4, x, z) * step, h = HeightAt(seed, jx, jz), r = Hash2(seed + 5, x, z);
                    string b = BiomeAt(seed, jx, jz, h), kind = null;
                    if (b == "forest" && r < 0.55) kind = "tree";
                    else if (b == "grass" && r < 0.07) kind = "tree";
                    else if (b == "grass" && r < 0.16) kind = "bush";
                    else if (b == "rock" && r < 0.3) kind = "rock";
                    else if ((b == "grass" || b == "beach") && r > 0.975) kind = "rock";
                    if (kind != null) g.Nodes.Add(new ResourceNode { Id = n++, Kind = kind, X = jx, Z = jz, Y = h, Hp = Nodes[kind].Hp });
                }
            g.SpawnX = 0; g.SpawnZ = Island * 0.6;
            for (int k = 0; k < 60; k++) { double z = Island * (0.95 - k * 0.015); if (HeightAt(seed, 0, z) > 1.8) { g.SpawnZ = z; break; } }
        }

        public static Game NewGame(long seed = 1)
        {
            var g = new Game { Seed = seed, Rng = ToUint32(seed * 2654435761.0), Time = Day * 0.25 };   // JS: (seed * 2654435761) >>> 0, a double product
            MakeWorld(g); g.P.X = g.SpawnX; g.P.Z = g.SpawnZ; g.Inv["berry"] = 2;
            return g;
        }
        /// <summary>JS ToUint32 of a double (the product above can exceed 2^53, so this must not be done in exact integers).</summary>
        public static uint ToUint32(double v) { double m = Math.Truncate(v) % 4294967296.0; if (m < 0) m += 4294967296.0; return (uint)m; }
        public static double DayPhase(Game g) => (g.Time % Day) / Day;
        public static bool IsNight(Game g) { double k = DayPhase(g); return k >= NightFrom || k < NightTo; }
        static double Dist(double ax, double az, double bx, double bz) => Math.Sqrt((ax - bx) * (ax - bx) + (az - bz) * (az - bz));
        public static bool NearFire(Game g, double r = 6) => NearFire(g, g.P.X, g.P.Z, r);
        public static bool NearFire(Game g, double x, double z, double r) => g.Structures.Any(s => s.Kind == "campfire" && Dist(s.X, s.Z, x, z) < r);
        static void Add(Game g, Dictionary<string, int> d) { foreach (var kv in d) g.Inv[kv.Key] = g.Get(kv.Key) + kv.Value; }

        /// <summary>Needs, clock, regrowth and wolves for dt seconds (web step).</summary>
        public static void Step(Game g, double dt, bool sprinting = false)
        {
            var P = g.P; if (!P.Alive) return;
            int before = (int)Math.Floor(g.Time / Day); g.Time += dt; if ((int)Math.Floor(g.Time / Day) > before) g.Day++;
            bool night = IsNight(g), fire = NearFire(g);
            P.Hunger = Math.Max(0, P.Hunger - dt * (sprinting ? 0.26 : 0.16));
            P.Thirst = Math.Max(0, P.Thirst - dt * (sprinting ? 0.34 : 0.22));
            P.Stamina = Math.Max(0, Math.Min(100, P.Stamina + dt * (sprinting ? -14 : 9)));
            P.Warmth = Math.Max(0, Math.Min(100, P.Warmth + dt * (fire ? 4 : night ? -0.45 : 0.8)));
            double hurt = 0;
            if (P.Hunger <= 0) hurt += 0.5; if (P.Thirst <= 0) hurt += 0.6; if (P.Warmth <= 0) hurt += 0.4;
            if (hurt > 0) P.Hp -= hurt * dt;
            else if (P.Hunger > 60 && P.Thirst > 60) P.Hp = Math.Min(100, P.Hp + dt * 0.25);
            P.HitCd = Math.Max(0, P.HitCd - dt);
            foreach (var n in g.Nodes) if (n.Hp <= 0 && g.Time >= n.RespawnAt) n.Hp = Nodes[n.Kind].Hp;
            Wolves(g, dt, night);
            if (P.Hp <= 0) { P.Hp = 0; P.Alive = false; }
        }

        static void Wolves(Game g, double dt, bool night)
        {
            var P = g.P;
            if (night && g.Wolves.Count < Wolf.MaxAtNight + Math.Min(4, g.Day - 1) && Rand(g) < dt * 0.08)
            {
                double a = Rand(g) * Math.PI * 2, r = 38 + Rand(g) * 12;
                var w = new WolfState { Id = ++g.WolfSeq, X = P.X + Math.Cos(a) * r, Z = P.Z + Math.Sin(a) * r, Hp = Wolf.Hp };
                if (HeightAt(g.Seed, w.X, w.Z) > 0.5) g.Wolves.Add(w);
            }
            foreach (var w in g.Wolves)
            {
                w.Cd = Math.Max(0, w.Cd - dt);
                var fire = g.Structures.FirstOrDefault(s => s.Kind == "campfire" && Dist(s.X, s.Z, w.X, w.Z) < Wolf.Fear);
                double d = Dist(w.X, w.Z, P.X, P.Z), tx = 0, tz = 0;
                if (!night) { tx = w.X - P.X; tz = w.Z - P.Z; }
                else if (fire != null) { tx = w.X - fire.X; tz = w.Z - fire.Z; }
                else if (d < Wolf.Sense) { tx = P.X - w.X; tz = P.Z - w.Z; }
                double L = Math.Sqrt(tx * tx + tz * tz);
                if (L > 0.01 && !(d < 1.5 && night && fire == null))
                {
                    double nx = w.X + tx / L * Wolf.Speed * dt, nz = w.Z + tz / L * Wolf.Speed * dt;
                    if (!Blocked(g, nx, nz, 0.6)) { w.X = nx; w.Z = nz; }
                }
                if (night && fire == null && d < 1.7 && w.Cd <= 0 && P.Alive) { P.Hp -= Wolf.Bite; w.Cd = Wolf.Every; }
            }
            g.Wolves.RemoveAll(w => !(w.Hp > 0 && (night || Dist(w.X, w.Z, P.X, P.Z) < 70)));
        }

        public static bool Blocked(Game g, double x, double z, double r = 0.45)
        {
            if (HeightAt(g.Seed, x, z) < -0.6) return true;
            return g.Structures.Any(s => s.Kind == "wall" && Math.Abs(x - s.X) < 1 + r && Math.Abs(z - s.Z) < 1 + r);
        }
        public static void MovePlayer(Game g, double dx, double dz)
        {
            var P = g.P; if (!P.Alive) return;
            if (!Blocked(g, P.X + dx, P.Z)) P.X += dx;
            if (!Blocked(g, P.X, P.Z + dz)) P.Z += dz;
        }

        // ------------------------------------------------------------ actions
        public static ResourceNode NearestNode(Game g, double r = Reach)
        {
            ResourceNode best = null; double bd = r;
            foreach (var n in g.Nodes) { if (n.Hp <= 0) continue; double d = Dist(n.X, n.Z, g.P.X, g.P.Z); if (d < bd) { bd = d; best = n; } }
            return best;
        }
        /// <summary>Hit a node; returns the drop on the last hit, an empty drop on a hit, null when out of reach.</summary>
        public static Dictionary<string, int> Gather(Game g, ResourceNode n)
        {
            if (n == null || n.Hp <= 0 || Dist(n.X, n.Z, g.P.X, g.P.Z) > Reach + 0.5) return null;
            var D = Nodes[n.Kind]; n.Hp--;
            if (n.Hp > 0) return new Dictionary<string, int>();
            var drop = D.BonusTool != null && g.Get(D.BonusTool) > 0 ? D.BonusDrop : D.Drop;
            Add(g, drop); n.RespawnAt = g.Time + D.Regrow;
            return drop;
        }
        /// <summary>"" when crafted, else the reason: unknown / fire / need / have.</summary>
        public static string Craft(Game g, string id)
        {
            if (!Recipes.TryGetValue(id, out var R)) return "unknown";
            if (R.NearFire && !NearFire(g)) return "fire";
            if (R.Need.Any(kv => g.Get(kv.Key) < kv.Value)) return "need";
            if (Items[id].Tool && g.Get(id) > 0) return "have";
            foreach (var kv in R.Need) g.Inv[kv.Key] -= kv.Value;
            g.Inv[id] = g.Get(id) + 1; return "";
        }
        public static bool Eat(Game g, string id)
        {
            if (!Items.TryGetValue(id, out var I) || I.Food == 0 || g.Get(id) <= 0) return false;
            g.Inv[id]--; g.P.Hunger = Math.Min(100, g.P.Hunger + I.Food); g.P.Hp -= I.Hurt; return true;
        }
        public static bool CanDrink(Game g) => new[] { (1.5, 0.0), (-1.5, 0.0), (0.0, 1.5), (0.0, -1.5), (0.0, 0.0) }.Any(o => HeightAt(g.Seed, g.P.X + o.Item1, g.P.Z + o.Item2) < 0.3);
        public static bool Drink(Game g) { if (!CanDrink(g)) return false; g.P.Thirst = Math.Min(100, g.P.Thirst + 25); return true; }
        /// <summary>JS Math.round: halves round up (toward +∞), unlike C#'s banker's rounding.</summary>
        public static double Snap(double v) => Math.Floor(v / 2 + 0.5) * 2;
        public static bool CanPlace(Game g, string kind, double x, double z)
        {
            if (!Items.TryGetValue(kind, out var I) || !I.Place || g.Get(kind) <= 0) return false;
            x = Snap(x); z = Snap(z);
            double h = HeightAt(g.Seed, x, z), slope = Math.Abs(HeightAt(g.Seed, x + 1, z) - HeightAt(g.Seed, x - 1, z)) + Math.Abs(HeightAt(g.Seed, x, z + 1) - HeightAt(g.Seed, x, z - 1));
            if (h < 0.6 || slope > 2.2) return false;
            if (g.Structures.Any(s => s.X == x && s.Z == z)) return false;
            if (g.Nodes.Any(n => n.Hp > 0 && Dist(n.X, n.Z, x, z) < 1.6)) return false;
            if (kind == "wall" && Dist(g.P.X, g.P.Z, x, z) < 1.2) return false;
            return true;
        }
        public static bool Place(Game g, string kind, double x, double z, double rot = 0)
        {
            if (!CanPlace(g, kind, x, z)) return false;
            g.Inv[kind]--; g.Structures.Add(new Structure { Kind = kind, X = Snap(x), Z = Snap(z), Rot = rot }); return true;
        }
        /// <summary>Strike a wolf within 2.4 m with the best tool you carry (fist 5); true when it dies (meat ×2).</summary>
        public static bool Attack(Game g, WolfState w)
        {
            var P = g.P; if (w == null || P.HitCd > 0 || Dist(w.X, w.Z, P.X, P.Z) > 2.4) return false;
            string tool = new[] { "spear", "axe", "pickaxe" }.FirstOrDefault(t => g.Get(t) > 0);
            w.Hp -= tool != null ? Items[tool].Dmg : 5; P.HitCd = 0.55;
            if (w.Hp <= 0) { g.Kills++; g.Inv["meat"] = g.Get("meat") + 2; return true; }
            return false;
        }
    }
}

using System;
using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    /// <summary>One placement call of the web world builder (island coordinates, metres, radians), the same arguments the web game
    /// passes to <c>W.box</c> (Op "box": x, y = bottom, z, size; a collider unless NoCol, drawn unless Hidden; Geo = Blender unit-cube
    /// prop stretched to the box, or "" for a plain box) or <c>W.addStatic</c> (Op "static": a Blender model, y = bottom for unit-cube
    /// props or the model origin when Origin, scale, yaw).</summary>
    public sealed class PropCall
    {
        public readonly string Op, Geo, Mat, Kind, Surface;
        public readonly double X, Y, Z, Sx, Sy, Sz, RotY;
        public readonly bool Hidden, NoCol, Rot90, Origin;
        /// <summary>Not a surface to stand on (web noStand: the relay mast's collider core).</summary>
        public readonly bool NoStand;
        public readonly double[] Tint;

        public PropCall(string op, string geo, string mat, double x, double y, double z, double sx, double sy, double sz, double rotY,
            bool hidden, bool noCol, bool rot90, bool origin, string kind, string surface, double[] tint, bool noStand = false)
        {
            NoStand = noStand;
            Op = op; Geo = geo ?? ""; Mat = mat ?? ""; X = x; Y = y; Z = z; Sx = sx; Sy = sy; Sz = sz; RotY = rotY;
            Hidden = hidden; NoCol = noCol; Rot90 = rot90; Origin = origin; Kind = kind ?? ""; Surface = surface ?? ""; Tint = tint;
        }

        public bool IsBox => Op == "box";
        public bool HasCollider => IsBox && !NoCol;
        public bool Drawn => !IsBox || !Hidden;
        public override string ToString() => $"{Op} {Geo} ({X:0.##}, {Y:0.##}, {Z:0.##}) [{Sx:0.##} {Sy:0.##} {Sz:0.##}]";
    }

    /// <summary>A point light (web: lamp(…, light = true) → PointLight 0xffe2a0, 60, range 38).</summary>
    public readonly struct PropLight
    {
        public readonly double X, Y, Z, Range;
        public PropLight(double x, double y, double z, double range) { X = x; Y = y; Z = z; Range = range; }
    }

    /// <summary>A rotating radar (web: radar() — Blender 'Radar' base scaled to the mast height, dish spinning 0.7 rad/s).</summary>
    public readonly struct PropRadar
    {
        public readonly double X, Y, Z, Height;
        public PropRadar(double x, double y, double z, double h) { X = x; Y = y; Z = z; Height = h; }
    }

    /// <summary>A whole Blender model placed at its origin (web: new THREE.Mesh(assetGeo(name)) — e.g. the jungle relay mast).</summary>
    public readonly struct PropModel
    {
        public readonly string Geo; public readonly double X, Y, Z;
        public PropModel(string geo, double x, double y, double z) { Geo = geo; X = x; Y = y; Z = z; }
    }

    public sealed class PropSet
    {
        public readonly List<PropModel> Models = new List<PropModel>();
        public readonly List<PropCall> Calls = new List<PropCall>();
        public readonly List<PropLight> Lights = new List<PropLight>();
        public readonly List<PropRadar> Radars = new List<PropRadar>();
        /// <summary>Named points (web POI): e.g. "beachTower" = the deck a sniper stands on.</summary>
        public readonly Dictionary<string, (double x, double y, double z)> Points = new Dictionary<string, (double, double, double)>();
    }

    /// <summary>The web island's man-made props, a port of apps/special-soldier/src/world/build.js (helper functions sandbags, crate,
    /// barrel, ammoBox, lamp, tower, radar, building and world.js walls). Zone by zone; PropsTests compares the calls with the ones
    /// the JavaScript makes (Tools~/gen-props-fixture.mjs runs the web source). Heights use the web game's grid (IslandVegetation.HeightAt).</summary>
    public static class IslandProps
    {
        public const uint Seed = 1337;   // build.js: rnd = mulberry(1337), shared by every zone in order

        sealed class Builder
        {
            public readonly PropSet S = new PropSet();
            readonly float[] _h;
            public readonly IslandVegetation.Mulberry Rnd = new IslandVegetation.Mulberry(Seed);
            public Builder(float[] h) { _h = h; }
            public double H(double x, double z) => IslandVegetation.HeightAt(_h, x, z);

            public void Box(double x, double y, double z, double sx, double sy, double sz, string mat, string geo = "", bool hidden = false, bool noCol = false,
                bool rot90 = false, string kind = "", string surf = "", double[] tint = null, bool noStand = false) =>
                S.Calls.Add(new PropCall("box", geo, mat, x, y, z, sx, sy, sz, 0, hidden, noCol, rot90, false, kind, surf, tint, noStand));

            public void Static(string geo, double x, double y, double z, double sx = 1, double sy = 1, double sz = 1, double rotY = 0, double[] tint = null, bool origin = false) =>
                S.Calls.Add(new PropCall("static", geo, "", x, y, z, sx, sy, sz, rotY, false, false, false, origin, "", "", tint));

            // ---- build.js helpers (Blender assets loaded) ----
            public void Sandbags(double x, double z, double len, bool alongX = true)
            {
                double y = H(x, z) - 0.15;
                if (alongX) Box(x, y, z, len, 1.15, 0.8, "sand", "P_sandbags", kind: "cover", surf: "sand");
                else Box(x, y, z, 0.8, 1.15, len, "sand", "P_sandbags", rot90: true, kind: "cover", surf: "sand");
            }
            public void Crate(double x, double z, double s = 1.1) => Box(x, H(x, z) - 0.05, z, s, s, s, "wood", "P_crate", kind: "crate", surf: "wood");
            public void AmmoBox(double x, double z) => Box(x, H(x, z), z, 0.9, 0.5, 0.6, "olive", "P_ammo", kind: "cover", surf: "metal");
            public void Barrel(double x, double z) => Box(x, H(x, z) - 0.05, z, 0.75, 1.15, 0.75, "red", "P_barrel", kind: "barrel", surf: "metal");

            public void Lamp(double x, double z, double h = 6, bool light = false)
            {
                double y = H(x, z), k = h / 6;
                Static("LampPost", x, y, z, 1, k, 1, 0, null, true);
                if (light) S.Lights.Add(new PropLight(x, y + h - 0.4, z + 0.95, 38));
            }

            public (double x, double y, double z) Tower(double x, double z, double h = 6.5)
            {
                double y = H(x, z);
                Static("Watchtower", x, y, z, 1, (h + 0.25) / 6.5, 1, 0, null, true);
                Box(x, y + h, z, 3.6, 0.25, 3.6, "wood", hidden: true, surf: "wood");
                Box(x, y + h + 0.25, z - 1.7, 3.6, 0.7, 0.15, "wood", hidden: true, surf: "wood"); Box(x, y + h + 0.25, z + 1.7, 3.6, 0.7, 0.15, "wood", hidden: true, surf: "wood");
                Box(x - 1.7, y + h + 0.25, z, 0.15, 0.7, 3.6, "wood", hidden: true, surf: "wood"); Box(x + 1.7, y + h + 0.25, z, 0.15, 0.7, 3.6, "wood", hidden: true, surf: "wood");
                Rnd.Next();   // searchlight phase (web: const ph = rnd() * 6)
                return (x, y + h + 0.25, z);
            }

            public void Radar(double x, double z, double h = 7)
            {
                double y = H(x, z);
                S.Radars.Add(new PropRadar(x, y, z, h));
                Box(x, y, z, 2.4, h, 2.4, "concrete", hidden: true);
            }

            public double Building(double x, double z, double w, double d, double h, string mat, Dictionary<char, double[][]> gaps, string surf = "concrete", string roof = "dark")
            {
                double y = H(x, z) - 0.05;
                Walls(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, h, mat, gaps, 0.5, surf);
                double[] tint = roof == "rust" ? new[] { 2.3, 1.15, 0.75 } : roof == "concrete" ? new[] { 2.0, 2.0, 1.9 } : new[] { 1.0, 1.0, 1.0 };
                Box(x, y + h, z, w + 0.8, 0.45, d + 0.8, roof, "P_roof", surf: "metal", tint: tint);
                return y;
            }

            /// <summary>world.js walls(): a wall ring with door gaps; each solid run is one hidden collider plus ≈4 m Blender panels.</summary>
            public void Walls(double x0, double z0, double x1, double z1, double y, double h, string mat, Dictionary<char, double[][]> gaps, double th, string surf)
            {
                (string geo, double[] tint) panel = mat == "concrete" ? ("P_wall_concrete", null) : mat == "dark" ? ("P_wall_concrete", new[] { 0.5, 0.5, 0.52 })
                    : mat == "white" ? ("P_wall_concrete", new[] { 1.7, 1.72, 1.72 }) : mat == "metal" ? ("P_wall_metal", null)
                    : mat == "olive" ? ("P_wall_metal", new[] { 0.85, 0.95, 0.6 }) : mat == "wood" ? ("P_wall_wood", null) : (null, null);
                void Seg(double a0, double a1, double fix, bool horiz, double[][] g)
                {
                    double cur = a0;
                    var gs = new List<double[]>(g ?? new double[0][]); gs.Sort((p, q) => p[0].CompareTo(q[0])); gs.Add(new[] { a1, a1 });
                    foreach (var gp in gs)
                    {
                        double ga = gp[0], gb = gp[1];
                        if (ga > cur + 0.01)
                        {
                            double len = ga - cur, mid = (cur + ga) / 2;
                            if (panel.geo != null)
                            {
                                if (horiz) Box(mid, y, fix, len, h, th, mat, hidden: true, surf: surf); else Box(fix, y, mid, th, h, len, mat, hidden: true, surf: surf);
                                int n = Math.Max(1, (int)Math.Round(len / 4, MidpointRounding.AwayFromZero)); double w = len / n;
                                for (int i = 0; i < n; i++)
                                {
                                    double c = cur + w * (i + 0.5);
                                    if (horiz) Static(panel.geo, c, y, fix, w, h, th * 1.12, 0, panel.tint); else Static(panel.geo, fix, y, c, w, h, th * 1.12, Math.PI / 2, panel.tint);
                                }
                            }
                            else if (horiz) Box(mid, y, fix, len, h, th, mat, surf: surf); else Box(fix, y, mid, th, h, len, mat, surf: surf);
                        }
                        cur = Math.Max(cur, gb);
                    }
                }
                gaps = gaps ?? new Dictionary<char, double[][]>();
                gaps.TryGetValue('n', out var n0); gaps.TryGetValue('s', out var s0); gaps.TryGetValue('w', out var w0); gaps.TryGetValue('e', out var e0);
                Seg(x0, x1, z0, true, n0); Seg(x0, x1, z1, true, s0); Seg(z0, z1, x0, false, w0); Seg(z0, z1, x1, false, e0);
            }
        }

        /// <summary>web world.groundAt(x, z, y): the highest collider top under (x, z) (0.2 m slack) that is at most 0.6 m above y,
        /// else the ground. With y = 999 it is missions.js top(x, z): where an enemy "on a structure" stands.</summary>
        public static double GroundAt(PropSet set, double x, double z, double y, double ground)
        {
            double g = ground;
            foreach (var c in set.Calls)
            {
                if (!c.HasCollider || c.NoStand) continue;
                double top = c.Y + c.Sy;
                if (x > c.X - c.Sx / 2 - 0.2 && x < c.X + c.Sx / 2 + 0.2 && z > c.Z - c.Sz / 2 - 0.2 && z < c.Z + c.Sz / 2 + 0.2 && top <= y + 0.6 && top > g) g = top;
            }
            return g;
        }

        public static double Top(PropSet set, double x, double z) => GroundAt(set, x, z, 999, IslandVegetation.HeightAt(IslandVegetation.GridHeights(), x, z));

        /// <summary>The jungle comms relay (web POI.comms) — the Mission 02 target.</summary>
        public static readonly (double x, double z) Comms = (-140, 150);
        /// <summary>Mission 02's backup-power outpost on the north-west ridge (web missions.js GEN).</summary>
        public static readonly (double x, double z) Gen = (-170, 220);

        /// <summary>ZONE 02 — JUNGLE comms station (build.js): concrete hut with a console, the lattice relay mast (Blender
        /// 'CommsTower', 30 m collider core you cannot stand on), generator, sandbags, crates, barrel, ammo, a sniper tower and a lamp.
        /// The waterfall and cave further north are not ported yet.</summary>
        public static PropSet Jungle(float[] heights = null)
        {
            var b = new Builder(heights ?? IslandVegetation.GridHeights());
            var c = Comms; double y = b.H(c.x, c.z);
            b.Building(c.x - 14, c.z + 8, 10, 8, 3.2, "concrete", new Dictionary<char, double[][]> { ['e'] = new[] { new[] { c.z + 6.8, c.z + 9.2 } } });
            b.Box(c.x - 16, y, c.z + 6, 1, 1.4, 3, "metal", "P_console", rot90: true, surf: "metal");
            b.S.Models.Add(new PropModel("CommsTower", c.x, y, c.z));
            b.Box(c.x, y, c.z, 2.6, 30, 2.6, "", hidden: true, surf: "metal", noStand: true);   // web: POI.commsTower.col
            b.S.Points["commsMast"] = (c.x, y, c.z);
            b.Box(c.x + 8, y, c.z - 6, 3, 2.2, 2, "olive", "P_generator", kind: "cover", surf: "metal");
            b.Sandbags(c.x + 18, c.z + 22, 7); b.Sandbags(c.x - 4, c.z + 26, 6); b.Sandbags(c.x + 24, c.z + 4, 6, false); b.Sandbags(c.x + 6, c.z + 14, 4);
            b.Crate(c.x + 6, c.z + 5); b.Crate(c.x + 7.3, c.z + 5.2); b.Barrel(c.x + 10, c.z - 3); b.AmmoBox(c.x - 8, c.z + 3);
            b.S.Points["commsTower"] = b.Tower(c.x + 26, c.z + 26);
            b.Lamp(c.x + 4, c.z + 10, 6, true);
            return b.S;
        }

        /// <summary>Mission 02 backup-power outpost (web missions.js buildGenOutpost): generator, two sandbag walls, two barrels.</summary>
        public static PropSet GenOutpost(float[] heights = null)
        {
            var b = new Builder(heights ?? IslandVegetation.GridHeights());
            var g = Gen;
            b.Box(g.x, b.H(g.x, g.z) - 0.05, g.z, 3, 2.2, 2, "olive", "P_generator", kind: "cover", surf: "metal");
            foreach (var (dx, dz, len, ax) in new[] { (0.0, 3.4, 4.2, true), (-3.6, 0.0, 3.2, false) })
            {
                double x = g.x + dx, z = g.z + dz;
                b.Box(x, b.H(x, z) - 0.15, z, ax ? len : 0.8, 1.15, ax ? 0.8 : len, "sand", "P_sandbags", rot90: !ax, kind: "cover", surf: "sand");
            }
            foreach (var (dx, dz) in new[] { (3.4, -1.2), (3.4, 0.2) }) { double x = g.x + dx, z = g.z + dz; b.Barrel(x, z); }
            return b.S;
        }

        /// <summary>Several prop sets as one (a mission that spans zones).</summary>
        public static PropSet Merge(params PropSet[] sets)
        {
            var m = new PropSet();
            foreach (var s in sets)
            {
                m.Calls.AddRange(s.Calls); m.Lights.AddRange(s.Lights); m.Radars.AddRange(s.Radars); m.Models.AddRange(s.Models);
                foreach (var kv in s.Points) m.Points[kv.Key] = kv.Value;
            }
            return m;
        }

        /// <summary>ZONE 01 — BEACH (build.js): sandbag posts, the guard hut, two watch towers, the coastal radar, crates, barrels,
        /// ammo box, lamps and the anti-landing hedgehogs at the waterline.</summary>
        public static PropSet Beach(float[] heights = null)
        {
            var b = new Builder(heights ?? IslandVegetation.GridHeights());
            b.Sandbags(-42, 306, 7); b.Sandbags(-46.5, 303, 5, false); b.Sandbags(46, 300, 7); b.Sandbags(50.5, 297, 5, false);
            b.Sandbags(-12, 312, 5); b.Sandbags(18, 316, 5);
            b.Building(-44, 292, 9, 7, 3, "wood", new Dictionary<char, double[][]> { ['s'] = new[] { new[] { -45.2, -42.8 } } }, "wood", "rust");
            b.S.Points["beachTower"] = b.Tower(10, 284); b.Tower(-70, 292); b.Radar(72, 292);
            b.Crate(-38, 301); b.Crate(-36.6, 301.4); b.Crate(52, 293); b.Barrel(54, 294.5); b.Barrel(-30, 298); b.AmmoBox(-41, 296.5);
            b.Lamp(-40, 298, 5, true); b.Lamp(44, 296, 5, true);
            for (int i = 0; i < 9; i++)
            {
                double x = -90 + i * 22 + b.Rnd.Next() * 6, z = 322 + b.Rnd.Next() * 10, y = b.H(x, z);
                b.Static("Hedgehog", x, y - 0.12, z, 1, 1, 1, b.Rnd.Next() * 6, null, true);   // beach obstacles
            }
            return b.S;
        }
    }
}

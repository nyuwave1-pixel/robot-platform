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
        /// <summary>Facility emergency light (web 0xff3020, pulsing 60 ± 40) instead of a warm lamp.</summary>
        public readonly bool Red;
        public PropLight(double x, double y, double z, double range, bool red = false) { X = x; Y = y; Z = z; Range = range; Red = red; }
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
        public readonly string Geo; public readonly double X, Y, Z, RotY;
        public PropModel(string geo, double x, double y, double z, double rotY = 0) { Geo = geo; X = x; Y = y; Z = z; RotY = rotY; }
    }

    public sealed class PropSet
    {
        public readonly List<PropModel> Models = new List<PropModel>();
        /// <summary>Floor and ceiling slabs of indoor levels (web: meshes, the facility's floor is the FAC_Y plane) — boxes with colliders.</summary>
        public readonly List<PropCall> Slabs = new List<PropCall>();
        /// <summary>Security cameras (Mission 04): island position of the camera head and its sweep phase.</summary>
        public readonly List<SecurityCam> Cameras = new List<SecurityCam>();
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
            public void Crate(double x, double z, double s = 1.1, double? y = null) => Box(x, y ?? H(x, z) - 0.05, z, s, s, s, "wood", "P_crate", kind: "crate", surf: "wood");
            public void AmmoBox(double x, double z, double? y = null) => Box(x, y ?? H(x, z), z, 0.9, 0.5, 0.6, "olive", "P_ammo", kind: "cover", surf: "metal");
            public void Barrel(double x, double z, double? y = null) => Box(x, y ?? H(x, z) - 0.05, z, 0.75, 1.15, 0.75, "red", "P_barrel", kind: "barrel", surf: "metal");

            /// <summary>build.js container(): a 6.1 × 2.6 × 2.5 box (Blender P_container) tinted by its paint.</summary>
            public void Container(double x, double z, string paint, bool alongX = true, double? y = null)
            {
                double[] tint = paint == "rust" ? new[] { 1.35, 0.62, 0.4 } : paint == "blue" ? new[] { 0.5, 0.8, 1.3 } : new[] { 0.78, 0.86, 0.56 };
                Box(x, y ?? H(x, z) - 0.1, z, alongX ? 6.1 : 2.5, 2.6, alongX ? 2.5 : 6.1, paint, "P_container", rot90: !alongX, kind: "cover", surf: "metal", tint: tint);
            }

            /// <summary>build.js truck(): the Blender truck (faces +z, turned to lie along x) and its 7.2 × 2.6 collider, 3.1 m high.</summary>
            public void Truck(double x, double z, bool alongX = true)
            {
                double y = H(x, z), L = 7.2, Wd = 2.6;
                S.Models.Add(new PropModel("Truck", x, y, z, alongX ? Math.PI / 2 : 0));
                double sx = alongX ? L : Wd, sz = alongX ? Wd : L;
                Box(x, y, z, sx, 3.1, sz, "", hidden: true, kind: "vehicle", surf: "metal");   // web: W.addCollider (hp 260, explosive 8)
            }

            /// <summary>build.js glass(): Blender window frame + a breakable see-through pane.</summary>
            public void Glass(double x, double y, double z, double sx, double sy, double sz)
            {
                if (sx >= sz) Static("P_window", x, y, z, sx, sy, sz * 1.4); else Static("P_window", x, y, z, sz, sy, sx * 1.4, Math.PI / 2);
                Box(x, y, z, sx, sy, sz, "glass", kind: "glass", surf: "glass");
            }

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

        /// <summary>ZONE 03 — MILITARY BASE (build.js): perimeter wall with three gates, corner sniper towers, gate sandbags and
        /// barriers, two barracks with bunks, the armory, HQ (two rooms, windows, the intel terminal desk), comms hut + radar,
        /// motor pool (trucks, containers), the bunker elevator, yard cover, flagpole and lamps.</summary>
        public static PropSet Base(float[] heights = null)
        {
            var b = new Builder(heights ?? IslandVegetation.GridHeights());
            const double y = 16;
            b.Walls(-120, -185, 120, 0, y, 3.2, "concrete", new Dictionary<char, double[][]> { ['s'] = new[] { new[] { -6.0, 6.0 } }, ['n'] = new[] { new[] { -6.0, 6.0 } }, ['e'] = new[] { new[] { -154.0, -146.0 } } }, 0.8, "concrete");
            foreach (var (tx, tz) in new[] { (-112.0, -8.0), (112.0, -8.0), (-112.0, -177.0), (112.0, -177.0) }) b.Tower(tx, tz, 7);
            b.Sandbags(-10, -10, 6); b.Sandbags(11, -12, 6); b.Sandbags(0, -26, 8);
            b.Box(-8.5, y, 2, 3, 1.1, 0.8, "red", "P_barrier", kind: "cover"); b.Box(8.5, y, 2, 3, 1.1, 0.8, "red", "P_barrier", kind: "cover");
            // barracks ×2
            b.Building(62, -40, 26, 12, 3.4, "olive", new Dictionary<char, double[][]> { ['w'] = new[] { new[] { -41.5, -38.5 } }, ['n'] = new[] { new[] { 55.0, 58.0 } } });
            b.Building(62, -72, 26, 12, 3.4, "olive", new Dictionary<char, double[][]> { ['w'] = new[] { new[] { -73.5, -70.5 } } });
            foreach (var bz in new[] { -40.0, -72.0 }) for (int i = 0; i < 4; i++) b.Box(54 + i * 5.5, y, bz + 3.6, 2, 1.7, 1, "dark", "P_bunk", surf: "metal");
            // armory / warehouse
            b.Building(-72, -48, 30, 20, 5, "metal", new Dictionary<char, double[][]> { ['e'] = new[] { new[] { -51.0, -45.0 } }, ['s'] = new[] { new[] { -80.0, -76.0 } } }, "metal", "rust");
            for (int i = 0; i < 6; i++) b.Crate(-82 + (i % 3) * 7, -54 + (i / 3) * 7, 1.4, y);
            b.Crate(-82, -54, 1.2, y + 1.4); b.Barrel(-62, -41, y); b.Barrel(-61, -42.2, y); b.AmmoBox(-66, -55, y);
            b.Box(-70, y, -48, 4, 1.1, 1.2, "dark", "P_desk", kind: "cover", surf: "metal");
            // HQ: two rooms, windows, intel terminal
            b.Building(0, -132, 28, 18, 4, "concrete", new Dictionary<char, double[][]> { ['s'] = new[] { new[] { -10.0, -6.0 }, new[] { -2.0, 2.0 }, new[] { 6.0, 10.0 } }, ['e'] = new[] { new[] { -131.0, -128.0 } }, ['w'] = new[] { new[] { -136.0, -133.0 } } });
            b.Box(0, y, -134, 0.4, 4, 9, "concrete", hidden: true);
            foreach (var pz in new[] { -136.25, -131.75 }) b.Static("P_wall_concrete", 0, y, pz, 4.5, 4, 0.45, Math.PI / 2);   // partition
            b.Glass(-8, y, -123, 4, 4, 0.3); b.Glass(8, y, -123, 4, 4, 0.3);
            b.Box(8, y, -138, 5, 1, 1.4, "dark", "P_desk", kind: "cover", surf: "metal"); b.Box(-7, y, -136, 3, 1, 1.4, "dark", "P_desk", kind: "cover", surf: "metal");
            b.S.Points["intel"] = (8, y + 1.2, -137);
            // comms hut + radar, motor pool
            b.Building(-78, -152, 12, 10, 3.4, "concrete", new Dictionary<char, double[][]> { ['e'] = new[] { new[] { -153.5, -150.5 } } }); b.Radar(-92, -168, 8);
            b.Truck(-62, -92); b.Truck(-62, -100); b.Truck(-40, -112, false);
            b.Container(-30, -88, "rust"); b.Container(-30, -84.5, "blue", true, y + 0); b.Container(-84, -112, "olive", false);
            b.Barrel(-48, -92, y); b.Barrel(-47, -93.2, y); b.Sandbags(-48, -122, 7); b.Sandbags(-20, -70, 7, false);
            // bunker (elevator to the underground facility)
            b.Building(90, -150, 12, 12, 3.6, "dark", new Dictionary<char, double[][]> { ['w'] = new[] { new[] { -152.0, -148.0 } } }, roof: "concrete");
            // yard clutter / cover lanes
            b.Sandbags(30, -100, 7); b.Sandbags(-18, -105, 6); b.Sandbags(40, -128, 6, false);
            b.Container(28, -60, "blue", false); b.Container(96, -100, "rust"); b.Container(96, -96.6, "olive");
            b.Crate(20, -82, 1.2, y); b.Crate(21.4, -82.3, 1.2, y); b.Crate(60, -112, 1.3, y);
            b.Barrel(34, -62, y); b.Barrel(70, -120, y); b.Barrel(-100, -70, y); b.AmmoBox(24, -98, y);
            b.Static("Flagpole", 0, y, -60, 1, 1, 1, 0, null, true); b.Box(0, y, -60, 0.3, 11, 0.3, "metal", hidden: true, surf: "metal");
            foreach (var (lx, lz, on) in new[] { (-30.0, -20.0, true), (30.0, -20.0, false), (-30.0, -80.0, false), (30.0, -80.0, true), (-30.0, -160.0, false), (40.0, -165.0, true), (80.0, -120.0, false), (-95.0, -90.0, false) })
                b.Lamp(lx, lz, 7, on);
            return b.S;
        }

        /// <summary>The underground bio-research facility under the bunker (web POI.fac, world.js FAC_Y / FAC_H).</summary>
        public static readonly (double x, double z) Fac = (90, -150);
        public const double FacY = -60, FacH = 4.2;

        /// <summary>ZONE 04 — UNDERGROUND FACILITY (build.js buildFacility): elevator hall, camera corridor with the security door,
        /// laboratory with glass partitions, bio vault, second corridor, server room with the uplink console and the exit lift.
        /// Points: facSpawn, secDoor (the door's own centre), secDoorPos (where you override it), sample, sampleMesh, server, exitLift.</summary>
        public static PropSet Facility(float[] heights = null)
        {
            var b = new Builder(heights ?? IslandVegetation.GridHeights());
            double ox = Fac.x, oz = Fac.z, y = FacY, h = FacH;
            (double x, double z) L(double x, double z) => (ox + x, oz + z);
            void Room(double x0, double z0, double x1, double z1, Dictionary<char, double[][]> gaps, string mat = "white")
            {
                var g = new Dictionary<char, double[][]>();
                foreach (var kv in gaps) g[kv.Key] = Array.ConvertAll(kv.Value, ab => kv.Key == 'n' || kv.Key == 's' ? new[] { ox + ab[0], ox + ab[1] } : new[] { oz + ab[0], oz + ab[1] });
                b.Walls(ox + x0, oz + z0, ox + x1, oz + z1, y, h, mat, g, 0.5, "metal");
                double cx = ox + (x0 + x1) / 2, cz = oz + (z0 + z1) / 2, w = x1 - x0 + 1, d = z1 - z0 + 1;
                b.S.Slabs.Add(new PropCall("box", "", "dark", cx, y - 0.3, cz, w, 0.3, d, 0, false, false, false, false, "floor", "metal", null));
                b.S.Slabs.Add(new PropCall("box", "", "concrete", cx, y + h, cz, w, 0.3, d, 0, false, false, false, false, "ceiling", "concrete", null));
            }
            void Light(double x, double z, bool red, bool on) { var p = L(x, z); if (on) b.S.Lights.Add(new PropLight(p.x, y + h - 0.5, p.z, 30, red)); }
            Dictionary<char, double[][]> G(params (char k, double a, double c)[] gs) { var r = new Dictionary<char, double[][]>(); foreach (var (k, a, c) in gs) r[k] = new[] { new[] { a, c } }; return r; }

            // A: elevator hall
            Room(-8, -16, 8, 8, G(('n', -2.5, 2.5))); Light(0, -4, false, true); Light(-5, 4, true, false);
            { var p = L(-5, -10); b.Box(p.x, y, p.z, 2.4, 1.1, 1.2, "dark", "P_ammo", kind: "cover", surf: "metal"); }
            { var p = L(5, -12); b.Box(p.x, y, p.z, 1.2, 1.1, 2.4, "dark", "P_ammo", rot90: true, kind: "cover", surf: "metal"); }
            // B: corridor with cameras
            Room(-2.5, -46, 2.5, -16, G(('n', -2.5, 2.5), ('s', -2.5, 2.5))); Light(0, -24, true, true); Light(0, -38, true, false);
            foreach (var (cx, cz) in new[] { (2.0, -25.0), (-2.0, -41.0) })
            {
                var p = L(cx, cz);
                b.Box(p.x, y + h - 0.8, p.z, 0.6, 0.6, 0.7, "", hidden: true, kind: "camera", surf: "metal");   // web: addCollider hp 10, pass
                b.S.Cameras.Add(new SecurityCam(p.x, p.z, cx));
            }
            { var p = L(0, -46); b.Box(p.x, y, p.z, 5, h, 0.4, "rust", "P_door", surf: "metal"); b.S.Points["secDoor"] = (p.x, y, p.z); b.S.Points["secDoorPos"] = (p.x, y + 1.3, p.z + 1.6); }
            // C: laboratory with glass partitions
            Room(-14, -76, 14, -46, new Dictionary<char, double[][]> { ['s'] = new[] { new[] { -2.5, 2.5 } }, ['n'] = new[] { new[] { -2.5, 2.5 } }, ['e'] = new[] { new[] { -63.0, -59.0 } } });
            Light(-7, -55, false, true); Light(7, -68, false, true); Light(0, -61, true, false);
            foreach (var gx in new[] { -9.0, -5.0, 5.0, 9.0 })
            {
                var p = L(gx, -61);
                b.Static("P_window", p.x, y, p.z, 3.9, h - 0.4, 0.3); b.Box(p.x, y, p.z, 3.9, h - 0.4, 0.2, "glass", kind: "glass", surf: "glass");
            }
            foreach (var (tx, tz, sx, sz) in new[] { (-8.0, -53.0, 5.0, 1.4), (8.0, -53.0, 5.0, 1.4), (-8.0, -69.0, 5.0, 1.4), (6.0, -70.0, 1.4, 5.0), (0.0, -56.0, 1.4, 3.0) })
            { var p = L(tx, tz); b.Box(p.x, y, p.z, sx, 1.05, sz, "white", "P_desk", rot90: sz > sx, kind: "cover", surf: "metal"); }
            foreach (var (tx, tz) in new[] { (-12.0, -72.0), (12.0, -49.0) }) { var p = L(tx, tz); b.Box(p.x, y, p.z, 1.4, 2.6, 1.4, "blue", "P_cabinet", kind: "cover", surf: "metal"); }
            // F: bio vault (east of the lab)
            Room(14, -70, 34, -52, G(('w', -63, -59)), "dark"); Light(24, -61, true, true);
            {
                var v = L(29, -61); b.Box(v.x, y, v.z, 1.6, 1.0, 1.6, "metal", "P_pedestal", surf: "metal");
                b.S.Points["sampleMesh"] = (v.x, y + 1.5, v.z); b.S.Points["sample"] = (v.x - 1.4, y + 1.2, v.z);
            }
            foreach (var (tx, tz) in new[] { (19.0, -56.0), (19.0, -66.0), (26.0, -55.0) }) { var p = L(tx, tz); b.Box(p.x, y, p.z, 1.5, 1.3, 1.5, "olive", "P_ammo", kind: "cover", surf: "metal"); }
            // D: corridor, E: server room
            Room(-2.5, -90, 2.5, -76, G(('n', -2.5, 2.5), ('s', -2.5, 2.5))); Light(0, -83, true, true);
            Room(-13, -118, 13, -90, G(('s', -2.5, 2.5)), "dark"); Light(-6, -98, false, true); Light(6, -110, true, true);
            foreach (var rx in new[] { -9.0, -4.5, 4.5, 9.0 }) foreach (var rz in new[] { -97.0, -105.0 })
                { var p = L(rx, rz); b.Box(p.x, y, p.z, 1.1, 2.7, 4.6, "dark", "P_rack", rot90: true, kind: "cover", surf: "metal"); }
            { var t = L(4, -116); b.Box(t.x, y, t.z, 3, 1.1, 1, "metal", "P_console", surf: "metal"); b.S.Points["server"] = (t.x, y + 1.3, t.z + 1.3); }
            { var e = L(-9, -114); b.S.Points["exitLift"] = (e.x, y + 1, e.z); }
            b.S.Points["facSpawn"] = (ox, y, oz + 4);
            return b.S;
        }

        /// <summary>Several prop sets as one (a mission that spans zones).</summary>
        public static PropSet Merge(params PropSet[] sets)
        {
            var m = new PropSet();
            foreach (var s in sets)
            {
                m.Calls.AddRange(s.Calls); m.Lights.AddRange(s.Lights); m.Radars.AddRange(s.Radars); m.Models.AddRange(s.Models);
                m.Slabs.AddRange(s.Slabs); m.Cameras.AddRange(s.Cameras);
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

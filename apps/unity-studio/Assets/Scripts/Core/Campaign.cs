using System;

namespace SpecialSoldier.Core
{
    /// <summary>One enemy placement from a web mission's setup() — sp(kind, x, z, { group, yaw, patrol, y: top(...) }).
    /// Island coordinates (web); convert with IslandTerrain.ToWorld and WebAngles.</summary>
    public sealed class SpawnDef
    {
        public string Kind, Group;
        public double X, Z;
        public double? Yaw;                        // web enemy yaw (radians, 0 = +z)
        public (double x, double z)[] Patrol;      // web patrol route
        public bool OnStructure;                   // web y: top(x, z) — on a tower/roof the Unity island does not have yet

        public SpawnDef(string kind, double x, double z, string group, double? yaw = null, (double, double)[] patrol = null, bool onStructure = false)
        { Kind = kind; X = x; Z = z; Group = group; Yaw = yaw; Patrol = patrol; OnStructure = onStructure; }
    }

    /// <summary>A campaign mission ported from apps/special-soldier/src/game/missions.js (checked by CampaignTests).</summary>
    public sealed class CampaignMission
    {
        public string Id, Code, Name, Zone, SkyId, AlarmRadio;
        public double SpawnX, SpawnZ, SpawnYaw;    // web player spawn (yaw: camera, 0 = looking toward −z)
        public string[] Brief;
        public SpawnDef[] Spawns, AlarmWave;
        public Func<MissionRunner> NewRunner;      // objectives in Unity world coordinates
        /// <summary>Island-space bounds of everything the mission uses (NavMesh bake volume): minX, minZ, maxX, maxZ.</summary>
        public (double minX, double minZ, double maxX, double maxZ) Area;
    }

    /// <summary>Web angle conventions → Unity world yaw in degrees (the island's z is flipped by IslandTerrain.ToWorld).</summary>
    public static class WebAngles
    {
        /// <summary>Enemies face (sin yaw, cos yaw) in web x/z; after the z flip that is atan2(sin, −cos) = 180° − yaw.</summary>
        public static double EnemyYawToWorldDeg(double webYaw) => 180.0 - webYaw * 180.0 / Math.PI;
        /// <summary>The web camera looks along (−sin yaw, −cos yaw); after the z flip that is −yaw.</summary>
        public static double PlayerYawToWorldDeg(double webYaw) => -webYaw * 180.0 / Math.PI;
    }

    public static class Campaign
    {
        static (double, double)[] R(params double[] xz) { var r = new (double, double)[xz.Length / 2]; for (int i = 0; i < r.Length; i++) r[i] = (xz[2 * i], xz[2 * i + 1]); return r; }
        static Vec2 W(double ix, double iz) { var w = IslandTerrain.ToWorld(ix, 0, iz); return new Vec2((float)w.x, (float)w.z); }

        /// <summary>MISSION 01 — SILENT LANDING (web missions.js MISSIONS[0]): night insertion on the southern beach.</summary>
        public static readonly CampaignMission M01 = new CampaignMission
        {
            Id = "m01", Code = "MISSION 01", Name = "SILENT LANDING", Zone = "ZONE 01 · BEACH", SkyId = "night",
            SpawnX = 0, SpawnZ = 328.5, SpawnYaw = 0,
            Brief = new[]
            {
                "04:30 — SQUAD 07 inserts by assault boat on the southern beach.",
                "BLACK COBRA sentries hold two sandbag posts, a watch tower and a coastal radar.",
                "Stay low: crouch, use the suppressed P9 [3] and night vision [N]. A sentry who survives five seconds after spotting you calls in a quick reaction force.",
                "Eliminate the beach sentries, then move to the jungle trail head.",
            },
            Spawns = new[]
            {
                new SpawnDef("guard", -40, 304, "beach", patrol: R(-40, 304, -12, 309, -40, 304, -58, 300)),
                new SpawnDef("guard", -44, 297.5, "beach", yaw: 0.4),
                new SpawnDef("guard", 46, 298, "beach", yaw: -0.3),
                new SpawnDef("guard", 50, 289, "beach", patrol: R(50, 289, 22, 302, 50, 289, 66, 286)),
                new SpawnDef("guard", 14, 311, "beach", patrol: R(14, 311, -18, 310, 14, 311, 30, 308)),
                new SpawnDef("sniper", 10, 284, "beach", yaw: 0, onStructure: true),
                new SpawnDef("guard", 68, 288, "beach", yaw: 0.2),
                new SpawnDef("assault", -6, 272, "beach", yaw: 0),
                new SpawnDef("assault", 7, 268, "beach", patrol: R(7, 268, -20, 276, 7, 268, 26, 272)),
            },
            AlarmRadio = "NOMAD: They got a call out — QRF coming down the trail!",
            AlarmWave = new[] { new SpawnDef("assault", -6, 236, "qrf"), new SpawnDef("assault", 5, 232, "qrf"), new SpawnDef("guard", 0, 228, "qrf") },
            NewRunner = () => new MissionRunner("MISSION 01", "SILENT LANDING",
                Objective.Kill("beach", "Eliminate the beach sentries"),
                Objective.Reach(W(0, 240), 10, "Move to the jungle trail head")),
            Area = (-90, 215, 100, 345),
        };

        public static readonly CampaignMission[] All = { M01 };

        public static CampaignMission Get(string id)
        {
            foreach (var m in All) if (string.Equals(m.Id, id, StringComparison.OrdinalIgnoreCase)) return m;
            return null;
        }
    }
}

using System;
using System.Collections.Generic;

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
        public bool OnStructure;                   // web y: top(x, z) — on a tower / roof (IslandProps.Top)
        /// <summary>web y: a fixed height (island metres), e.g. FAC_Y −60 in the underground facility; null = on the ground.</summary>
        public double? Y;

        public SpawnDef(string kind, double x, double z, string group, double? yaw = null, (double, double)[] patrol = null, bool onStructure = false, double? y = null)
        { Kind = kind; X = x; Z = z; Group = group; Yaw = yaw; Patrol = patrol; OnStructure = onStructure; Y = y; }
    }

    /// <summary>A campaign mission ported from apps/special-soldier/src/game/missions.js (checked by CampaignTests).</summary>
    public sealed class CampaignMission
    {
        public string Id, Code, Name, Zone, SkyId, AlarmRadio;
        public double SpawnX, SpawnZ, SpawnYaw;    // web player spawn (yaw: camera, 0 = looking toward −z)
        /// <summary>web spawn y when the mission does not start on the island surface (M04: FAC_Y).</summary>
        public double? SpawnY;
        public string[] Brief;
        public SpawnDef[] Spawns, AlarmWave;
        /// <summary>Named reinforcement waves the objective hooks send in (MissionRunner.WaveRequested): built switched off in the scene.</summary>
        public Dictionary<string, SpawnDef[]> Waves = new Dictionary<string, SpawnDef[]>();
        /// <summary>On the first alarm, enemies whose group starts with this go searching for the player (M02 web alarm()), or null.</summary>
        public string AlarmSearchPrefix;
        /// <summary>Mission 04: what command says when a security camera locks the facility down (web tick → camAlarm).</summary>
        public string CameraAlarmRadio;
        public Func<MissionRunner> NewRunner;      // objectives in Unity world coordinates
        /// <summary>The man-made props of the mission's zone (web build.js), or null.</summary>
        public Func<PropSet> Props;
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
                Objective.Reach(W(0, 240), 10, "Move to the jungle trail head").With(radio: "COMMAND: Beach is secure. Push inland to the trail head.")),
            Area = (-90, 215, 100, 345),
            Props = () => IslandProps.Beach(),
        };

        /// <summary>MISSION 02 — DEEP JUNGLE (web missions.js MISSIONS[1]): patrols on the trails, the comms relay, an optional
        /// backup generator (cut it first and only half the counter-attack comes), C4 on the mast, get clear, hold.</summary>
        public static readonly CampaignMission M02 = MakeM02();

        static CampaignMission MakeM02()
        {
            var c = IslandProps.Comms; var g = IslandProps.Gen;
            var spawns = new List<SpawnDef>();
            foreach (var (k, x, z) in new[] { ("guard", -28.0, 204.0), ("assault", -32.0, 200.0), ("guard", -24.0, 198.0) })
                spawns.Add(new SpawnDef(k, x, z, "patrolA", patrol: R(x, z, x - 44, z - 16, x - 20, z + 22)));
            foreach (var (k, x, z) in new[] { ("guard", 62.0, 192.0), ("guard", 66.0, 188.0), ("assault", 58.0, 186.0) })
                spawns.Add(new SpawnDef(k, x, z, "patrolB", patrol: R(x, z, x + 60, z - 24, x + 20, z - 50)));
            spawns.Add(new SpawnDef("sniper", -86, 214, "patrolA", yaw: 1.6));
            spawns.Add(new SpawnDef("guard", c.x + 18, c.z + 20, "comms", yaw: 0.6)); spawns.Add(new SpawnDef("guard", c.x - 4, c.z + 24, "comms", yaw: 0.2));
            spawns.Add(new SpawnDef("guard", c.x + 22, c.z + 4, "comms", yaw: 1.5));
            spawns.Add(new SpawnDef("assault", c.x + 6, c.z + 12, "comms", patrol: R(c.x + 6, c.z + 12, c.x + 20, c.z - 8, c.x - 10, c.z - 12, c.x - 18, c.z + 16)));
            spawns.Add(new SpawnDef("assault", c.x - 10, c.z - 6, "comms")); spawns.Add(new SpawnDef("sniper", c.x + 26, c.z + 26, "comms", yaw: 0.8, onStructure: true));
            spawns.Add(new SpawnDef("heavy", c.x + 4, c.z + 2, "comms", yaw: 0.5)); spawns.Add(new SpawnDef("guard", c.x - 12, c.z + 8, "comms"));
            spawns.Add(new SpawnDef("guard", g.x + 6, g.z + 5, "gen", yaw: 2.4));
            spawns.Add(new SpawnDef("assault", g.x - 5, g.z + 6, "gen", patrol: R(g.x - 5, g.z + 6, g.x - 14, g.z - 10, g.x + 8, g.z - 8)));
            var reinf = new[] { new SpawnDef("assault", c.x + 30, c.z - 60, "reinf"), new SpawnDef("assault", c.x + 20, c.z - 66, "reinf"), new SpawnDef("elite", c.x + 40, c.z - 62, "reinf"),
                new SpawnDef("guard", c.x - 10, c.z - 64, "reinf"), new SpawnDef("assault", c.x + 60, c.z - 40, "reinf") };
            return new CampaignMission
            {
                Id = "m02", Code = "MISSION 02", Name = "DEEP JUNGLE", Zone = "ZONE 02 · JUNGLE", SkyId = "dawn",
                SpawnX = 0, SpawnZ = 236, SpawnYaw = 0.5,
                Brief = new[]
                {
                    "05:40 — First light. Fog and rain are covering your approach.",
                    "A relay station in the western jungle links the island to BLACK COBRA command. Patrols sweep the trails between you and it.",
                    "Launch the recon drone [B] to tag hostiles before you commit.",
                    "Clear the station, plant C4 on the mast, get clear and hold against the counter-attack.",
                },
                Spawns = spawns.ToArray(),
                AlarmRadio = "REAPER: Patrols are converging on us!", AlarmSearchPrefix = "patrol",
                Waves = new Dictionary<string, SpawnDef[]> { ["reinf"] = reinf },
                NewRunner = () => new MissionRunner("MISSION 02", "DEEP JUNGLE",
                    Objective.Reach(W(-108, 186), 24, "Infiltrate through the jungle to the comms relay"),
                    Objective.Any("Two tasks — any order",
                        Objective.Kill("comms", "Clear the comms relay"),
                        Objective.Interact(W(g.x + 1.8, g.z - 1.4), "CUT BACKUP POWER", 3, "Cut the backup generator").With(onDone: m =>
                        {
                            bool cut = m.World != null && m.World.Alive("comms") > 0;   // web: powerCut = enemies.count('comms') > 0
                            if (cut) m.Flags.Add("powerCut"); else m.Flags.Remove("powerCut");
                            m.Say(cut ? "ATLAS: Backup power is down. When the relay goes, they will only get half a call out."
                                      : "ATLAS: Power is down — but the station already sent its distress call. Expect company.");
                        }))
                        .With(radio: "NOMAD: The relay runs off a backup generator up on the north-west ridge. Cut it first and they cannot call in a full counter-attack — or hit the station now. Your call."),
                    Objective.Interact(W(c.x + 2, c.z + 1.5), "PLANT C4 CHARGE", 3, "Plant C4 on the relay mast"),
                    Objective.Leave(W(c.x, c.z), 30, "Get clear of the blast (30 m)").With(onDone: m => m.Raise("detonate")),
                    Objective.Kill("reinf", "Repel the counter-attack").With(onStart: m =>
                    {
                        if (m.Flags.Contains("powerCut")) { m.Say("ATLAS: Only one squad heard the call — they are coming for the relay!"); m.SendWave("reinf", 3); }
                        else { m.Say("ATLAS: Movement north! They are coming for the relay!"); m.SendWave("reinf", 5); }
                    })),
                Area = (-195, 75, 135, 250),
                Props = () => IslandProps.Merge(IslandProps.Jungle(), IslandProps.GenOutpost()),
            };
        }

        /// <summary>MISSION 03 — BLACK COBRA BASE (web missions.js MISSIONS[2]): storm, the walled base with corner snipers and an APC.
        /// Breach the south gate, then in any order clear HQ security / sabotage the motor pool (kills the APC), download the intel
        /// (the base lights up: a QRF comes for HQ) and reach the bunker elevator.</summary>
        public static readonly CampaignMission M03 = MakeM03();

        /// <summary>web POI (build.js): HQ, motor pool, bunker elevator; the intel terminal sits on the HQ desk (IslandProps.Base "intel").</summary>
        public static readonly (double x, double z) Hq = (0, -130), Motor = (-55, -100), Bunker = (90, -150);

        static CampaignMission MakeM03()
        {
            const string b = "base", h = "hq";
            var spawns = new[]
            {
                new SpawnDef("guard", -8, -8, b, yaw: 3.1), new SpawnDef("guard", 10, -10, b, yaw: 3.1),
                new SpawnDef("sniper", -112, -8, b, yaw: 2.4, onStructure: true), new SpawnDef("sniper", 112, -8, b, yaw: -2.4, onStructure: true),
                new SpawnDef("guard", -20, -42, b, patrol: R(-20, -42, 22, -44, 22, -84, -20, -80)), new SpawnDef("assault", 44, -46, b, yaw: -1.6),
                new SpawnDef("assault", 46, -62, b, patrol: R(46, -62, 46, -92, 80, -92)), new SpawnDef("assault", 60, -40, b, yaw: -1.5, y: 16),
                new SpawnDef("guard", -50, -48, b, yaw: 1.6), new SpawnDef("heavy", -64, -46, b, yaw: 1.6, y: 16), new SpawnDef("guard", -50, -96, b, yaw: 0.5), new SpawnDef("guard", -74, -150, b, yaw: 1.5, y: 16),
                new SpawnDef("apc", -14, -96, "armor", yaw: 0.3),
                new SpawnDef("heavy", 0, -116, h, yaw: 3.1), new SpawnDef("elite", -7, -128, h, yaw: 3, y: 16), new SpawnDef("elite", 9, -129, h, yaw: 3.2, y: 16),
                new SpawnDef("guard", -9, -137, h, y: 16), new SpawnDef("guard", 18, -118, h, yaw: 2.6),
            };
            return new CampaignMission
            {
                Id = "m03", Code = "MISSION 03", Name = "BLACK COBRA BASE", Zone = "ZONE 03 · MILITARY BASE", SkyId = "storm",
                SpawnX = 0, SpawnZ = 46, SpawnYaw = 0,
                Brief = new[]
                {
                    "09:10 — A thunderstorm is rolling over the island. Thunder masks gunfire; rain cuts their sight lines.",
                    "The base is walled, with snipers in the corner towers and an APC in the motor pool. Small arms barely scratch armour — use grenades [G] or explosive barrels.",
                    "Breach the south gate, eliminate HQ security and pull the facility access data from the HQ terminal.",
                    "When the alarm goes, get to the bunker elevator on the east side.",
                },
                Spawns = spawns,
                AlarmRadio = "NOMAD: Base alarm! Armour is waking up!", AlarmSearchPrefix = "armor",
                AlarmWave = new[] { new SpawnDef("assault", 70, -70, "qrf"), new SpawnDef("assault", 76, -74, "qrf") },
                Waves = new Dictionary<string, SpawnDef[]>
                {
                    ["intel"] = new[] { new SpawnDef("assault", -4, -178, "qrf"), new SpawnDef("assault", 4, -180, "qrf"), new SpawnDef("elite", 0, -176, "qrf"),
                        new SpawnDef("assault", -30, -170, "qrf"), new SpawnDef("heavy", 30, -172, "qrf") },
                },
                NewRunner = () => new MissionRunner("MISSION 03", "BLACK COBRA BASE",
                    Objective.Reach(W(0, -16), 13, "Breach the south gate"),
                    Objective.Any("Two tasks — any order",
                        Objective.Kill("hq", "Eliminate HQ security"),
                        Objective.Interact(W(Motor.x, Motor.z), "SET CHARGE ON THE FUEL BOWSER", 3, "Sabotage the motor pool").With(onDone: m =>
                        {
                            m.Raise("sabotage");   // web: two blasts at the fuel bowser, every vehicle within 70 m destroyed
                            m.Flags.Add("sabotage");
                            m.Say("NOMAD: Fuel went up — that APC is scrap. Nice.");
                        }))
                        .With(radio: "REAPER: Two jobs before the terminal. Hit the motor pool first and their armour never leaves the shed — or go straight for HQ. Your call."),
                    Objective.Interact(W(8, -137), "DOWNLOAD FACILITY ACCESS DATA", 4, "Download the intel from the HQ terminal").With(onDone: m =>
                    {
                        m.Raise("siren");
                        m.Say("COMMAND: Data received. The whole base just lit up — get to the bunker!");
                        m.SendWave("intel", 5);
                        m.Flags.Add("alarmed");
                    }),
                    Objective.Reach(W(91, -150), 3.2f, "Reach the bunker elevator")),
                Area = (-125, -190, 125, 55),
                Props = () => IslandProps.Base(),
            };
        }

        /// <summary>MISSION 04 — UNDERGROUND ZERO (web missions.js MISSIONS[3]): sublevel 3 on emergency power. Security cameras
        /// (shoot them or stay out of their cone), the security door override, clear the lab, secure the bio-sample, start the
        /// uplink and hold the server room for 45 s, then the north lift.</summary>
        public static readonly CampaignMission M04 = MakeM04();

        static CampaignMission MakeM04()
        {
            var fac = IslandProps.Facility(); var P = fac.Points;
            double y = IslandProps.FacY, ox = IslandProps.Fac.x, oz = IslandProps.Fac.z;
            SpawnDef S(string k, double x, double z, string g, double yaw, (double, double)[] patrol = null) => new SpawnDef(k, ox + x, oz + z, g, yaw: yaw, patrol: patrol, y: y);
            (double, double) L(double x, double z) => (ox + x, oz + z);
            Vec2 At(string point) => W(P[point].x, P[point].z);
            // uplink defence pool: two soldiers per wave (web: assault + elite-or-assault at the server room door), never more than 5 alive
            var a = L(0, -74); var e = L(1.2, -71);
            var uplink = new List<SpawnDef>();
            foreach (var second in new[] { "elite", "assault", "elite", "assault" })
            { uplink.Add(new SpawnDef("assault", a.Item1, a.Item2, "wave", y: y)); uplink.Add(new SpawnDef(second, e.Item1, e.Item2, "wave", y: y)); }
            return new CampaignMission
            {
                Id = "m04", Code = "MISSION 04", Name = "UNDERGROUND ZERO", Zone = "ZONE 04 · UNDERGROUND FACILITY", SkyId = "facility",
                SpawnX = P["facSpawn"].x, SpawnZ = P["facSpawn"].z, SpawnY = y, SpawnYaw = 0,
                Brief = new[]
                {
                    "Sublevel 3 — the bio-research facility runs on emergency power.",
                    "Security cameras cover the access corridor. Shoot them out (the suppressed P9 will not be heard) or the whole level is alerted.",
                    "Override the security door, clear the laboratory, secure the bio-sample from the vault and start a data uplink in the server room.",
                    "The uplink takes 45 seconds. Hold the room, then take the north lift.",
                },
                Spawns = new[]
                {
                    S("guard", 0, -30, "corr", 0, R(ox, oz - 22, ox, oz - 42)),
                    S("elite", -8, -56, "lab", 0), S("elite", 8, -66, "lab", 0), S("assault", -10, -70, "lab", 0), S("assault", 9, -50, "lab", 0),
                    S("guard", 0, -72, "lab", 0, R(ox, oz - 72, ox - 10, oz - 64, ox + 10, oz - 64)),
                    S("heavy", 24, -61, "vault", -1.57), S("guard", 30, -56, "vault", -1.57),
                    S("elite", -6.8, -100, "srv", 0), S("elite", 6.8, -108, "srv", 0), S("heavy", 0, -112, "srv", 0),
                },
                AlarmSearchPrefix = "",   // camera lockdown: everyone not yet searching comes for you
                CameraAlarmRadio = "COMMAND: You have been made. Expect resistance.",
                Waves = new Dictionary<string, SpawnDef[]> { ["uplink"] = uplink.ToArray() },
                NewRunner = () =>
                {
                    float waveT = 2f;
                    return new MissionRunner("MISSION 04", "UNDERGROUND ZERO",
                        Objective.Interact(At("secDoorPos"), "OVERRIDE SECURITY DOOR", 2.5f, "Override the security door (avoid or destroy the cameras)").With(onDone: m => m.Raise("openDoor")),
                        Objective.Kill("lab", "Clear the laboratory"),
                        Objective.Interact(At("sample"), "SECURE BIO-SAMPLE", 2, "Secure the bio-sample in the vault").With(onDone: m =>
                        { m.Raise("sample"); m.Say("ATLAS: Sample is secure. That stuff should never leave this island."); }),
                        Objective.Interact(At("server"), "START DATA UPLINK", 1.5f, "Start the data uplink in the server room"),
                        Objective.Defend(45, "Defend the uplink").With(
                            onStart: m => { waveT = 2f; m.Raise("sirenServer"); m.Say("COMMAND: Uplink started. Forty-five seconds — hold that room!"); },
                            onTick: (m, dt) =>
                            {
                                if ((waveT -= dt) <= 0 && (m.World == null || m.World.Alive("wave") < 5)) { waveT = 11f; m.SendWave("uplink", 2); }
                            }),
                        Objective.Reach(At("exitLift"), 2.6f, "Take the north lift to the surface").With(radio: "COMMAND: We have it all. Extraction is at the airfield — move!"));
                },
                Area = (70, -275, 130, -135),
                Props = () => IslandProps.Facility(),
            };
        }

        public static readonly CampaignMission[] All = { M01, M02, M03, M04 };

        public static CampaignMission Get(string id)
        {
            foreach (var m in All) if (string.Equals(m.Id, id, StringComparison.OrdinalIgnoreCase)) return m;
            return null;
        }
    }
}

// Builds the playable "Island Slice" scene from code, so the scene never has to be hand-edited or merged.
//   Unity.exe -batchmode -projectPath apps/unity-studio -executeMethod SpecialSoldier.EditorTools.SliceBuilder.BuildSliceAndPlayer -quit -logFile -
// Menu: Special Soldier > Build Island Slice Scene. Every step logs "[Slice]" lines; exit codes: 0 ok, 10+ failure.
using System.IO;
using System.Linq;
using SpecialSoldier.Core;
using Unity.AI.Navigation;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using BodyPart = SpecialSoldier.Core.BodyPart; // UnityEditor also defines BodyPart (CS0104)

namespace SpecialSoldier.EditorTools
{
    public static class SliceBuilder
    {
        public const string ScenePath = "Assets/Scenes/IslandSlice.unity";
        const string GlbPath = "Assets/Imported/special_soldier_assets.glb";
        const string SettingsDir = "Assets/Settings";

        [MenuItem("Special Soldier/Build Island Slice Scene")]
        public static void BuildSceneMenu() => BuildScene();

        public static void BuildSliceAndPlayer()
        {
            if (!BuildScene() || !BuildCampaignScenes()) { EditorApplication.Exit(10); return; }
            var opts = new BuildPlayerOptions { scenes = BuildScenes(), locationPathName = "Builds/Slice/IslandSlice.exe", target = BuildTarget.StandaloneWindows64 };
            var report = BuildPipeline.BuildPlayer(opts);
            Debug.Log($"[Slice] player build {report.summary.result}, {report.summary.totalSize / 1024} kB, errors {report.summary.totalErrors}");
            EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 11);
        }

        /// <summary>Browser build for the BIT PARK portal: Builds/WebGL/index.html (static files, no server code).
        /// Gzip + decompression fallback so it also runs on hosts that do not send Content-Encoding headers.</summary>
        public static void BuildWebGL()
        {
            if (!System.IO.File.Exists(ScenePath) && !BuildScene()) { EditorApplication.Exit(12); return; }
            foreach (var m in Campaign.All) if (!File.Exists(CampaignScenePath(m)) && !BuildCampaignScene(m)) { EditorApplication.Exit(12); return; }
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.dataCaching = true;
            // Unity 6 lets Personal licences turn the splash off; the logo was 2.7 MB of the WebGL download (PC build report)
            PlayerSettings.SplashScreen.show = false;
            PlayerSettings.productName = "SPECIAL SOLDIER - Island Slice";
            var opts = new BuildPlayerOptions { scenes = BuildScenes(), locationPathName = "Builds/WebGL", target = BuildTarget.WebGL };
            var report = BuildPipeline.BuildPlayer(opts);
            Debug.Log($"[Slice] webgl build {report.summary.result}, {report.summary.totalSize / 1024} kB, errors {report.summary.totalErrors} -> Builds/WebGL/index.html");
            if (report.summary.result == BuildResult.Succeeded) PinWebGLPixelRatio("Builds/WebGL/index.html");
            EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 13);
        }

        /// <summary>Renders the WebGL canvas at CSS resolution (config.devicePixelRatio = 1). On a 125 % Windows display the
        /// UI Toolkit panel was magnified by the device pixel ratio a second time: the HUD ran 1.25x off the right and bottom
        /// edges (minimap, vitals and weapon panel unseen; seen in the browser 2026-11-25, devicePixelRatio 1.25, canvas
        /// 1600x950 for 1280x760 CSS). With the ratio pinned to 1 the whole HUD fits; the 3D view is a little softer on
        /// HiDPI screens and cheaper to draw.</summary>
        static void PinWebGLPixelRatio(string indexPath)
        {
            const string off = "// config.devicePixelRatio = 1;", on = "config.devicePixelRatio = 1;   // SliceBuilder: UI Toolkit HUD double-scaled on HiDPI";
            string html = File.Exists(indexPath) ? File.ReadAllText(indexPath) : null;
            if (html == null || !html.Contains(off)) { Debug.LogWarning("[Slice] webgl: could not pin devicePixelRatio (template changed?) in " + indexPath); return; }
            html = html.Replace(off, on);
            // A refused pointer lock (clicking within ~1 s of pressing Esc, or an embedding page that forbids it) rejects
            // requestPointerLock()'s promise; Unity's handler turned that into an "An error occurred running the Unity content"
            // alert although the game keeps running (seen in the browser 2026-11-25). Swallow only that rejection, before Unity's
            // listeners: the next click simply asks again.
            const string guard = "<script>window.addEventListener('unhandledrejection',function(e){var r=e.reason,m=r&&(r.message||'')+' '+(r.name||'');if(/pointer ?lock/i.test(m)){e.preventDefault();e.stopImmediatePropagation();}},true);</script>";
            if (!html.Contains("unhandledrejection") && html.Contains("</head>")) html = html.Replace("</head>", "    " + guard + "\n  </head>");
            File.WriteAllText(indexPath, html);
            Debug.Log("[Slice] webgl: devicePixelRatio pinned to 1 (UI Toolkit HUD fits on HiDPI screens), pointer-lock rejections no longer alert");
        }

        public static bool BuildScene()
        {
            EnsureUrp();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var rng = new System.Random(7);   // fixed seed: the same level every build

            BuildSkyRig("day", false);

            var level = new GameObject("Level");
            var sand = Mat("Sand", new Color(0.62f, 0.55f, 0.42f), 0.9f);
            var concrete = Mat("Concrete", new Color(0.55f, 0.55f, 0.53f), 0.85f);
            var crate = Mat("Crate", new Color(0.42f, 0.33f, 0.2f), 0.8f);
            // the web game's island (shared formula, Core.IslandTerrain) as a Unity Terrain; the slice stands on its base flat
            var island = BuildIsland(level);
            if (island) BuildVegetation(level);
            if (!island)
            {
                var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);   // fallback: the old flat ground
                ground.name = "Ground"; ground.transform.SetParent(level.transform); ground.transform.localScale = new Vector3(16f, 1f, 16f);
                ground.GetComponent<Renderer>().sharedMaterial = sand;
            }

            // perimeter walls + a compound in the middle + scattered cover
            for (int i = 0; i < 4; i++)
            {
                var wall = Box(level, $"Perimeter{i}", Vector3.zero, new Vector3(160f, 4f, 1f), concrete);
                wall.transform.rotation = Quaternion.Euler(0f, i * 90f, 0f);
                wall.transform.position = wall.transform.rotation * new Vector3(0f, 2f, 80f);
            }
            Box(level, "CompoundN", new Vector3(0f, 1.5f, 22f), new Vector3(24f, 3f, 0.6f), concrete);
            Box(level, "CompoundW", new Vector3(-12f, 1.5f, 13f), new Vector3(0.6f, 3f, 18f), concrete);
            Box(level, "CompoundE", new Vector3(12f, 1.5f, 13f), new Vector3(0.6f, 3f, 18f), concrete);
            Box(level, "CompoundS_L", new Vector3(-7.5f, 1.5f, 4f), new Vector3(9f, 3f, 0.6f), concrete);
            Box(level, "CompoundS_R", new Vector3(7.5f, 1.5f, 4f), new Vector3(9f, 3f, 0.6f), concrete);
            for (int i = 0; i < 26; i++)
            {
                float x = (float)(rng.NextDouble() * 120 - 60), z = (float)(rng.NextDouble() * 110 - 40);
                if (Mathf.Abs(x) < 14f && z > 2f && z < 24f) continue;            // keep the compound clear
                if (Mathf.Abs(x) < 6f && z < -28f) continue;                       // keep the spawn clear
                float s = 1f + (float)rng.NextDouble() * 1.2f;
                var c = Box(level, $"Cover{i}", new Vector3(x, s / 2f, z), new Vector3(s * 1.4f, s, s), crate);
                c.transform.rotation = Quaternion.Euler(0f, (float)rng.NextDouble() * 90f, 0f);
            }

            // intel terminal (mission prop) goes in before the NavMesh bake so agents walk around it
            var terminal = Box(level, "IntelTerminal", new Vector3(0f, 0.6f, 16f), new Vector3(1.2f, 1.2f, 0.6f), Mat("Terminal", new Color(0.18f, 0.22f, 0.2f), 0.4f));
            var screen = GameObject.CreatePrimitive(PrimitiveType.Quad); Object.DestroyImmediate(screen.GetComponent<Collider>());
            screen.name = "Screen"; screen.transform.SetParent(terminal.transform, false); screen.transform.localPosition = new Vector3(0f, 0.15f, -0.51f); screen.transform.localScale = new Vector3(0.8f, 0.5f, 1f);
            screen.GetComponent<Renderer>().sharedMaterial = Mat("TerminalScreen", new Color(0.2f, 0.9f, 0.5f), 0.1f);
            // only the arena: the island is 1.2 km and agents never leave the walls
            BakeNavMesh(level, new Vector3(0f, 0f, 0f), new Vector3(190f, 40f, 190f), "Assets/Scenes/IslandSlice_NavMesh.asset");

            var player = BuildPlayer(new Vector3(0f, 0.1f, -40f));
            var visual = LoadSoldierVisual();
            Debug.Log($"[Slice] soldier visual: {(visual ? "Blender GLB 'Soldier' node" : "capsule fallback (run StudioBootstrap.ImportAndBuild first)")}, animation: {(visual && SoldierAnimBuilder.RigPrefab() && SoldierAnimBuilder.Controller() ? "Quaternius UAL rig" : "procedural (web pose)")}");
            var enemies = new (string type, Vector3 pos, Vector3[] patrol, bool hold)[]
            {
                ("guard",   new Vector3(-20f, 0f, -10f), new[] { new Vector3(-20f, 0f, -10f), new Vector3(-30f, 0f, 5f) }, false),
                ("guard",   new Vector3(25f, 0f, -5f),   new[] { new Vector3(25f, 0f, -5f), new Vector3(30f, 0f, 15f) }, false),
                ("assault", new Vector3(-4f, 0f, 14f),   null, false),
                ("assault", new Vector3(5f, 0f, 18f),    null, false),
                ("heavy",   new Vector3(0f, 0f, 30f),    null, false),
                ("sniper",  new Vector3(40f, 0f, 55f),   null, true),
                ("elite",   new Vector3(-40f, 0f, 45f),  new[] { new Vector3(-40f, 0f, 45f), new Vector3(-15f, 0f, 50f) }, false),
            };
            var parent = new GameObject("Enemies");
            for (int i = 0; i < enemies.Length; i++) BuildEnemy(parent, i, enemies[i].type, enemies[i].pos, enemies[i].patrol, enemies[i].hold, visual, player.transform.position);
            // the compound squad (two assaults + the heavy) is the "Clear the compound" objective; the rest guard the approach
            foreach (var ea in parent.GetComponentsInChildren<EnemyAgent>(true))
                ea.group = (ea.typeId == "assault" || ea.typeId == "heavy") ? "compound" : "outer";

            // mission prop: the extraction point north of the compound (the intel terminal was placed before the NavMesh bake)
            var extraction = GameObject.CreatePrimitive(PrimitiveType.Cylinder); Object.DestroyImmediate(extraction.GetComponent<Collider>());
            extraction.name = "Extraction"; extraction.transform.position = new Vector3(0f, 0.02f, 62f); extraction.transform.localScale = new Vector3(16f, 0.02f, 16f);
            extraction.GetComponent<Renderer>().sharedMaterial = Mat("Extraction", new Color(0.25f, 0.8f, 0.35f), 0.6f);

            var director = BuildDirectorRig(player);
            director.missionMode = GameDirector.MissionMode.IslandSlice;
            director.intelTerminal = terminal.transform; director.extraction = extraction.transform;
            // opens a campaign mission instead when asked (-mission m01 / ?mission=m01)
            director.gameObject.AddComponent<SceneRouter>();

            bool saved = SaveAndList(scene, ScenePath, 0);
            Debug.Log($"[Slice] scene {(saved ? "saved" : "NOT saved")}: {ScenePath}, {enemies.Length} enemies, pipeline {(GraphicsSettings.defaultRenderPipeline ? GraphicsSettings.defaultRenderPipeline.name : "built-in")}");
            return saved;
        }

        /// <summary>Post-processing, sun, ambient, fog and the HDRI sky (SkyDirector applies the web sky.js preset at runtime).</summary>
        static SkyDirector BuildSkyRig(string preset, bool missionSky)
        {
            // Linear colour space + ACES tonemapping: in Gamma space URP washed the sand out to pale yellow (first PC run, 2026-11-23)
            if (PlayerSettings.colorSpace != ColorSpace.Linear) PlayerSettings.colorSpace = ColorSpace.Linear;
            var post = new GameObject("PostProcess").AddComponent<Volume>(); post.isGlobal = true; post.sharedProfile = PostProfile();

            var sun = new GameObject("Sun").AddComponent<Light>();
            sun.type = LightType.Directional; sun.intensity = 1.25f; sun.color = new Color(1f, 0.93f, 0.82f); sun.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(42f, -35f, 0f);
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.55f, 0.65f, 0.8f); RenderSettings.ambientEquatorColor = new Color(0.45f, 0.45f, 0.4f); RenderSettings.ambientGroundColor = new Color(0.2f, 0.18f, 0.15f);
            RenderSettings.fog = true; RenderSettings.fogMode = FogMode.Linear; RenderSettings.fogStartDistance = 60f; RenderSettings.fogEndDistance = 240f; RenderSettings.fogColor = new Color(0.7f, 0.75f, 0.8f);
            // weather / time of day: CC0 HDRI skybox + web sky.js presets, applied at runtime by SkyDirector (these values are the editor preview)
            var skyMat = SkyMaterial();
            RenderSettings.skybox = skyMat;
            var skyDir = new GameObject("Sky").AddComponent<SkyDirector>();
            skyDir.sun = sun; skyDir.volume = post; skyDir.skyMaterial = skyMat; skyDir.startPreset = preset; skyDir.missionSky = missionSky;
            EnsureSsao();

            return skyDir;
        }

        /// <summary>GameDirector + UI Toolkit HUD + pause menu, the same in every scene.</summary>
        static GameDirector BuildDirectorRig(GameObject player)
        {
            var director = new GameObject("GameDirector").AddComponent<GameDirector>();
            director.player = player.GetComponent<PlayerMotor>();
            // UI Toolkit HUD (compass, minimap, waypoint, damage arcs, kill feed); the IMGUI Hud stays in the project as a fallback
            var uiDoc = director.gameObject.AddComponent<UnityEngine.UIElements.UIDocument>();
            uiDoc.panelSettings = HudPanelSettings();
            var hud = director.gameObject.AddComponent<HudToolkit>();
            hud.player = director.player; hud.weapon = player.GetComponentInChildren<WeaponController>();
            hud.style = AssetDatabase.LoadAssetAtPath<UnityEngine.UIElements.StyleSheet>("Assets/UI/SliceHud.uss");
            // pause / settings menu (Esc), drawn above the HUD on the same panel settings
            var menuGo = new GameObject("PauseMenu");
            var menuDoc = menuGo.AddComponent<UnityEngine.UIElements.UIDocument>(); menuDoc.panelSettings = uiDoc.panelSettings; menuDoc.sortingOrder = 10;
            var menu = menuGo.AddComponent<PauseMenu>(); menu.style = AssetDatabase.LoadAssetAtPath<UnityEngine.UIElements.StyleSheet>("Assets/UI/PauseMenu.uss");
            Debug.Log($"[Slice] pause menu: style {(menu.style ? "ok" : "MISSING Assets/UI/PauseMenu.uss")}");
            Debug.Log($"[Slice] HUD: UI Toolkit (panel {(uiDoc.panelSettings ? "ok" : "MISSING")}, style {(hud.style ? "ok" : "MISSING Assets/UI/SliceHud.uss")}, theme {(uiDoc.panelSettings && uiDoc.panelSettings.themeStyleSheet ? "ok" : "MISSING")})");

            return director;
        }

        static void BakeNavMesh(GameObject level, Vector3 center, Vector3 size, string navPath, bool colliders = false)
        {
            var surface = level.AddComponent<NavMeshSurface>();
            surface.collectObjects = CollectObjects.Volume; surface.center = center; surface.size = size;
            // campaign scenes: walk on what blocks (terrain + prop colliders); the web props' visuals have no colliders of their own
            if (colliders) surface.useGeometry = NavMeshCollectGeometry.PhysicsColliders;
            surface.BuildNavMesh();
            // Save the baked data as an asset: an in-memory NavMeshData only survives builds made in this same Editor
            // process (the Windows build), so a later WebGL build in a fresh process had no navmesh ("no valid NavMesh").
            if (surface.navMeshData != null)
            {
                AssetDatabase.DeleteAsset(navPath);
                AssetDatabase.CreateAsset(surface.navMeshData, navPath);
            }
            Debug.Log($"[Slice] navmesh built: {(surface.navMeshData != null ? "ok, saved " + AssetDatabase.GetAssetPath(surface.navMeshData) : "MISSING")}");
        }

        /// <summary>Saves the scene and puts it in the build list at <paramref name="index"/> (the Island Slice is always first:
        /// it is the scene a player build opens, and its SceneRouter jumps to a mission when asked).</summary>
        static bool SaveAndList(UnityEngine.SceneManagement.Scene scene, string path, int index)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            bool saved = EditorSceneManager.SaveScene(scene, path);
            var list = EditorBuildSettings.scenes.Where(x => x.path != path).ToList();
            list.Insert(Mathf.Min(index, list.Count), new EditorBuildSettingsScene(path, true));
            EditorBuildSettings.scenes = list.ToArray();
            return saved;
        }

        /// <summary>Every enabled scene in the build list, the Island Slice first.</summary>
        static string[] BuildScenes() => EditorBuildSettings.scenes.Where(x => x.enabled && File.Exists(x.path)).Select(x => x.path).ToArray();

        // ---------------- campaign missions (Core.Campaign, ported from the web missions.js) ----------------

        public static string CampaignScenePath(CampaignMission m) => $"Assets/Scenes/{SceneRouter.SceneFor(m.Id)}.unity";

        [MenuItem("Special Soldier/Build Campaign Mission Scenes")]
        public static void BuildCampaignScenesMenu() => BuildCampaignScenes();

        public static bool BuildCampaignScenes()
        {
            bool ok = true;
            foreach (var m in Campaign.All) ok &= BuildCampaignScene(m);
            return ok;
        }

        /// <summary>SQUAD 07 — REAPER, NOMAD, ATLAS (web squad.js): soldiers with a teal tint so they never read as hostiles, the same
        /// animation rig as the enemies, a NavMeshAgent and SquadMate (Core.Squad rules). Placed in formation behind the player.</summary>
        static void BuildSquad(GameObject player, GameObject visual)
        {
            var root = new GameObject("Squad");
            var teal = new Color(0.55f, 0.85f, 0.8f, 1f);
            for (int i = 0; i < Squad.Names.Length; i++)
            {
                var o = Squad.Offsets[i];
                var go = new GameObject($"Squad_{Squad.Names[i]}"); go.transform.SetParent(root.transform);
                go.transform.position = player.transform.TransformPoint(new Vector3((float)o.x, 0f, -(float)o.z)); go.transform.rotation = player.transform.rotation;
                var body = go.AddComponent<CapsuleCollider>(); body.height = 1.8f; body.radius = 0.35f; body.center = new Vector3(0f, 0.9f, 0f);
                go.AddComponent<Damageable>();
                var agent = go.AddComponent<NavMeshAgent>(); agent.radius = 0.35f; agent.height = 1.8f; agent.acceleration = 14f; agent.angularSpeed = 0f; agent.enabled = false;
                go.AddComponent<SquadMate>().index = i;
                if (visual)
                {
                    var v = Object.Instantiate(visual, go.transform); v.name = "Visual"; v.transform.localPosition = Vector3.zero; v.transform.localRotation = Quaternion.identity;
                    foreach (var c in v.GetComponentsInChildren<Collider>()) Object.DestroyImmediate(c);
                    var mpb = new MaterialPropertyBlock();
                    foreach (var r in v.GetComponentsInChildren<Renderer>()) { r.GetPropertyBlock(mpb); mpb.SetColor("_BaseColor", teal); mpb.SetColor("baseColorFactor", teal); r.SetPropertyBlock(mpb); }
                    var anim = go.AddComponent<SoldierAnimator>(); anim.visual = v.transform; anim.rig = SoldierAnimBuilder.AddRig(go);
                }
            }
        }

        /// <summary>Mission 01's assault boat "MAKO" with SQUAD 07 aboard (web cinematics.js: Blender Boat, SEATS_NEW, seated pose).
        /// It starts beached at (3.2, 331.5) with the driver and one operator; IntroDirector sails it in for the intro.</summary>
        static void BuildIntroBoat(IntroDirector intro, GameObject soldier)
        {
            var glb = AssetDatabase.LoadAssetAtPath<GameObject>(GlbPath);
            var node = glb ? glb.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == "Boat") : null;
            if (!node) { Debug.LogWarning("[Slice] intro boat: GLB has no 'Boat' — Mission 01 starts without its intro"); return; }
            var boat = Object.Instantiate(node.gameObject); boat.name = "IntroBoat";
            foreach (var c in boat.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(c);
            var w = IslandTerrain.ToWorld(3.2, 0, 331.5);
            boat.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z); boat.transform.rotation = Quaternion.Euler(2f, -7f, -1.7f);   // web (0.04, π + 0.12, 0.03): yaw 180° − y, roll flips
            double[][] seats = { new[] { 1.02, 2.5 }, new[] { -1.02, 2.5 }, new[] { 1.02, 1.1 }, new[] { -1.02, 1.1 }, new[] { 1.02, -0.3 }, new[] { 0.0, -1.75 } };   // web SEATS_NEW
            var crew = new System.Collections.Generic.List<GameObject>();
            var sit = SoldierPose.Pose(sit: true);
            for (int i = 0; i < seats.Length && soldier; i++)
            {
                var c = Object.Instantiate(soldier, boat.transform); c.name = $"Crew{i}";
                foreach (var col in c.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(col);
                double x = seats[i][0], z = seats[i][1], r = i == 5 ? 0 : x > 0 ? -1.25 : 1.25;   // web: the driver stands, the rest face inboard
                // boat-local: the GLB import mirrors x (glTF +z stays the bow), so web seat (x, z) → (−x, z) and yaw r → −r
                c.transform.localPosition = new Vector3((float)-x, i == 5 ? 0.6f : 0.7f, (float)z);
                c.transform.localRotation = Quaternion.Euler(0f, (float)(-r * Mathf.Rad2Deg), 0f);
                if (i != 5)
                {
                    void Pitch(string n, double rad) { var t = c.GetComponentsInChildren<Transform>(true).FirstOrDefault(x2 => x2.name == n); if (t) t.localRotation *= Quaternion.Euler((float)(rad * Mathf.Rad2Deg), 0f, 0f); }
                    Pitch("legL", sit.LegL); Pitch("legR", sit.LegR); Pitch("shinL", sit.ShinL); Pitch("shinR", sit.ShinR); Pitch("upper", sit.Upper); Pitch("arms", sit.Arms);
                    var body = c.GetComponentsInChildren<Transform>(true).FirstOrDefault(x2 => x2.name == "body"); if (body) body.localPosition += Vector3.up * (float)sit.BodyY;
                }
                c.SetActive(i == 4 || i == 5);   // beached: driver + one operator (web placeBoat)
                crew.Add(c);
            }
            intro.boat = boat.transform; intro.crew = crew.ToArray();
            Debug.Log($"[Slice] intro boat: Blender Boat + {crew.Count} crew");
        }

        /// <summary>Island point at a fixed height (underground: FAC_Y) or, when null, on the terrain.</summary>
        static Vector3 SpawnPoint(double ix, double iz, double? iy)
        {
            if (!iy.HasValue) return IslandPoint(ix, iz);
            var w = IslandTerrain.ToWorld(ix, iy.Value, iz); return new Vector3((float)w.x, (float)w.y, (float)w.z);
        }

        static Vector3 IslandPoint(double ix, double iz)
        {
            var w = IslandTerrain.ToWorld(ix, IslandTerrain.Height(ix, iz), iz);
            return new Vector3((float)w.x, (float)w.y, (float)w.z);
        }

        /// <summary>One web campaign mission on the shared island: same spawn points, patrols, groups, alarm wave and sky.
        /// Structures the Unity island does not have yet (M01's watch tower) are left out; enemies on them stand on the ground.</summary>
        public static bool BuildCampaignScene(CampaignMission m)
        {
            EnsureUrp();
            if (PlayerSettings.colorSpace != ColorSpace.Linear) PlayerSettings.colorSpace = ColorSpace.Linear;
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            BuildSkyRig(m.SkyId, true);

            var level = new GameObject("Level");
            var island = BuildIsland(level);
            if (!island) { Debug.LogError($"[Slice] {m.Code}: needs the island terrain (web textures missing)"); return false; }
            BuildVegetation(level);
            var props = m.Props?.Invoke();
            var named = props != null ? BuildProps(level, props) : new System.Collections.Generic.Dictionary<string, Transform>();

            // bake only the mission area (island coords → world; z flips, so take min/max of both corners)
            Vector3 a = IslandPoint(m.Area.minX, m.Area.minZ), b = IslandPoint(m.Area.maxX, m.Area.maxZ);
            var min = Vector3.Min(a, b); var max = Vector3.Max(a, b);
            float yMid = 0f; foreach (var sp in m.Spawns) yMid += SpawnPoint(sp.X, sp.Z, sp.Y).y; yMid /= Mathf.Max(1, m.Spawns.Length);
            // the security door is open for the bake (agents path through once it slides up) and carves the NavMesh while shut
            named.TryGetValue("P_door", out var door);
            if (door) door.gameObject.SetActive(false);
            BakeNavMesh(level, new Vector3((min.x + max.x) / 2f, yMid, (min.z + max.z) / 2f), new Vector3(max.x - min.x, 80f, max.z - min.z), $"Assets/Scenes/{SceneRouter.SceneFor(m.Id)}_NavMesh.asset", true);
            if (door) { door.gameObject.SetActive(true); var ob = door.gameObject.AddComponent<NavMeshObstacle>(); ob.carving = true; ob.shape = NavMeshObstacleShape.Box; ob.size = Vector3.one; ob.center = Vector3.zero; }   // local units: the door's transform is already scaled to 5 × 4.2 × 0.4

            var spawn = SpawnPoint(m.SpawnX, m.SpawnZ, m.SpawnY);
            var player = BuildPlayer(spawn + Vector3.up * 0.1f);
            player.transform.rotation = Quaternion.Euler(0f, (float)WebAngles.PlayerYawToWorldDeg(m.SpawnYaw), 0f);
            var visual = LoadSoldierVisual();

            var parent = new GameObject("Enemies");
            for (int i = 0; i < m.Spawns.Length; i++) PlaceEnemy(parent, i, m.Spawns[i], visual, spawn, props);
            BuildSquad(player, visual);   // SQUAD 07 follows you (web: every campaign mission spawns three)
            var waveParent = new GameObject("AlarmWave");
            var wave = new System.Collections.Generic.List<GameObject>();
            for (int i = 0; i < (m.AlarmWave?.Length ?? 0); i++) wave.Add(PlaceEnemy(waveParent, i, m.AlarmWave[i], visual, spawn, props));
            foreach (var go in wave) go.SetActive(false);   // switched on by the mission's first alarm (GameDirector.OnAlarm)
            var hookWaves = new System.Collections.Generic.List<GameDirector.WaveGroup>();
            foreach (var kv in m.Waves)
            {
                var wp = new GameObject("Wave_" + kv.Key);
                var members = new System.Collections.Generic.List<GameObject>();
                for (int i = 0; i < kv.Value.Length; i++) members.Add(PlaceEnemy(wp, i, kv.Value[i], visual, spawn, props));
                foreach (var go in members) go.SetActive(false);   // sent in by objective hooks (GameDirector.SendWave)
                hookWaves.Add(new GameDirector.WaveGroup { name = kv.Key, members = members.ToArray() });
            }

            var director = BuildDirectorRig(player);
            director.missionMode = GameDirector.MissionMode.Campaign;
            director.campaignId = m.Id;
            director.alarmWave = wave.ToArray();
            director.waves = hookWaves.ToArray();
            if (named.TryGetValue("CommsTower", out var relay)) director.relayMast = relay;
            if (door) director.securityDoor = door;
            if (named.TryGetValue("BioSample", out var sample)) director.bioSample = sample.gameObject;
            // mission briefing before the mission starts (paused until START), drawn above the HUD and pause menu
            var briefGo = new GameObject("Briefing");
            var briefDoc = briefGo.AddComponent<UnityEngine.UIElements.UIDocument>(); briefDoc.panelSettings = director.GetComponent<UnityEngine.UIElements.UIDocument>().panelSettings; briefDoc.sortingOrder = 20;
            briefGo.AddComponent<BriefingScreen>().style = AssetDatabase.LoadAssetAtPath<UnityEngine.UIElements.StyleSheet>("Assets/UI/PauseMenu.uss");
            var intro = briefGo.AddComponent<IntroDirector>();   // the mission intro camera after the briefing
            if (m.IntroKind == "boat") BuildIntroBoat(intro, visual);   // Mission 01: the assault boat ride (web playBoatIntro)
            if (m.Id == "m05")
            {
                // the extraction helicopter waits out of sight; GameDirector.HeliArrive flies it in on the web curve
                var glb = AssetDatabase.LoadAssetAtPath<GameObject>(GlbPath);
                var node = glb ? glb.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == "Heli") : null;
                GameObject h;
                if (node) { h = Object.Instantiate(node.gameObject); foreach (var c in h.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(c); }
                else { h = GameObject.CreatePrimitive(PrimitiveType.Cube); Object.DestroyImmediate(h.GetComponent<Collider>()); h.transform.localScale = new Vector3(2.4f, 2.2f, 6.5f); }
                h.name = "Heli"; h.transform.position = SpawnPoint(IslandProps.Helipad.x + 240, IslandProps.Helipad.z - 120, 77.2); h.SetActive(false);
                director.heli = h.transform;
                Debug.Log($"[Slice] {m.Code}: extraction helicopter {(node ? "Blender Heli" : "box stand-in")}");
            }

            string path = CampaignScenePath(m);
            bool saved = SaveAndList(scene, path, 1 + System.Array.IndexOf(Campaign.All, m));
            Debug.Log($"[Slice] {m.Code} {m.Name}: scene {(saved ? "saved" : "NOT saved")}: {path}, {m.Spawns.Length} enemies + {wave.Count} QRF + {hookWaves.Sum(w => w.members.Length)} in waves, sky {m.SkyId}, spawn {spawn}");
            return saved;
        }

        /// <summary>The zone's props (Core.IslandProps = web build.js): Blender models from the shared GLB at the web game's
        /// positions and sizes, box colliders where the web game has them (named so SliceFx picks the impact surface), lamps
        /// with point lights, the radar dish turning.</summary>
        static System.Collections.Generic.Dictionary<string, Transform> BuildProps(GameObject level, PropSet set)
        {
            var named = new System.Collections.Generic.Dictionary<string, Transform>();
            var glb = AssetDatabase.LoadAssetAtPath<GameObject>(GlbPath);
            var root = new GameObject("Props"); root.transform.SetParent(level.transform);
            var cols = new GameObject("PropColliders"); cols.transform.SetParent(root.transform);
            Transform Node(string n) => glb ? glb.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == n) : null;
            int drawn = 0, colliders = 0, missing = 0;
            foreach (var pm in set.Models)
            {
                var w = IslandTerrain.ToWorld(pm.X, pm.Y, pm.Z);
                var node = Node(pm.Geo);
                GameObject go;
                if (node) { go = Object.Instantiate(node.gameObject, root.transform); foreach (var cc in go.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(cc); }
                else { missing++; go = GameObject.CreatePrimitive(PrimitiveType.Cube); Object.DestroyImmediate(go.GetComponent<Collider>()); go.transform.SetParent(root.transform); go.transform.localScale = new Vector3(2.6f, 30f, 2.6f); }
                go.name = pm.Geo == "CommsTower" ? "RelayMast" : pm.Geo;
                go.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z) + (node ? Vector3.zero : Vector3.up * 15f);
                go.transform.rotation = Quaternion.identity;
                // island yaw → Unity for a glTF +z model: 180° − yaw (the import mirrors x, the island mirrors z). −yaw turned
                // every placed model around (VehicleFacingTests 2026-11-27: motor-pool truck off by 180°).
                go.transform.rotation = Quaternion.Euler(0f, (float)WebAngles.EnemyYawToWorldDeg(pm.RotY), 0f);
                if (pm.Geo != "CommsTower") foreach (var t in go.GetComponentsInChildren<Transform>(true)) GameObjectUtility.SetStaticEditorFlags(t.gameObject, (StaticEditorFlags)~0 & ~StaticEditorFlags.BatchingStatic);
                named[pm.Geo] = go.transform; drawn++;
            }
            foreach (var c in set.Calls)
            {
                var bottom = IslandTerrain.ToWorld(c.X, c.Y, c.Z);
                Vector3 b = new Vector3((float)bottom.x, (float)bottom.y, (float)bottom.z);
                GameObject col = null;
                if (c.HasCollider && c.Kind != "camera")   // cameras get their own collider + health (SecurityCamera)
                {
                    string surf = c.Surface == "sand" ? "Ground_sandbag" : c.Surface == "wood" ? "Cover_wood" : c.Surface == "metal" ? "Metal_prop" : "Prop_concrete";
                    col = new GameObject($"{surf}_{colliders}"); col.transform.SetParent(cols.transform); col.isStatic = true;
                    col.transform.position = b + Vector3.up * (float)(c.Sy / 2);
                    col.AddComponent<BoxCollider>().size = new Vector3((float)c.Sx, (float)c.Sy, (float)c.Sz);
                    // the relay mast's core falls with the mast (Mission 02 detonation); nobody stands on it (web noStand)
                    if (c.NoStand && named.TryGetValue("CommsTower", out var mast)) { col.transform.SetParent(mast, true); col.name = "Metal_mast"; col.isStatic = false; }
                    colliders++;
                }
                if (!c.Drawn) continue;
                Vector3 pos = c.Origin ? b : b + Vector3.up * (float)(c.Sy / 2);
                bool turn = c.Rot90 || System.Math.Abs(c.RotY) > 1e-9;
                float yaw = c.Rot90 ? -90f : (float)(-c.RotY * Mathf.Rad2Deg);   // the island's z is mirrored: yaw changes sign
                Vector3 scale = c.Rot90 ? new Vector3((float)c.Sz, (float)c.Sy, (float)c.Sx) : new Vector3((float)c.Sx, (float)c.Sy, (float)c.Sz);
                GameObject go;
                var node = c.Geo.Length > 0 ? Node(c.Geo) : null;
                if (node)
                {
                    go = Object.Instantiate(node.gameObject, root.transform); go.name = c.Geo;
                    foreach (var cc in go.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(cc);
                }
                else
                {
                    if (c.Geo.Length > 0) missing++;
                    go = GameObject.CreatePrimitive(PrimitiveType.Cube); Object.DestroyImmediate(go.GetComponent<Collider>());
                    go.name = "Box_" + c.Mat; go.transform.SetParent(root.transform);
                    go.GetComponent<Renderer>().sharedMaterial = Mat("Prop_" + c.Mat, c.Mat == "wood" ? new Color(0.45f, 0.33f, 0.2f) : c.Mat == "sand" ? new Color(0.66f, 0.6f, 0.45f) : new Color(0.5f, 0.5f, 0.48f), 0.85f);
                }
                go.transform.position = pos; go.transform.rotation = turn ? Quaternion.Euler(0f, yaw, 0f) : Quaternion.identity; go.transform.localScale = scale;
                if (c.Geo == "P_door")
                {
                    // Mission 04 security door: its collider rides with it when it slides open
                    go.name = "SecurityDoor"; named["P_door"] = go.transform;
                    if (col) { col.transform.SetParent(go.transform, true); col.name = "Metal_door"; col.isStatic = false; }
                    drawn++; continue;
                }
                // static for lighting / occlusion, but not batching: static batching copies every mesh into the build (the
                // vegetation lesson — merged copies were 76 % of the WebGL download); the GLB meshes are shared as they are
                foreach (var t in go.GetComponentsInChildren<Transform>(true)) GameObjectUtility.SetStaticEditorFlags(t.gameObject, (StaticEditorFlags)~0 & ~StaticEditorFlags.BatchingStatic);
                if (c.Tint != null)
                {
                    var mpb = new MaterialPropertyBlock();
                    var tint = new Color((float)c.Tint[0], (float)c.Tint[1], (float)c.Tint[2], 1f);
                    foreach (var r in go.GetComponentsInChildren<Renderer>())
                    {
                        r.GetPropertyBlock(mpb);
                        var src = r.sharedMaterial;
                        if (src && src.HasProperty("baseColorFactor")) mpb.SetColor("baseColorFactor", src.GetColor("baseColorFactor") * tint);
                        if (src && src.HasProperty("_BaseColor")) mpb.SetColor("_BaseColor", src.GetColor("_BaseColor") * tint);
                        r.SetPropertyBlock(mpb);
                    }
                }
                drawn++;
            }
            foreach (var r in set.Radars)
            {
                var w = IslandTerrain.ToWorld(r.X, r.Y, r.Z);
                var node = Node("Radar"); if (!node) { missing++; continue; }
                var go = Object.Instantiate(node.gameObject, root.transform); go.name = "Radar";
                go.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z); go.transform.rotation = Quaternion.identity;
                go.transform.localScale = new Vector3(1f, (float)(r.Height / 7.0), 1f);
                var dish = go.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == "dish");
                if (dish) dish.gameObject.AddComponent<Spinner>();
                drawn++;
            }
            foreach (var l in set.Lights)
            {
                var w = IslandTerrain.ToWorld(l.X, l.Y, l.Z);
                var light = new GameObject(l.Red ? "EmergencyLight" : "LampLight").AddComponent<Light>(); light.transform.SetParent(root.transform);
                light.type = LightType.Point; light.range = (float)l.Range; light.intensity = 2.5f;
                light.color = l.Red ? new Color(1f, 0.19f, 0.125f) : new Color(1f, 0.886f, 0.627f);   // web 0xff3020 / 0xffe2a0
                light.shadows = LightShadows.None; light.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z);
                if (l.Red) { var pulse = light.gameObject.AddComponent<LightPulse>(); pulse.baseIntensity = 1.5f; pulse.swing = 1f; pulse.phase = (float)l.X; }
            }
            // painted ground (web runway, stripes, helipad): thin boxes / discs without colliders
            foreach (var f in set.Flats)
            {
                var w = IslandTerrain.ToWorld(f.X, f.Y, f.Z);
                var g = GameObject.CreatePrimitive(f.Disc ? PrimitiveType.Cylinder : PrimitiveType.Cube); Object.DestroyImmediate(g.GetComponent<Collider>());
                g.name = f.Disc ? "Pad" : "Paint"; g.transform.SetParent(root.transform); g.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z);
                g.transform.localScale = new Vector3((float)f.Sx, f.Disc ? 0.01f : 0.02f, (float)f.Sz);
                var col = new Color(((f.Color >> 16) & 255) / 255f, ((f.Color >> 8) & 255) / 255f, (f.Color & 255) / 255f);
                g.GetComponent<Renderer>().sharedMaterial = Mat("Paint_" + f.Color.ToString("x6"), col, 0.85f);
                g.GetComponent<Renderer>().shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; g.isStatic = true;
            }
            // indoor floors and ceilings (web: the facility floor is the FAC_Y plane; here they are solid slabs)
            foreach (var sl in set.Slabs)
            {
                var w = IslandTerrain.ToWorld(sl.X, sl.Y, sl.Z);
                var slab = GameObject.CreatePrimitive(PrimitiveType.Cube); slab.name = (sl.Kind == "floor" ? "Metal_floor" : "Prop_ceiling") + "_slab";
                slab.transform.SetParent(root.transform); slab.transform.position = new Vector3((float)w.x, (float)(w.y + sl.Sy / 2), (float)w.z);
                slab.transform.localScale = new Vector3((float)sl.Sx, (float)sl.Sy, (float)sl.Sz);
                slab.GetComponent<Renderer>().sharedMaterial = Mat("Slab_" + sl.Mat, sl.Mat == "dark" ? new Color(0.16f, 0.17f, 0.18f) : new Color(0.5f, 0.5f, 0.48f), 0.8f);
                slab.isStatic = true;
            }
            // Mission 04 security cameras: a dark box with a red lens under the ceiling, 10 hp
            int cam = 0;
            foreach (var sc in set.Cameras)
            {
                var call = set.Calls.First(c => c.Kind == "camera" && System.Math.Abs(c.X - sc.X) < 1e-6 && System.Math.Abs(c.Z - sc.Z) < 1e-6);
                var w = IslandTerrain.ToWorld(sc.X, call.Y + call.Sy / 2, sc.Z);   // web: head at y + h − 0.5, the collider's centre
                var go = new GameObject($"SecurityCamera{cam++}"); go.transform.SetParent(root.transform); go.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z);
                var box = go.AddComponent<BoxCollider>(); box.size = new Vector3(0.6f, 0.6f, 0.7f); box.center = Vector3.zero;
                go.AddComponent<HitZone>().part = BodyPart.Torso;
                var head = new GameObject("Head").transform; head.SetParent(go.transform, false);
                var body = GameObject.CreatePrimitive(PrimitiveType.Cube); Object.DestroyImmediate(body.GetComponent<Collider>()); body.transform.SetParent(head, false); body.transform.localScale = new Vector3(0.3f, 0.25f, 0.55f);
                body.GetComponent<Renderer>().sharedMaterial = Mat("Camera", new Color(0.12f, 0.13f, 0.14f), 0.5f);
                var lens = GameObject.CreatePrimitive(PrimitiveType.Sphere); Object.DestroyImmediate(lens.GetComponent<Collider>()); lens.transform.SetParent(head, false); lens.transform.localPosition = new Vector3(0f, 0f, 0.3f); lens.transform.localScale = Vector3.one * 0.16f;
                lens.GetComponent<Renderer>().sharedMaterial = Mat("CameraLens", new Color(1f, 0.1f, 0.05f), 0.2f);
                go.AddComponent<Damageable>();
                var scam = go.AddComponent<SecurityCamera>(); scam.islandX = sc.X; scam.islandZ = sc.Z; scam.phase = sc.Phase; scam.head = head; scam.lens = lens.GetComponent<Renderer>();
            }
            // Mission 04 bio-sample: the glowing canister on the vault pedestal (web 0x60ff90, emissive)
            if (set.Points.TryGetValue("sampleMesh", out var sm))
            {
                var w = IslandTerrain.ToWorld(sm.x, sm.y, sm.z);
                var s = GameObject.CreatePrimitive(PrimitiveType.Cylinder); Object.DestroyImmediate(s.GetComponent<Collider>());
                s.name = "BioSample"; s.transform.SetParent(root.transform); s.transform.position = new Vector3((float)w.x, (float)w.y, (float)w.z); s.transform.localScale = new Vector3(0.7f, 0.45f, 0.7f);
                var mat = Mat("BioSample", new Color(0.38f, 1f, 0.56f), 0.1f); mat.EnableKeyword("_EMISSION"); if (mat.HasProperty("_EmissionColor")) mat.SetColor("_EmissionColor", new Color(0.19f, 1f, 0.38f) * 2.5f); EditorUtility.SetDirty(mat);
                s.GetComponent<Renderer>().sharedMaterial = mat;
                var glow = s.AddComponent<Light>(); glow.type = LightType.Point; glow.range = 4f; glow.intensity = 1f; glow.color = new Color(0.38f, 1f, 0.56f);
                named["BioSample"] = s.transform;
            }
            Physics.SyncTransforms();
            Debug.Log($"[Slice] props: {drawn} drawn, {colliders} colliders, {set.Lights.Count} lamp lights, {set.Radars.Count} radar{(missing > 0 ? $", {missing} GLB models MISSING (boxes instead)" : "")}");
            return named;
        }

        static GameObject PlaceEnemy(GameObject parent, int i, SpawnDef sp, GameObject visual, Vector3 player, PropSet props)
        {
            var pos = SpawnPoint(sp.X, sp.Z, sp.Y);
            if (sp.OnStructure && props != null)
            {
                // web y: top(x, z) — the deck of the watch tower (the NavMesh is baked on colliders, so the deck is walkable)
                var w = IslandTerrain.ToWorld(sp.X, IslandProps.Top(props, sp.X, sp.Z), sp.Z);
                pos = new Vector3((float)w.x, (float)w.y, (float)w.z);
            }
            Vector3[] route = sp.Patrol?.Select(p => IslandPoint(p.x, p.z)).ToArray();
            Vector3 face = player;
            if (sp.Yaw.HasValue)
            {
                float deg = (float)WebAngles.EnemyYawToWorldDeg(sp.Yaw.Value);
                face = pos + Quaternion.Euler(0f, deg, 0f) * Vector3.forward * 5f;
            }
            else if (route != null && route.Length > 1) face = route[1];
            bool hold = sp.Kind == "sniper" || sp.OnStructure;
            var go = BuildEnemy(parent, i, sp.Kind, pos, route, hold, visual, face);
            go.GetComponent<EnemyAgent>().group = sp.Group;
            return go;
        }

        static GameObject BuildPlayer(Vector3 pos)
        {
            var go = new GameObject("Player") { tag = "Player" };
            go.transform.position = pos;
            var cc = go.AddComponent<CharacterController>(); cc.height = 1.8f; cc.radius = 0.35f; cc.center = new Vector3(0f, 0.9f, 0f);
            var hp = go.AddComponent<Damageable>(); hp.maxHealth = 100f; hp.armor = 100f; hp.armorSoak = 0.6f;   // player armour soaks 60%
            var motor = go.AddComponent<PlayerMotor>();
            var pivot = new GameObject("CameraPivot").transform; pivot.SetParent(go.transform, false); pivot.localPosition = new Vector3(0f, 1.65f, 0f);
            motor.cameraPivot = pivot;
            var cam = pivot.gameObject.AddComponent<Camera>(); cam.fieldOfView = 70f; cam.nearClipPlane = 0.05f; cam.tag = "MainCamera";
            pivot.gameObject.AddComponent<AudioListener>();
            if (GraphicsSettings.defaultRenderPipeline) cam.gameObject.AddComponent<UniversalAdditionalCameraData>().renderPostProcessing = true;
            var weapon = pivot.gameObject.AddComponent<WeaponController>(); weapon.motor = motor; weapon.view = cam;
            pivot.gameObject.AddComponent<GrenadeThrower>().motor = motor;
            var gear = go.AddComponent<GearController>(); gear.motor = motor; gear.view = cam;   // N/T/L/H/B equipment
            return go;
        }

        static GameObject BuildEnemy(GameObject parent, int i, string type, Vector3 pos, Vector3[] patrol, bool hold, GameObject visual, Vector3 face)
        {
            if (EnemyType.All.Any(t => t.Id == type && t.Vehicle)) return BuildVehicle(parent, i, type, pos, face);
            var go = new GameObject($"Enemy{i}_{type}");
            go.transform.SetParent(parent.transform); go.transform.position = pos;
            Vector3 look = face - pos; look.y = 0f; go.transform.rotation = Quaternion.LookRotation(look.sqrMagnitude > 0.01f ? look : Vector3.forward);
            var body = go.AddComponent<CapsuleCollider>(); body.height = 1.8f; body.radius = 0.35f; body.center = new Vector3(0f, 0.9f, 0f);
            go.AddComponent<HitZone>().part = BodyPart.Torso;
            var head = new GameObject("HeadHit"); head.transform.SetParent(go.transform, false); head.transform.localPosition = new Vector3(0f, 1.68f, 0f);
            head.AddComponent<SphereCollider>().radius = 0.14f; head.AddComponent<HitZone>().part = BodyPart.Head;
            // the capsule covers the head too: shrink it so head shots reach the sphere first
            body.height = 1.5f; body.center = new Vector3(0f, 0.75f, 0f);
            float sc = EnemyType.All.FirstOrDefault(t => t.Id == type)?.Scale ?? 1f;   // web type.scale (VIPER 1.2, heavy 1.14)
            if (sc != 1f) { body.height *= sc; body.center *= sc; body.radius *= sc; head.transform.localPosition *= sc; head.GetComponent<SphereCollider>().radius *= sc; }
            go.AddComponent<Damageable>();
            var agent = go.AddComponent<NavMeshAgent>(); agent.radius = 0.35f; agent.height = 1.8f; agent.angularSpeed = 360f; agent.acceleration = 12f;
            agent.enabled = false;   // EnemyAgent.Start enables it once the NavMeshSurface has loaded its data (WebGL ran agents first)
            var e = go.AddComponent<EnemyAgent>(); e.typeId = type; e.hold = hold;
            if (patrol != null)
            {
                e.patrolPoints = new Transform[patrol.Length];
                for (int p = 0; p < patrol.Length; p++)
                {
                    var wp = new GameObject($"Patrol{p}").transform; wp.SetParent(parent.transform); wp.position = patrol[p]; e.patrolPoints[p] = wp;
                }
            }
            if (visual)
            {
                var v = Object.Instantiate(visual, go.transform); v.name = "Visual";
                v.transform.localPosition = Vector3.zero; v.transform.localRotation = Quaternion.identity; v.transform.localScale = Vector3.one * sc;
                foreach (var c in v.GetComponentsInChildren<Collider>()) Object.DestroyImmediate(c);
                // U3: Quaternius UAL clips on an invisible Humanoid rig drive the soldier's pivots (web procedural pose without it)
                var anim = go.AddComponent<SoldierAnimator>(); anim.visual = v.transform;
                anim.rig = SoldierAnimBuilder.AddRig(go);
            }
            else
            {
                var cap = GameObject.CreatePrimitive(PrimitiveType.Capsule); Object.DestroyImmediate(cap.GetComponent<Collider>());
                cap.name = "Visual"; cap.transform.SetParent(go.transform, false); cap.transform.localPosition = new Vector3(0f, 0.9f, 0f); cap.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);
                cap.GetComponent<Renderer>().sharedMaterial = Mat("Enemy_" + type, type == "heavy" ? new Color(0.25f, 0.27f, 0.22f) : new Color(0.4f, 0.38f, 0.3f), 0.7f);
            }
            return go;
        }

        /// <summary>An APC (web makeAPC / Blender 'APC' with its 'turret'): one box collider for the hull and turret (the web game
        /// tests three 1.75 m spheres along the hull), the turret turns, the hull never moves (EnemyAgent vehicle rules).</summary>
        static GameObject BuildVehicle(GameObject parent, int i, string type, Vector3 pos, Vector3 face)
        {
            var go = new GameObject($"Enemy{i}_{type}");
            go.transform.SetParent(parent.transform); go.transform.position = pos;
            Vector3 look = face - pos; look.y = 0f; go.transform.rotation = Quaternion.LookRotation(look.sqrMagnitude > 0.01f ? look : Vector3.forward);
            var body = go.AddComponent<BoxCollider>(); body.size = new Vector3(3.5f, 3.3f, 7.3f); body.center = new Vector3(0f, 1.65f, 0f);
            go.AddComponent<HitZone>().part = BodyPart.Torso;
            go.AddComponent<Damageable>();
            var agent = go.AddComponent<NavMeshAgent>(); agent.radius = 1.8f; agent.height = 3.3f; agent.speed = 0f; agent.enabled = false;
            var e = go.AddComponent<EnemyAgent>(); e.typeId = type; e.hold = true;
            var glb = AssetDatabase.LoadAssetAtPath<GameObject>(GlbPath);
            var node = glb ? glb.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == "APC") : null;
            if (node)
            {
                var v = Object.Instantiate(node.gameObject, go.transform); v.name = "Visual";
                v.transform.localPosition = Vector3.zero; v.transform.localRotation = Quaternion.identity;
                foreach (var c in v.GetComponentsInChildren<Collider>()) Object.DestroyImmediate(c);
                e.turret = v.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == "turret");
            }
            else
            {
                var hull = GameObject.CreatePrimitive(PrimitiveType.Cube); Object.DestroyImmediate(hull.GetComponent<Collider>());
                hull.name = "Visual"; hull.transform.SetParent(go.transform, false); hull.transform.localPosition = new Vector3(0f, 1.2f, 0f); hull.transform.localScale = new Vector3(3.2f, 2.2f, 7f);
                var tur = GameObject.CreatePrimitive(PrimitiveType.Cube); Object.DestroyImmediate(tur.GetComponent<Collider>());
                tur.name = "turret"; tur.transform.SetParent(go.transform, false); tur.transform.localPosition = new Vector3(0f, 2.6f, 0.2f); tur.transform.localScale = new Vector3(1.5f, 0.7f, 1.7f);
                e.turret = tur.transform;
            }
            Debug.Log($"[Slice] vehicle {type}: {(node ? "Blender APC" : "box stand-in")}, turret {(e.turret ? "ok" : "MISSING")}");
            return go;
        }

        static GameObject LoadSoldierVisual()
        {
            var root = AssetDatabase.LoadAssetAtPath<GameObject>(GlbPath);
            if (!root) return null;
            var t = root.GetComponentsInChildren<Transform>(true).FirstOrDefault(x => x.name == "Soldier");
            return t ? t.gameObject : null;
        }

        static GameObject Box(GameObject parent, string name, Vector3 pos, Vector3 size, Material m)
        {
            var b = GameObject.CreatePrimitive(PrimitiveType.Cube);
            b.name = name; b.transform.SetParent(parent.transform); b.transform.position = pos; b.transform.localScale = size;
            b.GetComponent<Renderer>().sharedMaterial = m; b.isStatic = true;
            return b;
        }

        static VolumeProfile PostProfile()
        {
            string path = SettingsDir + "/SlicePost.asset";
            var profile = AssetDatabase.LoadAssetAtPath<VolumeProfile>(path);
            if (!profile) { profile = ScriptableObject.CreateInstance<VolumeProfile>(); AssetDatabase.CreateAsset(profile, path); }
            if (!profile.TryGet(out Tonemapping tm)) { tm = profile.Add<Tonemapping>(true); tm.name = "Tonemapping"; AssetDatabase.AddObjectToAsset(tm, profile); }
            tm.mode.Override(TonemappingMode.ACES);
            if (!profile.TryGet(out ColorAdjustments ca)) { ca = profile.Add<ColorAdjustments>(true); ca.name = "ColorAdjustments"; AssetDatabase.AddObjectToAsset(ca, profile); }
            ca.postExposure.Override(0.3f); ca.contrast.Override(8f); ca.saturation.Override(6f);
            // bloom on the sun-lit sky, muzzle flashes and explosions; light vignette to frame the view
            if (!profile.TryGet(out Bloom bloom)) { bloom = profile.Add<Bloom>(true); bloom.name = "Bloom"; AssetDatabase.AddObjectToAsset(bloom, profile); }
            bloom.threshold.Override(1.0f); bloom.intensity.Override(0.55f); bloom.scatter.Override(0.65f);
            if (!profile.TryGet(out Vignette vig)) { vig = profile.Add<Vignette>(true); vig.name = "Vignette"; AssetDatabase.AddObjectToAsset(vig, profile); }
            vig.intensity.Override(0.22f); vig.smoothness.Override(0.45f);
            EditorUtility.SetDirty(profile); AssetDatabase.SaveAssets();
            return profile;
        }

        const string TerrainDir = "Assets/Imported/Terrain";

        /// <summary>Unity Terrain of the web game's 1.2 km island (Core.IslandTerrain, parity-tested against terrain.js, mapped with ToWorld): 513² heights,
        /// four splat layers from the web game's CC0 photo textures (copied from apps/special-soldier/src/assets/tex at build time,
        /// one tile = 2.5 m like the web shader), plus a sea plane. Positioned so island (0, 16, −95) is world (0, 0, 0).</summary>
        static Terrain BuildIsland(GameObject level)
        {
            string texSrc = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "special-soldier", "src", "assets", "tex"));
            if (!Directory.Exists(texSrc)) { Debug.LogWarning("[Slice] island skipped: web textures not found at " + texSrc); return null; }
            Directory.CreateDirectory(TerrainDir);
            var layers = new TerrainLayer[4];
            string[] names = { "sand", "grass", "rock", "concrete" };
            for (int i = 0; i < 4; i++)
            {
                foreach (var suffix in new[] { "_d", "_n" })
                {
                    string dst = $"{TerrainDir}/{names[i]}{suffix}.jpg";
                    File.Copy(Path.Combine(texSrc, names[i] + suffix + ".jpg"), dst, true);
                    AssetDatabase.ImportAsset(dst, ImportAssetOptions.ForceUpdate);
                    if (suffix == "_n" && AssetImporter.GetAtPath(dst) is TextureImporter ti && ti.textureType != TextureImporterType.NormalMap)
                    { ti.textureType = TextureImporterType.NormalMap; ti.SaveAndReimport(); }
                }
                string layerPath = $"{SettingsDir}/Terrain_{names[i]}.terrainlayer";
                var layer = AssetDatabase.LoadAssetAtPath<TerrainLayer>(layerPath);
                if (!layer) { layer = new TerrainLayer(); AssetDatabase.CreateAsset(layer, layerPath); }
                layer.diffuseTexture = AssetDatabase.LoadAssetAtPath<Texture2D>($"{TerrainDir}/{names[i]}_d.jpg");
                layer.normalMapTexture = AssetDatabase.LoadAssetAtPath<Texture2D>($"{TerrainDir}/{names[i]}_n.jpg");
                layer.tileSize = new Vector2(2.5f, 2.5f); layer.smoothness = names[i] == "concrete" ? 0.15f : 0.05f;
                EditorUtility.SetDirty(layer); layers[i] = layer;
            }

            const int res = 513;
            var h = IslandTerrain.HeightGrid(res, out float min, out float max);
            float range = Mathf.Max(1f, max - min);
            var norm = new float[res, res];
            // Unity rows run toward +z = island −z (IslandTerrain.ToWorld flips z), so read the island rows backwards
            for (int r = 0; r < res; r++) for (int c = 0; c < res; c++) norm[r, c] = (h[res - 1 - r, c] - min) / range;

            string dataPath = SettingsDir + "/IslandTerrain.asset";
            AssetDatabase.DeleteAsset(dataPath);
            var data = new TerrainData { heightmapResolution = res };
            data.size = new Vector3(IslandTerrain.Size, range, IslandTerrain.Size);
            data.SetHeights(0, 0, norm);
            data.terrainLayers = layers;
            const int ares = 512;
            data.alphamapResolution = ares;
            var alpha = new float[ares, ares, 4];
            for (int r = 0; r < ares; r++)
                for (int c = 0; c < ares; c++)
                {
                    double x = -IslandTerrain.Size / 2 + (c + 0.5) * IslandTerrain.Size / ares, z = IslandTerrain.Size / 2 - (r + 0.5) * IslandTerrain.Size / ares;   // flipped z
                    var w = IslandTerrain.Splat(x, z);
                    alpha[r, c, 0] = (float)w.sand; alpha[r, c, 1] = (float)w.grass; alpha[r, c, 2] = (float)w.rock; alpha[r, c, 3] = (float)w.concrete;
                }
            data.SetAlphamaps(0, 0, alpha);
            AssetDatabase.CreateAsset(data, dataPath);

            var go = Terrain.CreateTerrainGameObject(data);
            go.name = "Island"; go.transform.SetParent(level.transform);
            // terrain corner = world position of island (−600, min, +600) (its +z row 0 after the flip)
            var corner = IslandTerrain.ToWorld(-IslandTerrain.Size / 2, min, IslandTerrain.Size / 2);
            go.transform.position = new Vector3((float)corner.x, (float)corner.y, (float)corner.z);
            go.isStatic = true;
            var terrain = go.GetComponent<Terrain>();
            var tmat = new Material(Shader.Find("Universal Render Pipeline/Terrain/Lit"));
            AssetDatabase.CreateAsset(tmat, SettingsDir + "/IslandTerrain.mat");
            terrain.materialTemplate = tmat; terrain.heightmapPixelError = 4f; terrain.basemapDistance = 400f;

            // sea at island height 0 (world −16)
            var sea = GameObject.CreatePrimitive(PrimitiveType.Plane); Object.DestroyImmediate(sea.GetComponent<Collider>());
            sea.name = "Sea"; sea.transform.SetParent(level.transform);
            sea.transform.position = new Vector3(0f, (float)IslandTerrain.ToWorld(0, 0, 0).y, 0f); sea.transform.localScale = new Vector3(400f, 1f, 400f);
            sea.GetComponent<Renderer>().sharedMaterial = Mat("Sea", new Color(0.1f, 0.27f, 0.33f), 0.08f);

            AssetDatabase.SaveAssets();
            float atOrigin = terrain.SampleHeight(Vector3.zero) + go.transform.position.y;
            Debug.Log($"[Slice] island terrain {res}² heights ({min:0.0}..{max:0.0} m), {ares}² splat, ground at slice origin y = {atOrigin:0.00} (expect 0)");
            return terrain;
        }

        const string VegDir = "Assets/Imported/Vegetation";

        /// <summary>The web island's trees, palms and rocks (Core.IslandVegetation = vegetation.js, same seed → same places) using the
        /// Blender Tree / Palm / Rock models from the shared GLB, drawn with GPU instancing (Runtime/InstancedVegetation): each model's
        /// meshes once, one transform per plant, 160 m cells like the web game. Merging every plant into per-cell meshes made the
        /// vegetation 55.7 MB of a 73 MB WebGL build (PC build report, 2026-11-25). No colliders: they all stand outside the arena
        /// walls. Ferns are left out for now.</summary>
        static void BuildVegetation(GameObject level)
        {
            var glb = AssetDatabase.LoadAssetAtPath<GameObject>(GlbPath);
            if (!glb) { Debug.LogWarning("[Slice] vegetation skipped: GLB not imported (run StudioBootstrap.ImportAndBuild first)"); return; }
            var layout = IslandVegetation.Build();
            AssetDatabase.DeleteAsset(VegDir); Directory.CreateDirectory(VegDir);
            var root = new GameObject("Vegetation"); root.transform.SetParent(level.transform);
            var veg = root.AddComponent<InstancedVegetation>();
            var models = new System.Collections.Generic.List<InstancedVegetation.Model>();
            var cells = new System.Collections.Generic.List<InstancedVegetation.Cell>();
            var mats = new System.Collections.Generic.Dictionary<Material, Material>();
            Plant(glb, "Tree", layout.Trunks, models, cells, mats);
            Plant(glb, "Palm", layout.Palms, models, cells, mats);
            Plant(glb, "Rock", layout.Rocks, models, cells, mats);
            veg.models = models.ToArray(); veg.cells = cells.ToArray();
            AssetDatabase.SaveAssets();
            int parts = models.Sum(m => m.parts.Length);
            Debug.Log($"[Slice] vegetation: {layout.Trunks.Count} trees, {layout.Palms.Count} palms, {layout.Rocks.Count} rocks → instanced: {models.Count} models ({parts} mesh parts, {mats.Count} instancing materials), {cells.Count} cells");
        }

        static void Plant(GameObject glb, string node, System.Collections.Generic.List<IslandVegetation.Item> items,
            System.Collections.Generic.List<InstancedVegetation.Model> models, System.Collections.Generic.List<InstancedVegetation.Cell> cells,
            System.Collections.Generic.Dictionary<Material, Material> mats)
        {
            var src = glb.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == node);
            if (!src) { Debug.LogWarning($"[Slice] vegetation: GLB has no '{node}' node"); return; }
            // every mesh (and sub-mesh) under the model, with its transform relative to the model's root (the GLB lays models out in a row)
            var parts = new System.Collections.Generic.List<InstancedVegetation.Part>();
            foreach (var f in src.GetComponentsInChildren<MeshFilter>(true).Where(f => f.sharedMesh))
            {
                var srcMats = f.GetComponent<MeshRenderer>().sharedMaterials;
                for (int sub = 0; sub < f.sharedMesh.subMeshCount && sub < srcMats.Length; sub++)
                    parts.Add(new InstancedVegetation.Part { mesh = f.sharedMesh, subMesh = sub, material = Instancing(srcMats[sub], mats), rel = src.worldToLocalMatrix * f.transform.localToWorldMatrix });
            }
            int model = models.Count;
            models.Add(new InstancedVegetation.Model { name = node, parts = parts.ToArray() });

            var byCell = new System.Collections.Generic.Dictionary<(int, int), System.Collections.Generic.List<Matrix4x4>>();
            var bounds = new System.Collections.Generic.Dictionary<(int, int), Bounds>();
            var local = new Bounds(); bool first = true;   // the model's own bounds, to size each cell's bounds
            foreach (var p in parts) { var b = TransformBounds(p.rel, p.mesh.bounds); if (first) { local = b; first = false; } else local.Encapsulate(b); }
            foreach (var it in items)
            {
                var w = IslandTerrain.ToWorld(it.X, it.Y, it.Z);
                // web: rotation (tx, r, tz) radians, uniform scale s; yaw sign flips with the z mirror
                var trs = Matrix4x4.TRS(new Vector3((float)w.x, (float)w.y, (float)w.z),
                    Quaternion.Euler((float)(-it.Tx * Mathf.Rad2Deg), (float)(-it.R * Mathf.Rad2Deg), (float)(it.Tz * Mathf.Rad2Deg)), Vector3.one * (float)it.S);
                var key = (Mathf.FloorToInt((float)w.x / 160f), Mathf.FloorToInt((float)w.z / 160f));
                if (!byCell.TryGetValue(key, out var list)) byCell[key] = list = new System.Collections.Generic.List<Matrix4x4>();
                list.Add(trs);
                var b = TransformBounds(trs, local);
                if (bounds.TryGetValue(key, out var cb)) { cb.Encapsulate(b); bounds[key] = cb; } else bounds[key] = b;
            }
            foreach (var kv in byCell) cells.Add(new InstancedVegetation.Cell { model = model, bounds = bounds[kv.Key], items = kv.Value.ToArray() });
        }

        /// <summary>The GLB's materials are read-only import sub-assets: an instancing-enabled copy of each is saved next to the data.</summary>
        static Material Instancing(Material src, System.Collections.Generic.Dictionary<Material, Material> mats)
        {
            if (!src) return null;
            if (mats.TryGetValue(src, out var m)) return m;
            m = new Material(src) { name = src.name + "_Instanced", enableInstancing = true };
            AssetDatabase.CreateAsset(m, $"{VegDir}/{m.name}_{mats.Count}.mat");
            mats[src] = m;
            return m;
        }

        static Bounds TransformBounds(Matrix4x4 m, Bounds b)
        {
            var r = new Bounds(m.MultiplyPoint3x4(b.center), Vector3.zero);
            for (int i = 0; i < 8; i++)
                r.Encapsulate(m.MultiplyPoint3x4(b.center + Vector3.Scale(b.extents, new Vector3((i & 1) == 0 ? -1 : 1, (i & 2) == 0 ? -1 : 1, (i & 4) == 0 ? -1 : 1))));
            return r;
        }

        /// <summary>PanelSettings for the HUD: default runtime theme (Assets/UI/SliceTheme.tss), scale with screen size from 1920×1080.</summary>
        static UnityEngine.UIElements.PanelSettings HudPanelSettings()
        {
            string path = SettingsDir + "/SliceHudPanel.asset";
            var ps = AssetDatabase.LoadAssetAtPath<UnityEngine.UIElements.PanelSettings>(path);
            if (!ps) { ps = ScriptableObject.CreateInstance<UnityEngine.UIElements.PanelSettings>(); AssetDatabase.CreateAsset(ps, path); }
            ps.themeStyleSheet = AssetDatabase.LoadAssetAtPath<UnityEngine.UIElements.ThemeStyleSheet>("Assets/UI/SliceTheme.tss");
            ps.scaleMode = UnityEngine.UIElements.PanelScaleMode.ScaleWithScreenSize;
            ps.referenceResolution = new Vector2Int(1920, 1080);
            ps.screenMatchMode = UnityEngine.UIElements.PanelScreenMatchMode.MatchWidthOrHeight;
            ps.match = 0.5f;
            EditorUtility.SetDirty(ps); AssetDatabase.SaveAssets();
            return ps;
        }

        /// <summary>Skybox/Panoramic material asset (lat-long HDRI). Saved as an asset so the shader is kept in player builds.</summary>
        static Material SkyMaterial()
        {
            string path = SettingsDir + "/Sky_Panoramic.mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!m) { m = new Material(Shader.Find("Skybox/Panoramic")); AssetDatabase.CreateAsset(m, path); }
            m.SetFloat("_Mapping", 1f);       // latitude-longitude layout
            m.SetFloat("_ImageType", 0f);     // 360 degrees
            m.SetFloat("_Exposure", SpecialSoldier.Core.SkyPresets.Day.HdriExposure);
            var day = Resources.Load<Texture>("Sky/sky_day");
            if (day) m.SetTexture("_MainTex", day);
            EditorUtility.SetDirty(m);
            Debug.Log($"[Slice] sky material: {(day ? "HDRI sky_day" : "no HDRI found in Resources/Sky (run Tools~/fetch-hdris.mjs)")}");
            return m;
        }

        /// <summary>Adds URP's Screen Space Ambient Occlusion feature to the slice renderer once. Found by name through
        /// reflection so a URP version that renames or hides the class only skips SSAO instead of breaking the build.</summary>
        static void EnsureSsao()
        {
            var data = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(SettingsDir + "/URP_Renderer.asset");
            if (!data) { Debug.LogWarning("[Slice] SSAO skipped: renderer data not at " + SettingsDir + "/URP_Renderer.asset"); return; }
            foreach (var f in data.rendererFeatures) if (f && f.GetType().Name == "ScreenSpaceAmbientOcclusion") return;
            var type = typeof(UniversalRendererData).Assembly.GetType("UnityEngine.Rendering.Universal.ScreenSpaceAmbientOcclusion");
            if (type == null) { Debug.LogWarning("[Slice] SSAO skipped: feature type not found in this URP"); return; }
            var feature = (ScriptableRendererFeature)ScriptableObject.CreateInstance(type);
            feature.name = "SSAO";
            AssetDatabase.AddObjectToAsset(feature, data);
            data.rendererFeatures.Add(feature);
            EditorUtility.SetDirty(data); AssetDatabase.SaveAssets();
            Debug.Log("[Slice] SSAO renderer feature added");
        }

        static Material Mat(string name, Color c, float roughness)
        {
            Directory.CreateDirectory(SettingsDir + "/Materials");
            string path = $"{SettingsDir}/Materials/{name}.mat";
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            var shader = Shader.Find(GraphicsSettings.defaultRenderPipeline ? "Universal Render Pipeline/Lit" : "Standard");
            if (!m) { m = new Material(shader); AssetDatabase.CreateAsset(m, path); }
            m.shader = shader;
            m.SetColor(GraphicsSettings.defaultRenderPipeline ? "_BaseColor" : "_Color", c);
            m.SetFloat("_Smoothness", 1f - roughness); m.SetFloat("_Glossiness", 1f - roughness);
            EditorUtility.SetDirty(m);
            return m;
        }

        /// <summary>Creates and assigns a URP asset when the project still uses the built-in pipeline.</summary>
        static void EnsureUrp()
        {
            if (GraphicsSettings.defaultRenderPipeline) return;
            Directory.CreateDirectory(SettingsDir);
            var data = ScriptableObject.CreateInstance<UniversalRendererData>();
            AssetDatabase.CreateAsset(data, SettingsDir + "/URP_Renderer.asset");
            var asset = UniversalRenderPipelineAsset.Create(data);
            asset.shadowDistance = 120f; asset.msaaSampleCount = 4;
            AssetDatabase.CreateAsset(asset, SettingsDir + "/URP_Pipeline.asset");
            GraphicsSettings.defaultRenderPipeline = asset;
            QualitySettings.renderPipeline = asset;
            AssetDatabase.SaveAssets();
            Debug.Log("[Slice] created and assigned URP pipeline asset");
        }
    }
}

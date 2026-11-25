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
            if (!BuildScene()) { EditorApplication.Exit(10); return; }
            var opts = new BuildPlayerOptions { scenes = new[] { ScenePath }, locationPathName = "Builds/Slice/IslandSlice.exe", target = BuildTarget.StandaloneWindows64 };
            var report = BuildPipeline.BuildPlayer(opts);
            Debug.Log($"[Slice] player build {report.summary.result}, {report.summary.totalSize / 1024} kB, errors {report.summary.totalErrors}");
            EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 11);
        }

        /// <summary>Browser build for the BIT PARK portal: Builds/WebGL/index.html (static files, no server code).
        /// Gzip + decompression fallback so it also runs on hosts that do not send Content-Encoding headers.</summary>
        public static void BuildWebGL()
        {
            if (!System.IO.File.Exists(ScenePath) && !BuildScene()) { EditorApplication.Exit(12); return; }
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.productName = "SPECIAL SOLDIER - Island Slice";
            var opts = new BuildPlayerOptions { scenes = new[] { ScenePath }, locationPathName = "Builds/WebGL", target = BuildTarget.WebGL };
            var report = BuildPipeline.BuildPlayer(opts);
            Debug.Log($"[Slice] webgl build {report.summary.result}, {report.summary.totalSize / 1024} kB, errors {report.summary.totalErrors} -> Builds/WebGL/index.html");
            EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 13);
        }

        public static bool BuildScene()
        {
            EnsureUrp();
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var rng = new System.Random(7);   // fixed seed: the same level every build

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
            skyDir.sun = sun; skyDir.volume = post; skyDir.skyMaterial = skyMat; skyDir.startPreset = "day";
            EnsureSsao();

            var level = new GameObject("Level");
            var sand = Mat("Sand", new Color(0.62f, 0.55f, 0.42f), 0.9f);
            var concrete = Mat("Concrete", new Color(0.55f, 0.55f, 0.53f), 0.85f);
            var crate = Mat("Crate", new Color(0.42f, 0.33f, 0.2f), 0.8f);
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground"; ground.transform.SetParent(level.transform); ground.transform.localScale = new Vector3(16f, 1f, 16f);
            ground.GetComponent<Renderer>().sharedMaterial = sand;

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
            var surface = level.AddComponent<NavMeshSurface>();
            surface.collectObjects = CollectObjects.Children;
            surface.BuildNavMesh();
            // Save the baked data as an asset: an in-memory NavMeshData only survives builds made in this same Editor
            // process (the Windows build), so a later WebGL build in a fresh process had no navmesh ("no valid NavMesh").
            if (surface.navMeshData != null)
            {
                const string navPath = "Assets/Scenes/IslandSlice_NavMesh.asset";
                AssetDatabase.DeleteAsset(navPath);
                AssetDatabase.CreateAsset(surface.navMeshData, navPath);
            }
            Debug.Log($"[Slice] navmesh built: {(surface.navMeshData != null ? "ok, saved " + AssetDatabase.GetAssetPath(surface.navMeshData) : "MISSING")}");

            var player = BuildPlayer(new Vector3(0f, 0.1f, -40f));
            var visual = LoadSoldierVisual();
            Debug.Log($"[Slice] soldier visual: {(visual ? "Blender GLB 'Soldier' node" : "capsule fallback (run StudioBootstrap.ImportAndBuild first)")}");
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

            var director = new GameObject("GameDirector").AddComponent<GameDirector>();
            director.player = player.GetComponent<PlayerMotor>();
            director.missionMode = GameDirector.MissionMode.IslandSlice;
            director.intelTerminal = terminal.transform; director.extraction = extraction.transform;
            // UI Toolkit HUD (compass, minimap, waypoint, damage arcs, kill feed); the IMGUI Hud stays in the project as a fallback
            var uiDoc = director.gameObject.AddComponent<UnityEngine.UIElements.UIDocument>();
            uiDoc.panelSettings = HudPanelSettings();
            var hud = director.gameObject.AddComponent<HudToolkit>();
            hud.player = director.player; hud.weapon = player.GetComponentInChildren<WeaponController>();
            hud.style = AssetDatabase.LoadAssetAtPath<UnityEngine.UIElements.StyleSheet>("Assets/UI/SliceHud.uss");
            Debug.Log($"[Slice] HUD: UI Toolkit (panel {(uiDoc.panelSettings ? "ok" : "MISSING")}, style {(hud.style ? "ok" : "MISSING Assets/UI/SliceHud.uss")}, theme {(uiDoc.panelSettings && uiDoc.panelSettings.themeStyleSheet ? "ok" : "MISSING")})");

            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
            bool saved = EditorSceneManager.SaveScene(scene, ScenePath);
            var list = EditorBuildSettings.scenes.Where(s => s.path != ScenePath).ToList();
            list.Insert(0, new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = list.ToArray();
            Debug.Log($"[Slice] scene {(saved ? "saved" : "NOT saved")}: {ScenePath}, {enemies.Length} enemies, pipeline {(GraphicsSettings.defaultRenderPipeline ? GraphicsSettings.defaultRenderPipeline.name : "built-in")}");
            return saved;
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
            return go;
        }

        static void BuildEnemy(GameObject parent, int i, string type, Vector3 pos, Vector3[] patrol, bool hold, GameObject visual, Vector3 face)
        {
            var go = new GameObject($"Enemy{i}_{type}");
            go.transform.SetParent(parent.transform); go.transform.position = pos;
            Vector3 look = face - pos; look.y = 0f; go.transform.rotation = Quaternion.LookRotation(look.sqrMagnitude > 0.01f ? look : Vector3.forward);
            var body = go.AddComponent<CapsuleCollider>(); body.height = 1.8f; body.radius = 0.35f; body.center = new Vector3(0f, 0.9f, 0f);
            go.AddComponent<HitZone>().part = BodyPart.Torso;
            var head = new GameObject("HeadHit"); head.transform.SetParent(go.transform, false); head.transform.localPosition = new Vector3(0f, 1.68f, 0f);
            head.AddComponent<SphereCollider>().radius = 0.14f; head.AddComponent<HitZone>().part = BodyPart.Head;
            // the capsule covers the head too: shrink it so head shots reach the sphere first
            body.height = 1.5f; body.center = new Vector3(0f, 0.75f, 0f);
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
                v.transform.localPosition = Vector3.zero; v.transform.localRotation = Quaternion.identity;
                foreach (var c in v.GetComponentsInChildren<Collider>()) Object.DestroyImmediate(c);
            }
            else
            {
                var cap = GameObject.CreatePrimitive(PrimitiveType.Capsule); Object.DestroyImmediate(cap.GetComponent<Collider>());
                cap.name = "Visual"; cap.transform.SetParent(go.transform, false); cap.transform.localPosition = new Vector3(0f, 0.9f, 0f); cap.transform.localScale = new Vector3(0.7f, 0.9f, 0.7f);
                cap.GetComponent<Renderer>().sharedMaterial = Mat("Enemy_" + type, type == "heavy" ? new Color(0.25f, 0.27f, 0.22f) : new Color(0.4f, 0.38f, 0.3f), 0.7f);
            }
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

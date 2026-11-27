using System.IO;
using SurvivalWorld.Runtime;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace SurvivalWorld.EditorTools
{
    /// <summary>
    /// Builds Assets/Survival/SurvivalIsland.unity: copies the Blender export (apps/game-lab/survival-world/assets/survival.glb,
    /// made by blender/build_assets.py) into Assets/Survival/Models, imports it with glTFast and wires its models into a
    /// <see cref="SurvivalDirector"/>. The island itself is generated at play time from the shared rules (SurvivalRules).
    /// Batch: -executeMethod SurvivalWorld.EditorTools.SurvivalSceneBuilder.BuildSceneBatch  (or .BuildWebGL → Builds/SurvivalWebGL)
    /// </summary>
    public static class SurvivalSceneBuilder
    {
        const string Dir = "Assets/Survival", ModelPath = Dir + "/Models/survival.glb", ScenePath = Dir + "/SurvivalIsland.unity";
        static string SourceGlb => Path.GetFullPath(Path.Combine(Application.dataPath, "../../game-lab/survival-world/assets/survival.glb"));

        [MenuItem("Survival World/Build Island Scene")]
        public static void BuildSceneMenu() => BuildScene();
        public static void BuildSceneBatch() => EditorApplication.Exit(BuildScene() ? 0 : 12);

        public static bool BuildScene()
        {
            if (!CopyModel()) return false;
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(ModelPath);
            if (!model) { Debug.LogError("[Survival] glTFast did not import " + ModelPath + " (is com.unity.cloud.gltfast installed?)"); return false; }

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cam = new GameObject("Main Camera") { tag = "MainCamera" }.AddComponent<Camera>();
            cam.gameObject.AddComponent<AudioListener>();
            var sun = new GameObject("Sun").AddComponent<Light>(); sun.type = LightType.Directional; sun.shadows = LightShadows.Soft; sun.color = new Color(1f, 0.96f, 0.88f);
            sun.transform.rotation = Quaternion.Euler(50, 30, 0);

            var director = new GameObject("SurvivalDirector").AddComponent<SurvivalDirector>();
            director.sun = sun;
            director.hudFont = AssetDatabase.LoadAssetAtPath<Font>(Dir + "/Fonts/NotoSansKR-Survival.ttf");
            if (!director.hudFont) Debug.LogWarning("[Survival] Korean HUD font missing — run Tools~/gen-survival-font.py");
            var templates = (GameObject)PrefabUtility.InstantiatePrefab(model);
            templates.name = "Templates (Blender models)"; templates.transform.SetParent(director.transform, false);
            director.tree = Child(templates, "Tree"); director.treeTall = Child(templates, "TreeTall"); director.rock = Child(templates, "Rock");
            director.bush = Child(templates, "Bush"); director.wolf = Child(templates, "Wolf"); director.campfire = Child(templates, "Campfire"); director.wall = Child(templates, "Wall");
            templates.SetActive(false);   // copies are made at play time; the lineup itself stays hidden
            director.groundMaterial = Mat("Ground", Color.white, 0.95f, false);
            director.seaMaterial = Mat("Sea", new Color(0.17f, 0.44f, 0.55f), 0.2f, false);
            director.ghostOk = Mat("GhostOk", new Color(0.56f, 0.88f, 0.54f), 1f, true);
            director.ghostBad = Mat("GhostBad", new Color(0.88f, 0.54f, 0.54f), 1f, true);

            bool missing = !director.tree || !director.rock || !director.bush || !director.wolf || !director.campfire || !director.wall;
            if (missing) Debug.LogWarning("[Survival] some models were not found in the GLB — check the node names in blender/build_assets.py");
            Directory.CreateDirectory(Dir);
            bool saved = EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"[Survival] scene {(saved ? "saved" : "NOT saved")}: {ScenePath} (models {(missing ? "incomplete" : "all 7")})");
            return saved && !missing;
        }

        static bool CopyModel()
        {
            Directory.CreateDirectory(Dir + "/Models");
            if (!File.Exists(SourceGlb)) { Debug.LogError("[Survival] missing " + SourceGlb + " — run blender/build_assets.py (npm run assets) first"); return false; }
            bool changed = !File.Exists(ModelPath) || !System.Linq.Enumerable.SequenceEqual(File.ReadAllBytes(ModelPath), File.ReadAllBytes(SourceGlb));
            if (changed) { File.Copy(SourceGlb, ModelPath, true); AssetDatabase.ImportAsset(ModelPath, ImportAssetOptions.ForceUpdate); }
            return true;
        }

        static GameObject Child(GameObject root, string name)
        {
            foreach (var t in root.GetComponentsInChildren<Transform>(true)) if (t.name == name) return t.gameObject;
            return null;
        }

        static Material Mat(string name, Color c, float roughness, bool unlit)
        {
            Directory.CreateDirectory(Dir + "/Materials");
            string path = $"{Dir}/Materials/{name}.mat";
            bool urp = GraphicsSettings.defaultRenderPipeline;
            var shader = Shader.Find(urp ? (unlit ? "Universal Render Pipeline/Unlit" : "Universal Render Pipeline/Lit") : (unlit ? "Unlit/Color" : "Standard"));
            var m = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!m) { m = new Material(shader); AssetDatabase.CreateAsset(m, path); }
            m.shader = shader;
            m.SetColor(urp ? "_BaseColor" : "_Color", c);
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", 1f - roughness);
            if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", 1f - roughness);
            EditorUtility.SetDirty(m); AssetDatabase.SaveAssets();
            return m;
        }

        /// <summary>A browser build of this scene alone: Builds/SurvivalWebGL/index.html. Leaves the project's build list and product name as they were.</summary>
        public static void BuildWebGL()
        {
            if (!File.Exists(ScenePath) && !BuildScene()) { EditorApplication.Exit(12); return; }
            string product = PlayerSettings.productName;
            PlayerSettings.productName = "SURVIVAL WORLD";
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions { scenes = new[] { ScenePath }, locationPathName = "Builds/SurvivalWebGL", target = BuildTarget.WebGL });
            PlayerSettings.productName = product;
            Debug.Log($"[Survival] webgl build {report.summary.result}, {report.summary.totalSize / 1024} kB, errors {report.summary.totalErrors} -> Builds/SurvivalWebGL/index.html");
            EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 13);
        }
    }
}

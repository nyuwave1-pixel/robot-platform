// Batch-mode entry points for the Unity studio project (Unity 6000.6.9f1).
//   Unity.exe -batchmode -projectPath apps/unity-studio -executeMethod StudioBootstrap.AddPackages -quit -logFile -
//   Unity.exe -batchmode -projectPath apps/unity-studio -executeMethod StudioBootstrap.ImportAndBuild -quit -logFile -
// AddPackages: installs URP + glTFast through the Package Manager (versions resolved by the editor, not guessed).
// ImportAndBuild: copies the shared Blender GLB from apps/special-soldier, lets glTFast import it, builds a test scene
// that lists the imported nodes the web game relies on, and makes one Windows build. Every step logs "[Studio]" lines.
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.PackageManager;
using UnityEditor.SceneManagement;
using UnityEngine;

public static class StudioBootstrap
{
    const string GlbSource = "../special-soldier/src/assets/assets.glb";
    const string GlbTarget = "Assets/Imported/special_soldier_assets.glb";
    const string ScenePath = "Assets/Scenes/SoldierImportTest.unity";

    public static void AddPackages()
    {
        foreach (var id in new[] { "com.unity.render-pipelines.universal", "com.unity.cloud.gltfast" })
        {
            var req = Client.Add(id);
            while (!req.IsCompleted) System.Threading.Thread.Sleep(200);
            if (req.Status == StatusCode.Success) Debug.Log($"[Studio] package {req.Result.name} {req.Result.version}");
            else { Debug.LogError($"[Studio] package {id} failed: {req.Error?.message}"); EditorApplication.Exit(2); }
        }
    }

    public static void ImportAndBuild()
    {
        var src = Path.GetFullPath(Path.Combine(Application.dataPath, "..", GlbSource));
        if (!File.Exists(src)) { Debug.LogError("[Studio] GLB not found: " + src); EditorApplication.Exit(3); return; }
        Directory.CreateDirectory(Path.GetDirectoryName(GlbTarget));
        File.Copy(src, GlbTarget, true);
        AssetDatabase.ImportAsset(GlbTarget, ImportAssetOptions.ForceUpdate);
        var root = AssetDatabase.LoadAssetAtPath<GameObject>(GlbTarget);
        if (root == null) { Debug.LogError("[Studio] glTFast did not produce a prefab for " + GlbTarget); EditorApplication.Exit(4); return; }

        var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
        var inst = (GameObject)PrefabUtility.InstantiatePrefab(root);
        var names = inst.GetComponentsInChildren<Transform>(true).Select(t => t.name).ToList();
        int tris = inst.GetComponentsInChildren<MeshFilter>(true).Where(m => m.sharedMesh).Sum(m => m.sharedMesh.triangles.Length / 3);
        foreach (var need in new[] { "Soldier", "W_m4", "W_bullpup", "W_revolver", "Heli", "APC" })
            Debug.Log($"[Studio] node {need}: {(names.Any(n => n == need) ? "found" : "MISSING")}");
        Debug.Log($"[Studio] imported {names.Count} nodes, {tris} triangles");

        Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
        EditorSceneManager.SaveScene(scene, ScenePath);
        var opts = new BuildPlayerOptions { scenes = new[] { ScenePath }, locationPathName = "Builds/Windows/UnityStudio.exe", target = BuildTarget.StandaloneWindows64 };
        var report = BuildPipeline.BuildPlayer(opts);
        Debug.Log($"[Studio] build {report.summary.result}, {report.summary.totalSize / 1024} kB, {report.summary.totalTime.TotalSeconds:F0} s");
        EditorApplication.Exit(report.summary.result == BuildResult.Succeeded ? 0 : 5);
    }
}

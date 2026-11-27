using System.Collections;
using NUnit.Framework;
using SurvivalWorld.Core;
using SurvivalWorld.Runtime;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>SURVIVAL WORLD Unity edition: the built scene draws every live resource node with a Blender model,
    /// gathering hides a node, a placed campfire appears, and wolves that the rules spawn at night get a view.</summary>
    public sealed class SurvivalPlayTests
    {
        const string Scene = "Assets/Survival/SurvivalIsland.unity";

        [UnityTest]
        public IEnumerator Island_Nodes_Fire_Wolves()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(Scene)) Assert.Ignore("SurvivalIsland scene not built yet (Survival World/Build Island Scene)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(Scene, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("SurvivalIsland");
#endif
            yield return null; yield return null;
            var d = Object.FindAnyObjectByType<SurvivalDirector>();
            Assert.IsNotNull(d); Assert.IsNotNull(d.tree, "Blender tree model wired"); Assert.IsNotNull(d.wolf, "Blender wolf model wired");
            var G = d.G; Assert.IsNotNull(G);
            Assert.AreEqual(G.Nodes.Count, d.ActiveNodeViews, "one view per live node");

            // break the nearest bush/tree/rock by walking up to it
            var n = G.Nodes[0]; G.P.X = n.X + 1; G.P.Z = n.Z;
            for (int i = 0; i < 8 && n.Hp > 0; i++) SurvivalRules.Gather(G, n);
            yield return null;
            Assert.AreEqual(G.Nodes.Count - 1, d.ActiveNodeViews, "a broken node is hidden");

            // a campfire placed by the rules shows up
            G.P.X = G.SpawnX; G.P.Z = G.SpawnZ; G.Inv["campfire"] = 1;
            bool placed = false;
            for (int dx = 2; dx <= 12 && !placed; dx += 2) placed = SurvivalRules.Place(G, "campfire", G.P.X + dx, G.P.Z);
            Assert.IsTrue(placed, "found a spot for a campfire near spawn");
            yield return null;
            Assert.AreEqual(1, d.StructureViews);

            // night far from the fire: wolves spawn in the rules and get a model
            G.P.X = G.SpawnX - 30; G.P.Z = G.SpawnZ; G.Time = SurvivalRules.Day * 0.85;
            for (int i = 0; i < 600 && G.Wolves.Count == 0; i++) SurvivalRules.Step(G, 0.25);
            Assume.That(G.Wolves.Count, Is.GreaterThan(0), "no wolf spawned in 150 s of night (random)");
            yield return null;
            Assert.AreEqual(G.Wolves.Count, d.WolfViews);
        }

        /// <summary>PC check (2026-11-27, no mouse look in the browser): the ground faces up, and a running wolf's head
        /// (Blender node "head", in front of "tail") leads in the direction it moves.</summary>
        [UnityTest]
        public IEnumerator Ground_FacesUp_Wolf_HeadLeads()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(Scene)) Assert.Ignore("SurvivalIsland scene not built yet (Survival World/Build Island Scene)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(Scene, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("SurvivalIsland");
#endif
            yield return null; yield return null;
            var d = Object.FindAnyObjectByType<SurvivalDirector>(); var G = d.G;

            var ground = GameObject.Find("Ground").GetComponent<MeshFilter>().sharedMesh;
            float up = 0f; foreach (var nrm in ground.normals) up += nrm.y;
            Assert.That(up / ground.normals.Length, Is.GreaterThan(0.8f), "terrain normals point up (triangle winding)");

            G.P.X = G.SpawnX - 30; G.P.Z = G.SpawnZ; G.Time = SurvivalRules.Day * 0.85;
            for (int i = 0; i < 600 && G.Wolves.Count == 0; i++) SurvivalRules.Step(G, 0.25);
            Assume.That(G.Wolves.Count, Is.GreaterThan(0), "no wolf spawned (random)");
            var w = G.Wolves[0];
            Vector3 start = SurvivalTerrain.ToWorld(d.seed, w.X, w.Z);
            for (int i = 0; i < 90 && G.Wolves.Contains(w); i++) { SurvivalRules.Step(G, 0.03); yield return null; }   // it runs at the player
            Assume.That(G.Wolves.Contains(w), "the wolf left the game");
            var go = GameObject.Find("wolf" + w.Id);
            Assert.IsNotNull(go, "wolf view");
            Vector3 moved = go.transform.position - start; moved.y = 0;
            Assume.That(moved.magnitude, Is.GreaterThan(0.5f), "the wolf did not move");
            Transform head = null, tail = null;
            foreach (var t in go.GetComponentsInChildren<Transform>(true)) { if (t.name == "head") head = t; if (t.name == "tail") tail = t; }
            Assert.IsTrue(head && tail, "Blender wolf has head / tail pivots");
            Vector3 nose = head.position - tail.position; nose.y = 0;
            float dot = Vector3.Dot(nose.normalized, moved.normalized);
            Debug.Log($"[Survival] wolf moved {moved.magnitude:F1} m, head·move = {dot:F2}");
            Assert.That(dot, Is.GreaterThan(0.7f), $"the wolf runs head first (head·move {dot:F2}; −1 = backward → LookRotation(-face))");
        }
    }
}

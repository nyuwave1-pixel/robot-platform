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
    }
}

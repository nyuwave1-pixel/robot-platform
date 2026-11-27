using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>The island's vegetation is GPU-instanced (no merged per-cell meshes): every plant of the web layout is there and
    /// the cells near the camera draw.</summary>
    public sealed class VegetationTests
    {
        [UnityTest]
        public IEnumerator VegetationIsInstanced_AllPlantsPresent_NearCellsDraw()
        {
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/IslandSlice.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("IslandSlice");
#endif
            yield return null; yield return null; yield return null;
            var veg = Object.FindAnyObjectByType<InstancedVegetation>();
            if (!veg) Assert.Ignore("no vegetation (GLB not imported)");
            var web = Core.IslandVegetation.Build();
            Assert.AreEqual(web.Trunks.Count + web.Palms.Count + web.Rocks.Count, veg.TotalPlants, "same plants as the web island");
            Assert.AreEqual(0, veg.GetComponentsInChildren<MeshFilter>().Length, "no merged meshes left");
            Assert.That(veg.DrawnLastFrame, Is.GreaterThan(0), "trees beyond the arena walls are drawn");
            foreach (var m in veg.models) foreach (var p in m.parts) Assert.IsTrue(p.material.enableInstancing, p.material.name);
        }
    }
}

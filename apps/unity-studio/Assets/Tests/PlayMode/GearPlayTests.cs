using System.Collections;
using NUnit.Framework;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>Tactical equipment in the Island Slice (everything unlocked outside the campaign): vision modes, med kit, drone.</summary>
    public sealed class GearPlayTests
    {
        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/IslandSlice.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("IslandSlice");
#endif
            yield return null; yield return null;
        }

        [UnityTest]
        public IEnumerator VisionMedkitAndDrone()
        {
            yield return Load();
            var g = GearController.Instance; Assert.NotNull(g, "GearController on the player");
            g.Use("nvg"); Assert.AreEqual(Vision.Night, g.Vision);
            g.Use("thermal"); Assert.AreEqual(Vision.Thermal, g.Vision);
            g.Use("thermal"); Assert.AreEqual(Vision.Off, g.Vision);

            var hp = g.motor.GetComponent<Damageable>(); hp.Configure(100f, 0f, 0.6f); hp.ApplyDamage(50f, Vector3.zero);
            Assert.IsTrue(g.Heal()); Assert.AreEqual(100f, hp.Model.Health, 0.01f, "+65, capped at 100"); Assert.AreEqual(1, g.Medkits);

            g.Use("drone"); Assert.IsTrue(g.DroneActive); Assert.IsFalse(g.view.enabled, "the drone camera takes over"); Assert.IsFalse(g.motor.enabled);
            for (int i = 0; i < 10; i++) yield return null;
            g.Use("drone"); Assert.IsFalse(g.DroneActive); Assert.IsTrue(g.view.enabled); Assert.IsTrue(g.motor.enabled);
            StringAssert.Contains("[B] RECON DRONE", g.StatusLine);
        }
    }
}

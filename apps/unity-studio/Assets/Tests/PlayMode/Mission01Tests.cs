using System.Collections;
using System.Linq;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>MISSION 01 SILENT LANDING (web missions.js, Core.Campaign.M01) built by SliceBuilder.BuildCampaignScene:
    /// nine beach sentries on the navmesh, the QRF waits switched off, and the first alarm brings it in exactly once.</summary>
    public sealed class Mission01Tests
    {
        const string ScenePath = "Assets/Scenes/Mission01.unity";

        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(ScenePath)) Assert.Ignore("Mission01 scene not built yet (run-batch.ps1 slice step)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission01");
#endif
            yield return null; yield return null;
            Assert.NotNull(GameDirector.Instance, "GameDirector missing from Mission01");
        }

        [UnityTest]
        public IEnumerator Boots_NineBeachSentriesOnNavMesh_QrfInactive()
        {
            yield return Load();
            var d = GameDirector.Instance;
            Assert.AreEqual(GameDirector.MissionMode.Campaign, d.missionMode);
            Assert.AreEqual("MISSION 01", d.Mission.Code);
            Assert.AreEqual(9, d.enemies.Count, "beach sentries");
            Assert.IsTrue(d.enemies.All(e => e.group == "beach"));
            foreach (var e in d.enemies) Assert.IsTrue(e.GetComponent<NavMeshAgent>().isOnNavMesh, $"{e.name} is not on the navmesh");
            Assert.AreEqual(3, d.alarmWave.Length, "QRF");
            Assert.IsTrue(d.alarmWave.All(g => !g.activeSelf), "the QRF waits until the alarm");
            StringAssert.Contains("Eliminate the beach sentries", d.ObjectiveLine);
            Assert.NotNull(SkyDirector.Instance, "sky");
            Assert.AreEqual("night", SkyDirector.Instance.Target.Id, "the mission's night sky beats the saved weather");
        }

        [UnityTest]
        public IEnumerator FirstAlarm_BringsTheQrf_CountsOnce()
        {
            yield return Load();
            var d = GameDirector.Instance;
            Assert.IsTrue(d.Mission.RaiseAlarm());
            Assert.IsFalse(d.Mission.RaiseAlarm(), "a second call-in is not another alarm");
            yield return null;
            Assert.AreEqual(1, d.Mission.Stats.Alarms);
            Assert.IsTrue(d.alarmWave.All(g => g.activeSelf), "QRF switched on");
            Assert.AreEqual(12, d.enemies.Count, "the QRF joins the director's enemy list");
            StringAssert.Contains("QRF", d.RadioLine);
            Assert.AreEqual(9, d.Alive("beach"), "the QRF does not count toward the beach objective");
        }
    }
}

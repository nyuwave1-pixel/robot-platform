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
    /// <summary>MISSION 02 DEEP JUNGLE (web missions.js, Core.Campaign.M02): patrols, the comms relay and its sniper tower, the
    /// counter-attack waiting switched off, the mast falling on "detonate", and a power cut halving the counter-attack.</summary>
    public sealed class Mission02Tests
    {
        const string ScenePath = "Assets/Scenes/Mission02.unity";

        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(ScenePath)) Assert.Ignore("Mission02 scene not built yet (run-batch.ps1 slice step)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission02");
#endif
            yield return null; yield return null;
            Assert.NotNull(GameDirector.Instance, "GameDirector missing from Mission02");
        }

        [UnityTest]
        public IEnumerator Boots_PatrolsAndRelay_CounterAttackWaits()
        {
            yield return Load();
            var d = GameDirector.Instance;
            Assert.AreEqual("MISSION 02", d.Mission.Code);
            Assert.AreEqual(17, d.enemies.Count, "patrols + relay garrison + generator guards");
            foreach (var e in d.enemies) Assert.IsTrue(e.GetComponent<NavMeshAgent>().isOnNavMesh, $"{e.name} is not on the navmesh");
            Assert.AreEqual(5, d.waves.Single(w => w.name == "reinf").members.Length);
            Assert.IsTrue(d.waves.SelectMany(w => w.members).All(g => !g.activeSelf), "counter-attack waits");
            Assert.NotNull(d.relayMast, "relay mast");
            var towerSniper = d.enemies.Single(e => e.typeId == "sniper" && e.group == "comms");
            var t = Terrain.activeTerrain;
            Assert.That(towerSniper.transform.position.y - (t.SampleHeight(towerSniper.transform.position) + t.transform.position.y), Is.GreaterThan(5f), "relay sniper on the tower");
            StringAssert.Contains("Infiltrate through the jungle", d.ObjectiveLine);
            Assert.AreEqual("dawn", SkyDirector.Instance.Target.Id);
        }

        [UnityTest]
        public IEnumerator Detonation_ToppleTheMast_PowerCutSendsThree()
        {
            yield return Load();
            var d = GameDirector.Instance;
            var up = d.relayMast.up;
            d.Mission.Raise("detonate");
            for (float s = 0; s < 3.2f; s += Time.deltaTime) yield return null;
            Assert.IsTrue(d.Detonated);
            Assert.That(Vector3.Angle(up, d.relayMast.up), Is.GreaterThan(60f), "the mast fell");
            d.Mission.Flags.Add("powerCut");
            int before = d.enemies.Count;
            d.Mission.Objectives[4].OnStart(d.Mission);
            yield return null;
            Assert.AreEqual(before + 3, d.enemies.Count, "power cut: one squad of three");
            StringAssert.Contains("Only one squad", d.RadioLine);
        }
    }
}

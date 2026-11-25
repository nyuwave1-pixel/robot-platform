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
    /// <summary>MISSION 05 LAST EXTRACTION (web missions.js, Core.Campaign.M05): VIPER and his guard on the runway, phase 2 at half
    /// health, the LZ waves, the helicopter landing and boarding.</summary>
    public sealed class Mission05Tests
    {
        const string ScenePath = "Assets/Scenes/Mission05.unity";

        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(ScenePath)) Assert.Ignore("Mission05 scene not built yet (run-batch.ps1 slice step)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission05");
#endif
            yield return null; yield return null;
            Assert.NotNull(GameDirector.Instance, "GameDirector missing from Mission05");
        }

        [UnityTest]
        public IEnumerator Boots_ViperOnTheRunway_SniperOnTheContainer()
        {
            yield return Load();
            var d = GameDirector.Instance;
            Assert.AreEqual("MISSION 05", d.Mission.Code);
            Assert.AreEqual(11, d.enemies.Count);
            var viper = d.enemies.Single(e => e.typeId == "boss");
            Assert.AreEqual(950f, viper.GetComponent<Damageable>().Model.MaxHealth);
            foreach (var e in d.enemies.Where(e => e.typeId != "apc")) Assert.IsTrue(e.GetComponent<NavMeshAgent>().isOnNavMesh, $"{e.name} is not on the navmesh");
            Assert.NotNull(d.heli); Assert.IsFalse(d.heli.gameObject.activeSelf, "the helicopter is not here yet");
            Assert.AreEqual(21, d.waves.Single(w => w.name == "lz").members.Length);
            Assert.AreEqual("dusk", SkyDirector.Instance.Target.Id);
        }

        [UnityTest]
        public IEnumerator ViperPhase2_HeliLands_BoardingUnlocks()
        {
            yield return Load();
            var d = GameDirector.Instance; var viper = d.enemies.Single(e => e.typeId == "boss");
            int before = d.enemies.Count;
            viper.GetComponent<Damageable>().ApplyDamage(1200f, viper.transform.position + Vector3.forward * 5f, true);   // armour soaks half
            yield return null;
            Assert.IsTrue(viper.BossPhase2, "under half health"); Assert.AreEqual(5.2f, viper.Type.Speed);
            Assert.AreEqual(before + 4, d.enemies.Count, "four more onto the runway");
            StringAssert.Contains("VIPER", d.RadioLine);
            var board = d.Mission.Objectives[4];
            Assert.IsFalse(board.Enabled(d.Mission), "no boarding before the helicopter lands");
            d.Mission.Raise("heliArrive");
            for (float s = 0; s < 9f; s += Time.deltaTime) yield return null;
            Assert.IsTrue(d.HeliLanded); Assert.IsTrue(board.Enabled(d.Mission));
        }

        [UnityTest]
        public IEnumerator DoorGunner_LiftsOff_SendsPortWaves_Finishes()
        {
            yield return Load();
            var d = GameDirector.Instance;
            d.Mission.Raise("heliArrive");
            for (float s = 0; s < 9f; s += Time.deltaTime) yield return null;
            float padY = d.heli.position.y;
            d.Mission.Raise("gunner");
            Assert.NotNull(DoorGunner.Instance);
            for (float s = 0; s < 3f; s += Time.deltaTime) yield return null;
            Assert.That(d.heli.position.y, Is.GreaterThan(padY + 5f), "climbing out of the LZ");
            Assert.AreEqual(4, d.enemies.Count(e => e && e.Alive && e.group == "port"), "first port wave at 2 s");
            Assert.That(Vector3.Distance(d.player.transform.position, d.heli.position), Is.LessThan(5f), "you ride in the door");
            DoorGunner.Instance.T = 45.95f;
            for (int i = 0; i < 5; i++) yield return null;
            Assert.IsTrue(d.Mission.Flags.Contains("gunnerDone"));
            Assert.AreEqual(0, d.enemies.Count(e => e && e.group == "port"), "the port is clear");
        }
    }
}

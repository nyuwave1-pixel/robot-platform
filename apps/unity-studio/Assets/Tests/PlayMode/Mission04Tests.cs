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
    /// <summary>MISSION 04 UNDERGROUND ZERO (web missions.js, Core.Campaign.M04): the facility 60 m down, the cameras (shoot one
    /// out, get seen by the other), the security door, the sample and the uplink waves.</summary>
    public sealed class Mission04Tests
    {
        const string ScenePath = "Assets/Scenes/Mission04.unity";

        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(ScenePath)) Assert.Ignore("Mission04 scene not built yet (run-batch.ps1 slice step)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission04");
#endif
            yield return null; yield return null;
            Assert.NotNull(GameDirector.Instance, "GameDirector missing from Mission04");
        }

        [UnityTest]
        public IEnumerator Boots_Underground_OnTheNavMesh_CamerasDoorSample()
        {
            yield return Load();
            var d = GameDirector.Instance;
            Assert.AreEqual("MISSION 04", d.Mission.Code);
            Assert.AreEqual(11, d.enemies.Count);
            Assert.That(d.player.transform.position.y, Is.LessThan(-70f), "the player starts in the facility (FAC_Y −60 = world −76)");
            yield return null;
            Assert.That(d.player.transform.position.y, Is.GreaterThan(-77f), "standing on the floor slab, not falling");
            foreach (var e in d.enemies) Assert.IsTrue(e.GetComponent<NavMeshAgent>().isOnNavMesh, $"{e.name} is not on the navmesh");
            Assert.AreEqual(2, Object.FindObjectsByType<SecurityCamera>().Length);
            Assert.NotNull(d.securityDoor); Assert.NotNull(d.bioSample);
            Assert.AreEqual(8, d.waves.Single(w => w.name == "uplink").members.Length);
            StringAssert.Contains("Override the security door", d.ObjectiveLine);
        }

        [UnityTest]
        public IEnumerator ShotCameraIsBlind_DoorOpens_UplinkSendsPairs()
        {
            yield return Load();
            var d = GameDirector.Instance; var cams = Object.FindObjectsByType<SecurityCamera>();
            cams[0].GetComponent<Damageable>().ApplyDamage(20f, cams[0].transform.position + Vector3.down);
            Assert.IsTrue(cams[0].Model.Dead, "10 hp: one burst shoots it out");
            Vector3 shut = d.securityDoor.position;
            d.Mission.Raise("openDoor");
            for (float s = 0; s < 2f; s += Time.deltaTime) yield return null;
            Assert.That(d.securityDoor.position.y - shut.y, Is.EqualTo(4f).Within(0.05f), "the door slid 4 m up");
            int before = d.enemies.Count;
            var defend = d.Mission.Objectives[4];
            defend.OnStart(d.Mission); defend.OnTick(d.Mission, 2.1f);
            Assert.AreEqual(before + 2, d.enemies.Count, "first uplink wave: two soldiers");
            defend.OnTick(d.Mission, 11.1f);
            Assert.AreEqual(before + 4, d.enemies.Count, "the next pair 11 s later, from the same pool");
        }
    }
}

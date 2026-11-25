using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>MISSION 03 BLACK COBRA BASE (web missions.js, Core.Campaign.M03): the walled base in the storm, corner-tower
    /// snipers, the APC (turret, small arms barely scratch it), the motor-pool sabotage that destroys it, the intel QRF.</summary>
    public sealed class Mission03Tests
    {
        const string ScenePath = "Assets/Scenes/Mission03.unity";

        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists(ScenePath)) Assert.Ignore("Mission03 scene not built yet (run-batch.ps1 slice step)");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission03");
#endif
            yield return null; yield return null;
            Assert.NotNull(GameDirector.Instance, "GameDirector missing from Mission03");
        }

        static EnemyAgent Apc => GameDirector.Instance.enemies.Single(e => e.typeId == "apc");

        [UnityTest]
        public IEnumerator Boots_BaseGarrison_ApcWithTurret_SnipersOnTowers()
        {
            yield return Load();
            var d = GameDirector.Instance;
            Assert.AreEqual("MISSION 03", d.Mission.Code);
            Assert.AreEqual(18, d.enemies.Count, "base + armor + HQ");
            foreach (var e in d.enemies.Where(e => e.typeId != "apc")) Assert.IsTrue(e.GetComponent<NavMeshAgent>().isOnNavMesh, $"{e.name} is not on the navmesh");
            Assert.NotNull(Apc.turret, "APC turret");
            var t = Terrain.activeTerrain;
            foreach (var s in d.enemies.Where(e => e.typeId == "sniper"))
                Assert.That(s.transform.position.y - (t.SampleHeight(s.transform.position) + t.transform.position.y), Is.GreaterThan(5f), $"{s.name} on a corner tower");
            Assert.AreEqual("storm", SkyDirector.Instance.Target.Id);
            Assert.AreEqual(2, d.alarmWave.Length); Assert.AreEqual(5, d.waves.Single(w => w.name == "intel").members.Length);
        }

        [UnityTest]
        public IEnumerator SmallArmsScratchTheApc_SabotageDestroysIt()
        {
            yield return Load();
            var hp = Apc.GetComponent<Damageable>();
            float before = hp.Model.Health;
            hp.ApplyDamage(100f, Apc.transform.position + Vector3.forward * 10f, BodyPart.Torso, true);
            Assert.That(before - hp.Model.Health, Is.EqualTo(10f).Within(0.01f), "rifle fire: a tenth (web vehicle rule)");
            GameDirector.Instance.Mission.Raise("sabotage");
            for (float s = 0; s < 1f; s += Time.deltaTime) yield return null;
            Assert.IsFalse(Apc.Alive, "the fuel bowser blast takes the APC with it");
            Assert.That(Mathf.Abs(Mathf.DeltaAngle(Apc.transform.eulerAngles.x, 0f)), Is.LessThan(1f), "a wrecked APC does not tip over like a soldier");
        }
    }
}

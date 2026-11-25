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
    /// <summary>SQUAD 07 in Mission 01 (web squad.js, Core.Squad): three team-mates on the NavMesh that follow you, go weapons free on
    /// the first shot and take only 35 % from stray rounds.</summary>
    public sealed class SquadPlayTests
    {
        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        [UnityTest]
        public IEnumerator ThreeMates_Follow_WeaponsFree_StrayRounds()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists("Assets/Scenes/Mission01.unity")) Assert.Ignore("Mission01 scene not built yet");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/Mission01.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission01");
#endif
            for (int i = 0; i < 3; i++) yield return null;
            var mates = Object.FindObjectsByType<SquadMate>().OrderBy(m => m.index).ToArray();
            Assert.AreEqual(3, mates.Length); Assert.AreEqual("REAPER", mates[0].Name);
            foreach (var m in mates) Assert.IsTrue(m.GetComponent<NavMeshAgent>().isOnNavMesh, $"{m.Name} on the navmesh");

            var d = GameDirector.Instance; var p = d.player.transform; var cc = d.player.GetComponent<CharacterController>();
            Vector3 start = mates[2].transform.position;
            cc.enabled = false; p.position += p.forward * 14f; cc.enabled = true;   // walk 14 m up the beach
            for (float s = 0; s < 4f; s += Time.deltaTime) yield return null;
            Assert.That(Vector3.Distance(mates[2].transform.position, start), Is.GreaterThan(6f), "ATLAS followed");
            Assert.That(Vector3.Distance(mates[2].transform.position, p.position), Is.LessThan(12f), "and keeps formation behind you");

            Assert.IsFalse(d.SquadWeaponsFree);
            d.ReportNoise(p.position, 50f);
            Assert.IsTrue(d.SquadWeaponsFree, "the first shot: weapons free");

            var hp = mates[0].GetComponent<Damageable>(); float before = hp.Model.Health;
            hp.ApplyDamage(100f, p.position);
            Assert.That(before - hp.Model.Health, Is.EqualTo(35f).Within(0.01f), "stray rounds: 35 %");
        }
    }
}

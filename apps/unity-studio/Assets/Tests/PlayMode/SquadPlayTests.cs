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
            // the rear mate catches up over a few seconds (12.7 m after exactly 4 s on the PC, 2026-11-26): wait for it, ≤ 8 s
            for (float s = 0; s < 8f && Vector3.Distance(mates[2].transform.position, p.position) >= (mates[2].Fighting ? 14.5f : 12f); s += Time.deltaTime) yield return null;
            // engaged, ATLAS only closes to 14 m (≈ 6.4 m of travel after a 14 m move), so expect less travel then
            Assert.That(Vector3.Distance(mates[2].transform.position, start), Is.GreaterThan(mates[2].Fighting ? 4f : 6f), $"ATLAS followed (fighting={mates[2].Fighting})");
            // Core.Squad.FollowSpeed: a mate with a live target only moves once you are > 14 m away (web rule), otherwise > 1.6 m.
            // On the PC the night-beach sentries were already engaged, so ATLAS rightly held at ~12.8 m (2026-11-26).
            float keep = mates[2].Fighting ? 14.5f : 12f;
            Assert.That(Vector3.Distance(mates[2].transform.position, p.position), Is.LessThan(keep), $"and keeps formation behind you (fighting={mates[2].Fighting})");

            Assert.IsFalse(d.SquadWeaponsFree);
            d.ReportNoise(p.position, 50f);
            Assert.IsTrue(d.SquadWeaponsFree, "the first shot: weapons free");

            var hp = mates[0].GetComponent<Damageable>(); float before = hp.Model.Health;
            hp.ApplyDamage(100f, p.position);
            Assert.That(before - hp.Model.Health, Is.EqualTo(35f).Within(0.01f), "stray rounds: 35 %");
        }
    }
}

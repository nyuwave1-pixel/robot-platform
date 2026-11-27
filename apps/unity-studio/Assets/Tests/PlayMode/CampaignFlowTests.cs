using System.Collections;
using System.Linq;
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
    /// <summary>Campaign flow in the Unity edition: winning Mission 01 records progress (web save rules), unlocks Mission 02 and
    /// offers it as the next mission; the briefing never blocks tests.</summary>
    public sealed class CampaignFlowTests
    {
        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        [UnityTest]
        public IEnumerator WinningMission01_UnlocksMission02()
        {
#if UNITY_EDITOR
            if (!System.IO.File.Exists("Assets/Scenes/Mission01.unity")) Assert.Ignore("Mission01 scene not built yet");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/Mission01.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("Mission01");
#endif
            yield return null; yield return null;
            var d = GameDirector.Instance;
            Assert.IsFalse(BriefingScreen.IsOpen, "no briefing in tests"); Assert.AreEqual(1f, Time.timeScale);
            Assert.AreEqual(0, d.CampaignIndex); Assert.IsFalse(ProgressStore.Current.Unlocked(1));
            foreach (var e in d.enemies.ToArray()) e.GetComponent<Damageable>().ApplyDamage(1e6f, e.transform.position + Vector3.up, BodyPart.Head, true);
            yield return null;
            // walk onto the trail head (objective 2)
            var at = d.Mission.Current.At; var p = new Vector3(at.X, 0f, at.Z); var t = Terrain.activeTerrain; p.y = t.SampleHeight(p) + t.transform.position.y + 0.1f;
            var cc = d.player.GetComponent<CharacterController>(); cc.enabled = false; d.player.transform.position = p; cc.enabled = true;
            for (int i = 0; i < 5 && d.State == GameDirector.Outcome.Playing; i++) yield return null;
            Assert.AreEqual(GameDirector.Outcome.Won, d.State);
            Assert.IsTrue(d.FirstClear); Assert.AreEqual(1, ProgressStore.Current.Progress); Assert.IsTrue(ProgressStore.Current.Unlocked(1));
            Assert.IsNotNull(ProgressStore.Current.Best(0));
            if (Application.CanStreamedLevelBeLoaded("Mission02")) Assert.AreEqual("Mission02", d.NextScene);
        }
    }
}

using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>Esc pauses the slice, options apply live (volume, weather) and Esc resumes.</summary>
    public sealed class PauseMenuTests : InputTestFixture
    {
        Keyboard _kb;

        public override void Setup()
        {
            base.Setup();
            _kb = InputSystem.AddDevice<Keyboard>();
            SettingsStore.UseDefaultsForTests();
        }

        public override void TearDown() { GameDirector.AssumeCursorCaptured = false; Time.timeScale = 1f; AudioListener.pause = false; base.TearDown(); }

        static IEnumerator LoadSlice()
        {
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/IslandSlice.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("IslandSlice");
#endif
            yield return null; yield return null;
        }

        IEnumerator Tap(KeyControl key) { Press(key); yield return null; Release(key); yield return null; }

        [UnityTest]
        public IEnumerator Esc_Pauses_OptionsApplyLive_Esc_Resumes()
        {
            yield return LoadSlice();
            GameDirector.AssumeCursorCaptured = true;
            Assert.NotNull(PauseMenu.Instance, "PauseMenu missing from the slice");
            Assert.IsFalse(PauseMenu.IsOpen);

            yield return Tap(_kb.escapeKey);
            Assert.IsTrue(PauseMenu.IsOpen, "Esc should open the menu");
            Assert.AreEqual(0f, Time.timeScale, "game should be frozen");

            SettingsStore.Edit(s => { s.Volume = 0.2f; s.SkyId = "night"; });
            yield return null; yield return null;
            Assert.AreEqual(0.2f, AudioListener.volume, 1e-4, "master volume applies at once");
            Assert.AreEqual("night", SkyDirector.Instance.Target.Id, "weather choice applies at once");

            yield return Tap(_kb.escapeKey);
            Assert.IsFalse(PauseMenu.IsOpen);
            Assert.AreEqual(1f, Time.timeScale);
        }

        [UnityTest]
        public IEnumerator FovSettingReachesTheCamera()
        {
            yield return LoadSlice();
            SettingsStore.Edit(s => s.Fov = 95f);
            yield return new WaitForSeconds(1f);
            var cam = Camera.main;
            Assert.AreEqual(95f, cam.fieldOfView, 1.5f, "hip-fire FOV follows the setting");
        }
    }
}

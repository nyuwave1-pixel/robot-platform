using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UIElements;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>The two PC checks that needed mouse look in the browser (2026-11-27), done by turning the player in code:
    /// SQUAD 07 name tags show over a team-mate in front of you (HudToolkit.SquadTags), and the M03 storm sun casts soft,
    /// faint shadows (SkyDirector overcast rule — PC 2026-11-26 saw hard black tree shadows under the storm).</summary>
    public sealed class HudSquadTagStormTests
    {
        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load(string scene)
        {
#if UNITY_EDITOR
            string path = $"Assets/Scenes/{scene}.unity";
            if (!System.IO.File.Exists(path)) Assert.Ignore($"{scene} scene not built yet");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(path, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync(scene);
#endif
            for (int i = 0; i < 3; i++) yield return null;
        }

        [UnityTest]
        public IEnumerator SquadTag_ShowsOverAMateInFront_HiddenBehind()
        {
            yield return Load("Mission01");
            var mate = Object.FindObjectsByType<SquadMate>().OrderBy(m => m.index).FirstOrDefault();
            if (!mate) Assert.Ignore("Mission01 has no squad");
            var d = GameDirector.Instance; var p = d.player.transform;
            var cam = d.player.GetComponentInChildren<Camera>();

            void Face(Vector3 dir) { dir.y = 0f; p.rotation = Quaternion.LookRotation(dir.normalized); if (d.player.cameraPivot) d.player.cameraPivot.localRotation = Quaternion.identity; }
            Label TagOf(string name) => Object.FindObjectsByType<UIDocument>().Select(u => u.rootVisualElement).Where(r => r != null)
                .SelectMany(r => r.Query<Label>(className: "squad-tag").ToList())
                .FirstOrDefault(l => l.resolvedStyle.display == DisplayStyle.Flex && l.text.StartsWith(mate.Name));

            Face(mate.transform.position - p.position);
            for (int i = 0; i < 5; i++) yield return null;
            float dist = Vector3.Distance(cam.transform.position, mate.transform.position);
            var tag = TagOf(mate.Name);
            Assert.IsNotNull(tag, $"{mate.Name} tag shown while looking at the mate ({dist:F1} m away)");
            Assert.AreEqual(mate.Name, tag.text, "not down: just the name");

            Face(p.position - mate.transform.position);   // turn around
            for (int i = 0; i < 5; i++) yield return null;
            Assert.IsNull(TagOf(mate.Name), "no tag for a mate behind you");
        }

        [UnityTest]
        public IEnumerator Mission03Storm_SunShadowsSoftAndFaint()
        {
            yield return Load("Mission03");
            var sky = SkyDirector.Instance;
            if (!sky || !sky.sun) Assert.Ignore("no SkyDirector sun in Mission03");
            for (int i = 0; i < 10; i++) yield return null;
            Debug.Log($"[Storm] preset storm={sky.Current.Storm:F2} rain={sky.Current.Rain:F2} shadows={sky.sun.shadows} strength={sky.sun.shadowStrength:F2}");
            Assert.That(sky.Current.Storm, Is.GreaterThan(0.5f), "Mission03 runs under the storm preset");
            Assert.AreNotEqual(LightShadows.Hard, sky.sun.shadows, "storm: no hard shadows");
            Assert.That(sky.sun.shadowStrength, Is.LessThanOrEqualTo(0.5f), "storm: faint shadows");
        }
    }
}

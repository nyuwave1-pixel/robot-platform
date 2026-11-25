using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UIElements;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>The UI Toolkit HUD builds in the real slice scene and reacts to the game: objective text, compass, damage arc, kill feed.</summary>
    public sealed class HudTests
    {
        static IEnumerator LoadSlice()
        {
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/IslandSlice.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("IslandSlice");
#endif
            yield return null; yield return null; yield return null;
        }

        static Label FindLabel(VisualElement root, System.Func<string, bool> match)
        {
            Label hit = null;
            root.Query<Label>().ForEach(l => { if (hit == null && l.text != null && match(l.text)) hit = l; });
            return hit;
        }

        [UnityTest]
        public IEnumerator Hud_ShowsObjectiveCompassAndAmmo()
        {
            yield return LoadSlice();
            var hud = Object.FindAnyObjectByType<HudToolkit>();
            Assert.NotNull(hud, "HudToolkit missing from the slice");
            var root = hud.GetComponent<UIDocument>().rootVisualElement;
            Assert.NotNull(root.panel, "UIDocument has no panel (PanelSettings missing?)");
            yield return new WaitForSeconds(0.25f);   // text refreshes every 0.09 s
            Assert.NotNull(FindLabel(root, t => t.Contains("Take the compound")), "objective line not shown");
            Assert.NotNull(FindLabel(root, t => t.EndsWith("°") || t.Contains("° ")), "compass heading not shown");
            Assert.NotNull(FindLabel(root, t => t.StartsWith(" / ")), "reserve ammo not shown");
        }

        [UnityTest]
        public IEnumerator Hud_KillFeedListsAKill()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance; var hud = Object.FindAnyObjectByType<HudToolkit>();
            var e = d.enemies[0];
            e.GetComponent<Damageable>().ApplyDamage(1e6f, Vector3.zero, Core.BodyPart.Head, true);
            yield return new WaitForSeconds(0.25f);
            var root = hud.GetComponent<UIDocument>().rootVisualElement;
            Assert.NotNull(FindLabel(root, t => t.Contains("HEADSHOT") && t.Contains(e.Type.Name)), "kill feed line missing");
        }
    }
}

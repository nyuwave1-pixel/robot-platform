using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UIElements;

namespace SpecialSoldier
{
    /// <summary>Mission briefing (web menu brief screen) shown when a campaign scene opens: code, name, zone, the briefing text and
    /// your best result. The game is paused until START (button, Enter or Space). Skipped in tests (SettingsStore.Volatile) and with
    /// <c>-nobrief</c> on the command line.</summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class BriefingScreen : MonoBehaviour
    {
        public StyleSheet style;
        public static bool IsOpen { get; private set; }
        VisualElement _panel;

        void Start()
        {
            var d = GameDirector.Instance;
            var m = d && d.missionMode == GameDirector.MissionMode.Campaign ? Campaign.Get(d.campaignId) : null;
            bool skip = m == null || SettingsStore.Volatile || System.Array.IndexOf(System.Environment.GetCommandLineArgs(), "-nobrief") >= 0;
            if (skip) { gameObject.SetActive(false); return; }

            var root = GetComponent<UIDocument>().rootVisualElement;
            if (style) root.styleSheets.Add(style);
            _panel = new VisualElement(); _panel.AddToClassList("pause-backdrop"); root.Add(_panel);
            var card = new VisualElement(); card.AddToClassList("pause-card"); _panel.Add(card);
            Text(card, m.Code + " — " + m.Name, "pause-title");
            Text(card, m.Zone, "pause-sub");
            Text(card, "BRIEFING", "pause-head");
            foreach (var line in m.Brief) { var l = Text(card, line, "pause-note"); l.style.whiteSpace = WhiteSpace.Normal; l.style.fontSize = 17; l.style.marginBottom = 6; }
            int idx = System.Array.IndexOf(Campaign.All, m);
            var best = ProgressStore.Current.Best(idx);
            Text(card, best != null ? $"BEST: GRADE {best.Grade} · {HudMath.Clock(best.Time)} · {best.Kills} KILLS · {best.Accuracy}% · {best.Alarms} ALARMS" : "FIRST DEPLOYMENT", "pause-sub");
            Text(card, "DIFFICULTY: " + GameDirector.CurrentDifficulty.Label, "pause-note");
            var actions = new VisualElement(); actions.AddToClassList("pause-actions"); card.Add(actions);
            var go = new Button(Begin) { text = "START MISSION  [Enter]" }; go.AddToClassList("pause-primary"); actions.Add(go);

            IsOpen = true; Time.timeScale = 0f;
            UnityEngine.Cursor.lockState = CursorLockMode.None; UnityEngine.Cursor.visible = true;
        }

        static Label Text(VisualElement parent, string text, string cls) { var l = new Label(text); l.AddToClassList(cls); parent.Add(l); return l; }

        void Update()
        {
            if (!IsOpen) return;
            var kb = Keyboard.current;
            if (kb != null && (kb.enterKey.wasPressedThisFrame || kb.numpadEnterKey.wasPressedThisFrame || kb.spaceKey.wasPressedThisFrame)) Begin();
        }

        public void Begin()
        {
            if (!IsOpen) return;
            IsOpen = false; Time.timeScale = 1f;
            if (_panel != null) _panel.style.display = DisplayStyle.None;
            UnityEngine.Cursor.lockState = CursorLockMode.Locked; UnityEngine.Cursor.visible = false;
        }

        void OnDestroy() { if (IsOpen) { IsOpen = false; Time.timeScale = 1f; } }
    }
}

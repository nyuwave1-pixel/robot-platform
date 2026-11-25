using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;

namespace SpecialSoldier
{
    /// <summary>Esc opens a pause menu (UI Toolkit) that stops the game (timeScale 0, audio paused) and edits the saved options:
    /// field of view, mouse sensitivity, invert Y, master volume, music, difficulty (applies on restart) and weather (immediate).
    /// Same options and ranges as the web game's settings screen (Core.GameSettings); stored by SettingsStore.</summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class PauseMenu : MonoBehaviour
    {
        public static PauseMenu Instance { get; private set; }
        public static bool IsOpen => Instance && Instance._open;
        public StyleSheet style;

        bool _open;
        VisualElement _panel;
        Slider _fov, _sens, _vol, _music;
        Toggle _invert;
        Label _fovV, _sensV, _volV, _musicV, _diffNote, _mission;
        readonly System.Collections.Generic.List<(Button b, string id)> _diffButtons = new System.Collections.Generic.List<(Button, string)>();
        readonly System.Collections.Generic.List<(Button b, string id)> _skyButtons = new System.Collections.Generic.List<(Button, string)>();
        string _diffAtStart;

        void Awake() { Instance = this; _diffAtStart = GameDirector.CurrentDifficulty.Id; }
        void OnDestroy() { if (Instance == this) { Instance = null; Time.timeScale = 1f; AudioListener.pause = false; } }

        void OnEnable()
        {
            var root = GetComponent<UIDocument>().rootVisualElement;
            if (root == null) return;
            root.Clear();
            if (style) root.styleSheets.Add(style);
            Build(root);
            _panel.style.display = DisplayStyle.None;
        }

        void Build(VisualElement root)
        {
            _panel = new VisualElement(); _panel.AddToClassList("pause-backdrop"); root.Add(_panel);
            var card = new VisualElement(); card.AddToClassList("pause-card"); _panel.Add(card);
            Text(card, "PAUSED", "pause-title");
            _mission = Text(card, "", "pause-sub");

            var row = new VisualElement(); row.AddToClassList("pause-row"); card.Add(row);
            var left = Column(row, "CONTROLS");
            _fov = SliderRow(left, "FIELD OF VIEW", GameSettings.FovMin, GameSettings.FovMax, out _fovV, v => SettingsStore.Edit(s => s.Fov = v));
            _sens = SliderRow(left, "MOUSE SENSITIVITY", GameSettings.SensMin, GameSettings.SensMax, out _sensV, v => SettingsStore.Edit(s => s.Sensitivity = v));
            _invert = new Toggle("INVERT Y"); _invert.AddToClassList("pause-toggle"); left.Add(_invert);
            _invert.RegisterValueChangedCallback(e => SettingsStore.Edit(s => s.InvertY = e.newValue));
            Text(left, "AUDIO", "pause-head");
            _vol = SliderRow(left, "MASTER VOLUME", 0f, 1f, out _volV, v => SettingsStore.Edit(s => s.Volume = v));
            _music = SliderRow(left, "MUSIC", 0f, 1f, out _musicV, v => SettingsStore.Edit(s => s.Music = v));

            var right = Column(row, "DIFFICULTY");
            var diffRow = new VisualElement(); diffRow.AddToClassList("pause-buttons"); right.Add(diffRow);
            foreach (var d in Difficulty.All)
            {
                var id = d.Id; var b = new Button(() => { SettingsStore.Edit(s => s.DifficultyId = id); Refresh(); }) { text = d.Label };
                b.AddToClassList("pause-choice"); diffRow.Add(b); _diffButtons.Add((b, id));
            }
            _diffNote = Text(right, "", "pause-note");
            Text(right, "WEATHER", "pause-head");
            var skyRow = new VisualElement(); skyRow.AddToClassList("pause-buttons"); right.Add(skyRow);
            foreach (var p in SkyPresets.Outdoor)
            {
                var id = p.Id; var b = new Button(() => { SettingsStore.Edit(s => s.SkyId = id); Refresh(); }) { text = id.ToUpper() };
                b.AddToClassList("pause-choice"); skyRow.Add(b); _skyButtons.Add((b, id));
            }

            var actions = new VisualElement(); actions.AddToClassList("pause-actions"); card.Add(actions);
            var resume = new Button(() => Close()) { text = "RESUME  [Esc]" }; resume.AddToClassList("pause-primary"); actions.Add(resume);
            var restart = new Button(Restart) { text = "RESTART MISSION" }; restart.AddToClassList("pause-secondary"); actions.Add(restart);
            // one game, two editions: back to the Three.js campaign (docs/game-dev/EDITIONS_ROADMAP.md)
            var classic = new Button(PortalBridge.GoToClassicEdition) { text = "CLASSIC EDITION  (full campaign)" }; classic.AddToClassList("pause-secondary"); actions.Add(classic);
            // campaign: every mission of this edition, locked until the one before it is cleared (web campaign screen)
            Text(card, "CAMPAIGN", "pause-head");
            var missions = new VisualElement(); missions.AddToClassList("pause-buttons"); card.Add(missions);
            for (int i = 0; i < Campaign.All.Length; i++)
            {
                var m = Campaign.All[i]; string scene = SceneRouter.SceneFor(m.Id); var best = ProgressStore.Current.Best(i);
                bool open = ProgressStore.Current.Unlocked(i) && Application.CanStreamedLevelBeLoaded(scene);
                var b = new Button(() => { Time.timeScale = 1f; UnityEngine.SceneManagement.SceneManager.LoadScene(scene); })
                    { text = $"{m.Code.Replace("MISSION ", "M")} {m.Name}" + (best != null ? $"  [{best.Grade}]" : open ? "" : "  — LOCKED") };
                b.AddToClassList("pause-choice"); b.SetEnabled(open); missions.Add(b);
            }
            Text(card, "WASD move · Shift sprint · C crouch · Space jump · LMB fire · RMB aim · R reload · V mode · 1–3 weapon · G grenade · E interact · K weather", "pause-keys");
        }

        static Label Text(VisualElement parent, string text, string cls) { var l = new Label(text); l.AddToClassList(cls); parent.Add(l); return l; }
        static VisualElement Column(VisualElement parent, string head) { var c = new VisualElement(); c.AddToClassList("pause-col"); parent.Add(c); Text(c, head, "pause-head"); return c; }

        Slider SliderRow(VisualElement parent, string label, float min, float max, out Label value, System.Action<float> set)
        {
            var line = new VisualElement(); line.AddToClassList("pause-line"); parent.Add(line);
            Text(line, label, "pause-label");
            var s = new Slider(min, max); s.AddToClassList("pause-slider"); line.Add(s);
            var v = Text(line, "", "pause-value"); value = v;
            s.RegisterValueChangedCallback(e => { set(e.newValue); Refresh(); });
            return s;
        }

        bool _wasCaptured;

        void Update()
        {
            var dir = GameDirector.Instance;
            bool playing = !dir || dir.State == GameDirector.Outcome.Playing;
            // WebGL: the browser eats the first Esc to release the pointer lock, so losing the lock mid-game also pauses
            bool captured = GameDirector.CursorCaptured;
            if (_wasCaptured && !captured && !_open && playing) Open();
            _wasCaptured = captured;

            var kb = Keyboard.current;
            if (kb == null || !kb.escapeKey.wasPressedThisFrame || BriefingScreen.IsOpen) return;
            if (_open) Close();
            else if (playing) Open();
            _wasCaptured = GameDirector.CursorCaptured;
        }

        public void Open()
        {
            if (_panel == null) return;
            _open = true; _panel.style.display = DisplayStyle.Flex;
            Time.timeScale = 0f; AudioListener.pause = true;
            UnityEngine.Cursor.lockState = CursorLockMode.None; UnityEngine.Cursor.visible = true;
            Refresh();
        }

        public void Close(bool relock = true)
        {
            if (_panel == null) return;
            _open = false; _panel.style.display = DisplayStyle.None;
            Time.timeScale = 1f; AudioListener.pause = false;
            if (relock) { UnityEngine.Cursor.lockState = CursorLockMode.Locked; UnityEngine.Cursor.visible = false; }   // Resume is a click, so WebGL allows the lock
        }

        void Restart()
        {
            Close(false);
            SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        }

        /// <summary>Shows the saved values (already snapped to the web slider steps) and highlights the chosen buttons.</summary>
        void Refresh()
        {
            var s = SettingsStore.Current;
            _fov.SetValueWithoutNotify(s.Fov); _fovV.text = $"{s.Fov:0}°";
            _sens.SetValueWithoutNotify(s.Sensitivity); _sensV.text = $"{s.Sensitivity:0.00}";
            _invert.SetValueWithoutNotify(s.InvertY);
            _vol.SetValueWithoutNotify(s.Volume); _volV.text = $"{s.Volume * 100:0}%";
            _music.SetValueWithoutNotify(s.Music); _musicV.text = $"{s.Music * 100:0}%";
            foreach (var (b, id) in _diffButtons) b.EnableInClassList("pause-on", id == s.DifficultyId);
            var sky = SkyDirector.Instance;
            foreach (var (b, id) in _skyButtons) b.EnableInClassList("pause-on", sky != null ? id == sky.Target.Id : id == s.SkyId);
            _diffNote.text = s.DifficultyId != _diffAtStart ? $"{Difficulty.FromId(s.DifficultyId).Label} applies when you restart the mission" : $"Playing on {GameDirector.CurrentDifficulty.Label}";
            var m = GameDirector.Instance ? GameDirector.Instance.Mission : null;
            _mission.text = m != null ? $"{m.Code} · {m.Name} · {HudMath.Clock(m.Stats.Time)}" : "";
        }
    }
}

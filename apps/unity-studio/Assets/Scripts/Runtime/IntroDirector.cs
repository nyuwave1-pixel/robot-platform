using System.Collections.Generic;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.UIElements;

namespace SpecialSoldier
{
    /// <summary>Mission intro (web cinematics.js): after the briefing a camera flies the mission's shots (Core.Cinematic) with letterbox
    /// bars, the shot caption and the web fades; Enter / Space skips. The player, the enemies and the mission clock wait meanwhile.
    /// Missions without shots (Mission 01's boat ride is not ported) start straight away. Skipped in tests and with -nobrief.</summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class IntroDirector : MonoBehaviour
    {
        public static IntroDirector Instance { get; private set; }
        public bool Playing { get; private set; }
        /// <summary>Mission 01: the assault boat and its six operators (web cinematics.js boat + crew), placed by SliceBuilder.</summary>
        public Transform boat;
        public GameObject[] crew = new GameObject[0];
        int _shown = -1;
        Cinematic _cine; Camera _cam, _view; VisualElement _top, _bottom, _fade; Label _caption;
        readonly List<Behaviour> _paused = new List<Behaviour>();
        float _fadeA;

        void Awake() => Instance = this;
        void OnDestroy() { if (Instance == this) Instance = null; }

        /// <summary>Starts the intro of this scene's campaign mission (no-op without shots).</summary>
        public void Play()
        {
            var d = GameDirector.Instance;
            var m = d && d.missionMode == GameDirector.MissionMode.Campaign ? Campaign.Get(d.campaignId) : null;
            bool boatRide = m != null && m.IntroKind == "boat" && boat;
            if (m == null || (!boatRide && (m.Intro == null || m.Intro.Length == 0)) || SettingsStore.Volatile || Playing) return;
            var shots = boatRide ? BoatIntro.Shots() : m.Intro;
            _cine = new Cinematic(shots); if (boatRide) { _cine.Anchor = BoatIntro.BoatAt; foreach (var c in crew) if (c) c.SetActive(true); }
            Playing = true; d.Cinematic = true;
            var player = d.player;
            _view = player ? player.GetComponentInChildren<Camera>() : null;
            _cam = new GameObject("IntroCam").AddComponent<Camera>(); _cam.nearClipPlane = 0.1f; _cam.fieldOfView = (float)shots[0].Fov;
            if (GraphicsSettings.defaultRenderPipeline) _cam.GetUniversalAdditionalCameraData().renderPostProcessing = true;   // adds the component only if missing
            if (_view) _view.enabled = false;
            // freeze everything that acts: the player's controls and every enemy
            _paused.Clear();
            if (player) foreach (var b in player.GetComponentsInChildren<Behaviour>()) if ((b is PlayerMotor || b is WeaponController || b is GrenadeThrower || b is GearController) && b.enabled) { b.enabled = false; _paused.Add(b); }
            foreach (var e in d.enemies) if (e && e.enabled) { e.enabled = false; _paused.Add(e); }

            var root = GetComponent<UIDocument>().rootVisualElement;
            VisualElement Bar(bool top) { var v = new VisualElement(); v.style.position = Position.Absolute; v.style.left = 0; v.style.right = 0; v.style.height = Length.Percent(11); v.style.backgroundColor = Color.black; if (top) v.style.top = 0; else v.style.bottom = 0; v.pickingMode = PickingMode.Ignore; root.Add(v); return v; }
            _top = Bar(true); _bottom = Bar(false);
            _caption = new Label(); _caption.style.position = Position.Absolute; _caption.style.left = 0; _caption.style.right = 0; _caption.style.bottom = Length.Percent(13);
            _caption.style.unityTextAlign = TextAnchor.MiddleCenter; _caption.style.fontSize = 22; _caption.style.color = new Color(0.92f, 0.95f, 0.9f); _caption.style.unityFontStyleAndWeight = FontStyle.Bold; _caption.pickingMode = PickingMode.Ignore; root.Add(_caption);
            _fade = new VisualElement(); _fade.style.position = Position.Absolute; _fade.style.left = 0; _fade.style.right = 0; _fade.style.top = 0; _fade.style.bottom = 0; _fade.style.backgroundColor = Color.black; _fade.pickingMode = PickingMode.Ignore; root.Add(_fade);
            _fadeA = 1f;
        }

        void Update()
        {
            if (!Playing) return;
            var kb = Keyboard.current;
            if (kb != null && (kb.enterKey.wasPressedThisFrame || kb.spaceKey.wasPressedThisFrame)) { _cine.Skip(); }
            var shot = _cine.Current;
            if (shot == null) { End(); return; }
            _caption.text = shot.Text;
            if (_cine.Index != _shown) { _shown = _cine.Index; if (!string.IsNullOrEmpty(shot.Radio) && GameDirector.Instance) GameDirector.Instance.Radio(shot.Radio); }
            var (pos, look, fade) = _cine.Step(Time.deltaTime);
            if (boat && _cine.Anchor != null) PlaceBoat(BoatIntro.BoatAt(_cine.Time), Mathf.Sin(Time.time * 1.7f) * 0.12f);
            if (pos != null)
            {
                var p = IslandTerrain.ToWorld(pos[0], pos[1], pos[2]); var l = IslandTerrain.ToWorld(look[0], look[1], look[2]);
                _cam.transform.position = new Vector3((float)p.x, (float)p.y, (float)p.z);
                _cam.transform.LookAt(new Vector3((float)l.x, (float)l.y, (float)l.z));
                _cam.fieldOfView = (float)shot.Fov;
            }
            _fadeA = Mathf.MoveTowards(_fadeA, fade ? 1f : 0f, Time.deltaTime * 4f);   // web post fade
            _fade.style.opacity = _fadeA;
        }

        /// <summary>The boat on the sea (island y 0 = world −16), bow toward the island (web rotation.y = π).</summary>
        void PlaceBoat(double[] at, float bob)
        {
            var w = IslandTerrain.ToWorld(at[0], at[1], at[2]);
            boat.position = new Vector3((float)w.x, (float)w.y + bob, (float)w.z);
            boat.rotation = Quaternion.Euler(Mathf.Sin(Time.time * 1.3f) * 1.2f, 180f, Mathf.Sin(Time.time * 0.9f) * 1.5f);
        }

        void End()
        {
            Playing = false;
            if (boat && _cine?.Anchor != null)
            {
                // web placeBoat(true): beached at (3.2, 331.5); only the driver and one operator stay aboard
                PlaceBoat(new[] { 3.2, 0.0, 331.5 }, 0f); boat.rotation = Quaternion.Euler(2f, 180f + 7f, 1.7f);
                for (int i = 0; i < crew.Length; i++) if (crew[i]) crew[i].SetActive(i == 4 || i == 5);
            }
            if (_cam) Destroy(_cam.gameObject);
            if (_view) _view.enabled = true;
            foreach (var b in _paused) if (b) b.enabled = true;
            _paused.Clear();
            foreach (var v in new[] { _top, _bottom, _fade }) v?.RemoveFromHierarchy();
            _caption?.RemoveFromHierarchy();
            if (GameDirector.Instance) GameDirector.Instance.Cinematic = false;
            UnityEngine.Cursor.lockState = CursorLockMode.Locked; UnityEngine.Cursor.visible = false;
        }
    }
}

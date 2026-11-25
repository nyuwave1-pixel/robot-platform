using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace SpecialSoldier
{
    /// <summary>Tactical equipment on the player (web gear.js, Core.Gear rules): night vision [N], thermal imager [T], tac light [L],
    /// med kit [H], recon drone [B]; [X] cycles and [F] uses the selected item. Items unlock with campaign progress (all of them
    /// outside the campaign). Vision modes are a post-processing volume; thermal also makes hostiles glow. The drone is its own
    /// camera that flies 15 m/s, stays within 72 m of the ground and 230 m of you, and tags hostiles it sees onto the radar for 30 s.</summary>
    public sealed class GearController : MonoBehaviour
    {
        public PlayerMotor motor;
        public Camera view;
        public static GearController Instance { get; private set; }

        public Vision Vision { get; private set; }
        public bool LightOn { get; private set; }
        public int Medkits { get; private set; } = Gear.MedkitsPerMission;
        public readonly DroneBattery Battery = new DroneBattery();
        public bool DroneActive => Battery.Active;
        int _sel;

        Volume _volume; ColorAdjustments _ca; FilmGrain _grain; Vignette _vig;
        Light _spot;
        Camera _droneCam; float _dyaw, _dpitch, _scanT, _thermalRefresh;
        readonly MaterialPropertyBlock _mpb = new MaterialPropertyBlock();

        void Awake()
        {
            Instance = this;
            if (!motor) motor = GetComponentInParent<PlayerMotor>();
            if (!view) view = GetComponentInChildren<Camera>();
            var go = new GameObject("GearVolume"); go.transform.SetParent(transform, false);
            _volume = go.AddComponent<Volume>(); _volume.isGlobal = true; _volume.priority = 50f; _volume.weight = 0f;
            var profile = ScriptableObject.CreateInstance<VolumeProfile>(); _volume.profile = profile;
            _ca = profile.Add<ColorAdjustments>(true); _grain = profile.Add<FilmGrain>(true); _vig = profile.Add<Vignette>(true);
            _spot = new GameObject("TacLight").AddComponent<Light>();
            _spot.transform.SetParent(view ? view.transform : transform, false); _spot.transform.localPosition = new Vector3(0.15f, -0.1f, 0f);
            _spot.type = LightType.Spot; _spot.range = 55f; _spot.spotAngle = 48f; _spot.color = new Color(0.95f, 0.965f, 1f); _spot.intensity = 0f;   // web SpotLight(0xf2f6ff, 55 m, 0.42 rad)
        }

        void OnDestroy() { if (Instance == this) Instance = null; }

        bool All => !GameDirector.Instance || GameDirector.Instance.missionMode != GameDirector.MissionMode.Campaign;
        public bool Has(string id) => Gear.Has(id, ProgressStore.Current.Progress, All);
        static GameDirector Dir => GameDirector.Instance;

        void Say(string line) { if (Dir) Dir.Radio(line); }

        public void Use(string id)
        {
            if (!Has(id)) { Say(Gear.Get(id).Name + " — LOCKED"); return; }
            switch (id)
            {
                case "nvg": SetVision(Gear.Toggle(Vision, Vision.Night)); break;
                case "thermal": SetVision(Gear.Toggle(Vision, Vision.Thermal)); break;
                case "light": LightOn = !LightOn; _spot.intensity = LightOn ? 6f : 0f; SliceFx.I.Click(); break;
                case "medkit": Heal(); break;
                case "drone": if (DroneActive) RecallDrone(); else LaunchDrone(); break;
            }
        }

        public bool Heal()
        {
            var hp = motor ? motor.GetComponent<Damageable>() : null;
            if (!hp || !Gear.CanHeal(Medkits, hp.Model.Health, hp.Model.MaxHealth)) return false;
            Medkits--; hp.Model.Heal(Gear.MedkitHeal); Say("MED KIT USED"); SliceFx.I.HitConfirm(false);
            return true;
        }

        public void SetVision(Vision v)
        {
            Vision = v; SliceFx.I.Click();
            _volume.weight = v == Vision.Off ? 0f : 1f;
            if (v == Vision.Night)
            {   // green phosphor: brighter, desaturated green, grain, tube vignette
                _ca.postExposure.Override(1.8f); _ca.saturation.Override(-70f); _ca.contrast.Override(15f); _ca.colorFilter.Override(new Color(0.45f, 1f, 0.5f));
                _grain.intensity.Override(0.45f); _vig.intensity.Override(0.42f);
            }
            else if (v == Vision.Thermal)
            {   // grey world, hostiles white-hot
                _ca.postExposure.Override(-0.6f); _ca.saturation.Override(-100f); _ca.contrast.Override(35f); _ca.colorFilter.Override(Color.white);
                _grain.intensity.Override(0.2f); _vig.intensity.Override(0.25f);
            }
            ApplyThermal(v == Vision.Thermal);
        }

        void ApplyThermal(bool on)
        {
            if (!Dir) return;
            var hot = new Color(3.2f, 2.9f, 2.5f, 1f);
            foreach (var e in Dir.enemies)
            {
                if (!e || !e.Alive) continue;   // the dead keep what they have (a burnt APC stays burnt)
                foreach (var r in e.GetComponentsInChildren<Renderer>())
                {
                    if (!r.enabled) continue;   // the hidden animation rig
                    if (!on) { r.SetPropertyBlock(null); continue; }
                    _mpb.Clear(); _mpb.SetColor("_BaseColor", hot); _mpb.SetColor("baseColorFactor", hot); r.SetPropertyBlock(_mpb);
                }
            }
        }

        void LaunchDrone()
        {
            var p = transform.position;
            var isl = IslandTerrain.ToIsland(p.x, p.y, p.z);
            if (!Battery.TryLaunch(Gear.DroneHasSignal(isl.y), out var why)) { Say(why); return; }
            if (!_droneCam)
            {
                _droneCam = new GameObject("DroneCam").AddComponent<Camera>(); _droneCam.enabled = false;
                _droneCam.nearClipPlane = 0.1f; _droneCam.fieldOfView = view ? view.fieldOfView : 70f;
                if (GraphicsSettings.defaultRenderPipeline) _droneCam.gameObject.AddComponent<UniversalAdditionalCameraData>().renderPostProcessing = true;
            }
            _droneCam.transform.position = (motor ? motor.Eye : p) + Vector3.up * 2f;
            _dyaw = transform.eulerAngles.y; _dpitch = 17f;   // web: dpitch −0.3 rad (looking down)
            SetPlayerControl(false);
            if (view) view.enabled = false; _droneCam.enabled = true;
            SliceFx.I.HitConfirm(false);
        }

        public void RecallDrone()
        {
            Battery.Recall();
            if (_droneCam) _droneCam.enabled = false;
            if (view) view.enabled = true;
            SetPlayerControl(true);
        }

        void SetPlayerControl(bool on)
        {
            if (motor) motor.enabled = on;
            foreach (var w in GetComponentsInChildren<WeaponController>()) w.enabled = on;
            foreach (var g in GetComponentsInChildren<GrenadeThrower>()) g.enabled = on;
        }

        void Update()
        {
            float dt = Time.deltaTime;
            if (Battery.Tick(dt)) { RecallDrone(); Say("DRONE BATTERY DEPLETED"); }
            var hp = motor ? motor.GetComponent<Damageable>() : null;
            bool playing = (!Dir || Dir.State == GameDirector.Outcome.Playing) && (!hp || hp.Alive) && !PauseMenu.IsOpen && !BriefingScreen.IsOpen;
            if (!playing) { if (DroneActive && (hp && !hp.Alive || Dir && Dir.State != GameDirector.Outcome.Playing)) RecallDrone(); return; }

            var kb = Keyboard.current;
            if (kb != null)
            {
                foreach (var g in Gear.Items)
                    if (g.Id != "medkit" && Pressed(kb, g.Key)) Use(g.Id);
                if (kb.hKey.wasPressedThisFrame) { if (!Heal() && Medkits <= 0) Say("NO MED KITS LEFT"); }
                if (kb.xKey.wasPressedThisFrame)
                {
                    var list = System.Array.FindAll(Gear.Items, g => Has(g.Id));
                    if (list.Length > 0) { _sel = (_sel + 1) % list.Length; Say("EQUIPMENT: " + list[_sel].Name); }
                }
                if (kb.fKey.wasPressedThisFrame) { var list = System.Array.FindAll(Gear.Items, g => Has(g.Id)); if (list.Length > 0) Use(list[_sel % list.Length].Id); }
            }
            if (Vision == Vision.Thermal && (_thermalRefresh -= dt) <= 0f) { _thermalRefresh = 0.5f; ApplyThermal(true); }   // reinforcements, deaths
            if (DroneActive) FlyDrone(dt, kb);
        }

        static bool Pressed(Keyboard kb, char key)
        {
            switch (key)
            {
                case 'N': return kb.nKey.wasPressedThisFrame;
                case 'T': return kb.tKey.wasPressedThisFrame;
                case 'L': return kb.lKey.wasPressedThisFrame;
                case 'B': return kb.bKey.wasPressedThisFrame;
                default: return false;
            }
        }

        void FlyDrone(float dt, Keyboard kb)
        {
            var mouse = Mouse.current;
            if (mouse != null && GameDirector.CursorCaptured)
            {
                Vector2 d = mouse.delta.ReadValue() * SettingsStore.Current.LookDegreesPerPixel(1f, false);
                _dyaw += d.x; _dpitch = Mathf.Clamp(_dpitch - d.y, -34f, 86f);   // web: pitch −1.5 … 0.6 rad
            }
            var rot = Quaternion.Euler(_dpitch, _dyaw, Mathf.Sin(Time.time * 2f) * 0.6f);
            Vector3 fwd = Quaternion.Euler(0f, _dyaw, 0f) * Vector3.forward, right = Quaternion.Euler(0f, _dyaw, 0f) * Vector3.right;
            float f = 0, r = 0, u = 0;
            if (kb != null) { f = (kb.wKey.isPressed ? 1 : 0) - (kb.sKey.isPressed ? 1 : 0); r = (kb.dKey.isPressed ? 1 : 0) - (kb.aKey.isPressed ? 1 : 0); u = (kb.spaceKey.isPressed ? 1 : 0) - (kb.leftCtrlKey.isPressed ? 1 : 0); }
            Vector3 pos = _droneCam.transform.position + (fwd * f + right * r) * Gear.DroneSpeed * dt + Vector3.up * u * Gear.DroneSpeed * Gear.DroneClimbFactor * dt;
            // clamp in island coordinates (the web rule): 2–72 m above the ground (sea level over water), within 230 m of you
            var isl = IslandTerrain.ToIsland(pos.x, pos.y, pos.z); var me = IslandTerrain.ToIsland(transform.position.x, transform.position.y, transform.position.z);
            var t = Terrain.activeTerrain; double ground = t ? IslandTerrain.ToIsland(pos.x, t.SampleHeight(pos) + t.transform.position.y, pos.z).y : isl.y - 2;
            var c = Gear.ClampDrone(isl.x, isl.y, isl.z, ground, me.x, me.z);
            var w = IslandTerrain.ToWorld(c.x, c.y, c.z);
            _droneCam.transform.SetPositionAndRotation(new Vector3((float)w.x, (float)w.y, (float)w.z), rot);

            if ((_scanT -= dt) > 0f || !Dir) return;
            _scanT = Gear.ScanEvery;
            Vector3 eye = _droneCam.transform.position, look = _droneCam.transform.forward;
            foreach (var e in Dir.enemies)
            {
                if (!e || !e.Alive) continue;
                Vector3 to = e.transform.position + Vector3.up * 1.2f - eye; float dist = to.magnitude;
                if (!Gear.DroneSees(dist, Vector3.Dot(to / Mathf.Max(dist, 0.01f), look))) continue;
                if (Physics.Raycast(eye, to / dist, out RaycastHit hit, dist - 0.5f, ~0, QueryTriggerInteraction.Ignore) && hit.collider.GetComponentInParent<EnemyAgent>() != e) continue;
                if (Time.time - e.MarkedTime > 30f) SliceFx.I.HitConfirm(false);   // web: a beep for a new tag
                e.MarkedTime = Time.time;
            }
        }

        /// <summary>HUD line: the items you have, what is on, drone battery, med kits.</summary>
        public string StatusLine
        {
            get
            {
                var sb = new System.Text.StringBuilder();
                foreach (var g in Gear.Items)
                {
                    if (!Has(g.Id)) continue;
                    bool on = g.Id == "nvg" ? Vision == Vision.Night : g.Id == "thermal" ? Vision == Vision.Thermal : g.Id == "light" ? LightOn : g.Id == "drone" && DroneActive;
                    string extra = g.Id == "medkit" ? $" x{Medkits}" : g.Id == "drone" ? $" {Mathf.RoundToInt(Battery.Level * 100)}%" : "";
                    sb.Append(on ? "> " : "").Append('[').Append(g.Key).Append("] ").Append(g.Name).Append(extra).Append("   ");
                }
                return sb.ToString().TrimEnd();
            }
        }
    }
}

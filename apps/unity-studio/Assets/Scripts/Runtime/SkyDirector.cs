using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace SpecialSoldier
{
    /// <summary>Weather and time of day for the slice: CC0 Poly Haven HDRI skybox (Resources/Sky), sun colour / angle / strength,
    /// exponential fog, skybox ambient light, post exposure, rain and storm lightning with thunder — all driven by the
    /// engine-free Core.SkyPresets (a port of the web game's sky.js presets) and faded the way the web game fades them.
    /// Pick the weather with -sky day|dawn|storm|dusk|night (desktop), ?sky=... in the WebGL page URL, or [K] in game.</summary>
    public sealed class SkyDirector : MonoBehaviour
    {
        public static SkyDirector Instance { get; private set; }
        public Light sun;
        public Volume volume;
        public Material skyMaterial;                 // Skybox/Panoramic asset made by SliceBuilder (keeps the shader in builds)
        public string startPreset = "day";
        /// <summary>Campaign missions have their own time of day (M01 is a night landing): the scene's preset wins over the
        /// saved weather choice. A <c>?sky=</c> / <c>-sky</c> request still wins, and [K] still cycles.</summary>
        public bool missionSky;
        public float basePostExposure = 0.3f;        // the slice's tuned exposure (PC run 2026-11-23) on top of the preset's EV
        public float sunScale = 1.1f;                // web sunI → Unity lux-less intensity

        public SkyPreset Target { get; private set; }
        public SkyPreset Current { get; private set; }
        public float Flash => _bolt.Flash;

        readonly LightningClock _bolt = new LightningClock();
        ColorAdjustments _ca;
        ParticleSystem _rain;
        string _loadedHdri;
        float _envT;

        public static string RequestedPreset()
        {
            var args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++) if (args[i] == "-sky") return args[i + 1];
            string url = Application.absoluteURL;
            int q = string.IsNullOrEmpty(url) ? -1 : url.IndexOf("sky=", System.StringComparison.Ordinal);
            if (q >= 0) { string v = url.Substring(q + 4); int amp = v.IndexOfAny(new[] { '&', '#' }); return amp >= 0 ? v.Substring(0, amp) : v; }
            return null;
        }

        void Awake()
        {
            Instance = this;
            if (!skyMaterial) skyMaterial = RenderSettings.skybox;
            if (volume && volume.profile) volume.profile.TryGet(out _ca);
            Target = SkyPresets.Get(RequestedPreset() ?? (missionSky ? startPreset : null) ?? SettingsStore.Current.SkyId ?? startPreset);
            _savedSky = SettingsStore.Current.SkyId;
            SettingsStore.Changed += OnSettings;
            Current = Target.Clone();
            MakeRain();
            Apply(Current);
        }

        /// <summary>Starts a fade to another preset (web: Sky.set(name)).</summary>
        public void Set(string id)
        {
            Target = SkyPresets.Get(id);
        }

        public void Cycle()
        {
            var list = SkyPresets.Outdoor; int i = 0;
            for (; i < list.Count; i++) if (list[i].Id == Target.Id) break;
            Set(list[(i + 1) % list.Count].Id);
        }

        void Update()
        {
            float dt = Time.deltaTime;
            var kb = Keyboard.current;
            if (kb != null && kb.kKey.wasPressedThisFrame) Cycle();
            Current = SkyPreset.Approach(Current, Target, dt);
            if (_bolt.Tick(dt, Current.Storm > 0.5f)) SliceFx.I.Thunder();
            Apply(Current);
            if (_rain && Camera.main) _rain.transform.position = Camera.main.transform.position + Vector3.up * 14f;
        }

        static Color C(Rgb c) => new Color(c.R, c.G, c.B);

        void Apply(SkyPreset p)
        {
            float flash = _bolt.Lit ? 1f : 0f;
            if (sun)
            {
                sun.enabled = p.SunIntensity > 0.01f;
                sun.color = Color.Lerp(C(p.Sun), new Color(0.8f, 0.86f, 1f), flash);
                sun.intensity = p.SunIntensity * sunScale * p.LightScale + flash * 2.5f;   // dimmer under storm clouds and at night
                var d = p.SunDirUnity;
                sun.transform.rotation = Quaternion.LookRotation(-new Vector3(d.X, d.Y, d.Z));
            }
            RenderSettings.fog = p.FogDensity > 0f;
            RenderSettings.fogMode = FogMode.ExponentialSquared;           // same falloff as three.js FogExp2
            RenderSettings.fogDensity = p.FogDensity;
            RenderSettings.fogColor = C(p.Fog) + new Color(0.25f, 0.27f, 0.35f) * flash;

            if (skyMaterial && p.Hdri != null && p.Hdri != _loadedHdri)
            {
                var tex = Resources.Load<Texture>("Sky/" + p.Hdri);
                if (tex) { skyMaterial.SetTexture("_MainTex", tex); _loadedHdri = p.Hdri; _envT = 0f; }
            }
            bool hdri = skyMaterial && _loadedHdri != null && p.Hdri != null;
            if (hdri)
            {
                RenderSettings.skybox = skyMaterial;
                skyMaterial.SetFloat("_Exposure", p.HdriExposure * (1f + flash * 3f));   // day-normalised × Mood (SkyPresets.HdriExposure)
                RenderSettings.ambientMode = AmbientMode.Skybox;
                RenderSettings.ambientIntensity = p.Hemi;
                // re-bake skybox ambient after an HDRI swap and a few times a second while the weather fades
                if ((_envT -= Time.unscaledDeltaTime) <= 0f) { DynamicGI.UpdateEnvironment(); _envT = 0.5f; }
            }
            else
            {
                RenderSettings.ambientMode = AmbientMode.Trilight;           // facility / no HDRI: web hemisphere light colours
                RenderSettings.ambientSkyColor = C(p.Top) * p.Hemi; RenderSettings.ambientEquatorColor = C(p.Fog) * p.Hemi; RenderSettings.ambientGroundColor = C(p.Bottom) * 0.5f * p.Hemi;
            }
            if (_ca) _ca.postExposure.Override(basePostExposure + p.PostExposureEv);
            if (_rain)
            {
                var em = _rain.emission; em.rateOverTime = p.Rain * 2600f;
                var vel = _rain.velocityOverLifetime; vel.x = p.Wind * 1.6f;
            }
        }

        void MakeRain()
        {
            var go = new GameObject("Rain"); go.transform.SetParent(transform);
            _rain = go.AddComponent<ParticleSystem>();
            _rain.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = _rain.main;
            main.loop = true; main.playOnAwake = true; main.simulationSpace = ParticleSystemSimulationSpace.World; main.maxParticles = 5000;
            main.startLifetime = 0.9f; main.startSpeed = 0f; main.startSize = 0.025f; main.startColor = new Color(0.75f, 0.8f, 0.88f, 0.45f);
            var shape = _rain.shape; shape.shapeType = ParticleSystemShapeType.Box; shape.scale = new Vector3(44f, 0.1f, 44f);
            var vel = _rain.velocityOverLifetime; vel.enabled = true; vel.space = ParticleSystemSimulationSpace.World;
            vel.x = 0f; vel.y = -22f; vel.z = 0f;
            var em = _rain.emission; em.rateOverTime = 0f;
            var r = go.GetComponent<ParticleSystemRenderer>();
            r.renderMode = ParticleSystemRenderMode.Stretch; r.velocityScale = 0.035f; r.lengthScale = 1f;
            r.sharedMaterial = new Material(Shader.Find("Sprites/Default"));
            _rain.Play();
        }

        string _savedSky;
        /// <summary>React only when the saved weather itself changes (the menu), so a volume change doesn't undo a [K] cycle.</summary>
        void OnSettings(GameSettings s) { if (s.SkyId != _savedSky) { _savedSky = s.SkyId; Set(s.SkyId); } }

        void OnDestroy() { SettingsStore.Changed -= OnSettings; if (Instance == this) Instance = null; }
    }
}

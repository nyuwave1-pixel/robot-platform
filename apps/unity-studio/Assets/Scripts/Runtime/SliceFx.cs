using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Sound and small visual effects for the slice: gunshots (2D for the player, 3D for enemies), footsteps,
    /// muzzle flashes, impact dust and the stealth / combat music loop. Clips are the web game's CC0 Freesound files
    /// (apps/special-soldier/public/audio, ledger: apps/special-soldier/docs/ASSET_LICENSES.md), copied to Resources/Audio.
    /// Created on first use, so scenes and tests need no setup; every call is safe when a clip is missing.</summary>
    public sealed class SliceFx : MonoBehaviour
    {
        static SliceFx _i;
        public static SliceFx I { get { if (!_i) _i = new GameObject("SliceFx").AddComponent<SliceFx>(); return _i; } }

        /// <summary>How many effects were played since load (PlayMode tests read these).</summary>
        public static int Shots, Steps, Impacts;

        AudioClip _shot; AudioClip[] _steps;
        AudioSource[] _pool; int _next;
        AudioSource _stealth, _combat;
        ParticleSystem _dust, _spark;
        Light _flash; float _flashT;

        void Awake()
        {
            _i = this;
            _shot = Resources.Load<AudioClip>("Audio/shot");
            _steps = new AudioClip[4];
            for (int k = 0; k < 4; k++) _steps[k] = Resources.Load<AudioClip>($"Audio/step_gravel{k + 1}");

            _pool = new AudioSource[16];
            for (int k = 0; k < _pool.Length; k++)
            {
                var go = new GameObject("Sfx" + k); go.transform.SetParent(transform);
                var a = go.AddComponent<AudioSource>(); a.playOnAwake = false; a.rolloffMode = AudioRolloffMode.Linear; a.minDistance = 4f; a.maxDistance = 140f; a.dopplerLevel = 0f;
                _pool[k] = a;
            }
            _stealth = Loop("Audio/music_stealth", 0.35f);
            _combat = Loop("Audio/music_combat", 0f);

            var mat = new Material(Shader.Find("Sprites/Default"));
            _dust = MakeParticles("ImpactDust", mat, new Color(0.62f, 0.56f, 0.45f, 0.85f), 0.12f, 0.35f, 2.2f, 0.55f, 0.6f);
            _spark = MakeParticles("HitSpark", mat, new Color(1f, 0.75f, 0.35f, 1f), 0.03f, 0.06f, 7f, 0.15f, 0f);

            _flash = new GameObject("MuzzleFlash").AddComponent<Light>(); _flash.transform.SetParent(transform);
            _flash.type = LightType.Point; _flash.range = 7f; _flash.intensity = 0f; _flash.color = new Color(1f, 0.78f, 0.45f);
        }

        AudioSource Loop(string path, float vol)
        {
            var clip = Resources.Load<AudioClip>(path);
            var a = gameObject.AddComponent<AudioSource>(); a.clip = clip; a.loop = true; a.volume = vol; a.spatialBlend = 0f; a.playOnAwake = false;
            if (clip) a.Play();
            return a;
        }

        ParticleSystem MakeParticles(string name, Material mat, Color c, float sizeMin, float sizeMax, float speed, float life, float gravity)
        {
            var go = new GameObject(name); go.transform.SetParent(transform);
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main; main.playOnAwake = false; main.loop = false; main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.startColor = c; main.startSize = new ParticleSystem.MinMaxCurve(sizeMin, sizeMax); main.startSpeed = new ParticleSystem.MinMaxCurve(speed * 0.4f, speed);
            main.startLifetime = new ParticleSystem.MinMaxCurve(life * 0.6f, life); main.gravityModifier = gravity; main.maxParticles = 400;
            var em = ps.emission; em.enabled = false;
            var sh = ps.shape; sh.shapeType = ParticleSystemShapeType.Cone; sh.angle = 35f; sh.radius = 0.02f;
            var col = ps.colorOverLifetime; col.enabled = true;
            var g = new Gradient(); g.SetKeys(new[] { new GradientColorKey(Color.white, 0f), new GradientColorKey(Color.white, 1f) }, new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(0f, 1f) });
            col.color = g;
            var sz = ps.sizeOverLifetime; sz.enabled = true; sz.size = new ParticleSystem.MinMaxCurve(1f, AnimationCurve.Linear(0f, 0.6f, 1f, 1.6f));
            go.GetComponent<ParticleSystemRenderer>().sharedMaterial = mat;
            return ps;
        }

        void Play(AudioClip clip, Vector3 pos, bool spatial, float vol, float pitch)
        {
            if (!clip) return;
            var a = _pool[_next]; _next = (_next + 1) % _pool.Length;
            a.transform.position = pos; a.spatialBlend = spatial ? 1f : 0f; a.volume = vol; a.pitch = pitch; a.clip = clip; a.Play();
        }

        /// <summary>A gunshot. Player shots are 2D and louder; enemy shots are positional so you can hear where they come from.</summary>
        public void Shot(Vector3 pos, bool player, float loudness = 1f)
        {
            Shots++;
            Play(_shot, pos, !player, (player ? 0.55f : 0.8f) * Mathf.Clamp01(loudness), Random.Range(0.92f, 1.08f) * (player ? 1f : 0.95f));
        }

        public void Step(Vector3 pos, bool sprint)
        {
            Steps++;
            Play(_steps[Random.Range(0, _steps.Length)], pos, false, sprint ? 0.32f : 0.2f, Random.Range(0.9f, 1.1f));
        }

        public void MuzzleFlash(Vector3 pos)
        {
            _flash.transform.position = pos; _flash.intensity = 6f; _flashT = 0.05f;
        }

        /// <summary>Bullet impact: dust on the ground and walls, a spark burst when it hits a character.</summary>
        public void Impact(Vector3 point, Vector3 normal, bool character)
        {
            Impacts++;
            var ps = character ? _spark : _dust;
            ps.transform.SetPositionAndRotation(point + normal * 0.03f, Quaternion.LookRotation(normal.sqrMagnitude > 0 ? normal : Vector3.up));
            ps.Emit(character ? 6 : 10);
        }

        void Update()
        {
            if (_flashT > 0f && (_flashT -= Time.deltaTime) <= 0f) _flash.intensity = 0f;

            // stealth music while nobody is fighting, combat music once any enemy is in COMBAT; cross-fade over ~1.5 s
            bool fighting = false;
            var d = GameDirector.Instance;
            if (d) foreach (var e in d.enemies) if (e && e.Alive && e.Brain != null && e.Brain.State == Core.AlertState.Combat) { fighting = true; break; }
            float k = Time.deltaTime / 1.5f;
            if (_combat.clip) _combat.volume = Mathf.MoveTowards(_combat.volume, fighting ? 0.4f : 0f, k * 0.4f);
            if (_stealth.clip) _stealth.volume = Mathf.MoveTowards(_stealth.volume, fighting ? 0f : 0.35f, k * 0.35f);
            if (_combat.clip && !_combat.isPlaying) _combat.Play();
        }

        void OnDestroy() { if (_i == this) _i = null; }
    }
}

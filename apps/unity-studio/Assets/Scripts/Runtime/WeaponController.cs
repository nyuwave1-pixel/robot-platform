using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SpecialSoldier
{
    /// <summary>Hitscan gun on the player camera. Ammo/cadence/reload come from Core.WeaponState, damage from Core.Ballistics,
    /// so the numbers match the web game. Left mouse fire, right mouse aim (ADS), R reload, V fire mode, 1/2/3 switch weapon.</summary>
    public sealed class WeaponController : MonoBehaviour
    {
        public PlayerMotor motor;
        public Camera view;
        public string[] loadout = { "m4", "shotgun", "pistol" };
        public float hipFov = 70f;
        public LayerMask hitMask = ~0;

        public WeaponState Current { get; private set; }
        public float Bloom { get; private set; }            // extra spread from sustained fire, degrees
        public float HitMarkerTime { get; private set; }    // > 0 while the hit marker shows
        public bool LastHitWasKill { get; private set; }
        public bool Aiming { get; private set; }

        WeaponState[] _slots;
        int _slot;
        LineRenderer _tracer;
        float _tracerT;

        void Awake()
        {
            _slots = new WeaponState[loadout.Length];
            for (int i = 0; i < loadout.Length; i++) _slots[i] = new WeaponState(WeaponTable.Get(loadout[i]));
            Current = _slots[0];
            _tracer = gameObject.AddComponent<LineRenderer>();
            _tracer.positionCount = 2; _tracer.startWidth = 0.02f; _tracer.endWidth = 0.005f; _tracer.enabled = false;
            _tracer.material = new Material(Shader.Find("Sprites/Default")); _tracer.startColor = new Color(1f, 0.85f, 0.4f, 0.9f); _tracer.endColor = new Color(1f, 0.85f, 0.4f, 0f);
        }

        void Update()
        {
            float dt = Time.deltaTime;
            if (HitMarkerTime > 0) HitMarkerTime -= dt;
            if (_tracerT > 0 && (_tracerT -= dt) <= 0) _tracer.enabled = false;
            var hp = motor ? motor.GetComponent<Damageable>() : null;
            var kb = Keyboard.current; var mouse = Mouse.current;
            bool canAct = kb != null && mouse != null && (!hp || hp.Alive) && Cursor.lockState == CursorLockMode.Locked
                          && (!GameDirector.Instance || GameDirector.Instance.State == GameDirector.Outcome.Playing);

            if (canAct)
            {
                for (int i = 0; i < _slots.Length && i < 9; i++)
                    if (kb[(Key)((int)Key.Digit1 + i)].wasPressedThisFrame && i != _slot) { _slot = i; Current = _slots[i]; Bloom = 0; }
                if (kb.rKey.wasPressedThisFrame) Current.StartReload();
                if (kb.vKey.wasPressedThisFrame) Current.CycleMode();
            }

            var w = Current.Stats;
            Aiming = canAct && mouse.rightButton.isPressed && !(motor && motor.IsSprinting);
            if (view) view.fieldOfView = Mathf.Lerp(view.fieldOfView, Aiming ? hipFov / w.Zoom : hipFov, Mathf.Min(1f, dt / Mathf.Max(0.05f, w.Ads)));

            bool trigger = canAct && mouse.leftButton.isPressed && !(motor && motor.IsSprinting);
            int shots = Current.Tick(dt, trigger);
            for (int s = 0; s < shots; s++) Fire(w);

            // bloom decays at (3 + 2b) deg/s, the same rule the web game's hitChance model assumes
            Bloom = Mathf.Max(0f, Bloom - (3f + 2f * Bloom) * dt);
        }

        void Fire(WeaponStats w)
        {
            Transform eye = view ? view.transform : transform;
            float cone = (Aiming ? w.AdsSpread : w.Spread) + Bloom + (motor && motor.IsCrouching ? -0.2f : 0f);
            cone = Mathf.Max(0.01f, cone);
            Vector3 end = eye.position + eye.forward * 300f;
            for (int p = 0; p < w.Pellets; p++)
            {
                Vector2 r = Random.insideUnitCircle * Mathf.Tan(cone * Mathf.Deg2Rad);
                Vector3 dir = (eye.forward + eye.right * r.x + eye.up * r.y).normalized;
                if (Physics.Raycast(eye.position, dir, out RaycastHit hit, 600f, hitMask, QueryTriggerInteraction.Ignore))
                {
                    end = hit.point;
                    var zone = hit.collider.GetComponent<HitZone>();
                    var target = zone ? zone.Owner : hit.collider.GetComponentInParent<Damageable>();
                    if (target && target.Alive && (!motor || target.gameObject != motor.gameObject))
                    {
                        float dmg = (float)Ballistics.DamageAt(w, hit.distance) * Ballistics.BodyMultiplier(zone ? zone.part : BodyPart.Torso);
                        target.ApplyDamage(dmg, eye.position);
                        HitMarkerTime = 0.18f; LastHitWasKill = !target.Alive;
                    }
                }
            }
            Bloom = Mathf.Min(3.5f, Bloom + ((Aiming ? w.AdsSpread : w.Spread) * 0.3f + 0.25f) * 0.16f * 3f);
            if (motor) motor.AddRecoil(w.RecoilV * (Aiming ? 0.55f : 1f), Random.Range(-w.RecoilH, w.RecoilH) * 0.5f);
            _tracer.SetPosition(0, eye.position + eye.forward * 0.6f - eye.up * 0.12f + eye.right * 0.12f);
            _tracer.SetPosition(1, end); _tracer.enabled = true; _tracerT = 0.04f;
            if (GameDirector.Instance) GameDirector.Instance.ReportNoise(eye.position, w.Loud);
        }
    }
}

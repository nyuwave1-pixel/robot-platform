using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SpecialSoldier
{
    /// <summary>G throws a frag grenade (web: weapons.throwGrenade): 3 grenades, 0.9 s between throws,
    /// look direction × 17 m/s + 4.5 m/s up + the player's own velocity. Sits next to WeaponController on the camera.</summary>
    public sealed class GrenadeThrower : MonoBehaviour
    {
        public PlayerMotor motor;
        public int grenades = 3;
        float _cool;
        Vector3 _lastPos;

        void Start() { if (!motor) motor = GetComponentInParent<PlayerMotor>(); _lastPos = motor ? motor.transform.position : transform.position; }

        void Update()
        {
            float dt = Time.deltaTime;
            if (_cool > 0f) _cool -= dt;
            Vector3 vel = motor && dt > 0f ? (motor.transform.position - _lastPos) / dt : Vector3.zero;
            if (motor) _lastPos = motor.transform.position;

            var kb = Keyboard.current;
            var hp = motor ? motor.GetComponent<Damageable>() : null;
            bool canAct = kb != null && (!hp || hp.Alive) && Cursor.lockState == CursorLockMode.Locked
                          && (!GameDirector.Instance || GameDirector.Instance.State == GameDirector.Outcome.Playing);
            if (!canAct || !kb.gKey.wasPressedThisFrame || grenades <= 0 || _cool > 0f) return;

            grenades--; _cool = Explosives.ThrowCooldown;
            var f = transform.forward;
            var v = Explosives.PlayerThrowVelocity(new Vec3(f.x, f.y, f.z), new Vec3(vel.x, 0f, vel.z));
            Grenade.Throw(transform.position + f * 0.5f, new Vector3(v.X, v.Y, v.Z), true, Explosives.HandGrenadeFuse);
        }
    }
}

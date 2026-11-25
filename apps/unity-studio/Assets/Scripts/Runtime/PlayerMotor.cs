using UnityEngine;
using UnityEngine.InputSystem;

namespace SpecialSoldier
{
    /// <summary>First-person movement: WASD, mouse look, Shift sprint, C/Ctrl crouch, Space jump.
    /// Speeds follow the web game (walk 4.2, sprint 6.5, crouch 2.0 m/s). Reads devices directly from the Input System.</summary>
    [RequireComponent(typeof(CharacterController))]
    public sealed class PlayerMotor : MonoBehaviour
    {
        public Transform cameraPivot;
        public float walkSpeed = 4.2f, sprintSpeed = 6.5f, crouchSpeed = 2.0f, jumpSpeed = 4.6f, gravity = 18f;
        public float lookSensitivity = 0.08f, standHeight = 1.8f, crouchHeight = 1.15f;
        public bool IsSprinting { get; private set; }
        public bool IsCrouching { get; private set; }
        public float Pitch { get; private set; }
        public Vector3 Eye => cameraPivot ? cameraPivot.position : transform.position + Vector3.up * 1.6f;

        CharacterController _cc;
        Damageable _health;
        float _vy, _recoilDebt, _stepT;

        void Awake() { _cc = GetComponent<CharacterController>(); _health = GetComponent<Damageable>(); }

        /// <summary>Weapon recoil: kicks the view up at once; 70% of the climb eases back down over the next frames.</summary>
        public void AddRecoil(float upDegrees, float sideDegrees)
        {
            Pitch = Mathf.Clamp(Pitch - upDegrees, -85f, 85f);
            _recoilDebt += upDegrees * 0.7f;
            transform.Rotate(0f, sideDegrees, 0f);
        }

        void Update()
        {
            if (_health && !_health.Alive) return;
            var kb = Keyboard.current; var mouse = Mouse.current;
            if (kb == null || mouse == null) return;
            float dt = Time.deltaTime;

            if (GameDirector.CursorCaptured)
            {
                Vector2 look = mouse.delta.ReadValue() * lookSensitivity;
                transform.Rotate(0f, look.x, 0f);
                Pitch = Mathf.Clamp(Pitch - look.y, -85f, 85f);
            }
            float recover = _recoilDebt * Mathf.Min(1f, dt * 8f);
            _recoilDebt -= recover; Pitch = Mathf.Clamp(Pitch + recover, -85f, 85f);
            if (cameraPivot) cameraPivot.localRotation = Quaternion.Euler(Pitch, 0f, 0f);

            Vector2 move = new Vector2((kb.dKey.isPressed ? 1 : 0) - (kb.aKey.isPressed ? 1 : 0), (kb.wKey.isPressed ? 1 : 0) - (kb.sKey.isPressed ? 1 : 0));
            if (move.sqrMagnitude > 1f) move.Normalize();
            IsCrouching = kb.cKey.isPressed || kb.leftCtrlKey.isPressed;
            IsSprinting = kb.leftShiftKey.isPressed && move.y > 0.1f && !IsCrouching && !mouse.rightButton.isPressed;
            float speed = IsCrouching ? crouchSpeed : IsSprinting ? sprintSpeed : walkSpeed;
            if (mouse.rightButton.isPressed) speed *= 0.6f;

            float h = Mathf.MoveTowards(_cc.height, IsCrouching ? crouchHeight : standHeight, dt * 4f);
            _cc.height = h; _cc.center = new Vector3(0f, h / 2f, 0f);
            if (cameraPivot) cameraPivot.localPosition = new Vector3(0f, h - 0.15f, 0f);

            if (_cc.isGrounded) { _vy = -1f; if (kb.spaceKey.wasPressedThisFrame && !IsCrouching) _vy = jumpSpeed; }
            else _vy -= gravity * dt;

            Vector3 v = (transform.right * move.x + transform.forward * move.y) * speed + Vector3.up * _vy;
            _cc.Move(v * dt);

            // footsteps are noise: sprinting is heard from 14 m, walking 6 m, crouching is silent
            if (_cc.isGrounded && move.sqrMagnitude > 0.01f && !IsCrouching && (_stepT -= dt) <= 0f)
            {
                _stepT = IsSprinting ? 0.32f : 0.5f;
                SliceFx.I.Step(transform.position, IsSprinting);
                if (GameDirector.Instance) GameDirector.Instance.ReportNoise(transform.position, IsSprinting ? 14f : 6f);
            }
        }
    }
}

using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>A Mission 04 security camera on the facility ceiling (Core.SecurityCam = the web rule). It sweeps, watches for you
    /// within 15 m and its cone with line of sight, and locks the level down when its meter reaches 1.2 (GameDirector.CameraAlarm).
    /// Ten points of damage shoot it out. Positions are kept in island coordinates so the Core cone test is the web one.</summary>
    [RequireComponent(typeof(Damageable))]
    public sealed class SecurityCamera : MonoBehaviour
    {
        public double islandX, islandZ, phase;
        public Transform head;
        public Renderer lens;
        public SecurityCam Model { get; private set; }
        PlayerMotor _player;

        void Awake()
        {
            Model = new SecurityCam(islandX, islandZ, phase);
            var hp = GetComponent<Damageable>(); hp.Configure(10f, 0f, 0.5f);
            hp.Died += () =>
            {
                Model.Dead = true;
                if (lens) lens.enabled = false;
                SliceFx.I.Impact(transform.position, Vector3.down, false, "metal");   // sparks (web fx.sparks)
            };
        }

        void Start() => _player = FindAnyObjectByType<PlayerMotor>();

        void Update()
        {
            if (Model.Dead) return;
            double yaw = Model.Yaw(Time.time);
            if (head) head.rotation = Quaternion.Euler(0f, (float)WebAngles.EnemyYawToWorldDeg(yaw), 0f);   // island yaw → Unity (z mirrored)
            var d = GameDirector.Instance;
            if (!d || d.CameraAlarmed || d.State != GameDirector.Outcome.Playing || !_player) return;
            var pi = IslandTerrain.ToIsland(_player.transform.position.x, _player.transform.position.y, _player.transform.position.z);
            bool sees = false;
            if (Model.InView(pi.x, pi.z, Time.time))
            {
                Vector3 eye = transform.position - Vector3.up * 0.2f, to = _player.Eye - eye;
                sees = !Physics.Raycast(eye + to.normalized * 0.5f, to.normalized, out RaycastHit hit, to.magnitude - 0.5f, ~0, QueryTriggerInteraction.Ignore)
                       || hit.collider.GetComponentInParent<PlayerMotor>() == _player;
            }
            if (Model.Step(Time.deltaTime, sees, _player.IsCrouching)) d.CameraAlarm(transform.position);
        }
    }
}

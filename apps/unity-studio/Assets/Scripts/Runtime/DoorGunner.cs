using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SpecialSoldier
{
    /// <summary>Mission 05 door-gunner set piece (web gunner.js, Core.DoorGun): the helicopter lifts off and orbits the port while you
    /// hold the right-hand M134 — limited arc, spin-up, heat and overheat — against three waves. Hitscan rounds with the door gun's
    /// range falloff and body-part damage; hits, kills and score count like on foot. Ends after 46 s ("gunnerDone").</summary>
    public sealed class DoorGunner : MonoBehaviour
    {
        public static DoorGunner Instance { get; private set; }
        public float T { get; set; }
        public readonly DoorGunBarrels Barrels = new DoorGunBarrels();
        GameDirector _d; Transform _heli, _pivot; Camera _cam; double _fx, _fy, _fz, _a0, _aim, _pitch = DoorGun.PitchStart;
        readonly bool[] _sent = new bool[DoorGun.Waves.Length];
        int _kills0, _shotN; bool _done; Transform _rotor;

        public static DoorGunner Begin(GameDirector d)
        {
            var g = d.gameObject.AddComponent<DoorGunner>(); g._d = d; Instance = g;
            g._heli = d.heli;
            if (d.heli) foreach (var t in d.heli.GetComponentsInChildren<Transform>(true)) if (t.name == "rotor") g._rotor = t;
            var hp = d.heli ? d.heli.position : d.player.transform.position;
            var isl = IslandTerrain.ToIsland(hp.x, hp.y, hp.z); g._fx = isl.x; g._fy = isl.y; g._fz = isl.z; g._a0 = DoorGun.StartAngle(isl.x, isl.z);
            g._kills0 = d.Mission != null ? d.Mission.Stats.Kills : 0;
            // web: G.enemies.clear() — whoever is left on the airfield is out of the picture
            foreach (var e in d.enemies) if (e) e.gameObject.SetActive(false);
            foreach (var m in FindObjectsByType<SquadMate>()) m.gameObject.SetActive(false);   // web: G.squad.clear() — they are aboard
            d.enemies.RemoveAll(e => !e || !e.gameObject.activeSelf);
            var p = d.player;
            if (p)
            {
                foreach (var b in p.GetComponentsInChildren<Behaviour>()) if (b is PlayerMotor || b is WeaponController || b is GrenadeThrower || b is GearController) b.enabled = false;
                var cc = p.GetComponent<CharacterController>(); if (cc) cc.enabled = false;
                g._pivot = p.cameraPivot; g._cam = p.GetComponentInChildren<Camera>();
            }
            d.Radio("ANGEL 1-2: Technicals and boats leaving the port — they want this bird. Door gun is yours!");
            return g;
        }

        void OnDestroy() { if (Instance == this) Instance = null; }

        void Update()
        {
            if (_done || !_d) return;
            float dt = Time.deltaTime; T += dt;
            for (int i = 0; i < DoorGun.Waves.Length; i++) if (!_sent[i] && T >= DoorGun.Waves[i].t) { _sent[i] = true; _d.SendWave("port" + i, DoorGun.Waves[i].list.Length); }

            var pose = DoorGun.Pose(T, _fx, _fy, _fz, _a0);
            if (_rotor) _rotor.Rotate(0f, 26f * Mathf.Rad2Deg * dt, 0f, Space.Self);
            if (_heli)
            {
                var hw = IslandTerrain.ToWorld(pose.x, pose.y, pose.z);
                _heli.position = new Vector3((float)hw.x, (float)hw.y, (float)hw.z);
                // web rotation.set(0.06, yaw, −0.12) under the z mirror: pitch kept, yaw 180° − yaw, roll changes sign
                _heli.rotation = Quaternion.Euler(0.06f * Mathf.Rad2Deg, (float)WebAngles.EnemyYawToWorldDeg(pose.yaw), T < DoorGun.LiftSeconds ? 0f : 0.12f * Mathf.Rad2Deg);
            }
            // aim inside the door's arc (web: rel ±1.25, pitch −1.15 … 0.3)
            var mouse = Mouse.current; bool alive = _d.player && _d.player.GetComponent<Damageable>().Alive;
            if (mouse != null && alive && GameDirector.CursorCaptured && !PauseMenu.IsOpen)
            {
                float s = SettingsStore.Current.LookDegreesPerPixel(1f, false) * Mathf.Deg2Rad; Vector2 md = mouse.delta.ReadValue();
                _aim = System.Math.Max(-DoorGun.AimArc, System.Math.Min(DoorGun.AimArc, _aim - md.x * s));
                _pitch = System.Math.Max(DoorGun.PitchMin, System.Math.Min(DoorGun.PitchMax, _pitch + md.y * s * (SettingsStore.Current.InvertY ? -1 : 1)));
            }
            var eye = DoorGun.DoorEye(pose.x, pose.y, pose.z, pose.yaw, _aim);
            var ew = IslandTerrain.ToWorld(eye.x, eye.y, eye.z); var eyeW = new Vector3((float)ew.x, (float)ew.y, (float)ew.z);
            if (_d.player)
            {
                var pt = _d.player.transform;
                pt.rotation = Quaternion.Euler(0f, (float)WebAngles.PlayerYawToWorldDeg(eye.camYaw), 0f);
                pt.position = eyeW - (_pivot ? _pivot.position - pt.position : Vector3.up * 1.65f);
                if (_pivot) _pivot.localRotation = Quaternion.Euler((float)(-_pitch * Mathf.Rad2Deg), 0f, -0.05f * Mathf.Rad2Deg);
            }

            bool trigger = alive && mouse != null && mouse.leftButton.isPressed && GameDirector.CursorCaptured && !PauseMenu.IsOpen;
            int shots = Barrels.Step(dt, trigger, out bool overheated);
            if (overheated) { _d.Radio("DOOR GUN OVERHEATED"); SliceFx.I.Click(); }
            for (int i = 0; i < shots; i++) Fire(eyeW);

            if (DoorGun.Over(T)) Finish();
        }

        void Fire(Vector3 eye)
        {
            var cam = _cam ? _cam.transform : transform;
            Vector2 r = Random.insideUnitCircle * Mathf.Tan(DoorGun.Spread * Mathf.Deg2Rad);
            Vector3 dir = (cam.forward + cam.right * r.x + cam.up * r.y).normalized;
            if (_d.Mission != null) _d.Mission.Stats.Shots++;
            if (Physics.Raycast(eye + dir * 1.2f, dir, out RaycastHit hit, 600f, ~0, QueryTriggerInteraction.Ignore))
            {
                var target = hit.collider.GetComponentInParent<Damageable>();
                var zone = hit.collider.GetComponent<HitZone>();
                if (target && target.Alive && !target.GetComponent<PlayerMotor>())
                {
                    var part = zone ? zone.part : BodyPart.Torso;
                    target.ApplyDamage((float)(DoorGun.DamageAt(hit.distance) * Ballistics.BodyMultiplier(part)), eye, part, true);
                    if (_d.Mission != null) _d.Mission.Stats.Hits++;
                    SliceFx.I.HitConfirm(!target.Alive);
                }
                SliceFx.I.Impact(hit.point, hit.normal, target, SliceFx.SurfaceOf(hit.collider));
            }
            if (++_shotN % 2 == 0) SliceFx.I.Shot(eye, true, 1f, "LMG");   // web: every second round is heard
            SliceFx.I.MuzzleFlash(eye + dir * 1.2f);
            _d.ReportNoise(eye, 110f);
        }

        void Finish()
        {
            _done = true;
            foreach (var e in _d.enemies) if (e && e.group == "port") e.gameObject.SetActive(false);   // web: G.enemies.clear()
            _d.enemies.RemoveAll(e => !e || !e.gameObject.activeSelf);
            _d.Radio("ANGEL 1-2: Port is clear. All souls aboard — SQUAD 07 is feet dry, heading home.");
            _d.Mission?.Flags.Add("gunnerDone");
            _d.Mission?.Tick(0f, _d);
        }

        /// <summary>HUD line while on the gun (web #gunnerHud).</summary>
        public string StatusLine => $"{DoorGun.Name}   HEAT {Mathf.RoundToInt((float)Barrels.Heat * 100)}%{(Barrels.Overheated ? " OVERHEATED" : "")}   " +
                                    $"EXFIL IN {Mathf.CeilToInt((float)(DoorGun.LiftSeconds + DoorGun.OrbitSeconds - T))} S   KILLS {(_d && _d.Mission != null ? _d.Mission.Stats.Kills - _kills0 : 0)}";
    }
}

using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.AI;

namespace SpecialSoldier
{
    /// <summary>A SQUAD 07 team-mate (web squad.js, Core.Squad): keeps formation behind you on the NavMesh, holds fire until contact
    /// ("weapons free"), then shoots short bursts at the nearest hostile it can see within 60 m. Stray rounds hurt it (35 %, blasts 50 %);
    /// at zero it goes down for 18 s and gets back up with 120 hp. Kills it makes count, without your style bonus.</summary>
    [RequireComponent(typeof(NavMeshAgent), typeof(Damageable))]
    public sealed class SquadMate : MonoBehaviour
    {
        public int index;
        public string Name => Squad.Names[Mathf.Clamp(index, 0, Squad.Names.Length - 1)];
        public bool Down { get; private set; }
        public bool Fighting => _tgt && _tgt.Alive;
        public bool WantsCrouch => Down || (Fighting && _speed == 0) || (_player && _player.IsCrouching && _speed == 0);
        public EnemyAgent Target => _tgt;

        NavMeshAgent _agent; Damageable _hp; PlayerMotor _player; EnemyAgent _tgt;
        float _think, _shotT, _pauseT = 1f, _downT, _speed; int _burst;
        static float _lastBark = -99f;

        void Awake()
        {
            _agent = GetComponent<NavMeshAgent>(); _hp = GetComponent<Damageable>();
            _hp.Configure((float)Squad.MaxHp, 0f, 0.5f);
            _hp.DamageFilter = (a, explosive) => a * (explosive ? Squad.BlastFactor : Squad.StrayRoundFactor);
            _hp.Died += GoDown;
            _think = index * 0.15f;
        }

        void Start()
        {
            _player = FindAnyObjectByType<PlayerMotor>();
            if (!_agent.enabled) _agent.enabled = true;
            if (!_agent.isOnNavMesh && NavMesh.SamplePosition(transform.position, out NavMeshHit nh, 6f, NavMesh.AllAreas)) _agent.Warp(nh.position);
            _agent.updateRotation = false; _agent.stoppingDistance = 0.4f;
        }

        void GoDown()
        {
            Down = true; _downT = (float)Squad.DownSeconds; _tgt = null;
            if (_agent.isOnNavMesh) _agent.ResetPath();
            if (GameDirector.Instance) GameDirector.Instance.Radio($"{Name}: I'm hit! Going down!");
        }

        void Update()
        {
            float dt = Time.deltaTime; var d = GameDirector.Instance;
            if (!_player || !d) return;
            if (Down)
            {
                if ((_downT -= dt) <= 0f)
                {
                    Down = false; _hp.Configure((float)Squad.MaxHp, 0f, 0.5f); _hp.Model.TakeDamage((float)(Squad.MaxHp - Squad.ReviveHp));
                    d.Radio($"{Name}: Back in the fight.");
                }
                return;
            }
            _hp.Model.Heal((float)Squad.RegenPerSecond * dt);

            // formation (island coordinates, web yaw)
            var me = IslandTerrain.ToIsland(transform.position.x, transform.position.y, transform.position.z);
            var pp = _player.transform.position; var pi = IslandTerrain.ToIsland(pp.x, pp.y, pp.z);
            double yaw = -_player.transform.eulerAngles.y * Mathf.Deg2Rad;   // Unity yaw → web camera yaw (WebAngles.PlayerYawToWorldDeg)
            var goal = Squad.FormationGoal(pi.x, pi.z, yaw, index);
            double dl = System.Math.Sqrt((goal.x - me.x) * (goal.x - me.x) + (goal.z - me.z) * (goal.z - me.z));
            if (Squad.NeedsRegroup(dl, pi.y - me.y)) { Regroup(goal); return; }
            _speed = (float)Squad.FollowSpeed(dl, Fighting);
            if (_agent.isOnNavMesh)
            {
                if (_speed > 0f)
                {
                    var gw = IslandTerrain.ToWorld(goal.x, pi.y, goal.z);
                    _agent.speed = _speed; _agent.SetDestination(new Vector3((float)gw.x, (float)gw.y, (float)gw.z));
                }
                else if (_agent.hasPath) _agent.ResetPath();
            }

            // targeting every 0.4 s: nearest hostile in sight within 60 m (combat ones only before "weapons free")
            if ((_think -= dt) <= 0f)
            {
                _think = (float)Squad.ThinkEvery;
                if (_tgt && !_tgt.Alive && Time.time - _lastBark > 6f) { _lastBark = Time.time; d.Radio($"{Name}: {Squad.Barks[Random.Range(0, Squad.Barks.Length)]}"); }
                _tgt = null; float best = (float)(Squad.TargetRange * Squad.TargetRange);
                Vector3 eye = transform.position + Vector3.up * 1.6f;
                foreach (var e in d.enemies)
                {
                    if (!e || !e.Alive || !e.gameObject.activeInHierarchy || e.Brain == null || !Squad.MayEngage(d.SquadWeaponsFree, e.Brain.State)) continue;
                    float d2 = (e.transform.position - transform.position).sqrMagnitude; if (d2 >= best) continue;
                    Vector3 aim = e.transform.position + Vector3.up * (e.Type.Vehicle ? 2f : 1.3f);
                    if (Physics.Linecast(eye, aim, out RaycastHit hit, ~0, QueryTriggerInteraction.Ignore) && hit.collider.GetComponentInParent<EnemyAgent>() != e) continue;
                    best = d2; _tgt = e;
                }
            }

            // facing: the target, the way it walks, or watching the flanks behind you (web)
            Vector3 face;
            if (Fighting) face = _tgt.transform.position - transform.position;
            else if (_speed > 0f && _agent.velocity.sqrMagnitude > 0.05f) face = _agent.velocity;
            else face = Quaternion.Euler(0f, (index == 0 ? -1f : 1f) * 28.6f, 0f) * -_player.transform.forward;   // web: P.yaw + π ± 0.5
            face.y = 0f;
            float off = 0f;
            if (face.sqrMagnitude > 0.01f)
            {
                var want = Quaternion.LookRotation(face);
                off = Quaternion.Angle(transform.rotation, want) * Mathf.Deg2Rad;
                transform.rotation = Quaternion.RotateTowards(transform.rotation, want, (float)Squad.TurnRate * Mathf.Rad2Deg * dt);
            }

            if (!Fighting) return;
            if (_burst > 0)
            {
                if ((_shotT -= dt) <= 0f) { _shotT = (float)Squad.ShotEvery; _burst--; Fire(); if (_burst == 0) _pauseT = (float)Squad.PauseAfterBurst(Random.value); }
            }
            else if ((_pauseT -= dt) <= 0f && off < Squad.AimTolerance) { _burst = Squad.BurstLength(Random.value); _shotT = 0f; }
        }

        void Fire()
        {
            var e = _tgt; Vector3 muzzle = transform.position + transform.forward * 0.7f + Vector3.up * (WantsCrouch ? 1.02f : 1.42f);
            float dist = Vector3.Distance(e.transform.position, transform.position);
            Vector3 aim = e.transform.position + Vector3.up * (e.Type.Vehicle ? 1.6f : 1.15f) - muzzle;
            aim += transform.right * (float)Squad.AimErrorSide(Random.value, dist) + Vector3.up * (float)Squad.AimErrorUp(Random.value);
            var dir = aim.normalized;
            if (Physics.Raycast(muzzle, dir, out RaycastHit hit, 300f, ~0, QueryTriggerInteraction.Ignore))
            {
                var target = hit.collider.GetComponentInParent<Damageable>(); var zone = hit.collider.GetComponent<HitZone>();
                if (target && target.GetComponent<EnemyAgent>())
                {
                    var part = zone ? zone.part : BodyPart.Torso;
                    target.ApplyDamage((float)(Squad.DamageAt(hit.distance) * Ballistics.BodyMultiplier(part)), muzzle, part, false);
                }
                SliceFx.I.Impact(hit.point, hit.normal, target, SliceFx.SurfaceOf(hit.collider));
            }
            SliceFx.I.Shot(muzzle, false, 0.8f, "ASSAULT RIFLE"); SliceFx.I.MuzzleFlash(muzzle);
            if (GameDirector.Instance) GameDirector.Instance.ReportNoise(muzzle, 110f);
        }

        /// <summary>web regroup(): back into formation next to you.</summary>
        void Regroup((double x, double z) goal)
        {
            var pp = _player.transform.position; var w = IslandTerrain.ToWorld(goal.x, IslandTerrain.ToIsland(pp.x, pp.y, pp.z).y, goal.z);
            var p = new Vector3((float)w.x, (float)w.y, (float)w.z);
            if (!NavMesh.SamplePosition(p, out NavMeshHit nh, 4f, NavMesh.AllAreas) && !NavMesh.SamplePosition(pp, out nh, 4f, NavMesh.AllAreas)) return;
            if (_agent.isOnNavMesh) _agent.Warp(nh.position); else transform.position = nh.position;
        }
    }
}

using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.AI;

namespace SpecialSoldier
{
    /// <summary>Enemy soldier: NavMeshAgent movement driven by the engine-free AwarenessBrain (PATROL → SUSPICIOUS → SEARCH →
    /// COMBAT ↔ RETREAT). Perception is a vision cone + line-of-sight raycast; gunfire is hitscan bursts with the type's spread.</summary>
    [RequireComponent(typeof(NavMeshAgent), typeof(Damageable))]
    public sealed class EnemyAgent : MonoBehaviour
    {
        public string typeId = "guard";
        public Transform[] patrolPoints;
        public bool hold;                         // stays at its post (snipers, turrets)
        public float eyeHeight = 1.6f;
        public LayerMask sightMask = ~0;

        public AwarenessBrain Brain { get; private set; }
        public EnemyType Type { get; private set; }
        public bool Alive => _hp && _hp.Alive;

        NavMeshAgent _agent;
        Damageable _hp;
        PlayerMotor _player;
        Damageable _playerHp;
        Vector3 _lastKnown, _home;
        float _think, _noise, _burstGap, _shotT;
        int _burstLeft, _patrolIndex;
        bool _seesNow;

        void Awake()
        {
            Type = System.Array.Find(EnemyType.All, t => t.Id == typeId) ?? EnemyType.Sentry;
            Brain = new AwarenessBrain(Type) { Hold = hold };
            _agent = GetComponent<NavMeshAgent>();
            _hp = GetComponent<Damageable>();
            _hp.Configure(Type.Hp, Type.Armor, 0.5f);
            _hp.Hit += (dmg, from) => { _lastKnown = from; Brain.OnDamaged(); if (_hp.Model.Health < Type.Hp * 0.35f) Brain.Retreat(); };
            _hp.Died += OnDied;
            _home = transform.position;
        }

        void Start()
        {
            _player = FindFirstObjectByType<PlayerMotor>();
            _playerHp = _player ? _player.GetComponent<Damageable>() : null;
            _agent.speed = 1.5f;
        }

        public void Hear(Vector3 pos, float radius)
        {
            float d = Vector3.Distance(pos, transform.position);
            if (d > radius) return;
            _noise = Mathf.Max(_noise, radius);
            if (Brain.State < AlertState.Combat) _lastKnown = pos;
            if (d < radius * 0.55f) Brain.Alert();
        }

        void Update()
        {
            if (!Alive) return;
            float dt = Time.deltaTime;
            if ((_think -= dt) <= 0f)
            {
                float td = Brain.State >= AlertState.Search ? 0.13f : 0.45f;   // same think rates as the web game
                _think = td;
                Perceive(td);
            }
            Move();
            if (Brain.State == AlertState.Combat) Shoot(dt);
        }

        void Perceive(float td)
        {
            _seesNow = false; float dist = 999f;
            if (_player && _playerHp && _playerHp.Alive)
            {
                Vector3 eye = transform.position + Vector3.up * eyeHeight, target = _player.Eye - Vector3.up * 0.15f;
                Vector3 to = target - eye; dist = to.magnitude;
                float half = Type.Fov * 0.5f * Mathf.Rad2Deg;
                bool inCone = Brain.State >= AlertState.Combat || Vector3.Angle(transform.forward, new Vector3(to.x, 0f, to.z)) < half || dist < 3.5f;
                if (dist < Type.Vision && inCone && Physics.Raycast(eye + to.normalized * 0.4f, to, out RaycastHit hit, dist, sightMask, QueryTriggerInteraction.Ignore))
                    _seesNow = hit.collider.GetComponentInParent<PlayerMotor>() == _player;
                if (_seesNow) _lastKnown = _player.transform.position;
            }
            var p = new Perception { SeesTarget = _seesNow, Distance = dist, TargetSprinting = _player && _player.IsSprinting, NoiseRadius = _noise };
            _noise = 0f;
            Brain.Tick(td, p);
        }

        void Move()
        {
            if (!_agent.isOnNavMesh) return;
            switch (Brain.State)
            {
                case AlertState.Patrol:
                    _agent.speed = 1.5f;
                    if (patrolPoints != null && patrolPoints.Length > 0 && !hold)
                    {
                        if (!_agent.hasPath || _agent.remainingDistance < 0.6f)
                        { _patrolIndex = (_patrolIndex + 1) % patrolPoints.Length; _agent.SetDestination(patrolPoints[_patrolIndex].position); }
                    }
                    else if (!hold && Vector3.Distance(transform.position, _home) > 1f) _agent.SetDestination(_home);
                    break;
                case AlertState.Suspicious:
                    _agent.ResetPath(); Face(_lastKnown);
                    break;
                case AlertState.Search:
                    _agent.speed = 2.7f;
                    if (!hold) _agent.SetDestination(_lastKnown); else Face(_lastKnown);
                    break;
                case AlertState.Combat:
                    _agent.speed = Type.Speed;
                    float d = Vector3.Distance(transform.position, _lastKnown);
                    if (hold || (_seesNow && d < 28f && d > 8f)) _agent.ResetPath();      // in a good band: stand and shoot
                    else if (_seesNow && d <= 8f) _agent.SetDestination(transform.position + (transform.position - _lastKnown).normalized * 6f);
                    else _agent.SetDestination(_lastKnown);
                    Face(_lastKnown);
                    break;
                case AlertState.Retreat:
                    _agent.speed = Type.Speed * 1.1f;
                    if (!hold && !_agent.hasPath) _agent.SetDestination(transform.position + (transform.position - _lastKnown).normalized * 18f);
                    break;
            }
        }

        void Face(Vector3 p)
        {
            Vector3 dir = p - transform.position; dir.y = 0f;
            if (dir.sqrMagnitude < 0.01f) return;
            transform.rotation = Quaternion.RotateTowards(transform.rotation, Quaternion.LookRotation(dir), 240f * Time.deltaTime);
        }

        void Shoot(float dt)
        {
            if (!_seesNow || !_playerHp || !_playerHp.Alive) { _burstLeft = 0; return; }
            if (_burstLeft <= 0)
            {
                if ((_burstGap -= dt) > 0f) return;
                _burstLeft = Random.Range(Type.BurstMin, Type.BurstMax + 1);
                _burstGap = Random.Range(0.6f, 1.4f) * Type.React;
            }
            if ((_shotT -= dt) > 0f) return;
            _shotT = 60f / Type.Rpm; _burstLeft--;

            Vector3 eye = transform.position + Vector3.up * eyeHeight;
            Vector3 dir = (_player.Eye - Vector3.up * 0.35f - eye).normalized;
            Vector2 r = Random.insideUnitCircle * Mathf.Tan(Type.Spread * Mathf.Deg2Rad);
            dir = (dir + transform.right * r.x + Vector3.up * r.y).normalized;
            if (Physics.Raycast(eye + dir * 0.4f, dir, out RaycastHit hit, Type.Vision * 1.5f, sightMask, QueryTriggerInteraction.Ignore))
            {
                var target = hit.collider.GetComponentInParent<Damageable>();
                if (target == _playerHp) target.ApplyDamage(Type.GunDamage, eye);
            }
            if (GameDirector.Instance) GameDirector.Instance.ReportNoise(eye, 110f);
        }

        void OnDied()
        {
            _agent.enabled = false;
            foreach (var c in GetComponentsInChildren<Collider>()) c.enabled = false;
            transform.rotation = Quaternion.Euler(-80f, transform.eulerAngles.y, 0f);   // simple fall until ragdolls arrive
            transform.position += Vector3.up * 0.3f;
        }
    }
}

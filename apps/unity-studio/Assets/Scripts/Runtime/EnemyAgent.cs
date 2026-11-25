using System.Collections.Generic;
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
        public string group = "outer";          // mission kill objectives count enemies by group
        public bool AlarmRaised { get; set; }    // this enemy's squad already called it in (mission stats)
        public float LastFireTime { get; private set; } = -999f;   // HUD radar shows enemies for 2.5 s after they fire
        /// <summary>When the recon drone last tagged this enemy (radar shows it for 30 s, web e.marked).</summary>
        public float MarkedTime { get; set; } = -999f;
        public float VisionNow { get; private set; }                // current sight range in metres (night, rain, your stance)
        public Transform[] patrolPoints;
        public bool hold;                         // stays at its post (snipers, turrets)
        /// <summary>Vehicles (APC): the part that turns toward the target (web: parts.turret, 1.3 rad/s). The hull never moves.</summary>
        public Transform turret;
        Quaternion _turretRest = Quaternion.identity;
        public float eyeHeight = 1.6f;
        public LayerMask sightMask = ~0;

        public AwarenessBrain Brain { get; private set; }
        public TacticsPlanner Tactics { get; private set; }
        public Vector3? Goal { get; private set; }            // current combat move goal (cover spot, flank point, ...)
        public bool InCover => _goalIsCover && AtGoal;
        public bool Hidden { get; private set; }               // ducked behind cover: does not shoot this moment
        /// <summary>Kneels: ducked behind cover, or reached its fall-back spot while retreating (web enemies.js wantCrouch).</summary>
        public bool WantsCrouch => Hidden || (Brain != null && Brain.State == AlertState.Retreat && AtGoal);
        /// <summary>A SoldierAnimator poses the model (crouch, death): the stand-in sink and tip-over below are skipped.</summary>
        public bool PoseDriven { get; set; }
        bool AtGoal => Goal.HasValue && _agent && _agent.isOnNavMesh && !_agent.pathPending && _agent.remainingDistance < 0.7f;

        static readonly List<EnemyAgent> Active = new List<EnemyAgent>();
        static readonly Collider[] Nearby = new Collider[96];
        readonly List<CoverBox> _boxes = new List<CoverBox>();
        readonly List<Vec2> _taken = new List<Vec2>();
        PeekCycle _peek;
        readonly GrenadeDecision _nades = new GrenadeDecision();
        bool _goalIsCover;
        Transform _visual; float _visualBaseY;
        public EnemyType Type { get; private set; }
        /// <summary>Mission 05: VIPER has dropped under half health (web e.phase = 2).</summary>
        public bool BossPhase2 { get; private set; }
        public bool Alive => _hp && _hp.Alive;

        NavMeshAgent _agent;
        Damageable _hp;
        PlayerMotor _player;
        Damageable _playerHp;
        Vector3 _lastKnown, _home;
        float _think, _noise, _burstGap, _shotT, _reactT;
        int _burstLeft, _patrolIndex;
        bool _seesNow;

        void Awake()
        {
            Type = System.Array.Find(EnemyType.All, t => t.Id == typeId) ?? EnemyType.Sentry;
            if (Type.Vehicle) { hold = true; eyeHeight = 2.6f; }   // web: vehicles hold, perceive from 2.6 m
            if (turret) _turretRest = Quaternion.Inverse(transform.rotation) * turret.rotation;
            Brain = new AwarenessBrain(Type) { Hold = hold, DifficultyDetect = GameDirector.CurrentDifficulty.Detect };
            // like the web game's engage(): a short, randomised pause before the first burst (shorter when it only heard you)
            Brain.StateChanged += (from, to) => { if (to == AlertState.Combat) _reactT = GameDirector.CurrentDifficulty.ReactionDelay(Type, Random.value, _seesNow); };
            var rng = new System.Random(name.GetHashCode() ^ transform.position.GetHashCode());   // GetInstanceID() is obsolete (error) in Unity 6.6
            Tactics = new TacticsPlanner(hold ? CombatBehavior.Hold : TacticsPlanner.BehaviorFor(Type), rng);
            _peek = new PeekCycle(rng);
            _agent = GetComponent<NavMeshAgent>();
            _hp = GetComponent<Damageable>();
            _hp.Configure(Type.Hp, Type.Armor, 0.5f);
            _hp.DamageFilter = Type.DamageTaken;   // vehicles: small arms ×0.1 (web damage())
            _hp.Hit += (dmg, from) => { _lastKnown = from; Brain.OnDamaged(); };   // falling back is decided by TacticsPlanner
            _hp.Hit += (dmg, from) =>
            {
                // web: VIPER below half health → phase 2 (faster, tighter spread, calls four more onto the runway)
                if (Type.Boss && !BossPhase2 && _hp.Alive && EnemyType.BossPhase2(_hp.Model.Health))
                { BossPhase2 = true; Type = EnemyType.ViperEnraged; if (GameDirector.Instance) GameDirector.Instance.OnBossPhase2(this); }
            };
            _hp.Died += OnDied;
            _home = transform.position;
        }

        void OnEnable() => Active.Add(this);
        void OnDisable() => Active.Remove(this);

        void Start()
        {
            _player = FindAnyObjectByType<PlayerMotor>();
            _playerHp = _player ? _player.GetComponent<Damageable>() : null;
            _agent.speed = 1.5f;
            // In the WebGL player the agents' OnEnable can run before NavMeshSurface.OnEnable adds the baked data,
            // leaving every agent "not on a NavMesh" for good. Start runs after all OnEnable calls: re-attach here.
            // The scene ships the agent disabled (SliceBuilder) so it never tries to attach before the data exists.
            if (!_agent.enabled) _agent.enabled = true;
            if (!_agent.isOnNavMesh)
            {
                bool found = NavMesh.SamplePosition(transform.position, out NavMeshHit nh, 4f, NavMesh.AllAreas);
                _agent.enabled = false; _agent.enabled = true;
                if (found && !_agent.isOnNavMesh) _agent.Warp(nh.position);
                if (!_agent.isOnNavMesh) Debug.LogWarning($"[Enemy] {name}: still no NavMesh (navmesh triangles: {NavMesh.CalculateTriangulation().indices.Length / 3})");
            }
            _visual = transform.Find("Visual");
            if (_visual) _visualBaseY = _visual.localPosition.y;
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
            // web vision range: night and rain from the current sky, the player's stance, alerted / combat rules (Core.AwarenessBrain.VisionRange)
            var sky = SkyDirector.Instance != null ? SkyDirector.Instance.Current : null;
            var stance = _player && _player.IsCrouching ? Stance.Crouch : Stance.Stand;
            float vision = Brain.VisionRange(sky != null ? sky.Night : 0f, stance, sky != null ? sky.Rain : 0f);
            VisionNow = vision;
            if (_player && _playerHp && _playerHp.Alive)
            {
                Vector3 eye = transform.position + Vector3.up * eyeHeight, target = _player.Eye - Vector3.up * 0.15f;
                Vector3 to = target - eye; dist = to.magnitude;
                float half = Type.Fov * 0.5f * Mathf.Rad2Deg;
                bool inCone = Brain.State >= AlertState.Combat || Vector3.Angle(transform.forward, new Vector3(to.x, 0f, to.z)) < half || dist < 3.5f;
                if (dist < vision && inCone && Physics.Raycast(eye + to.normalized * 0.4f, to, out RaycastHit hit, dist, sightMask, QueryTriggerInteraction.Ignore))
                    _seesNow = hit.collider.GetComponentInParent<PlayerMotor>() == _player;
                if (_seesNow) _lastKnown = _player.transform.position;
            }
            var p = new Perception { SeesTarget = _seesNow, Distance = dist, TargetSprinting = _player && _player.IsSprinting, NoiseRadius = _noise, VisionRange = vision };
            _noise = 0f;
            Brain.Tick(td, p);
            PlanCombat(td);
        }

        static Vec2 V(Vector3 v) => new Vec2(v.x, v.z);

        /// <summary>Re-plans the combat move with the engine-free TacticsPlanner (web: Enemies.plan + findCover).</summary>
        void PlanCombat(float td)
        {
            if (Brain.State < AlertState.Combat) { Goal = null; _goalIsCover = false; Hidden = false; return; }
            if (Brain.State != AlertState.Combat || hold) return;
            GatherCover();
            _taken.Clear();
            foreach (var o in Active) if (o != this && o.Alive && o.Goal.HasValue) _taken.Add(V(o.Goal.Value));
            var r = Tactics.Plan(td, V(transform.position), V(_lastKnown), _hp.Model.Health / _hp.Model.MaxHealth, InCover, _seesNow, _boxes, _taken);
            if (r.Replanned && Type.Grenades) TryThrowGrenade();
            if (!r.HasGoal) return;
            var g = new Vector3(r.Goal.X, transform.position.y, r.Goal.Z);
            if (NavMesh.SamplePosition(g, out NavMeshHit nh, 3f, NavMesh.AllAreas)) g = nh.position;
            Goal = g; _goalIsCover = r.InCover; _peek.Reset();
            if (r.Retreat)
            {
                Brain.Retreat();
                if (GameDirector.Instance) GameDirector.Instance.ReportNoise(transform.position, 80f);   // calls the squad (web: alertSquad 80 m)
            }
        }

        /// <summary>Lobs a grenade at the last known position when the player hides (web: plan → G.fx.grenade, fuse 2.9 s).</summary>
        void TryThrowGrenade()
        {
            if (!_player) return;
            float dist = Vector3.Distance(transform.position, _lastKnown);
            bool playerHiding = _player.IsCrouching && !_seesNow;   // the slice has no cover detection for the player yet
            if (!_nades.ShouldThrow(dist, playerHiding, _seesNow, Brain.SinceSeen)) return;
            Vector3 from = transform.position + Vector3.up * 1.6f + transform.forward * 0.5f;
            var v = Explosives.LobVelocity(new Vec3(from.x, from.y, from.z), new Vec3(_lastKnown.x, _lastKnown.y, _lastKnown.z));
            Grenade.Throw(from, new Vector3(v.X, v.Y, v.Z), false, Explosives.EnemyGrenadeFuse);
        }

        /// <summary>Static, solid obstacles within 40 m as top-down boxes. Enemies, the player and triggers are skipped.</summary>
        void GatherCover()
        {
            _boxes.Clear();
            int n = Physics.OverlapSphereNonAlloc(transform.position, 40f, Nearby, sightMask, QueryTriggerInteraction.Ignore);
            for (int i = 0; i < n; i++)
            {
                var c = Nearby[i];
                if (!c || c.attachedRigidbody || c.GetComponent<Grenade>() || c.GetComponentInParent<Damageable>() || c is CharacterController) continue;
                var b = c.bounds;
                bool usable = !c.gameObject.name.Contains("Glass") && !c.gameObject.name.Contains("Fence");
                _boxes.Add(new CoverBox(b.min.x, b.min.z, b.max.x, b.max.z, b.max.y - transform.position.y, usable));
            }
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
                case AlertState.Retreat:
                    _agent.speed = Type.Speed * (Brain.State == AlertState.Retreat ? 1.1f : 1f);
                    if (hold) _agent.ResetPath();
                    else if (Goal.HasValue)
                    {
                        if (!_agent.hasPath || (_agent.destination - Goal.Value).sqrMagnitude > 0.5f) _agent.SetDestination(Goal.Value);
                    }
                    else
                    {
                        // no plan yet: hold a sensible range (fallback from the first version)
                        float d = Vector3.Distance(transform.position, _lastKnown);
                        if (_seesNow && d < 28f && d > 8f) _agent.ResetPath();
                        else if (_seesNow && d <= 8f) _agent.SetDestination(transform.position + (transform.position - _lastKnown).normalized * 6f);
                        else if (Brain.State == AlertState.Combat) _agent.SetDestination(_lastKnown);
                    }
                    Hidden = _goalIsCover && AtGoal && _peek.Tick(Time.deltaTime);
                    if (!_goalIsCover || !AtGoal) _peek.Reset();
                    if (_seesNow || Brain.SinceSeen < 3f) Face(_lastKnown);
                    break;
            }
            if (Type.Vehicle && Brain.State >= AlertState.Search) Face(_lastKnown);   // web: the turret tracks the last known position
            if (_visual && !PoseDriven)
            {
                // duck behind cover: the model sinks 0.55 m (stand-in when there is no SoldierAnimator)
                var lp = _visual.localPosition;
                lp.y = Mathf.MoveTowards(lp.y, _visualBaseY - (Hidden ? 0.55f : 0f), Time.deltaTime * 3f);
                _visual.localPosition = lp;
            }
        }

        void Face(Vector3 p)
        {
            Vector3 dir = p - transform.position; dir.y = 0f;
            if (dir.sqrMagnitude < 0.01f) return;
            if (Type.Vehicle)
            {
                if (turret) turret.rotation = Quaternion.RotateTowards(turret.rotation, Quaternion.LookRotation(dir) * _turretRest, 1.3f * Mathf.Rad2Deg * Time.deltaTime);
                return;
            }
            transform.rotation = Quaternion.RotateTowards(transform.rotation, Quaternion.LookRotation(dir), 240f * Time.deltaTime);
        }

        void Shoot(float dt)
        {
            if (!_seesNow || !_playerHp || !_playerHp.Alive || Hidden) { _burstLeft = 0; return; }
            Vector3 gunFwd = Vector3.forward;
            if (Type.Vehicle && turret)
            {
                // the turret must be on target before it fires (web: fireLogic(..., |angle| small))
                gunFwd = turret.forward; gunFwd.y = 0f; gunFwd.Normalize();
                Vector3 toP = _player.transform.position - transform.position; toP.y = 0f;
                if (Vector3.Angle(gunFwd, toP) > 12f) return;
            }
            if (_reactT > 0f) { _reactT -= dt; return; }
            var diff = GameDirector.CurrentDifficulty;
            if (_burstLeft <= 0)
            {
                if ((_burstGap -= dt) > 0f) return;
                _burstLeft = Random.Range(Type.BurstMin, Type.BurstMax + 1);
                _burstGap = Random.Range(0.7f, 2.0f) * diff.React;     // web: 0.7–2.0 s pause between bursts
            }
            if ((_shotT -= dt) > 0f) return;
            _shotT = 60f / Type.Rpm; _burstLeft--; LastFireTime = Time.time;

            Vector3 eye = transform.position + Vector3.up * (Type.Vehicle ? Type.MuzzleHeight : eyeHeight);
            if (Type.Vehicle) eye += gunFwd * 3.2f;   // web: muzzle 3.2 m out along the turret
            Vector3 dir = (_player.Eye - Vector3.up * 0.35f - eye).normalized;
            float spread = diff.ShotSpread(Type, _agent.velocity.sqrMagnitude > 0.25f, Brain.StateTime);
            Vector2 r = Random.insideUnitCircle * Mathf.Tan(spread * Mathf.Deg2Rad);
            dir = (dir + transform.right * r.x + Vector3.up * r.y).normalized;
            if (Physics.Raycast(eye + dir * 0.4f, dir, out RaycastHit hit, Type.Vision * 1.5f, sightMask, QueryTriggerInteraction.Ignore))
            {
                var target = hit.collider.GetComponentInParent<Damageable>();
                if (target != _playerHp) SliceFx.I.Impact(hit.point, hit.normal, false, SliceFx.SurfaceOf(hit.collider));   // misses kick up dust near you
                if (target == _playerHp) target.ApplyDamage(Type.GunDamage * diff.Dmg, eye);
                else if (target && target.GetComponent<SquadMate>()) target.ApplyDamage(Type.GunDamage * diff.Dmg, eye);   // a team-mate in the way (its filter: 35 %)
                else
                {
                    // near miss: the round passed within 1.6 m of your head before it hit something (web: fx bullets → 'whiz')
                    Vector3 toEye = _player.Eye - eye; float along = Vector3.Dot(toEye, dir);
                    if (along > 0f && along < hit.distance && (toEye - dir * along).magnitude < 1.6f) SliceFx.I.Whiz();
                }
            }
            SliceFx.I.Shot(eye, false); SliceFx.I.MuzzleFlash(eye + dir * 0.6f);
            if (GameDirector.Instance) GameDirector.Instance.ReportNoise(eye, 110f);
        }

        void OnDied()
        {
            Goal = null; Hidden = false;
            _agent.enabled = false;
            foreach (var c in GetComponentsInChildren<Collider>()) c.enabled = false;
            if (Type.Vehicle)
            {
                // web: fx.explode(9 m) and the hull turns to burnt metal
                Vector3 c = transform.position + Vector3.up * 1.5f;
                Grenade.Flash(c); SliceFx.I.Explosion(c);
                if (GameDirector.Instance) GameDirector.Instance.ReportNoise(c, 120f);
                var mpb = new MaterialPropertyBlock(); var burnt = new Color(0.08f, 0.07f, 0.06f, 1f);
                foreach (var r in GetComponentsInChildren<Renderer>())
                { r.GetPropertyBlock(mpb); mpb.SetColor("_BaseColor", burnt); mpb.SetColor("baseColorFactor", burnt); r.SetPropertyBlock(mpb); }
                return;
            }
            if (PoseDriven) return;   // SoldierAnimator plays the death (UAL Death01, or the web pose's fall)
            transform.rotation = Quaternion.Euler(-80f, transform.eulerAngles.y, 0f);   // simple fall (no SoldierAnimator)
            transform.position += Vector3.up * 0.3f;
        }
    }
}

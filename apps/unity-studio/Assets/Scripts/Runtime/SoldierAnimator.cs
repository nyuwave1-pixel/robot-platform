using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.AI;

namespace SpecialSoldier
{
    /// <summary>Animates an enemy soldier. The game's soldier models are rigid parts on pivots (body, legL/legR, shinL/shinR,
    /// upper, arms, head — the web game's rig), not a skinned mesh. Two ways to move them:
    /// <list type="bullet">
    /// <item>With <see cref="rig"/> (an invisible Quaternius UAL Humanoid mannequin, CC0): its Animator plays motion clips and each
    /// pivot copies the rotation its bone made since the rest pose (hips → body, thighs → legs, calves → shins, chest → upper, head).</item>
    /// <item>Without it: the web game's procedural pose, Core.SoldierPose (same numbers as models.js poseSoldier).</item>
    /// </list>
    /// The rifle arms always follow the web aim rule (pitch toward the target) plus a small kick on each shot.</summary>
    [DefaultExecutionOrder(100)]
    public sealed class SoldierAnimator : MonoBehaviour
    {
        public Animator rig;
        public Transform visual;
        [Tooltip("+1: pivot angles as in the web game. Set −1 if legs bend the wrong way on screen (model imported mirrored).")]
        public float pitchSign = 1f;
        [Tooltip("Yaw between the mannequin's facing and the soldier model's facing (0 when both face +z).")]
        public float rigYaw = 0f;

        static readonly int SpeedId = Animator.StringToHash("Speed"), CrouchId = Animator.StringToHash("Crouch"),
            DeadId = Animator.StringToHash("Dead"), HitId = Animator.StringToHash("Hit"), HitHeadId = Animator.StringToHash("HitHead");

        EnemyAgent _enemy; NavMeshAgent _nav; Damageable _hp; PlayerMotor _player;
        Transform _body, _legL, _legR, _shinL, _shinR, _upper, _arms, _head;
        Quaternion _rLegL, _rLegR, _rShinL, _rShinR, _rUpper, _rArms, _rVisual; Vector3 _bodyRest;
        struct Link { public Transform bone, pivot; public Quaternion boneRest, pivotRest; }
        Link[] _links; Transform _hips; Vector3 _hipsRest; float _hipScale = 1f;
        SoldierGait _gait; double _dead;
        public bool HasPivots => _legL && _legR && _upper && _arms;
        public bool UsesRig => _links != null;
        public double Crouch => _gait?.Crouch ?? 0;
        public double Speed { get; private set; }

        void Awake()
        {
            _enemy = GetComponent<EnemyAgent>(); _nav = GetComponent<NavMeshAgent>(); _hp = GetComponent<Damageable>();
            if (!visual) visual = transform.Find("Visual");
            if (visual)
            {
                _body = Find("body"); _legL = Find("legL"); _legR = Find("legR"); _shinL = Find("shinL"); _shinR = Find("shinR");
                _upper = Find("upper"); _arms = Find("arms"); _head = Find("head");
            }
            if (!HasPivots) { enabled = false; return; }   // capsule fallback: nothing to animate
            _rLegL = _legL.localRotation; _rLegR = _legR.localRotation; _rUpper = _upper.localRotation; _rArms = _arms.localRotation;
            _rShinL = _shinL ? _shinL.localRotation : Quaternion.identity; _rShinR = _shinR ? _shinR.localRotation : Quaternion.identity;
            _rVisual = visual.localRotation; _bodyRest = _body ? _body.localPosition : Vector3.zero;
            _gait = new SoldierGait(Random.value * 6.0);   // web: walk starts at a random phase so a squad does not march in step
            if (_enemy) _enemy.PoseDriven = true;
            if (_hp) _hp.Hit += (dmg, from) => { if (UsesRig && _hp.Alive) rig.SetTrigger(_hp.LastHitPart == BodyPart.Head ? HitHeadId : HitId); };
        }

        Transform Find(string n)
        {
            foreach (var t in visual.GetComponentsInChildren<Transform>(true)) if (t.name == n) return t;
            return null;
        }

        void Start()
        {
            _player = FindAnyObjectByType<PlayerMotor>();
            if (rig && rig.avatar && rig.avatar.isHuman) Bind();
        }

        /// <summary>Captures the rest pose of both rigs (before the Animator's first update: the mannequin is in its bind pose).</summary>
        void Bind()
        {
            rig.applyRootMotion = false; rig.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            var list = new System.Collections.Generic.List<Link>();
            void L(HumanBodyBones b, Transform pivot)
            {
                var bone = rig.GetBoneTransform(b);
                if (bone && pivot) list.Add(new Link { bone = bone, pivot = pivot, boneRest = RootRel(bone), pivotRest = RootRel(pivot) });
            }
            // order matters: parents before children (world rotations are written in this order)
            L(HumanBodyBones.Hips, _body);
            L(HumanBodyBones.LeftUpperLeg, _legL); L(HumanBodyBones.LeftLowerLeg, _shinL);
            L(HumanBodyBones.RightUpperLeg, _legR); L(HumanBodyBones.RightLowerLeg, _shinR);
            L(rig.GetBoneTransform(HumanBodyBones.UpperChest) ? HumanBodyBones.UpperChest : HumanBodyBones.Chest, _upper);
            L(HumanBodyBones.Head, _head);
            if (list.Count < 5) { Debug.LogWarning($"[Anim] {name}: UAL rig mapped only {list.Count} bones — procedural pose"); return; }
            _links = list.ToArray();
            _hips = rig.GetBoneTransform(HumanBodyBones.Hips);
            _hipsRest = transform.InverseTransformPoint(_hips.position);
            float soldierHip = _legL.position.y - transform.position.y;                       // 0.93 m on the game's soldier
            _hipScale = _hipsRest.y > 0.2f ? soldierHip / _hipsRest.y : 1f;
        }

        Quaternion RootRel(Transform t) => Quaternion.Inverse(transform.rotation) * t.rotation;

        void Update()
        {
            float dt = Time.deltaTime;
            Vector3 v = _nav && _nav.enabled ? _nav.velocity : Vector3.zero; v.y = 0f;
            Speed = v.magnitude;
            bool alive = !_hp || _hp.Alive;
            double wantCrouch = alive && _enemy && _enemy.WantsCrouch ? 1 : 0;
            _gait.Step(dt, Speed, alive && Speed > 0.15f, wantCrouch);
            if (!alive) _dead = SoldierPose.Damp(_dead, 1, 6, dt);
            if (UsesRig)
            {
                rig.SetFloat(SpeedId, (float)Speed, 0.12f, dt);
                rig.SetFloat(CrouchId, (float)_gait.Crouch);
                rig.SetBool(DeadId, !alive);
            }
        }

        void LateUpdate()
        {
            bool alive = !_hp || _hp.Alive;
            double aim = -0.25;
            if (alive && _enemy && _enemy.Brain != null && _enemy.Brain.State >= AlertState.Combat && _player)
            {
                Vector3 to = _player.transform.position - transform.position;
                aim = SoldierPose.Aim(true, to.y, new Vector2(to.x, to.z).magnitude);
            }
            if (alive && _enemy && Time.time - _enemy.LastFireTime < 0.07f) aim += 0.09;   // muzzle climb on each shot

            var pose = SoldierPose.Pose(_gait.Walk, _gait.MoveK, _gait.Crouch, aim, false, _dead);
            if (UsesRig) FollowRig();
            else
            {
                Pitch(_legL, _rLegL, pose.LegL); Pitch(_legR, _rLegR, pose.LegR);
                Pitch(_shinL, _rShinL, pose.ShinL); Pitch(_shinR, _rShinR, pose.ShinR);
                Pitch(_upper, _rUpper, pose.Upper);
                if (_body) _body.localPosition = _bodyRest + Vector3.up * (float)pose.BodyY;
                visual.localRotation = _rVisual * Quaternion.Euler(pitchSign * (float)(pose.Tilt * Mathf.Rad2Deg), 0f, 0f);
            }
            Pitch(_arms, _rArms, pose.Arms);   // the rifle: web aim rule on top of the torso
        }

        void Pitch(Transform t, Quaternion rest, double rad)
        {
            if (t) t.localRotation = rest * Quaternion.Euler(pitchSign * (float)(rad * Mathf.Rad2Deg), 0f, 0f);
        }

        void FollowRig()
        {
            var yaw = Quaternion.Euler(0f, rigYaw, 0f); var yawInv = Quaternion.Inverse(yaw);
            foreach (var l in _links)
            {
                var delta = RootRel(l.bone) * Quaternion.Inverse(l.boneRest);        // what the bone did since its rest pose
                l.pivot.rotation = transform.rotation * (yaw * delta * yawInv) * l.pivotRest;
            }
            if (_body && _hips)
            {
                Vector3 d = transform.InverseTransformPoint(_hips.position) - _hipsRest;   // hips sway, crouch drop, fall
                _body.localPosition = _bodyRest + yaw * d * _hipScale;
            }
        }
    }
}

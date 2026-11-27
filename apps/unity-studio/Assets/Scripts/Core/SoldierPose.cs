using System;

namespace SpecialSoldier.Core
{
    /// <summary>Joint angles of the game's soldier model (the pivots the Blender and Higgsfield soldiers share: body, legL/legR,
    /// shinL/shinR, upper, arms, head). Angles are rotations about the model's x axis in radians, exactly the values the web
    /// game writes to <c>rotation.x</c>; BodyY is the hip drop in metres, Tilt the whole-model pitch when dead.</summary>
    public struct SoldierPoseAngles
    {
        public double LegL, LegR, ShinL, ShinR, Upper, Arms, BodyY, Tilt;
    }

    /// <summary>The web game's procedural soldier animation: a line-by-line port of apps/special-soldier/src/game/models.js
    /// poseSoldier() and the gait update in enemies.js (moveK, walk phase, crouch). SoldierPoseTests compares it with numbers
    /// the JavaScript produced (Tools~/gen-pose-fixture.mjs). The Unity soldier uses it when the Quaternius animation rig is
    /// missing, and always for the rifle arms (aim pitch).</summary>
    public static class SoldierPose
    {
        public static SoldierPoseAngles Pose(double walk = 0, double moveK = 0, double crouch = 0, double aim = 0, bool sit = false, double dead = 0)
        {
            var p = new SoldierPoseAngles();
            double sw = Math.Sin(walk) * 0.55 * moveK;
            if (sit)
            {
                p.LegL = p.LegR = -1.45; p.ShinL = p.ShinR = Math.Min(2.3, 1.45);
                p.BodyY = -0.52; p.Upper = 0.12; p.Arms = 0.35;
                return p;
            }
            // gait: the swinging leg folds at the knee, the planted leg stays almost straight; crouch = left knee up, right knee down (kneel)
            double c = Math.Cos(walk), lift = 0.95 * moveK;
            p.ShinL = Math.Min(2.3, crouch * 2.0 + (Math.Max(0, -c) * lift + 0.08 * moveK) * (1 - crouch * 0.6));
            p.ShinR = Math.Min(2.3, crouch * 1.05 + (Math.Max(0, c) * lift + 0.08 * moveK) * (1 - crouch * 0.6));
            p.LegL = sw - crouch * 1.1; p.LegR = -sw + crouch * 0.5;
            p.BodyY = -crouch * 0.42 - 0.93 * (1 - Math.Cos(sw));   // hips drop with the planted leg's angle, so both feet stay down
            p.Upper = crouch * 0.25 + moveK * 0.1; p.Arms = -aim - crouch * 0.2;
            p.Tilt = -dead * 1.5;
            return p;
        }

        /// <summary>web util.damp: frame-rate independent approach of a toward b.</summary>
        public static double Damp(double a, double b, double k, double dt) => a + (b - a) * (1 - Math.Exp(-k * dt));

        /// <summary>Rifle pitch toward a target (web enemies.js): atan2(target height + 1.1 − own height − 1.4, max(2, distance)),
        /// clamped to ±0.6 rad; −0.25 (muzzle down) when not fighting.</summary>
        public static double Aim(bool fighting, double heightDiff, double distance) =>
            fighting ? Clamp(Math.Atan2(heightDiff + 1.1 - 1.4, Math.Max(2, distance)), -0.6, 0.6) : -0.25;

        static double Clamp(double v, double a, double b) => v < a ? a : v > b ? b : v;
    }

    /// <summary>Per-soldier gait state (web enemies.js: e.moveK, e.walk, e.crouch).</summary>
    public sealed class SoldierGait
    {
        public double Walk, MoveK, Crouch;

        public SoldierGait(double walkPhase = 0) { Walk = walkPhase; }

        /// <summary>moveK eases toward 1 while moving (rate 8), the walk phase advances 2.6 rad per metre, crouch eases (rate 9).</summary>
        public void Step(double dt, double speed, bool moving, double wantCrouch)
        {
            MoveK = SoldierPose.Damp(MoveK, moving ? 1 : 0, 8, dt);
            Walk += speed * dt * 2.6 * MoveK;
            Crouch = SoldierPose.Damp(Crouch, wantCrouch, 9, dt);
        }
    }

    /// <summary>Which Quaternius Universal Animation Library clip plays for a movement state, and the Animator parameter values.
    /// Speeds are the clips' natural ground speeds (m/s) used as blend thresholds: below WalkSpeed the soldier blends idle → walk,
    /// above it walk → jog → sprint. Enemy speeds: patrol 1.5, search 2.7, combat EnemyType.Speed.</summary>
    public static class SoldierClips
    {
        public const string Idle = "Idle_Loop", Walk = "Walk_Loop", Jog = "Jog_Fwd_Loop", Sprint = "Sprint_Loop",
            CrouchIdle = "Crouch_Idle_Loop", CrouchWalk = "Crouch_Fwd_Loop", Hit = "Hit_Chest", HitHead = "Hit_Head", Death = "Death01";
        public const float WalkSpeed = 1.5f, JogSpeed = 3.5f, SprintSpeed = 6f, CrouchWalkSpeed = 1.6f;

        /// <summary>Every clip the soldier controller needs (the import keeps these; checked against the UAL file list).</summary>
        public static readonly string[] Required = { Idle, Walk, Jog, Sprint, CrouchIdle, CrouchWalk, Hit, HitHead, Death };

        /// <summary>UAL convention: clips that end in "_Loop" loop (Quaternius Unity setup, step 3).</summary>
        public static bool Loops(string clip) => clip != null && clip.EndsWith("_Loop", StringComparison.Ordinal);

        /// <summary>The standing clip that dominates at this speed (for logs and tests; the Animator blends between them).</summary>
        public static string Dominant(double speed, double crouch)
        {
            if (crouch >= 0.5) return speed < CrouchWalkSpeed * 0.5 ? CrouchIdle : CrouchWalk;
            if (speed < WalkSpeed * 0.5) return Idle;
            if (speed < (WalkSpeed + JogSpeed) * 0.5) return Walk;
            if (speed < (JogSpeed + SprintSpeed) * 0.5) return Jog;
            return Sprint;
        }
    }
}

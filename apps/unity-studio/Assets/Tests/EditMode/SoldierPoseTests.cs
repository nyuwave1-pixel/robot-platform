using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Core.SoldierPose against the web game's poseSoldier() (PoseFixture.g.cs from Tools~/gen-pose-fixture.mjs), and the
    /// Quaternius clip list against the UAL file the project ships.</summary>
    public sealed class SoldierPoseTests
    {
        const double Eps = 1e-12;

        [Test]
        public void PoseMatchesTheWebGame()
        {
            foreach (var f in PoseFixture.Poses)
            {
                var p = SoldierPose.Pose(f.walk, f.moveK, f.crouch, f.aim, f.sit, f.dead);
                string at = $"walk {f.walk} moveK {f.moveK} crouch {f.crouch} aim {f.aim} sit {f.sit} dead {f.dead}";
                Assert.That(p.LegL, Is.EqualTo(f.legL).Within(Eps), "legL " + at);
                Assert.That(p.LegR, Is.EqualTo(f.legR).Within(Eps), "legR " + at);
                Assert.That(p.ShinL, Is.EqualTo(f.shinL).Within(Eps), "shinL " + at);
                Assert.That(p.ShinR, Is.EqualTo(f.shinR).Within(Eps), "shinR " + at);
                Assert.That(p.Upper, Is.EqualTo(f.upper).Within(Eps), "upper " + at);
                Assert.That(p.Arms, Is.EqualTo(f.arms).Within(Eps), "arms " + at);
                Assert.That(p.BodyY, Is.EqualTo(f.bodyY).Within(Eps), "body y " + at);
                Assert.That(p.Tilt, Is.EqualTo(f.tilt).Within(Eps), "tilt " + at);
            }
        }

        [Test]
        public void GaitMatchesTheWebGame()
        {
            var g = new SoldierGait(0.5);
            int k = 0;
            for (int i = 0; i < 60; i++)
            {
                double dt = 1.0 / 60 + (i % 7) * 0.003, speed = i < 30 ? 1.5 : 3.2;
                g.Step(dt, speed, i < 45, i >= 40 ? 1 : 0);
                if (i % 6 != 5) continue;
                var f = PoseFixture.Gait[k++];
                Assert.That(f.frame, Is.EqualTo(i));
                Assert.That(g.Walk, Is.EqualTo(f.walk).Within(1e-9), $"walk @{i}");
                Assert.That(g.MoveK, Is.EqualTo(f.moveK).Within(1e-12), $"moveK @{i}");
                Assert.That(g.Crouch, Is.EqualTo(f.crouch).Within(1e-12), $"crouch @{i}");
            }
            Assert.That(k, Is.EqualTo(PoseFixture.Gait.Length));
        }

        [Test]
        public void StandingStillIsUpright_CrouchKneels_DeadFallsBack()
        {
            var still = SoldierPose.Pose();
            Assert.That(still.LegL, Is.EqualTo(0)); Assert.That(still.ShinL, Is.EqualTo(0)); Assert.That(still.BodyY, Is.EqualTo(0));
            var kneel = SoldierPose.Pose(crouch: 1);
            Assert.That(kneel.ShinL, Is.GreaterThan(kneel.ShinR), "left knee up, right knee down");
            Assert.That(kneel.BodyY, Is.EqualTo(-0.42).Within(1e-12), "hips drop 0.42 m");
            Assert.That(SoldierPose.Pose(dead: 1).Tilt, Is.EqualTo(-1.5).Within(1e-12));
        }

        [Test]
        public void AimPitchFollowsTheWebRule()
        {
            Assert.That(SoldierPose.Aim(false, 0, 10), Is.EqualTo(-0.25), "muzzle down when not fighting");
            Assert.That(SoldierPose.Aim(true, 0.3, 10), Is.EqualTo(0).Within(1e-12), "level when the target's chest is level with the gun");
            Assert.That(SoldierPose.Aim(true, 50, 3), Is.EqualTo(0.6), "clamped up");
            Assert.That(SoldierPose.Aim(true, -50, 3), Is.EqualTo(-0.6), "clamped down");
        }

        [Test]
        public void ClipChoiceAndLooping()
        {
            Assert.That(SoldierClips.Dominant(0, 0), Is.EqualTo(SoldierClips.Idle));
            Assert.That(SoldierClips.Dominant(1.5, 0), Is.EqualTo(SoldierClips.Walk), "patrol speed");
            Assert.That(SoldierClips.Dominant(2.7, 0), Is.EqualTo(SoldierClips.Jog), "search speed");
            Assert.That(SoldierClips.Dominant(6.5, 0), Is.EqualTo(SoldierClips.Sprint));
            Assert.That(SoldierClips.Dominant(0, 1), Is.EqualTo(SoldierClips.CrouchIdle));
            Assert.That(SoldierClips.Dominant(1.5, 1), Is.EqualTo(SoldierClips.CrouchWalk));
            Assert.That(SoldierClips.Loops(SoldierClips.Walk), Is.True);
            Assert.That(SoldierClips.Loops(SoldierClips.Death), Is.False);
            Assert.That(SoldierClips.Loops(SoldierClips.Hit), Is.False);
        }

        /// <summary>Every clip the controller asks for is in the shipped Quaternius file (FBX stores take names as plain text).</summary>
        [Test]
        public void RequiredClipsAreInTheShippedUalFile()
        {
            string fbx = FindUp(Path.Combine("apps", "unity-studio", "Assets", "ThirdParty", "Quaternius", "UAL", "UAL1_Standard.fbx"));
            if (fbx == null) Assert.Ignore("UAL1_Standard.fbx not present (node apps/unity-studio/Tools~/fetch-ual.mjs)");
            byte[] bytes = File.ReadAllBytes(fbx);
            foreach (var clip in SoldierClips.Required) Assert.That(Contains(bytes, System.Text.Encoding.ASCII.GetBytes(clip)), Is.True, clip);
        }

        static bool Contains(byte[] hay, byte[] needle)
        {
            for (int i = 0; i <= hay.Length - needle.Length; i++)
            {
                int j = 0; while (j < needle.Length && hay[i + j] == needle[j]) j++;
                if (j == needle.Length) return true;
            }
            return false;
        }

        static string FindUp(string rel)
        {
            for (var dir = new DirectoryInfo(TestContext.CurrentContext.TestDirectory); dir != null; dir = dir.Parent)
            {
                string p = Path.Combine(dir.FullName, rel);
                if (File.Exists(p)) return p;
            }
            return null;
        }
    }
}

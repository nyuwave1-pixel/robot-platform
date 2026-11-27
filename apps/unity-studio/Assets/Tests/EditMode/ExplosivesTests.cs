using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class ExplosivesTests
    {
        [Test]
        public void DamageFallsOffLinearlyToTheRadius()
        {
            Assert.That(Explosives.Damage(0, true), Is.EqualTo(170f).Within(1e-3));
            Assert.That(Explosives.Damage(3.75f, true), Is.EqualTo(85f).Within(1e-3));
            Assert.That(Explosives.Damage(7.5f, true), Is.EqualTo(0f).Within(1e-3));
            Assert.That(Explosives.Damage(8f, true), Is.EqualTo(0f));
        }

        [Test]
        public void WallsCutDamageExceptPointBlank()
        {
            Assert.That(Explosives.Damage(3f, false), Is.EqualTo(Explosives.Damage(3f, true) * 0.25f).Within(1e-3));
            Assert.That(Explosives.Damage(1f, false), Is.EqualTo(Explosives.Damage(1f, true)).Within(1e-3), "within 1.5 m cover does not help");
        }

        [Test]
        public void LobLandsOnTheTargetAfterTheFlightTime()
        {
            var from = new Vec3(0, 1.6f, 0); var target = new Vec3(12, 0, 20);
            var v = Explosives.LobVelocity(from, target);
            var p = Explosives.PositionAt(from, v, Explosives.EnemyFlightTime);
            Assert.That(Vec3.Distance(p, target), Is.LessThan(1e-3f));
            Assert.That(v.Y, Is.GreaterThan(0), "it is a lob, not a line drive");
        }

        [Test]
        public void PlayerThrowMatchesTheWebGame()
        {
            var v = Explosives.PlayerThrowVelocity(new Vec3(0, 0, 1), new Vec3(1, 0, 0));
            Assert.That(v.X, Is.EqualTo(1f)); Assert.That(v.Y, Is.EqualTo(4.5f)); Assert.That(v.Z, Is.EqualTo(17f));
            // thrown level from eye height (1.6 m), standing still: first touchdown about 20 m away
            var still = Explosives.PlayerThrowVelocity(new Vec3(0, 0, 1), new Vec3(0, 0, 0));
            float t = (4.5f + (float)System.Math.Sqrt(4.5 * 4.5 + 2 * 9.81 * 1.6)) / 9.81f;
            var land = Explosives.PositionAt(new Vec3(0, 1.6f, 0), still, t);
            Assert.That(land.Y, Is.EqualTo(0f).Within(1e-3));
            Assert.That(land.Z, Is.InRange(19.5f, 21f), "a level throw carries ~20 m before the first bounce");
        }

        [Test]
        public void EnemyThrowsOnlyWithinRangeWhenYouHideAndThenWaits()
        {
            var d = new GrenadeDecision();
            Assert.That(d.ShouldThrow(20, false, true, 0), Is.False, "you are in the open and visible: keep shooting");
            Assert.That(new GrenadeDecision().ShouldThrow(5, true, false, 1), Is.False, "too close");
            Assert.That(new GrenadeDecision().ShouldThrow(40, true, false, 1), Is.False, "too far");
            var e = new GrenadeDecision();
            Assert.That(e.ShouldThrow(20, true, false, 1), Is.True, "flush you out of cover");
            int plans = 0; while (!e.ShouldThrow(20, true, false, 1)) plans++;
            Assert.That(plans, Is.EqualTo(4), "cooldown 14 at 3 per plan = 5th plan throws again");
            Assert.That(new GrenadeDecision().ShouldThrow(20, false, false, 5), Is.True, "lost sight under 8 s ago");
            Assert.That(new GrenadeDecision().ShouldThrow(20, false, false, 9), Is.False, "lost you long ago");
        }

        [Test]
        public void OnlyGrenadierTypesThrow()
        {
            Assert.That(EnemyType.Elite.Grenades, Is.True);
            Assert.That(EnemyType.Sentry.Grenades || EnemyType.Assault.Grenades || EnemyType.Heavy.Grenades || EnemyType.Sniper.Grenades, Is.False);
        }

        [Test]
        public void ConstantsMatchTheWebSource()
        {
            string fx = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), System.AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && fx == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "fx.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "fx.js") })
                        if (File.Exists(p)) { fx = File.ReadAllText(p); break; }
            if (fx == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("radius: opt.radius || 7.5", fx);
            StringAssert.Contains("dmg: opt.dmg || 170", fx);
            StringAssert.Contains("fuse: opt.fuse ?? 2.8", fx);
            StringAssert.Contains("n.v.multiplyScalar(0.38)", fx);
            StringAssert.Contains("k *= 0.25", fx);
            StringAssert.Contains("owner === 'player' ? 0.6 : 1", fx);
            Assert.That(Regex.IsMatch(fx, @"GRAV = 9\.81"));
        }
    }
}

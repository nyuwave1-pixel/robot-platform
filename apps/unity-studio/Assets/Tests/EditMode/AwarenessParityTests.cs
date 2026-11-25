using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Enemy perception matches apps/special-soldier/src/game/enemies.js (vision range modifiers, meter drain).</summary>
    public class AwarenessParityTests
    {
        [Test]
        public void VisionShrinksAtNightCrouchedAndInRain()
        {
            var b = new AwarenessBrain(EnemyType.Sentry);   // base vision 72 m
            Assert.That(b.VisionRange(0, Stance.Stand, 0), Is.EqualTo(72f).Within(1e-4));
            Assert.That(b.VisionRange(1, Stance.Stand, 0), Is.EqualTo(36f).Within(1e-4), "full night halves it");
            Assert.That(b.VisionRange(0, Stance.Crouch, 0), Is.EqualTo(72f * 0.72f).Within(1e-4));
            Assert.That(b.VisionRange(0, Stance.Stand, 1), Is.EqualTo(72f * 0.8f).Within(1e-4), "heavy rain −20 %");
            Assert.That(b.VisionRange(0, Stance.Stand, 5), Is.EqualTo(72f * 0.7f).Within(1e-4), "rain caps at −30 %");
            Assert.That(b.VisionRange(0, Stance.Stand, 0, flashlight: true), Is.EqualTo(108f).Within(1e-4));
            b.DifficultyDetect = 1.3f; Assert.That(b.VisionRange(0, Stance.Stand, 0), Is.EqualTo(72f * 1.3f).Within(1e-3), "VETERAN");
        }

        [Test]
        public void AlertedEnemiesSeeFurtherAndCombatKeepsNinetyPercent()
        {
            var b = new AwarenessBrain(EnemyType.Sentry);
            b.Alert();
            Assert.That(b.VisionRange(0, Stance.Stand, 0), Is.EqualTo(90f).Within(1e-4));
            b.OnDamaged();   // combat
            Assert.That(b.VisionRange(1, Stance.Crouch, 1), Is.EqualTo(72f * 0.9f).Within(1e-4), "night + crouch + rain can't hide you mid-fight");
        }

        [Test]
        public void NightCrouchingLetsYouGetCloser()
        {
            float SpotTime(float night, Stance st, float dist)
            {
                var b = new AwarenessBrain(EnemyType.Sentry);
                float vr = b.VisionRange(night, st, 0);
                for (int i = 1; i < 400; i++) { b.Tick(0.13f, new Perception { SeesTarget = dist < vr, Distance = dist, VisionRange = vr }); if (b.State == AlertState.Combat) return i * 0.13f; }
                return float.PositiveInfinity;
            }
            Assert.That(SpotTime(0, Stance.Stand, 30), Is.LessThan(5f));
            Assert.That(SpotTime(1, Stance.Crouch, 30), Is.EqualTo(float.PositiveInfinity), "30 m is beyond a sentry's 26 m night/crouch sight");
        }

        [Test]
        public void MeterDrainsWhileUnseenEvenInCombat()
        {
            var b = new AwarenessBrain(EnemyType.Assault);
            b.OnDamaged();
            for (int i = 0; i < 50; i++) b.Tick(0.13f, default);
            Assert.That(b.State, Is.EqualTo(AlertState.Search));
            Assert.That(b.Detect, Is.EqualTo(0f).Within(1e-5), "drained to 0 by the time it searches, so it doesn't snap back to combat");
            for (int i = 0; i < 10; i++) b.Tick(0.13f, default);
            Assert.That(b.State, Is.EqualTo(AlertState.Search));
        }

        [Test]
        public void FormulaMatchesTheWebSource()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "enemies.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "enemies.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("let vr = t.vision * (1 - G.sky.night * 0.5) * [1, 0.72, 0.5][P.stance] * D.detect * (e.alerted ? 1.25 : 1) * (G.gear.light ? 1.5 : 1) * (1 - Math.min(0.3, G.sky.rainAmt * 0.2));", js);
            StringAssert.Contains("if (e.state === ST.COMBAT) vr = Math.max(vr, t.vision * 0.9);", js);
            StringAssert.Contains("e.detect = Math.max(0, e.detect - tdt * 0.18)", js);
            StringAssert.Contains("e.detect += tdt * (1.35 - dist / vr) * 0.95 * D.detect / t.react * (e.alerted ? 1.8 : 1) * (P.sprinting ? 1.5 : 1)", js);
        }
    }
}

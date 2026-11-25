using System;
using System.IO;
using System.Linq;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class HudModelTests
    {
        static readonly Vec2 O = new Vec2(0, 0);

        [Test]
        public void HeadingIsNorthZeroClockwise()
        {
            Assert.That(HudMath.Heading(0, 1), Is.EqualTo(0f).Within(1e-4));
            Assert.That(HudMath.Heading(1, 0), Is.EqualTo(90f).Within(1e-4));
            Assert.That(HudMath.Heading(0, -1), Is.EqualTo(180f).Within(1e-4));
            Assert.That(HudMath.Heading(-1, 0), Is.EqualTo(270f).Within(1e-4));
            Assert.That(HudMath.HeadingText(359.6f), Is.EqualTo("000°"));
            Assert.That(HudMath.Cardinal(44f), Is.EqualTo("NE")); Assert.That(HudMath.Cardinal(-90f), Is.EqualTo("W"));
        }

        [Test]
        public void CompassPlacesBearingsLeftAndRight()
        {
            Assert.That(HudMath.CompassX(0, 45), Is.EqualTo(0.5f).Within(1e-4), "NE is right of north");
            Assert.That(HudMath.CompassX(350, 10), Is.EqualTo(20f / 90f).Within(1e-4), "wraps across north");
            Assert.That(HudMath.CompassX(0, 180), Is.Null, "behind you is off the strip");
        }

        [Test]
        public void MinimapRotatesWithThePlayer()
        {
            var ahead = HudMath.MinimapPoint(O, 0, new Vec2(0, 35), out bool o1);
            Assert.That(ahead.x, Is.EqualTo(0f).Within(1e-4)); Assert.That(ahead.y, Is.EqualTo(-0.5f).Within(1e-4), "35 m ahead = halfway up"); Assert.That(o1, Is.False);
            var east = HudMath.MinimapPoint(O, 90, new Vec2(35, 0), out _);
            Assert.That(east.y, Is.EqualTo(-0.5f).Within(1e-4), "facing east, east is up");
            var north = HudMath.MinimapPoint(O, 90, new Vec2(0, 35), out _);
            Assert.That(north.x, Is.EqualTo(-0.5f).Within(1e-4), "facing east, north is on the left");
        }

        [Test]
        public void FarObjectiveIsPinnedToTheRim()
        {
            var p = HudMath.MinimapPoint(O, 0, new Vec2(0, 500), out bool outside, clampToRim: true);
            Assert.That(outside);
            Assert.That(Math.Sqrt(p.x * p.x + p.y * p.y), Is.EqualTo(1 - HudMath.MinimapRimInset).Within(1e-4));
            HudMath.MinimapPoint(O, 0, new Vec2(0, 500), out bool enemyOutside);
            Assert.That(enemyOutside, "enemies beyond 70 m are not drawn");
        }

        [TestCase(0f, 0, "HIDDEN")] [TestCase(0.31f, 0, "SUSPICIOUS")] [TestCase(0.8f, 0, "DETECTED")] [TestCase(0.1f, 2, "COMBAT · 2 ENGAGING")]
        public void AwarenessLabels(float detect, int combat, string label) => Assert.That(HudMath.Awareness(detect, combat).label, Is.EqualTo(label));

        [Test]
        public void CrosshairRadarAndFormatting()
        {
            Assert.That(HudMath.CrosshairGap(2.2f), Is.EqualTo(19.4f).Within(1e-4));
            Assert.That(HudMath.OnRadar(10, 99), Is.True); Assert.That(HudMath.OnRadar(99, 2), Is.True); Assert.That(HudMath.OnRadar(31, 3), Is.False);
            Assert.That(HudMath.Clock(65.9f), Is.EqualTo("1:05")); Assert.That(HudMath.Distance(42.4f), Is.EqualTo("42 m")); Assert.That(HudMath.Distance(1520), Is.EqualTo("1.5 km"));
        }

        [Test]
        public void DamageArcsPointAtTheShooterAndFade()
        {
            var d = new DamageIndicators();
            d.Add(HudMath.Bearing(O, new Vec2(0, -20)));       // shot from behind (south) while facing north
            var arc = d.Relative(0).Single();
            Assert.That(Math.Abs(arc.Bearing), Is.EqualTo(180f).Within(1e-3)); Assert.That(arc.Alpha, Is.EqualTo(1f));
            d.Tick(1.2f); Assert.That(d.Relative(0).Single().Alpha, Is.EqualTo(0.4f).Within(1e-4));
            d.Tick(0.5f); Assert.That(d.Count, Is.EqualTo(0), "gone after 1.6 s");
        }

        [Test]
        public void KillFeedKeepsFiveLinesForFourAndAHalfSeconds()
        {
            var f = new KillFeed();
            for (int i = 0; i < 7; i++) f.Add("NOMAD", "SENTRY " + i, i == 6);
            Assert.That(f.Lines.Count, Is.EqualTo(5)); Assert.That(f.Lines.Last(), Is.EqualTo("NOMAD ◎ HEADSHOT SENTRY 6"));
            f.Tick(4.6f); Assert.That(f.Lines.Count, Is.EqualTo(0));
        }

        [Test]
        public void ConstantsMatchTheWebHud()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "ui", "hud.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "ui", "hud.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("R = 88, scale = R / 70", js);
            StringAssert.Contains("if (l > R - 10)", js);
            StringAssert.Contains("this.dirs.push({ d, angle, t: 1.6 })", js);
            StringAssert.Contains("gap = 4 + wp.spreadDeg() * 7", js);
            StringAssert.Contains("G.time - e.marked < 30 || G.time - e.lastFire < 2.5", js);
            StringAssert.Contains("while (f.children.length > 5)", js); StringAssert.Contains("setTimeout(() => d.remove(), 4500)", js);
            StringAssert.Contains("det > 0.75", js); StringAssert.Contains("det > 0.3", js);
        }
    }
}

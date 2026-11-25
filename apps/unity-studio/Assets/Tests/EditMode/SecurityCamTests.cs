using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Mission 04 security cameras: the web game's detection rule (missions.js MISSIONS[3].tick).</summary>
    public sealed class SecurityCamTests
    {
        [Test]
        public void ConeAndRange()
        {
            var c = new SecurityCam(0, 0, 0);
            double t = Math.PI / 2 / 0.7 * 0 ;   // phase 0, time 0: yaw 0, looks along +z
            Assert.IsTrue(c.InView(0, 10, t), "ahead, 10 m");
            Assert.IsFalse(c.InView(0, 16, t), "beyond 15 m");
            Assert.IsFalse(c.InView(0, -5, t), "behind");
            Assert.IsFalse(c.InView(8, 5, t), "outside the cone (cos 0.53 < 0.55)");
            Assert.IsTrue(c.InView(5, 8, t), "inside the cone (cos 0.85)");
        }

        [Test]
        public void MeterFillsDrainsAndAlarmsOnce()
        {
            var c = new SecurityCam(0, 0, 0); int alarms = 0;
            for (int i = 0; i < 100; i++) if (c.Step(0.01, true, false)) alarms++;   // 1 s standing: 0.9
            Assert.That(c.Detect, Is.EqualTo(0.9).Within(1e-9)); Assert.AreEqual(0, alarms);
            for (int i = 0; i < 100; i++) if (c.Step(0.01, true, true)) alarms++;    // +1 s crouched: 1.4, alarm at 1.2
            Assert.That(c.Detect, Is.EqualTo(1.4).Within(1e-9)); Assert.AreEqual(1, alarms);
            for (int i = 0; i < 100; i++) c.Step(0.01, true, false);
            Assert.That(c.Detect, Is.EqualTo(1.5).Within(1e-9), "capped at 1.5");
            var d = new SecurityCam(0, 0, 0); d.Step(1, true, false); d.Step(1, false, false);
            Assert.That(d.Detect, Is.EqualTo(0.5).Within(1e-9), "drains 0.4/s");
            d.Dead = true; Assert.IsFalse(d.Step(10, true, false)); Assert.That(d.Detect, Is.EqualTo(0.5).Within(1e-9), "a shot-out camera sees nothing");
        }

        [Test]
        public void RuleIsTheWebOne()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "missions.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "missions.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("if (d < 15 && !G.noTarget) { const a = Math.atan2(dx, dz) - c.g.rotation.y; if (Math.cos(a) > 0.55", js);
            StringAssert.Contains("c.detect = clamp((c.detect || 0) + (see ? dt * (P.stance ? 0.5 : 0.9) : -dt * 0.4), 0, 1.5);", js);
            StringAssert.Contains("if (c.detect >= 1.2)", js);
        }
    }
}

using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Mission 05 door gunner (web gunner.js, v0.23).</summary>
    public sealed class DoorGunTests
    {
        [Test]
        public void FlightPath()
        {
            var a0 = DoorGun.StartAngle(205, -300);
            var start = DoorGun.Pose(0, 205, 7.2, -300, a0);
            Assert.That(start.x, Is.EqualTo(205).Within(1e-9)); Assert.That(start.y, Is.EqualTo(7.2).Within(1e-9));
            var orbit = DoorGun.Pose(20, 205, 7.2, -300, a0);
            double r = Math.Sqrt(Math.Pow(orbit.x - DoorGun.Port.x, 2) + Math.Pow(orbit.z - DoorGun.Port.z, 2));
            Assert.That(r, Is.EqualTo(82).Within(1e-6), "on the 82 m orbit"); Assert.That(orbit.y, Is.EqualTo(36).Within(1.21), "36 m ± 1.2 bob");
            // right-hand door faces the port: the door eye is nearer the port than the helicopter
            var eye = DoorGun.DoorEye(orbit.x, orbit.y, orbit.z, orbit.yaw, 0);
            double re = Math.Sqrt(Math.Pow(eye.x - DoorGun.Port.x, 2) + Math.Pow(eye.z - DoorGun.Port.z, 2));
            Assert.That(re, Is.LessThan(r), "the gun looks in toward the port");
            Assert.IsFalse(DoorGun.Over(45.9)); Assert.IsTrue(DoorGun.Over(46));
        }

        [Test]
        public void SpinFiresAndOverheats()
        {
            var g = new DoorGunBarrels(); int shots = 0; bool over = false; double t = 0;
            while (!over && t < 30) { shots += g.Step(1 / 60.0, true, out over); t += 1 / 60.0; }
            Assert.IsTrue(over, "holding the trigger overheats it"); Assert.That(t, Is.InRange(3.5, 5.5), "about 4 s of fire");
            Assert.That(shots, Is.InRange(85, 120), "≈ 1 / 0.0105 rounds before the barrels glow");
            Assert.AreEqual(0, g.Step(0.1, true, out _), "no fire while overheated");
            while (g.Overheated) g.Step(1 / 60.0, false, out _);
            Assert.That(g.Heat, Is.LessThan(0.35));
            Assert.That(DoorGun.DamageAt(50), Is.EqualTo(46)); Assert.That(DoorGun.DamageAt(400), Is.EqualTo(46 * 0.7).Within(1e-4));
        }

        [Test]
        public void NumbersAreTheWebOnes()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "gunner.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "gunner.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("export const GUN = { name: 'M134 DOOR GUN', cls: 'LMG', dmg: 46, rpm: 1500, vel: 900, range: [90, 320], minMul: 0.7, spread: 1.1 };", js);
            StringAssert.Contains("const LIFT_S = 6, ORBIT_S = 40, R = 82, ALT = 36, W = 0.12;", js);
            StringAssert.Contains("this.waves = [[2, [['assault', -18, 10], ['assault', -10, 16], ['guard', -24, 4], ['apc', 6, 22]]], [14, [['assault', 20, -8], ['heavy', 26, -2], ['elite', 14, -14], ['assault', 30, 6]]], [26, [['elite', -6, -26], ['assault', 2, -30], ['heavy', -14, -20], ['apc', -30, -8]]]];", js);
            StringAssert.Contains("this.rel = clamp(this.rel - I.mx * s, -1.25, 1.25); this.pitch = clamp(this.pitch - I.my * s * (G.settings.invertY ? -1 : 1), -1.15, 0.3);", js);
            StringAssert.Contains("this.spin = damp(this.spin, want ? 1 : 0, want ? 6 : 2, dt)", js);
            StringAssert.Contains("this.cool += 60 / GUN.rpm; this.heat += 0.0105;", js);
            StringAssert.Contains("this.heat = Math.max(0, this.heat - dt * (this.firing ? 0.05 : 0.32));", js);
            StringAssert.Contains("if (this.over && this.heat < 0.35) this.over = false;", js);
            StringAssert.Contains("_p.copy(h.position).addScaledVector(_r, 1.45).add(_o.set(0, 2.35, 0));", js);
        }
    }
}

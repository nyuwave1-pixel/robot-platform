using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>SQUAD 07 rules (web squad.js).</summary>
    public sealed class SquadTests
    {
        [Test]
        public void FormationSitsBehindYouAndTurnsWithYou()
        {
            var g = Squad.FormationGoal(0, 0, 0, 2);   // ATLAS, 6.4 m behind; yaw 0 looks toward −z, so behind is +z
            Assert.That(g.x, Is.EqualTo(0).Within(1e-12)); Assert.That(g.z, Is.EqualTo(6.4).Within(1e-12));
            var t = Squad.FormationGoal(0, 0, Math.PI / 2, 2);   // turned left a quarter: behind is +x
            Assert.That(t.x, Is.EqualTo(6.4).Within(1e-9)); Assert.That(t.z, Is.EqualTo(0).Within(1e-9));
        }

        [Test]
        public void FollowRegroupEngage()
        {
            Assert.AreEqual(0, Squad.FollowSpeed(1.5, false)); Assert.AreEqual(1.5 + 2 * 1.2, Squad.FollowSpeed(2, false), 1e-12);
            Assert.AreEqual(0, Squad.FollowSpeed(10, true), "fighting: hold position within 14 m"); Assert.AreEqual(7.2, Squad.FollowSpeed(40, true));
            Assert.IsTrue(Squad.NeedsRegroup(80, 0)); Assert.IsTrue(Squad.NeedsRegroup(5, 20)); Assert.IsFalse(Squad.NeedsRegroup(30, 2));
            Assert.IsFalse(Squad.MayEngage(false, AlertState.Search)); Assert.IsTrue(Squad.MayEngage(false, AlertState.Combat)); Assert.IsTrue(Squad.MayEngage(true, AlertState.Patrol));
            Assert.AreEqual(2, Squad.BurstLength(0)); Assert.AreEqual(4, Squad.BurstLength(0.99)); Assert.AreEqual(3.6, Squad.PauseAfterBurst(1), 1e-12);
            Assert.AreEqual(8, Squad.DamageAt(30)); Assert.AreEqual(8 * 0.6, Squad.DamageAt(200), 1e-5);
        }

        [Test]
        public void NumbersAreTheWebOnes()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "squad.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "squad.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("const NAMES = ['REAPER', 'NOMAD', 'ATLAS'], OFFS = [[-2.6, 3.2], [2.6, 3.8], [0, 6.4]], GUN = { dmg: 8, vel: 860, range: [50, 140], minMul: 0.6, pellets: 1 };", js);
            StringAssert.Contains("gx = P.pos.x + m.off[0] * c + m.off[1] * s, gz = P.pos.z - m.off[0] * s + m.off[1] * c;", js);
            StringAssert.Contains("if (dl > 75 || Math.abs(P.pos.y - m.pos.y) > 15)", js);
            StringAssert.Contains("if (dl > (fighting ? 14 : 1.6) && !P.frozen) {", js);
            StringAssert.Contains("speed = Math.min(7.2, 1.5 + dl * 1.2)", js);
            StringAssert.Contains("m.hp = Math.min(200, m.hp + dt * 4);", js);
            StringAssert.Contains("m.down = true; m.downT = 18;", js); StringAssert.Contains("m.down = false; m.hp = 120;", js);
            StringAssert.Contains("m.think = 0.4;", js); StringAssert.Contains("let bd = 60 * 60;", js);
            StringAssert.Contains("if (!e.alive || (!this.free && e.state < ST.COMBAT)) continue;", js);
            StringAssert.Contains("m.burst = 2 + (Math.random() * 3 | 0)", js); StringAssert.Contains("m.pauseT = 1.4 + Math.random() * 2.2", js);
            StringAssert.Contains("Math.abs(angDiff(wantYaw, m.yaw)) < 0.25", js); StringAssert.Contains("m.shotT = 0.1;", js);
            StringAssert.Contains("(Math.random() - 0.5) * 0.11 * Math.sqrt(e.pos.distanceTo(m.pos)) * 3", js);
            foreach (var b in Squad.Barks) StringAssert.Contains($"'{b}'", js);
        }
    }
}

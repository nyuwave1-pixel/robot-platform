using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Intro camera moves are played the web way (cinematics.js update).</summary>
    public sealed class CinematicTests
    {
        [Test]
        public void EasesFadesAndAdvances()
        {
            var c = new Cinematic(new[] { new CinematicShot(new double[] { 0, 0, 0 }, new double[] { 10, 0, 0 }, new double[] { 0, 0, 9 }, 2, "A"), new CinematicShot(new double[] { 0, 5, 0 }, new double[] { 0, 5, 10 }, null, 2, "B") });
            var f = c.Step(0.1); Assert.IsTrue(f.fade, "fade in over the first 0.25 s");
            var m = c.Step(0.9); Assert.That(m.pos[0], Is.EqualTo(5).Within(1e-9), "smoothstep halfway at t = 1 s"); Assert.IsFalse(m.fade);
            c.Step(1.0); Assert.AreEqual(1, c.Index, "next shot after its duration");
            var last = c.Step(1.5); Assert.IsTrue(last.fade, "fade out over the last 0.7 s"); Assert.That(last.look, Is.EqualTo(new double[] { 0, 5, 10 }), "no look point: look at the end of the move");
            c.Skip(); Assert.IsTrue(c.Done);
        }

        [Test]
        public void BoatIntroRidesTheBoatToTheBeach()
        {
            Assert.That(BoatIntro.BoatAt(0)[2], Is.EqualTo(760)); Assert.That(BoatIntro.BoatAt(35)[2], Is.EqualTo(331.5).Within(1e-9));
            Assert.That(BoatIntro.BoatAt(35)[0], Is.EqualTo(3.2).Within(1e-9), "beached at x 3.2 (web placeBoat)");
            var shots = BoatIntro.Shots(); double total = 0; foreach (var s in shots) total += s.Dur;
            Assert.That(total, Is.EqualTo(35).Within(1e-9), "the shots last as long as the run in");
            var c = new Cinematic(shots) { Anchor = BoatIntro.BoatAt };
            var f = c.Step(0.01);
            Assert.That(f.pos[2], Is.EqualTo(BoatIntro.BoatAt(0.01)[2] + 44 - 8 * (0.01 / 6.5)).Within(1e-9), "first shot: 44 m behind the boat, closing 8 m over 6.5 s");
            Assert.That(f.pos[1], Is.GreaterThanOrEqualTo(0.9));
            while (!c.Done) c.Step(0.1);
            Assert.That(c.Time, Is.EqualTo(35).Within(0.61), "each shot change drops up to one frame, as in the web player");
        }

        [Test]
        public void RuleIsTheWebOne()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "cinematics.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "cinematics.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("const k = clamp(this.t / s.dur, 0, 1), e = k * k * (3 - 2 * k);", js);
            StringAssert.Contains("G.post.fadeTarget = (this.i === 0 && this.t < 0.25) || (last && s.dur - this.t < 0.7) ? 1 : 0;", js);
            StringAssert.Contains("const fov = s.fov || 50;", js);
            StringAssert.Contains("if (G.input.pressed('Enter') || G.input.pressed('Space')) return this.skip();", js);
            // boat intro: path and shots
            StringAssert.Contains("const T = 35, Z0 = 760, Z1 = 331.5", js);
            StringAssert.Contains("B.z = Z0 - (Z0 - Z1) * (k * (1.7 - 0.7 * k)); B.x = Math.sin(k * 3.2) * 5 * (1 - k) + 3.2 * smooth(0.7, 1, k);", js);
            StringAssert.Contains("const R = (dx, dy, dz) => [B.x + dx, Math.max(0.9, this.boat.position.y + dy), B.z + dz];", js);
            StringAssert.Contains("{ dur: 6.5, fov: 46, text: 'PACIFIC OCEAN · 04:30 — 2 KM SOUTH OF THE TARGET ISLAND', cam: (k) => ({ p: R(26 - k * 6, 13 - k * 3, 44 - k * 8), l: R(0, 0, -70) }) }", js);
            StringAssert.Contains("cam: (k) => ({ p: R(4 - k * 7, 1.5, -13 + k * 2), l: R(0, 1.1, 0) })", js);
            StringAssert.Contains("cam: (k) => ({ p: R(-10 + k * 1.5, 1.3 + k * 0.8, 3 - k * 7), l: R(0, 0.9, -0.5) })", js);
            StringAssert.Contains("cam: (k) => ({ p: R(1.6 - k * 0.6, 2.7, 8.5 - k * 2), l: R(0, 2.2, -60) })", js);
            StringAssert.Contains("cam: (k) => ({ p: R(0.25 + k * 0.3, 1.55, -3.6), l: R(0.4, 1.25, 1) })", js);
            StringAssert.Contains("cam: (k) => ({ p: R(-4.5 + k, 2.2 + k * 0.6, 8 - k * 2), l: R(0, 1.4, -30) })", js);
            foreach (var shot in BoatIntro.Shots()) StringAssert.Contains(shot.Text.Replace("\"", "\\\"").Replace("\\\"", "\""), js.Replace("\\'", "'"));
        }
    }
}

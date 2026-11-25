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
        }
    }
}

using System;
using System.IO;
using System.Linq;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class SfxSynthTests
    {
        static float Rms(float[] s, int from, int to) { double a = 0; for (int i = from; i < to; i++) a += s[i] * s[i]; return (float)Math.Sqrt(a / Math.Max(1, to - from)); }
        static float ZeroCrossRate(float[] s) { int z = 0; for (int i = 1; i < s.Length; i++) if ((s[i - 1] < 0) != (s[i] < 0)) z++; return z / (float)s.Length; }

        [Test]
        public void EveryRecipeRendersSaneAudio([ValueSource(typeof(SfxSynth), nameof(SfxSynth.Recipes))] string name)
        {
            var s = new SfxSynth().Render(name);
            Assert.That(s.Length, Is.GreaterThan(SfxSynth.SampleRate / 100), "at least 10 ms");
            Assert.That(s.All(v => !float.IsNaN(v) && Math.Abs(v) <= 1f), "finite and within ±1");
            Assert.That(s.Max(Math.Abs), Is.GreaterThan(0.02f), "audible");
        }

        [Test]
        public void LengthsFollowTheWebTimings()
        {
            var sr = SfxSynth.SampleRate;
            Assert.That(new SfxSynth().Render("hit").Length, Is.EqualTo((int)(0.05f * sr)).Within(2));
            Assert.That(new SfxSynth().Render("kill").Length, Is.EqualTo((int)(0.07f * sr) + (int)(0.12f * sr)).Within(2), "second tone starts at 70 ms");
            Assert.That(new SfxSynth().Render("reload", 1.0f).Length, Is.EqualTo((int)(1.25f * sr) + (int)(0.04f * sr)).Within(2), "magazine-in click lands at t2 + 0.25 s");
        }

        [Test]
        public void SoundsDecayLikeWebAudioEnvelopes()
        {
            foreach (var name in new[] { "hurt", "whiz", "impact:concrete", "explosion-body" })
            {
                var s = new SfxSynth().Render(name); int n = s.Length / 10;
                Assert.That(Rms(s, s.Length - n, s.Length), Is.LessThan(Rms(s, 0, 2 * n) * 0.35f), name);
            }
        }

        [Test]
        public void SurfacesSoundDifferent()
        {
            float sand = ZeroCrossRate(new SfxSynth(7).Render("impact:sand")), concrete = ZeroCrossRate(new SfxSynth(7).Render("impact:concrete"));
            Assert.That(concrete, Is.GreaterThan(sand * 1.5f), "concrete (1.8 kHz) is brighter than sand (500 Hz)");
            Assert.That(new SfxSynth().Render("impact:metal").Length, Is.GreaterThan(new SfxSynth().Render("impact:sand").Length), "metal rings longer");
        }

        [Test]
        public void SameSeedSameSound()
        {
            Assert.That(new SfxSynth(42).Render("whiz"), Is.EqualTo(new SfxSynth(42).Render("whiz")));
            Assert.That(new SfxSynth(42).Render("whiz"), Is.Not.EqualTo(new SfxSynth(43).Render("whiz")));
        }

        [Test]
        public void ShotgunIsLongerAndPistolShorterThanTheRifle()
        {
            int rifle = new SfxSynth().RenderShot("ASSAULT RIFLE").Length, shotgun = new SfxSynth().RenderShot("SHOTGUN").Length, pistol = new SfxSynth().RenderShot("SIDEARM").Length;
            Assert.That(shotgun, Is.GreaterThan(rifle)); Assert.That(pistol, Is.LessThan(rifle));
            Assert.That(Rms(new SfxSynth().RenderShot("SIDEARM"), 0, pistol), Is.LessThan(Rms(new SfxSynth().RenderShot("ASSAULT RIFLE"), 0, pistol)), "suppressed pistol is quiet");
        }

        [Test]
        public void AlarmIsTheWebSiren()
        {
            var a = new SfxSynth().Render("alarm");
            Assert.That(a.Length / (float)SfxSynth.SampleRate, Is.EqualTo(1.9f).Within(0.05f), "4 blips 0.5 s apart, 0.4 s each");
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "core", "audio.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "core", "audio.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js != null) StringAssert.Contains("case 'alarm': for (let i = 0; i < 4; i++) this.osc(0.4, { f: 620, f2: 880, type: 'square', g: 0.14, dest: d, t: i * 0.5 }); break;", js);
        }

        [Test]
        public void ShotProfilesMatchTheWebSource()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "core", "audio.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "core", "audio.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            float F(string v) => float.Parse(v, System.Globalization.CultureInfo.InvariantCulture);
            string shotTable = js.Substring(js.IndexOf("case 'shot':"));
            string sampleTable = js.Substring(js.IndexOf("const SHOT_SAMPLE"));
            foreach (var kv in SfxSynth.ShotProfiles)
            {
                var p = kv.Value; string key = System.Text.RegularExpressions.Regex.Escape(kv.Key);
                var m = System.Text.RegularExpressions.Regex.Match(shotTable, "'?" + key + @"'?:\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]");
                Assert.That(m.Success, kv.Key + " missing in the web shot table");
                Assert.That(new[] { p.g, p.f, p.thump, p.len }, Is.EqualTo(new[] { F(m.Groups[1].Value), F(m.Groups[2].Value), F(m.Groups[3].Value), F(m.Groups[4].Value) }), kv.Key + " synth body");
                var r = System.Text.RegularExpressions.Regex.Match(sampleTable.Substring(0, sampleTable.IndexOf(';')), "'?" + key + @"'?:\s*\[([\d.]+),\s*([\d.]+)\]");
                if (p.rate > 0) { Assert.That(r.Success, kv.Key + " recorded layer"); Assert.That(new[] { p.rate, p.sampleGain }, Is.EqualTo(new[] { F(r.Groups[1].Value), F(r.Groups[2].Value) })); }
                else Assert.That(r.Success, Is.False, kv.Key + " has no recording in the web game");
            }
        }
    }
}

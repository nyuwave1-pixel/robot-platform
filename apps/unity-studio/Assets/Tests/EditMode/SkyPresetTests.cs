using System;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class SkyPresetTests
    {
        static string WebSky()
        {
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "world", "sky.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "world", "sky.js") })
                        if (File.Exists(p)) return File.ReadAllText(p);
            return null;
        }

        [TestCase("night")] [TestCase("dawn")] [TestCase("storm")] [TestCase("facility")] [TestCase("dusk")]
        public void PresetMatchesTheWebSky(string id)
        {
            var js = WebSky(); if (js == null) Assert.Ignore("web game source not found");
            var line = Regex.Match(js, @"^\s*" + id + @":\s*\{(.*)\},?\s*$", RegexOptions.Multiline);
            Assert.That(line.Success, "no " + id + " preset in sky.js");
            string row = line.Groups[1].Value;
            float N(string key) => float.Parse(Regex.Match(row, @"\b" + key + @":\s*(-?[\d.]+)").Groups[1].Value, CultureInfo.InvariantCulture);
            Rgb H(string key) => Rgb.Hex(Convert.ToInt32(Regex.Match(row, @"\b" + key + @":\s*C\(0x([0-9a-fA-F]+)\)").Groups[1].Value, 16));
            var p = SkyPresets.Get(id); Assert.That(p.Id, Is.EqualTo(id));
            Assert.That(p.Top.ToString(), Is.EqualTo(H("top").ToString())); Assert.That(p.Bottom.ToString(), Is.EqualTo(H("bot").ToString()));
            Assert.That(p.Fog.ToString(), Is.EqualTo(H("fog").ToString())); Assert.That(p.Sun.ToString(), Is.EqualTo(H("sun").ToString()));
            foreach (var (k, v) in new (string, float)[] { ("dens", p.FogDensity), ("sunI", p.SunIntensity), ("hemi", p.Hemi), ("rain", p.Rain), ("wind", p.Wind), ("storm", p.Storm), ("stars", p.Stars), ("night", p.Night), ("exp", p.Exposure) })
                Assert.That(v, Is.EqualTo(N(k)).Within(1e-5), id + "." + k);
            var dir = Regex.Match(row, @"dir:\s*\[(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\]");
            Assert.That(new[] { p.SunDir.X, p.SunDir.Y, p.SunDir.Z }, Is.EqualTo(new[] { float.Parse(dir.Groups[1].Value, CultureInfo.InvariantCulture), float.Parse(dir.Groups[2].Value, CultureInfo.InvariantCulture), float.Parse(dir.Groups[3].Value, CultureInfo.InvariantCulture) }));
            StringAssert.Contains(p.Label, row);
        }

        [Test]
        public void UnitySunDirectionFlipsZAndIsNormalised()
        {
            var d = SkyPresets.Night.SunDirUnity;
            Assert.That(d.Length, Is.EqualTo(1f).Within(1e-5));
            Assert.That(d.Z, Is.GreaterThan(0), "three.js -z (into the screen) is Unity +z");
            Assert.That(SkyPresets.Day.SunDirUnity.Y, Is.GreaterThan(0.6f), "midday sun is high");
        }

        [Test]
        public void ExposureBecomesPostExposureEv()
        {
            Assert.That(SkyPresets.Dawn.PostExposureEv, Is.EqualTo(0f).Within(1e-6));
            Assert.That(SkyPresets.Night.PostExposureEv, Is.EqualTo((float)Math.Log(1.5, 2)).Within(1e-5));
        }

        [Test]
        public void BlendingHitsBothEndsAndApproachConverges()
        {
            var a = SkyPresets.Day; var b = SkyPresets.Night;
            Assert.That(SkyPreset.Lerp(a, b, 0).FogDensity, Is.EqualTo(a.FogDensity));
            Assert.That(SkyPreset.Lerp(a, b, 1).FogDensity, Is.EqualTo(b.FogDensity));
            Assert.That(SkyPreset.Lerp(a, b, 0.5f).SunDir.Length, Is.EqualTo(1f).Within(1e-5));
            var cur = a.Clone();
            for (int i = 0; i < 600; i++) cur = SkyPreset.Approach(cur, b, 1f / 60f);   // 10 s at 60 fps
            Assert.That(cur.Exposure, Is.EqualTo(b.Exposure).Within(0.01f), "the web fade settles within ~10 s");
            Assert.That(cur.Id, Is.EqualTo("night"));
        }

        [Test]
        public void EveryOutdoorPresetHasAnHdriAndUniqueId()
        {
            var ids = new System.Collections.Generic.HashSet<string>();
            foreach (var p in SkyPresets.Outdoor) { Assert.That(p.Hdri, Is.Not.Null.And.StartsWith("sky_"), p.Id); Assert.That(ids.Add(p.Id), p.Id); }
            Assert.That(SkyPresets.Get("nonsense").Id, Is.EqualTo("day"));
        }

        [TestCase("day", 1.33f)] [TestCase("dawn", 0.307f)] [TestCase("storm", 0.051f)] [TestCase("dusk", 0.126f)] [TestCase("night", 0.023f)]
        public void HdriExposureMatchesTheWebDomeBrightness(string id, float expected)
        {
            // values checked by eye on a tonemapped contact sheet (Tools~/hdri-preview.py) on 2026-11-25
            Assert.That(SkyPresets.Get(id).HdriExposure, Is.EqualTo(expected).Within(expected * 0.02f));
        }

        [Test]
        public void StormSkyIsDarkerThanDayAndNightDarkest()
        {
            float L(SkyPreset p) => p.HdriExposure * p.HdriMedian;   // displayed median sky brightness
            Assert.That(L(SkyPresets.Storm), Is.LessThan(L(SkyPresets.Day)));
            Assert.That(L(SkyPresets.Night), Is.LessThan(L(SkyPresets.Storm)));
        }

        [Test]
        public void LightningOnlyInStormsWithDelayedThunder()
        {
            var calm = new LightningClock(new Random(1));
            for (int i = 0; i < 3000; i++) Assert.That(calm.Tick(0.05f, false), Is.False);
            Assert.That(calm.Flash, Is.EqualTo(0f));

            var c = new LightningClock(new Random(2)); int strikes = 0, thunders = 0; float lastFlash = 0;
            for (int i = 0; i < 1200; i++)   // 60 s
            {
                if (c.Tick(0.05f, true)) thunders++;
                if (c.Flash > lastFlash + 0.5f) strikes++;
                lastFlash = c.Flash;
            }
            Assert.That(strikes, Is.InRange(3, 11), "first at 6 s, then every 5–17 s");
            Assert.That(thunders, Is.InRange(strikes - 1, strikes), "each strike is followed by thunder");
        }

        [Test]
        public void StrobeBlinksTwicePerStrike()
        {
            var c = new LightningClock(new Random(3)); int on = 0; bool was = false;
            for (int i = 0; i < 1000 && on < 2; i++) { c.Tick(0.01f, true);   // first strike at 6 s
 if (c.Lit && !was) on++; was = c.Lit; }
            Assert.That(on, Is.EqualTo(2));
        }
    }
}

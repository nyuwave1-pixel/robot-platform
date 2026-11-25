using System;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class GameSettingsTests
    {
        static string Web(string rel)
        {
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", rel), Path.Combine(dir.FullName, "apps", "special-soldier", rel) })
                        if (File.Exists(p)) return File.ReadAllText(p);
            return null;
        }

        [Test]
        public void DefaultsMatchTheWebGame()
        {
            var js = Web(Path.Combine("src", "core", "save.js")); if (js == null) Assert.Ignore("web game source not found");
            string row = Regex.Match(js, @"DEFAULT_SETTINGS = \{([^}]*)\}").Groups[1].Value;
            float N(string k) => float.Parse(Regex.Match(row, k + @":\s*([\d.]+)").Groups[1].Value, CultureInfo.InvariantCulture);
            var s = new GameSettings();
            Assert.That(s.Fov, Is.EqualTo(N("fov"))); Assert.That(s.Sensitivity, Is.EqualTo(N("sens")));
            Assert.That(s.Volume, Is.EqualTo(N("volume")).Within(1e-5)); Assert.That(s.Music, Is.EqualTo(N("music")).Within(1e-5));
            StringAssert.Contains("invertY: false", row); StringAssert.Contains("difficulty: 'regular'", row);
            Assert.That(s.InvertY, Is.False); Assert.That(s.DifficultyId, Is.EqualTo("regular"));
        }

        [Test]
        public void SliderRangesMatchTheWebMenu()
        {
            var js = Web(Path.Combine("src", "ui", "menu.js")); if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("sl('fov', 60, 100, 1", js); StringAssert.Contains("sl('sens', 0.2, 3, 0.05", js);
            StringAssert.Contains("sl('volume', 0, 1, 0.05", js); StringAssert.Contains("sl('music', 0, 1, 0.05", js);
            var s = new GameSettings { Fov = 140, Sensitivity = 0.01f, Volume = -1, Music = 0.333f };
            Assert.That(s.Fov, Is.EqualTo(100f)); Assert.That(s.Sensitivity, Is.EqualTo(0.2f).Within(1e-5));
            Assert.That(s.Volume, Is.EqualTo(0f)); Assert.That(s.Music, Is.EqualTo(0.35f).Within(1e-5), "snaps to the 0.05 step");
            s.Fov = 77.6f; Assert.That(s.Fov, Is.EqualTo(78f));
        }

        [Test]
        public void LookSpeedMatchesTheWebAndSlowsWhenAiming()
        {
            var js = Web(Path.Combine("src", "game", "player.js")); if (js != null) StringAssert.Contains("0.0022 * G.settings.sens * (wp.adsT > 0.5 ? 1 / lerp(1, wp.zoomNow, 0.75) : 1)", js);
            var s = new GameSettings();
            Assert.That(s.LookDegreesPerPixel(), Is.EqualTo(0.0022f * 180f / (float)Math.PI).Within(1e-5));
            s.Sensitivity = 2; Assert.That(s.LookDegreesPerPixel(), Is.EqualTo(2 * 0.0022f * 180f / (float)Math.PI).Within(1e-5));
            Assert.That(s.LookDegreesPerPixel(6f, true), Is.EqualTo(s.LookDegreesPerPixel() / 4.75f).Within(1e-5), "×6 scope: 1 / lerp(1, 6, 0.75)");
            Assert.That(s.MusicGain, Is.EqualTo(0.275f).Within(1e-5));
        }

        [Test]
        public void JsonRoundTripAndBadInputFallsBack()
        {
            var s = new GameSettings { Fov = 90, Sensitivity = 1.75f, Volume = 0.4f, Music = 0, InvertY = true, DifficultyId = "veteran", SkyId = "night" };
            var t = GameSettings.FromJson(s.ToJson());
            Assert.That(t.ToJson(), Is.EqualTo(s.ToJson()));
            Assert.That(t.Difficulty, Is.SameAs(Difficulty.Veteran)); Assert.That(t.SkyId, Is.EqualTo("night"));

            var bad = GameSettings.FromJson("{\"fov\":\"wide\",\"sens\":99,\"difficulty\":\"godmode\",\"sky\":\"mars\",\"extra\":{\"x\":1}}");
            Assert.That(bad.Fov, Is.EqualTo(78f), "unparsable → default");
            Assert.That(bad.Sensitivity, Is.EqualTo(3f), "clamped");
            Assert.That(bad.DifficultyId, Is.EqualTo("regular")); Assert.That(bad.SkyId, Is.EqualTo("day"));
            Assert.That(GameSettings.FromJson(null).Fov, Is.EqualTo(78f));
            Assert.That(GameSettings.FromJson("garbage").Volume, Is.EqualTo(0.7f).Within(1e-5));
        }
    }
}

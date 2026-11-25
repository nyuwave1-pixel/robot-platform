using System;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Every Unity enemy type has the web game's numbers (apps/special-soldier/src/game/enemies.js TYPES), the APC included.</summary>
    public sealed class EnemyTypeParityTests
    {
        static string Js()
        {
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "game", "enemies.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "game", "enemies.js") })
                        if (File.Exists(p)) return File.ReadAllText(p);
            return null;
        }
        static float F(Match m, string key) { var r = Regex.Match(m.Value, key + @": (-?[\d.]+)"); Assert.IsTrue(r.Success, key); return float.Parse(r.Groups[1].Value, CultureInfo.InvariantCulture); }

        [Test]
        public void TypesMatchTheWebTable()
        {
            var js = Js(); if (js == null) Assert.Ignore("web game source not found");
            foreach (var t in EnemyType.All)
            {
                var m = Regex.Match(js, @"\n  " + t.Id + @":\s+\{[^\n]*\},?\n");
                Assert.IsTrue(m.Success, t.Id + " not in enemies.js");
                StringAssert.Contains($"name: '{t.Name}'", m.Value, t.Id);
                Assert.AreEqual(F(m, "hp"), t.Hp, t.Id + " hp"); Assert.AreEqual(F(m, "armor"), t.Armor, t.Id + " armor");
                Assert.AreEqual(F(m, "speed"), t.Speed, 1e-6, t.Id + " speed"); Assert.AreEqual(F(m, "spread"), t.Spread, 1e-6, t.Id + " spread");
                Assert.AreEqual(F(m, "rpm"), t.Rpm, t.Id + " rpm"); Assert.AreEqual(F(m, "vision"), t.Vision, t.Id + " vision");
                Assert.AreEqual(F(m, "fov"), t.Fov, 1e-6, t.Id + " fov"); Assert.AreEqual(F(m, "react"), t.React, 1e-6, t.Id + " react");
                Assert.AreEqual(F(m, "score"), t.Score, t.Id + " score");
                var burst = Regex.Match(m.Value, @"burst: \[(\d+), (\d+)\]"); Assert.AreEqual((int.Parse(burst.Groups[1].Value), int.Parse(burst.Groups[2].Value)), (t.BurstMin, t.BurstMax), t.Id + " burst");
                Assert.AreEqual(float.Parse(Regex.Match(m.Value, @"gun: gun\((\d+)").Groups[1].Value, CultureInfo.InvariantCulture), t.GunDamage, t.Id + " gun");
                Assert.AreEqual(m.Value.Contains("vehicle: true"), t.Vehicle, t.Id + " vehicle");
                Assert.AreEqual(m.Value.Contains("grenades: true"), t.Grenades, t.Id + " grenades");
            }
        }

        [Test]
        public void VehiclesShrugOffSmallArms()
        {
            Assert.AreEqual(10f, EnemyType.Apc.DamageTaken(100, false), 1e-4, "web: dmg *= 0.1 unless explosive");
            Assert.AreEqual(100f, EnemyType.Apc.DamageTaken(100, true));
            Assert.AreEqual(100f, EnemyType.Assault.DamageTaken(100, false));
            var js = Js(); if (js == null) return;
            StringAssert.Contains("if (e.type.vehicle && !explosive) dmg *= 0.1;", js);
            StringAssert.Contains("e.pos.y + (t.vehicle ? 2.85 :", js);
        }
    }
}

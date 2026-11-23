using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;
using SpecialSoldier.Core;

namespace SpecialSoldier.Core.Tests
{
    public class DifficultyTests
    {
        [Test]
        public void MatchesTheWebGameDifficultyTable()
        {
            // apps/unity-studio/../special-soldier/src/core/save.js holds DIFFICULTY = { recruit: { ..., detect: 0.7, react: 1.5, acc: 1.6, dmg: 0.6 }, ... }
            string save = Path.GetFullPath(Path.Combine(UnityEngine.Application.dataPath, "..", "..", "special-soldier", "src", "core", "save.js"));
            if (!File.Exists(save)) Assert.Ignore("web game source not found next to the Unity project: " + save);
            string js = File.ReadAllText(save);
            foreach (var d in Difficulty.All)
            {
                var m = Regex.Match(js, d.Id + @":\s*\{[^}]*detect:\s*([\d.]+),\s*react:\s*([\d.]+),\s*acc:\s*([\d.]+),\s*dmg:\s*([\d.]+)");
                Assert.IsTrue(m.Success, "no " + d.Id + " row in save.js");
                float F(int g) => float.Parse(m.Groups[g].Value, CultureInfo.InvariantCulture);
                Assert.AreEqual(F(1), d.Detect, 1e-4, d.Id + " detect");
                Assert.AreEqual(F(2), d.React, 1e-4, d.Id + " react");
                Assert.AreEqual(F(3), d.Acc, 1e-4, d.Id + " acc");
                Assert.AreEqual(F(4), d.Dmg, 1e-4, d.Id + " dmg");
            }
        }

        [Test]
        public void UnknownIdFallsBackToRegular()
        {
            Assert.AreSame(Difficulty.Regular, Difficulty.FromId("nightmare"));
            Assert.AreSame(Difficulty.Veteran, Difficulty.FromId("veteran"));
        }

        [Test]
        public void EnemiesHesitateBeforeTheFirstBurst()
        {
            var t = EnemyType.Sentry;   // react 0.9 s
            Assert.AreEqual(0.9f * 0.7f, Difficulty.Regular.ReactionDelay(t, 0f, true), 1e-4);
            Assert.AreEqual(0.9f * 1.3f, Difficulty.Regular.ReactionDelay(t, 1f, true), 1e-4);
            Assert.Less(Difficulty.Regular.ReactionDelay(t, 0.5f, false), Difficulty.Regular.ReactionDelay(t, 0.5f, true), "heard-only reacts faster (already aiming that way)");
            Assert.Greater(Difficulty.Recruit.ReactionDelay(t, 0.5f, true), Difficulty.Veteran.ReactionDelay(t, 0.5f, true));
        }

        [Test]
        public void AimIsWorseWhileMovingAndJustAfterSpotting()
        {
            var t = EnemyType.Assault;
            float settled = Difficulty.Regular.ShotSpread(t, false, 5f);
            Assert.AreEqual(t.Spread, settled, 1e-4);
            Assert.AreEqual(t.Spread * 1.8f, Difficulty.Regular.ShotSpread(t, false, 0.5f), 1e-4);
            Assert.AreEqual(t.Spread * 1.6f * 1.8f, Difficulty.Regular.ShotSpread(t, true, 0.5f), 1e-4);
            Assert.Greater(Difficulty.Recruit.ShotSpread(t, false, 5f), Difficulty.Veteran.ShotSpread(t, false, 5f));
        }
    }
}

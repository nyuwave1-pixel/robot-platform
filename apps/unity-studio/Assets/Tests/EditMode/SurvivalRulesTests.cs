using System;
using System.Linq;
using NUnit.Framework;
using SurvivalWorld.Core;
using R = SurvivalWorld.Core.SurvivalRules;

namespace SurvivalWorld.Tests
{
    /// <summary>The C# SURVIVAL WORLD rules must equal the web prototype (fixture: Tools~/gen-survival-fixture.mjs from
    /// apps/game-lab/survival-world/src/logic.js), plus the same behaviour checks as the web tests.</summary>
    public sealed class SurvivalRulesTests
    {
        [Test]
        public void Terrain_HeightsAndBiomesMatchTheWeb()
        {
            foreach (var s in SurvivalFixture.Samples)
            {
                Assert.That(R.HeightAt(s.seed, s.x, s.z), Is.EqualTo(s.h).Within(1e-9), $"height {s.seed} ({s.x}, {s.z})");
                Assert.AreEqual(s.biome, R.BiomeAt(s.seed, s.x, s.z), $"biome {s.seed} ({s.x}, {s.z})");
            }
        }

        [Test]
        public void World_NodesAndSpawnMatchTheWeb()
        {
            foreach (var w in SurvivalFixture.Worlds)
            {
                var g = R.NewGame(w.seed);
                Assert.AreEqual(w.count, g.Nodes.Count, $"nodes {w.seed}");
                Assert.AreEqual(w.tree, g.Nodes.Count(n => n.Kind == "tree")); Assert.AreEqual(w.rock, g.Nodes.Count(n => n.Kind == "rock")); Assert.AreEqual(w.bush, g.Nodes.Count(n => n.Kind == "bush"));
                Assert.That(g.SpawnX, Is.EqualTo(w.sx).Within(1e-9)); Assert.That(g.SpawnZ, Is.EqualTo(w.sz).Within(1e-9));
            }
            foreach (var f in SurvivalFixture.Nodes)
            {
                var n = R.NewGame(f.seed).Nodes[f.id];
                Assert.AreEqual(f.kind, n.Kind); Assert.That(n.X, Is.EqualTo(f.x).Within(1e-9)); Assert.That(n.Z, Is.EqualTo(f.z).Within(1e-9)); Assert.That(n.Y, Is.EqualTo(f.y).Within(1e-9));
            }
        }

        [Test]
        public void Rng_StartsLikeTheWebEvenForLargeSeeds()
        {
            Assert.AreEqual(SurvivalFixture.BigSeedRng, R.NewGame(SurvivalFixture.BigSeed).Rng);
        }

        [Test]
        public void Night_WolvesNeedsAndRngFollowTheWebTrace()
        {
            var g = R.NewGame(11); g.Time = R.Day * 0.82;
            g.Structures.Add(new R.Structure { Kind = "campfire", X = R.Snap(g.P.X + 4), Z = R.Snap(g.P.Z) });
            int row = 0;
            for (int i = 1; i <= 240; i++)
            {
                R.Step(g, 0.25);
                if (i % 20 != 0) continue;
                var t = SurvivalFixture.Night[row++];
                Assert.That(g.P.Hp, Is.EqualTo(t.hp).Within(1e-6), $"hp @{i}"); Assert.That(g.P.Warmth, Is.EqualTo(t.warmth).Within(1e-6), $"warmth @{i}");
                Assert.AreEqual(t.wolves, g.Wolves.Count, $"wolves @{i}"); Assert.AreEqual(t.rng, g.Rng, $"rng @{i}");
                if (g.Wolves.Count > 0) { Assert.That(g.Wolves[0].X, Is.EqualTo(t.wx).Within(1e-6)); Assert.That(g.Wolves[0].Z, Is.EqualTo(t.wz).Within(1e-6)); }
            }
            Assert.AreEqual(SurvivalFixture.Night.Length, row);
        }

        [Test]
        public void Gather_Craft_Place_Attack()
        {
            var g = R.NewGame(7); var tree = g.Nodes.First(n => n.Kind == "tree");
            g.P.X = tree.X + 1; g.P.Z = tree.Z;
            Assert.AreSame(tree, R.NearestNode(g));
            Assert.AreEqual(0, R.Gather(g, tree).Count); R.Gather(g, tree);
            Assert.AreEqual(2, R.Gather(g, tree)["wood"]); Assert.AreEqual(2, g.Get("wood"));
            Assert.AreEqual("need", R.Craft(g, "axe"));
            g.Inv["wood"] = 20; g.Inv["stone"] = 10; g.Inv["meat"] = 1;
            Assert.AreEqual("", R.Craft(g, "axe")); Assert.AreEqual("have", R.Craft(g, "axe")); Assert.AreEqual("fire", R.Craft(g, "cooked"));
            Assert.AreEqual("", R.Craft(g, "campfire"));
            bool placed = new[] { (3.0, 0.0), (-3.0, 0.0), (0.0, 3.0), (0.0, -3.0) }.Any(o => R.Place(g, "campfire", g.P.X + o.Item1, g.P.Z + o.Item2));
            Assert.IsTrue(placed); Assert.IsTrue(R.NearFire(g)); Assert.AreEqual("", R.Craft(g, "cooked"));
            var w = new R.WolfState { Id = 1, X = g.P.X + 1, Z = g.P.Z, Hp = R.Wolf.Hp };
            g.Inv["spear"] = 1; R.Attack(g, w); g.P.HitCd = 0; Assert.IsTrue(R.Attack(g, w)); Assert.AreEqual(2, g.Get("meat"));
            Assert.AreEqual(2.0, R.Snap(1.0), "JS Math.round: 0.5 rounds up"); Assert.AreEqual(-2.0, R.Snap(-3.0));
        }

        [Test]
        public void Clock_NightWrapsPastMidnight()
        {
            var g = R.NewGame(1);
            foreach (var (k, night) in new[] { (0.25, false), (0.5, false), (0.78, false), (0.8, true), (0.99, true), (0.1, true), (0.24, false) })
            { g.Time = R.Day * (3 + k); Assert.AreEqual(night, R.IsNight(g), k.ToString()); }
        }
    }
}

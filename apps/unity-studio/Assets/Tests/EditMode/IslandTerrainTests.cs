using System;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>The C# island must equal the web game's island (fixture written by Tools~/gen-terrain-fixture.mjs from terrain.js).</summary>
    public class IslandTerrainTests
    {
        [Test]
        public void NoiseMatchesJavaScriptBitForBit()
        {
            foreach (var n in TerrainFixture.Noise)
            {
                Assert.That(IslandTerrain.Noise2(n.x, n.y), Is.EqualTo(n.noise2).Within(1e-12), $"noise2({n.x},{n.y})");
                Assert.That(IslandTerrain.Fbm(n.x, n.y, 5), Is.EqualTo(n.fbm5).Within(1e-12), $"fbm({n.x},{n.y})");
            }
        }

        [Test]
        public void HeightsMatchTheWebIsland()
        {
            double worst = 0;
            foreach (var p in TerrainFixture.Heights) worst = Math.Max(worst, Math.Abs(IslandTerrain.Height(p.x, p.z) - p.h));
            Assert.That(worst, Is.LessThan(1e-9), "largest difference in metres");
            Assert.That(TerrainFixture.Heights.Length, Is.GreaterThan(500));
        }

        [Test]
        public void SplatMatchesTheWebIsland()
        {
            foreach (var p in TerrainFixture.Splats)
            {
                var w = IslandTerrain.Splat(p.x, p.z);
                Assert.That(new[] { w.sand, w.grass, w.rock, w.concrete }, Is.EqualTo(new[] { p.sand, p.grass, p.rock, p.concrete }).Within(1e-9), $"({p.x},{p.z})");
            }
        }

        [Test]
        public void BaseFlatIsAt16MetresAndConcrete()
        {
            var b = IslandTerrain.Get("base");
            Assert.That(IslandTerrain.Height(b.CenterX, b.CenterZ), Is.EqualTo(16).Within(1e-9));
            Assert.That(IslandTerrain.Splat(0, -95).concrete, Is.EqualTo(1));
            Assert.That(IslandTerrain.Height(590, 590), Is.LessThan(0), "corners are sea");
        }

        [Test]
        public void WorldMappingFlipsZAndPutsTheBaseAtTheOrigin()
        {
            var w = IslandTerrain.ToWorld(0, 16, -95);
            Assert.That(new[] { w.x, w.y, w.z }, Is.EqualTo(new[] { 0.0, 0.0, 0.0 }));
            var comms = IslandTerrain.Get("comms"); var c = IslandTerrain.ToWorld(comms.CenterX, 0, comms.CenterZ);
            Assert.That(c.x, Is.LessThan(0)); Assert.That(c.z, Is.LessThan(0), "web +z (south on screen) becomes Unity −z: no mirror image");
            var back = IslandTerrain.ToIsland(c.x, c.y, c.z); Assert.That(back.z, Is.EqualTo(comms.CenterZ).Within(1e-9));
        }

        [Test]
        public void HeightGridCoversTheIsland()
        {
            var g = IslandTerrain.HeightGrid(129, out float min, out float max);
            Assert.That(g.GetLength(0), Is.EqualTo(129));
            Assert.That(min, Is.EqualTo(-7f).Within(0.01f)); Assert.That(max, Is.InRange(25f, 40f));
            Assert.That(g[0, 0], Is.EqualTo((float)IslandTerrain.Height(-600, -600)));
            Assert.That(g[128, 64], Is.EqualTo((float)IslandTerrain.Height(0, 600)).Within(1e-4f), "row = z, column = x");
        }
    }
}

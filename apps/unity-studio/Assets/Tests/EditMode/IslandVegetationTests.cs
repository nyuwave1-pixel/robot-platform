using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>The C# vegetation layout must be the web game's (fixture from Tools~/gen-vegetation-fixture.mjs / vegetation.js).</summary>
    public class IslandVegetationTests
    {
        static IslandVegetation.Layout _layout;
        static IslandVegetation.Layout L => _layout ??= IslandVegetation.Build();

        [Test]
        public void MulberryIsBitExact()
        {
            var r = new IslandVegetation.Mulberry(IslandVegetation.Seed);
            foreach (var expected in VegetationFixture.FirstRandoms) Assert.That(r.Next(), Is.EqualTo(expected));
        }

        [Test]
        public void GridHeightMatchesWorldHeightAt()
        {
            var h = IslandVegetation.GridHeights();
            foreach (var p in VegetationFixture.GridHeights) Assert.That(IslandVegetation.HeightAt(h, p.x, p.z), Is.EqualTo(p.h).Within(1e-9), $"({p.x},{p.z})");
        }

        static void Same(List<IslandVegetation.Item> got, int count, double[] sums, (int i, double x, double y, double z, double r, double s, double tx, double tz)[] samples, string what)
        {
            Assert.That(got.Count, Is.EqualTo(count), what + " count");
            var s = new double[7];
            foreach (var p in got) { s[0] += p.X; s[1] += p.Y; s[2] += p.Z; s[3] += p.R; s[4] += p.S; s[5] += p.Tx; s[6] += p.Tz; }
            for (int k = 0; k < 7; k++) Assert.That(s[k], Is.EqualTo(sums[k]).Within(1e-6), $"{what} sum {k}");
            foreach (var e in samples)
            {
                var p = got[e.i];
                Assert.That(new[] { p.X, p.Y, p.Z, p.R, p.S, p.Tx, p.Tz }, Is.EqualTo(new[] { e.x, e.y, e.z, e.r, e.s, e.tx, e.tz }).Within(1e-9), $"{what}[{e.i}]");
            }
        }

        [Test] public void TreesMatchTheWebIsland() => Same(L.Trunks, VegetationFixture.TrunksCount, VegetationFixture.TrunksSums, VegetationFixture.TrunksSamples, "trees");
        [Test] public void PalmsMatchTheWebIsland() => Same(L.Palms, VegetationFixture.PalmsCount, VegetationFixture.PalmsSums, VegetationFixture.PalmsSamples, "palms");
        [Test] public void RocksMatchTheWebIsland() => Same(L.Rocks, VegetationFixture.RocksCount, VegetationFixture.RocksSums, VegetationFixture.RocksSamples, "rocks");
        [Test] public void FernsMatchTheWebIsland() => Same(L.Ferns, VegetationFixture.FernsCount, VegetationFixture.FernsSums, VegetationFixture.FernsSamples, "ferns");

        [Test]
        public void NothingGrowsInsideTheSliceArena()
        {
            // the slice arena is island x ±80, z −175..−15 (base flat) — trees must keep out
            foreach (var t in L.Trunks) Assert.That(Math.Abs(t.X) < 80 && t.Z > -175 && t.Z < -15, Is.False);
            foreach (var r in L.Rocks) Assert.That(Math.Abs(r.X) < 80 && r.Z > -175 && r.Z < -15, Is.False);
        }
    }
}

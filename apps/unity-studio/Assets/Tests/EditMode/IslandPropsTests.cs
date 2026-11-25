using System.Linq;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Core.IslandProps against the calls the web game's own build.js beach section makes (PropsFixture.g.cs).</summary>
    public sealed class IslandPropsTests
    {
        static readonly PropSet Beach = IslandProps.Beach();

        [Test]
        public void BeachCallsMatchTheWebGame()
        {
            Assert.AreEqual(PropsFixture.Beach.Length, Beach.Calls.Count, "call count");
            for (int i = 0; i < Beach.Calls.Count; i++)
            {
                PropCall a = Beach.Calls[i], e = PropsFixture.Beach[i];
                string at = $"#{i} {e}";
                Assert.AreEqual(e.Op, a.Op, at); Assert.AreEqual(e.Geo, a.Geo, at); Assert.AreEqual(e.Mat, a.Mat, at);
                Assert.AreEqual(e.Hidden, a.Hidden, at); Assert.AreEqual(e.NoCol, a.NoCol, at); Assert.AreEqual(e.Rot90, a.Rot90, at); Assert.AreEqual(e.Origin, a.Origin, at);
                Assert.AreEqual(e.Kind, a.Kind, at); Assert.AreEqual(e.Surface, a.Surface, at);
                double[] ev = { e.X, e.Y, e.Z, e.Sx, e.Sy, e.Sz, e.RotY }, av = { a.X, a.Y, a.Z, a.Sx, a.Sy, a.Sz, a.RotY };
                for (int k = 0; k < ev.Length; k++) Assert.That(av[k], Is.EqualTo(ev[k]).Within(1e-9), $"{at} value {k}");
                Assert.AreEqual(e.Tint == null, a.Tint == null, at + " tint");
                if (e.Tint != null) Assert.That(a.Tint, Is.EqualTo(e.Tint).Within(1e-12), at + " tint");
            }
        }

        [Test]
        public void SniperDeckIsTheWebTowerTop()
        {
            var t = Beach.Points["beachTower"];
            Assert.That(t.y, Is.EqualTo(PropsFixture.BeachTowerTopY).Within(1e-9));
            Assert.That(t.x, Is.EqualTo(10)); Assert.That(t.z, Is.EqualTo(284));
            var deck = Beach.Calls.First(c => c.IsBox && c.Hidden && c.X == 10 && c.Z == 284 && c.Sx == 3.6);
            Assert.That(deck.Y + deck.Sy, Is.EqualTo(t.y).Within(1e-9), "the deck collider's top is where the sniper stands (web top())");
            Assert.That(IslandProps.Top(Beach, 10, 284), Is.EqualTo(PropsFixture.BeachTowerTopY).Within(1e-9), "web top(10, 284)");
            Assert.That(IslandProps.Top(Beach, 0, 300), Is.LessThan(5), "open beach: the ground");
            var m01 = Campaign.M01.Spawns.Single(s => s.Kind == "sniper");
            Assert.That((m01.X, m01.Z), Is.EqualTo((t.x, t.z)), "Mission 01's sniper spawns on this tower");
        }

        [Test]
        public void BeachHasTheBriefedStructures()
        {
            Assert.AreEqual(2, Beach.Calls.Count(c => c.Geo == "Watchtower"), "watch towers");
            Assert.AreEqual(1, Beach.Radars.Count, "coastal radar");
            Assert.AreEqual(6, Beach.Calls.Count(c => c.Geo == "P_sandbags"), "sandbag walls");
            Assert.AreEqual(9, Beach.Calls.Count(c => c.Geo == "Hedgehog"), "beach obstacles");
            Assert.AreEqual(2, Beach.Lights.Count, "lit lamps");
            Assert.IsTrue(Beach.Calls.Where(c => c.HasCollider || (c.IsBox && c.Hidden)).All(c => c.Sx > 0 && c.Sy > 0 && c.Sz > 0));
        }
    }
}

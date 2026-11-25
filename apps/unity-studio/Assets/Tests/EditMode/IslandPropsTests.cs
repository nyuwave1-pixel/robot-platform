using System.Linq;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Core.IslandProps against the calls the web game's own build.js beach section makes (PropsFixture.g.cs).</summary>
    public sealed class IslandPropsTests
    {
        static readonly PropSet Beach = IslandProps.Beach();

        [Test] public void BeachCallsMatchTheWebGame() => Same(PropsFixture.Beach, Beach);
        [Test] public void JungleStationCallsMatchTheWebGame() => Same(PropsFixture.Jungle, IslandProps.Jungle());
        [Test] public void GenOutpostCallsMatchTheWebGame() => Same(PropsFixture.GenOutpost, IslandProps.GenOutpost());
        [Test] public void BaseCallsMatchTheWebGame() => Same(PropsFixture.Base, IslandProps.Base());
        [Test] public void FacilityCallsMatchTheWebGame() => Same(PropsFixture.Facility, IslandProps.Facility());
        [Test] public void AirfieldCallsMatchTheWebGame() => Same(PropsFixture.Airfield, IslandProps.Airfield());

        [Test]
        public void AirfieldSniperStandsOnTheContainer()
        {
            var a = IslandProps.Airfield();
            Assert.That(IslandProps.Top(a, 232, -300), Is.EqualTo(7 + 2.6).Within(1e-9), "M05 sniper: web top(232, -300) = the blue container's roof");
        }

        [Test]
        public void FacilityPointsAndCamerasMatchTheWebGame()
        {
            var f = IslandProps.Facility();
            foreach (var (name, x, y, z) in PropsFixture.FacilityPoints)
                Assert.That(f.Points[name], Is.EqualTo((x, y, z)).Using<(double, double, double)>((a, b) => System.Math.Abs(a.Item1 - b.Item1) < 1e-9 && System.Math.Abs(a.Item2 - b.Item2) < 1e-9 && System.Math.Abs(a.Item3 - b.Item3) < 1e-9), name);
            Assert.AreEqual(PropsFixture.Cameras.Length, f.Cameras.Count);
            for (int i = 0; i < f.Cameras.Count; i++) { Assert.That(f.Cameras[i].X, Is.EqualTo(PropsFixture.Cameras[i].x).Within(1e-9)); Assert.That(f.Cameras[i].Z, Is.EqualTo(PropsFixture.Cameras[i].z).Within(1e-9)); }
            Assert.That(f.Slabs.Count, Is.EqualTo(12), "floor + ceiling for each of the 6 rooms");
            Assert.IsTrue(f.Slabs.Where(sl => sl.Kind == "floor").All(sl => System.Math.Abs(sl.Y + sl.Sy - IslandProps.FacY) < 1e-9), "floors top out at FAC_Y");
        }

        [Test]
        public void BaseIntelTerminalAndSniperTowersMatchTheWebGame()
        {
            var b = IslandProps.Base();
            Assert.That(b.Points["intel"], Is.EqualTo(PropsFixture.Intel));
            foreach (var (x, z) in new[] { (-112.0, -8.0), (112.0, -8.0) }) Assert.That(IslandProps.Top(b, x, z), Is.EqualTo(16 + 7.25).Within(0.3), $"corner tower deck at ({x}, {z})");
            Assert.AreEqual(3, b.Models.Count(m => m.Geo == "Truck")); Assert.AreEqual(1, b.Radars.Count);
        }

        [Test]
        public void JunglePointsMatchTheWebGame()
        {
            Assert.That(IslandProps.Comms, Is.EqualTo(PropsFixture.Comms)); Assert.That(IslandProps.Gen, Is.EqualTo(PropsFixture.Gen));
            var j = IslandProps.Jungle();
            Assert.AreEqual(1, j.Models.Count(m => m.Geo == "CommsTower"), "relay mast");
            var t = j.Points["commsTower"];
            Assert.That(IslandProps.Top(j, t.x, t.z), Is.EqualTo(t.y).Within(1e-9), "M02's comms sniper stands on this deck (web top)");
            var mast = j.Points["commsMast"];
            Assert.That(IslandProps.Top(j, mast.x, mast.z), Is.LessThan(mast.y + 1), "nobody stands on the 30 m mast collider (noStand)");
        }

        static void Same(PropCall[] expected, PropSet set)
        {
            Assert.AreEqual(expected.Length, set.Calls.Count, "call count");
            for (int i = 0; i < set.Calls.Count; i++)
            {
                PropCall a = set.Calls[i], e = expected[i];
                string at = $"#{i} {e}";
                Assert.AreEqual(e.Op, a.Op, at); Assert.AreEqual(e.Geo, a.Geo, at); Assert.AreEqual(e.Mat, a.Mat, at);
                Assert.AreEqual(e.Hidden, a.Hidden, at); Assert.AreEqual(e.NoCol, a.NoCol, at); Assert.AreEqual(e.Rot90, a.Rot90, at); Assert.AreEqual(e.Origin, a.Origin, at);
                Assert.AreEqual(e.Kind, a.Kind, at); Assert.AreEqual(e.Surface, a.Surface, at); Assert.AreEqual(e.NoStand, a.NoStand, at);
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

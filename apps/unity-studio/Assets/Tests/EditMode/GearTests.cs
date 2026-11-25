using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Tactical equipment follows the web game (gear.js, player.js heal).</summary>
    public sealed class GearTests
    {
        [Test]
        public void UnlocksFollowCampaignProgress()
        {
            Assert.IsTrue(Gear.Has("nvg", 0)); Assert.IsTrue(Gear.Has("light", 0)); Assert.IsTrue(Gear.Has("medkit", 0));
            Assert.IsFalse(Gear.Has("drone", 0)); Assert.IsTrue(Gear.Has("drone", 1));
            Assert.IsFalse(Gear.Has("thermal", 1)); Assert.IsTrue(Gear.Has("thermal", 2));
            Assert.IsTrue(Gear.Has("thermal", 0, all: true), "outside the campaign everything is on");
        }

        [Test]
        public void VisionToggles()
        {
            Assert.AreEqual(Vision.Night, Gear.Toggle(Vision.Off, Vision.Night));
            Assert.AreEqual(Vision.Off, Gear.Toggle(Vision.Night, Vision.Night));
            Assert.AreEqual(Vision.Thermal, Gear.Toggle(Vision.Night, Vision.Thermal));
        }

        [Test]
        public void BatteryDrainsRechargesAndRefuses()
        {
            var b = new DroneBattery();
            Assert.IsFalse(b.TryLaunch(false, out var why)); Assert.AreEqual("NO DRONE SIGNAL UNDERGROUND", why);
            Assert.IsTrue(b.TryLaunch(true, out _));
            bool empty = false; for (int i = 0; i < 46 && !empty; i++) empty = b.Tick(1f);
            Assert.IsTrue(empty, "45 s of flight"); Assert.IsFalse(b.Active); Assert.AreEqual(0f, b.Level);
            Assert.IsFalse(b.TryLaunch(true, out why)); Assert.AreEqual("DRONE BATTERY LOW", why);
            for (int i = 0; i < 9; i++) b.Tick(1f);   // 9 s: 0.15
            Assert.IsTrue(b.TryLaunch(true, out _), "15 % is enough");
        }

        [Test]
        public void DroneStaysLowAndLeashed()
        {
            var p = Gear.ClampDrone(500, 300, 0, 10, 0, 0);
            Assert.That(p.x, Is.EqualTo(230).Within(1e-9)); Assert.That(p.y, Is.EqualTo(82).Within(1e-9));
            Assert.That(Gear.ClampDrone(0, -5, 0, -3, 0, 0).y, Is.EqualTo(2).Within(1e-9), "over the sea: 2 m above sea level");
            Assert.IsTrue(Gear.DroneSees(100, 0.9)); Assert.IsFalse(Gear.DroneSees(160, 0.99)); Assert.IsFalse(Gear.DroneSees(50, 0.8));
            Assert.IsFalse(Gear.DroneHasSignal(-60)); Assert.IsTrue(Gear.DroneHasSignal(16));
        }

        [Test]
        public void MedkitRule()
        {
            Assert.IsTrue(Gear.CanHeal(2, 40, 100)); Assert.IsFalse(Gear.CanHeal(0, 40, 100)); Assert.IsFalse(Gear.CanHeal(2, 100, 100));
        }

        [Test]
        public void NumbersAreTheWebOnes()
        {
            string Find(params string[] rel)
            {
                foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                    for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
                        foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", Path.Combine(rel)), Path.Combine(dir.FullName, "apps", "special-soldier", Path.Combine(rel)) })
                            if (File.Exists(p)) return File.ReadAllText(p);
                return null;
            }
            var gear = Find("src", "game", "gear.js"); var player = Find("src", "game", "player.js");
            if (gear == null || player == null) Assert.Ignore("web game source not found");
            foreach (var g in Gear.Items) StringAssert.Contains($"{{ id: '{g.Id}', name: '{g.Name}', key: '{g.Key}', unlock: {g.Unlock} }}", gear);
            StringAssert.Contains("this.battery -= dt / 45", gear); StringAssert.Contains("this.battery = Math.min(1, this.battery + dt / 60)", gear);
            StringAssert.Contains("this.battery < 0.15 || G.player.pos.y < -30", gear);
            StringAssert.Contains("Math.max(G.world.heightAt(this.dronePos.x, this.dronePos.z), 0) + 2; this.dronePos.y = clamp(this.dronePos.y, g, g + 70)", gear);
            StringAssert.Contains("if (dl > 230)", gear); StringAssert.Contains("sp = 15 * dt", gear); StringAssert.Contains("this.scanT = 0.3", gear);
            StringAssert.Contains("if (d < 150 && _b.multiplyScalar(1 / d).dot(_d) > 0.82", gear);
            StringAssert.Contains("this.medkits = 2", player); StringAssert.Contains("this.health = Math.min(100, this.health + 65)", player);
        }
    }
}

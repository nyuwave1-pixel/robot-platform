using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Campaign missions in Unity must be the web game's (parsed from apps/special-soldier/src/game/missions.js).</summary>
    public class CampaignTests
    {
        static string Web(params string[] rel)
        {
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", Path.Combine(rel)), Path.Combine(dir.FullName, "apps", "special-soldier", Path.Combine(rel)) })
                        if (File.Exists(p)) return File.ReadAllText(p);
            return null;
        }
        static double D(string s) => double.Parse(s, CultureInfo.InvariantCulture);

        static string MissionBlock(string js, string code)
        {
            int a = js.IndexOf($"code: '{code}'", StringComparison.Ordinal); Assert.That(a, Is.GreaterThan(0), code + " not in missions.js");
            int b = js.IndexOf("{ code: 'MISSION", a + 10, StringComparison.Ordinal); return b < 0 ? js.Substring(a) : js.Substring(a, b - a);
        }

        [Test]
        public void Mission01SpawnsMatchTheWebGame()
        {
            var js = Web("src", "game", "missions.js"); if (js == null) Assert.Ignore("web game source not found");
            var block = MissionBlock(js, "MISSION 01");
            var sps = Regex.Matches(block, @"sp\('(\w+)', (-?[\d.]+), (-?[\d.]+), \{ group: g(.*?)\}\)");
            var m = Campaign.M01;
            Assert.That(sps.Count, Is.EqualTo(m.Spawns.Length), "spawn count");
            for (int i = 0; i < sps.Count; i++)
            {
                var g = sps[i].Groups; var s = m.Spawns[i]; string opts = g[4].Value;
                Assert.That(s.Kind, Is.EqualTo(g[1].Value), $"#{i} kind"); Assert.That(s.X, Is.EqualTo(D(g[2].Value)), $"#{i} x"); Assert.That(s.Z, Is.EqualTo(D(g[3].Value)), $"#{i} z");
                Assert.That(s.Group, Is.EqualTo("beach"));
                var yaw = Regex.Match(opts, @"yaw: (-?[\d.]+)");
                Assert.That(s.Yaw.HasValue, Is.EqualTo(yaw.Success), $"#{i} yaw present"); if (yaw.Success) Assert.That(s.Yaw.Value, Is.EqualTo(D(yaw.Groups[1].Value)));
                Assert.That(s.OnStructure, Is.EqualTo(opts.Contains("y: top(")), $"#{i} on structure");
                var patrol = Regex.Match(opts, @"patrol: \[(.*)\]");
                if (!patrol.Success) { Assert.That(s.Patrol, Is.Null, $"#{i} patrol"); continue; }
                var pts = Regex.Matches(patrol.Groups[1].Value, @"\[(-?[\d.]+), (-?[\d.]+)\]").Select(p => (D(p.Groups[1].Value), D(p.Groups[2].Value))).ToArray();
                Assert.That(s.Patrol, Is.EqualTo(pts), $"#{i} patrol");
            }
        }

        [Test]
        public void Mission01ObjectivesSkySpawnAndQrfMatchTheWebGame()
        {
            var js = Web("src", "game", "missions.js"); if (js == null) Assert.Ignore("web game source not found");
            var block = MissionBlock(js, "MISSION 01"); var m = Campaign.M01;
            StringAssert.Contains($"name: '{m.Name}'", block); StringAssert.Contains($"zone: '{m.Zone}'", block); StringAssert.Contains($"sky: '{m.SkyId}'", block);
            StringAssert.Contains("spawn: () => ({ x: 0, z: 328.5, yaw: 0 })", block);
            StringAssert.Contains("{ type: 'kill', group: 'beach', text: 'Eliminate the beach sentries'", block);
            StringAssert.Contains("{ type: 'reach', x: 0, z: 240, r: 10, text: 'Move to the jungle trail head'", block);
            StringAssert.Contains("wave([['assault', -6, 236], ['assault', 5, 232], ['guard', 0, 228]], 'qrf')", block);
            StringAssert.Contains(m.AlarmRadio, block);
            foreach (var line in m.Brief) StringAssert.Contains(line, block);
        }

        [Test]
        public void AlarmCountsOncePerMissionLikeTheWebGame()
        {
            var js = Web("src", "game", "missions.js");
            if (js != null) StringAssert.Contains("if (name === 'alarm' && !this.flags.alarm) { this.flags.alarm = true; this.stats.alarms++;", js);
            var en = Web("src", "game", "enemies.js");
            if (en != null) StringAssert.Contains("e.callT = 5", en);
            var r = Campaign.M01.NewRunner(); int raised = 0; r.AlarmRaised += () => raised++;
            Assert.That(r.RaiseAlarm(), Is.True); Assert.That(r.RaiseAlarm(), Is.False); Assert.That(r.RaiseAlarm(), Is.False);
            Assert.That(r.Stats.Alarms, Is.EqualTo(1)); Assert.That(raised, Is.EqualTo(1));
            Assert.That(r.Stats.Grade, Is.Not.EqualTo('C'), "one alarm costs one point, not more");
        }

        [Test]
        public void ObjectivesSitWhereTheWebPutsThem()
        {
            var r = Campaign.M01.NewRunner();
            Assert.That(r.Objectives[0].Kind, Is.EqualTo(ObjectiveKind.Kill)); Assert.That(r.Objectives[0].Group, Is.EqualTo("beach"));
            var reach = r.Objectives[1]; var island = IslandTerrain.ToIsland(reach.At.X, 0, reach.At.Z);
            Assert.That(island.x, Is.EqualTo(0).Within(1e-4)); Assert.That(island.z, Is.EqualTo(240).Within(1e-4)); Assert.That(reach.Radius, Is.EqualTo(10f));
        }

        [Test]
        public void WebAnglesBecomeUnityYaw()
        {
            Assert.That(WebAngles.EnemyYawToWorldDeg(0), Is.EqualTo(180.0), "a sentry with yaw 0 faces web +z (the sea): Unity −z after the flip");
            Assert.That(WebAngles.PlayerYawToWorldDeg(0), Is.EqualTo(0.0), "the player at yaw 0 looks web −z (inland): Unity +z");
            var sea = IslandTerrain.ToWorld(0, 0, 400); var shore = IslandTerrain.ToWorld(0, 0, 300);
            Assert.That(sea.z, Is.LessThan(shore.z), "the sea is toward Unity −z from the beach");
        }

        [Test]
        public void MissionAreaCoversSpawnsObjectivesAndTheQrf()
        {
            var m = Campaign.M01; var a = m.Area;
            foreach (var s in m.Spawns.Concat(m.AlarmWave)) { Assert.That(s.X, Is.InRange(a.minX, a.maxX), s.Kind); Assert.That(s.Z, Is.InRange(a.minZ, a.maxZ), s.Kind); }
            Assert.That(m.SpawnZ, Is.InRange(a.minZ, a.maxZ)); Assert.That(240.0, Is.InRange(a.minZ, a.maxZ));
            Assert.That(IslandTerrain.Height(m.SpawnX, m.SpawnZ), Is.GreaterThan(-1.5), "the player starts on the beach, not deep in the sea");
        }
    }
}

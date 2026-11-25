using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Core.Campaign against what the web game's own mission objects do (CampaignFixture.g.cs, from
    /// Tools~/gen-campaign-fixture.mjs running missions.js): spawns, objectives, interact points and every hook.</summary>
    public sealed class CampaignParityTests
    {
        static IEnumerable<TestCaseData> Missions()
        {
            yield return new TestCaseData(Campaign.M01, CampaignFixture.MISSION01).SetName("MISSION 01");
            yield return new TestCaseData(Campaign.M02, CampaignFixture.MISSION02).SetName("MISSION 02");
        }

        sealed class FakeWorld : IMissionWorld
        {
            public int AliveCount = 1;
            public Vec2 PlayerPosition => new Vec2(0, 0);
            public bool InteractHeld => false;
            public int Alive(string group) => AliveCount;
        }

        [TestCaseSource(nameof(Missions))]
        public void HeaderAndSpawns(CampaignMission m, MissionFixture f)
        {
            Assert.AreEqual(f.Code, m.Code); Assert.AreEqual(f.Name, m.Name); Assert.AreEqual(f.Zone, m.Zone); Assert.AreEqual(f.Sky, m.SkyId);
            Assert.That((m.SpawnX, m.SpawnZ, m.SpawnYaw), Is.EqualTo((f.SpawnX, f.SpawnZ, f.SpawnYaw)));
            Assert.AreEqual(f.Spawns.Length, m.Spawns.Length, "spawn count");
            for (int i = 0; i < f.Spawns.Length; i++)
            {
                var e = f.Spawns[i]; var a = m.Spawns[i]; string at = $"#{i} {e.kind}";
                Assert.AreEqual(e.kind, a.Kind, at); Assert.AreEqual(e.group, a.Group, at);
                Assert.That(a.X, Is.EqualTo(e.x).Within(1e-9), at); Assert.That(a.Z, Is.EqualTo(e.z).Within(1e-9), at);
                Assert.AreEqual(e.yaw.HasValue, a.Yaw.HasValue, at + " yaw"); if (e.yaw.HasValue) Assert.That(a.Yaw.Value, Is.EqualTo(e.yaw.Value).Within(1e-12), at);
                Assert.AreEqual(e.onStructure, a.OnStructure, at + " on structure");
                Assert.AreEqual(e.patrol == null, a.Patrol == null, at + " patrol");
                if (e.patrol != null) Assert.That(a.Patrol.SelectMany(p => new[] { p.x, p.z }).ToArray(), Is.EqualTo(e.patrol).Within(1e-9), at + " patrol");
            }
            var area = m.Area;
            foreach (var s in m.Spawns.Concat(m.AlarmWave ?? new SpawnDef[0]).Concat(m.Waves.Values.SelectMany(w => w)))
                Assert.IsTrue(s.X >= area.minX && s.X <= area.maxX && s.Z >= area.minZ && s.Z <= area.maxZ, $"{s.Kind} {s.Group} ({s.X}, {s.Z}) outside the NavMesh area");
        }

        [TestCaseSource(nameof(Missions))]
        public void Objectives(CampaignMission m, MissionFixture f)
        {
            var r = m.NewRunner();
            var flat = new List<(int parent, Objective o)>();
            for (int i = 0; i < r.Objectives.Count; i++) { flat.Add((-1, r.Objectives[i])); foreach (var p in r.Objectives[i].Parts ?? new List<Objective>()) flat.Add((i, p)); }
            Assert.AreEqual(f.Objectives.Length, flat.Count, "objective count");
            for (int i = 0; i < flat.Count; i++)
            {
                var e = f.Objectives[i]; var (parent, o) = flat[i]; string at = $"#{i} {e.text}";
                Assert.AreEqual(e.parent, parent, at); Assert.AreEqual(e.type, o.Kind.ToString().ToLowerInvariant(), at); Assert.AreEqual(e.text, o.Text, at);
                Assert.AreEqual(e.group, o.Group ?? "", at); Assert.AreEqual(e.label, o.Label ?? "", at); Assert.AreEqual(e.radio, o.Radio ?? "", at + " radio");
                if (e.hold.HasValue) Assert.That(o.Hold, Is.EqualTo(e.hold.Value).Within(1e-6), at);
                if (e.r.HasValue) Assert.That(o.Radius, Is.EqualTo(e.r.Value).Within(1e-6), at);
                if (e.x.HasValue && (o.Kind == ObjectiveKind.Reach || o.Kind == ObjectiveKind.Interact))
                {
                    var isl = IslandTerrain.ToIsland(o.At.X, 0, o.At.Z);
                    Assert.That(isl.x, Is.EqualTo(e.x.Value).Within(1e-3), at + " x"); Assert.That(isl.z, Is.EqualTo(e.z.Value).Within(1e-3), at + " z");
                }
            }
        }

        static string Wave(string group, IEnumerable<SpawnDef> list) => group + ":" + string.Join(";", list.Select(s => $"{s.Kind}@{s.X},{s.Z}"));

        [TestCaseSource(nameof(Missions))]
        public void HooksSayAndSendWhatTheWebGameDoes(CampaignMission m, MissionFixture f)
        {
            foreach (var h in f.Hooks)
            {
                var radio = new List<string>(); var waves = new List<string>();
                if (h.name == "alarm")
                {
                    radio.Add(m.AlarmRadio);
                    if (m.AlarmWave != null) waves.Add(Wave(m.AlarmWave[0].Group, m.AlarmWave));
                    if (h.waves.Length == 0) Assert.IsNotNull(m.AlarmSearchPrefix, "an alarm without a wave sends the patrols searching");
                }
                else
                {
                    var r = m.NewRunner(); var w = new FakeWorld { AliveCount = h.alive };
                    r.Begin(w);
                    r.RadioSaid += radio.Add; r.WaveRequested += (name, n) => waves.Add(Wave(name, m.Waves[name].Take(n)));
                    if (h.flags.Contains("powerCut")) r.Flags.Add("powerCut");
                    var idx = h.name.Split(' ')[1].Split('.').Select(int.Parse).ToArray();
                    var o = r.Objectives[idx[0]];
                    if (h.name.StartsWith("start")) o.OnStart(r); else o.Parts[idx[1]].OnDone(r);
                    bool after = r.Flags.Contains("powerCut");
                    Assert.AreEqual(h.flagsAfter.Contains("\"powerCut\":true"), after, h.name + " flags");
                }
                Assert.That(radio, Is.EqualTo(h.radio), $"{h.name} {h.flags} alive {h.alive}: radio");
                Assert.That(waves, Is.EqualTo(h.waves), $"{h.name} {h.flags}: waves");
            }
        }

        [Test]
        public void Mission02PlaysThroughInEitherOrder_PowerCutHalvesTheCounterAttack()
        {
            foreach (bool generatorFirst in new[] { true, false })
            {
                var r = Campaign.M02.NewRunner(); var w = new FakeWorld { AliveCount = 3 }; var sent = new List<int>(); string evt = null;
                r.WaveRequested += (name, n) => sent.Add(n); r.EventRaised += e => evt = e;
                r.Begin(w);
                r.Objectives[0].OnDone?.Invoke(r);
                // the generator part's hook decides the flag from how many comms soldiers are still alive
                w.AliveCount = generatorFirst ? 3 : 0;
                r.Objectives[1].Parts[1].OnDone(r);
                Assert.AreEqual(generatorFirst, r.Flags.Contains("powerCut"));
                r.Objectives[3].OnDone(r); Assert.AreEqual("detonate", evt);
                r.Objectives[4].OnStart(r);
                Assert.That(sent, Is.EqualTo(new[] { generatorFirst ? 3 : 5 }));
            }
        }
    }
}

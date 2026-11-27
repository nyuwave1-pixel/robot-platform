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
            yield return new TestCaseData(Campaign.M03, CampaignFixture.MISSION03).SetName("MISSION 03");
            yield return new TestCaseData(Campaign.M04, CampaignFixture.MISSION04).SetName("MISSION 04");
            yield return new TestCaseData(Campaign.M05, CampaignFixture.MISSION05).SetName("MISSION 05");
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
            Assert.AreEqual(f.SpawnY, m.SpawnY, "spawn height");
            Assert.AreEqual(f.Spawns.Length, m.Spawns.Length, "spawn count");
            for (int i = 0; i < f.Spawns.Length; i++)
            {
                var e = f.Spawns[i]; var a = m.Spawns[i]; string at = $"#{i} {e.kind}";
                Assert.AreEqual(e.kind, a.Kind, at); Assert.AreEqual(e.group, a.Group, at);
                Assert.That(a.X, Is.EqualTo(e.x).Within(1e-9), at); Assert.That(a.Z, Is.EqualTo(e.z).Within(1e-9), at);
                Assert.AreEqual(e.yaw.HasValue, a.Yaw.HasValue, at + " yaw"); if (e.yaw.HasValue) Assert.That(a.Yaw.Value, Is.EqualTo(e.yaw.Value).Within(1e-12), at);
                Assert.AreEqual(e.onStructure, a.OnStructure, at + " on structure");
                Assert.AreEqual(e.y, a.Y, at + " height");
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
                Assert.AreEqual(e.parent, parent, at); Assert.AreEqual(e.type, o.WebType ?? o.Kind.ToString().ToLowerInvariant(), at); Assert.AreEqual(e.text, o.Text, at);
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

        [TestCaseSource(nameof(Missions))]
        public void IntroShots(CampaignMission m, MissionFixture f)
        {
            Assert.AreEqual(f.IntroKind, m.IntroKind, "intro kind");
            var shots = m.Intro ?? new CinematicShot[0];
            Assert.AreEqual(f.Intro.Length, shots.Length, "shot count");
            for (int i = 0; i < shots.Length; i++)
            {
                var e = f.Intro[i]; var a = shots[i];
                Assert.That(a.From, Is.EqualTo(e.from)); Assert.That(a.To, Is.EqualTo(e.to)); Assert.That(a.Look, Is.EqualTo(e.look));
                Assert.AreEqual(e.dur, a.Dur); Assert.AreEqual(e.text, a.Text); Assert.AreEqual(e.fov, a.Fov);
            }
        }

        static string Wave(IEnumerable<SpawnDef> list) => list.First().Group + ":" + string.Join(";", list.Select(s => $"{s.Kind}@{s.X},{s.Z}"));

        [TestCaseSource(nameof(Missions))]
        public void HooksSayAndSendWhatTheWebGameDoes(CampaignMission m, MissionFixture f)
        {
            foreach (var h in f.Hooks)
            {
                var radio = new List<string>(); var waves = new List<string>();
                if (h.name == "bossPhase2")
                {
                    radio.Add(m.BossPhase2Radio); waves.Add(Wave(m.Waves["phase2"]));
                }
                else if (h.name == "alarm")
                {
                    if (m.AlarmRadio != null) radio.Add(m.AlarmRadio);
                    if (m.AlarmWave != null) waves.Add(Wave(m.AlarmWave));
                    if (h.waves.Length == 0 && h.radio.Length > 0) Assert.IsNotNull(m.AlarmSearchPrefix, "an alarm without a wave sends the patrols searching");
                }
                else
                {
                    var r = m.NewRunner(); var w = new FakeWorld { AliveCount = h.alive };
                    r.Begin(w);
                    r.EventRaised += e => { if (h.radio.Contains("@" + e)) radio.Add("@" + e); };   // web mission-object calls (heliArrive, ending)
                    r.RadioSaid += radio.Add; r.WaveRequested += (name, n) => waves.Add(Wave(m.Waves[name].Take(n)));
                    foreach (System.Text.RegularExpressions.Match fm in System.Text.RegularExpressions.Regex.Matches(h.flags, "\"(\\w+)\":true")) r.Flags.Add(fm.Groups[1].Value);
                    var idx = h.name.Split(' ')[1].Split('.').Select(int.Parse).ToArray();
                    var o = r.Objectives[idx[0]];
                    if (h.name.StartsWith("tick")) { o.OnStart?.Invoke(r); radio.Clear(); waves.Clear(); o.OnTick(r, 2.1f); }   // the first wave after the 2 s lead-in
                    else if (h.name.StartsWith("start")) o.OnStart(r); else if (idx.Length == 1) o.OnDone(r); else o.Parts[idx[1]].OnDone(r);
                    var expect = System.Text.RegularExpressions.Regex.Matches(h.flagsAfter, "\"(\\w+)\":true").Cast<System.Text.RegularExpressions.Match>().Select(x => x.Groups[1].Value).OrderBy(x => x);
                    Assert.That(r.Flags.OrderBy(x => x), Is.EqualTo(expect), h.name + " flags");
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

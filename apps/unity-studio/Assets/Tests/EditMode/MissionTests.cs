using System;
using System.Collections.Generic;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class MissionTests
    {
        sealed class FakeWorld : IMissionWorld
        {
            public Vec2 PlayerPosition { get; set; }
            public bool InteractHeld { get; set; }
            public readonly Dictionary<string, int> Groups = new Dictionary<string, int>();
            public int Alive(string g) => Groups.TryGetValue(g, out var n) ? n : 0;
        }

        static MissionStats S(int shots, int hits, int alarms, int deaths, int kills, int heads) =>
            new MissionStats { Shots = shots, Hits = hits, Alarms = alarms, Deaths = deaths, Kills = kills, Headshots = heads };

        [TestCase(100, 50, 0, 0, 10, 3, 'S')]
        [TestCase(100, 50, 0, 0, 10, 2, 'A')]
        [TestCase(100, 30, 1, 0, 10, 0, 'B')]
        [TestCase(100, 10, 2, 2, 10, 0, 'C')]
        [TestCase(0, 0, 0, 0, 0, 0, 'A')]      // never fired, stealth run: 0 + 2 + 2 + 1 (0 ≥ 0) = 5
        [TestCase(200, 89, 0, 1, 20, 6, 'A')]  // 44.5% rounds to 45% like JS Math.round → 2+2+1+1 = 6
        public void GradeCases(int shots, int hits, int alarms, int deaths, int kills, int heads, char grade) =>
            Assert.That(S(shots, hits, alarms, deaths, kills, heads).Grade, Is.EqualTo(grade));

        [Test]
        public void PortalRewardPerGrade()
        {
            Assert.That(S(100, 50, 0, 0, 10, 3).PortalRp, Is.EqualTo(60));
            Assert.That(S(100, 10, 2, 2, 10, 0).PortalRp, Is.EqualTo(15));
        }

        [Test]
        public void KillScoreGivesHeadshotBonus()
        {
            var s = new MissionStats(); s.AddKill(100, false); s.AddKill(150, true);
            Assert.That(s.Kills, Is.EqualTo(2)); Assert.That(s.Headshots, Is.EqualTo(1)); Assert.That(s.Score, Is.EqualTo(325f));
        }

        [Test]
        public void ObjectivesRunInOrder()
        {
            var w = new FakeWorld { PlayerPosition = new Vec2(0, 0) }; w.Groups["beach"] = 2;
            var m = new MissionRunner("M01", "TEST", Objective.Kill("beach", "Eliminate the sentries"), Objective.Reach(new Vec2(0, 50), 10, "Move to the trail"));
            m.Tick(0.1f, w); Assert.That(m.Index, Is.EqualTo(0));
            Assert.That(m.ObjectiveText(w), Is.EqualTo("Eliminate the sentries — 2 left"));
            w.Groups["beach"] = 0; m.Tick(0.1f, w); Assert.That(m.Index, Is.EqualTo(1));
            w.PlayerPosition = new Vec2(0, 45); bool done = false; m.MissionCompleted += () => done = true;
            m.Tick(0.1f, w); Assert.That(m.Complete && done);
            Assert.That(m.Stats.Time, Is.EqualTo(0.3f).Within(1e-4));
        }

        [Test]
        public void AnyOrderObjectiveNeedsEveryPart()
        {
            var w = new FakeWorld(); w.Groups["hq"] = 1; w.Groups["motor"] = 3;
            var m = new MissionRunner("M03", "BASE", Objective.Any("Hit the base", Objective.Kill("hq", "HQ security"), Objective.Kill("motor", "Motor pool")));
            w.Groups["motor"] = 0; m.Tick(0.1f, w);
            Assert.That(m.Complete, Is.False);
            StringAssert.Contains("✓ Motor pool", m.ObjectiveText(w)); StringAssert.Contains("○ HQ security (1)", m.ObjectiveText(w));
            w.Groups["hq"] = 0; m.Tick(0.1f, w);
            Assert.That(m.Complete);
        }

        [Test]
        public void InteractNeedsAContinuousHoldInRange()
        {
            var w = new FakeWorld { PlayerPosition = new Vec2(0, 0) };
            var m = new MissionRunner("X", "X", Objective.Interact(new Vec2(1, 0), "DOWNLOAD INTEL", 3f, "Download the intel"));
            w.InteractHeld = true;
            for (int i = 0; i < 20; i++) m.Tick(0.1f, w);            // 2 s
            Assert.That(m.HoldProgress, Is.EqualTo(2f / 3f).Within(0.01));
            w.InteractHeld = false; m.Tick(0.1f, w);                   // let go: starts over
            Assert.That(m.HoldProgress, Is.EqualTo(0));
            w.InteractHeld = true; w.PlayerPosition = new Vec2(10, 0);   // out of range: nothing happens
            for (int i = 0; i < 40; i++) m.Tick(0.1f, w);
            Assert.That(m.Complete, Is.False); Assert.That(m.HoldTarget, Is.Null);
            w.PlayerPosition = new Vec2(0, 0);
            for (int i = 0; i < 31; i++) m.Tick(0.1f, w);
            Assert.That(m.Complete);
        }

        [Test]
        public void DefendCountsDown()
        {
            var w = new FakeWorld();
            var m = new MissionRunner("X", "X", Objective.Defend(90, "Hold the helipad"));
            Assert.That(m.ObjectiveText(w), Is.EqualTo("Hold the helipad — 1:30"));
            for (int i = 0; i < 899; i++) m.Tick(0.1f, w);
            Assert.That(m.Complete, Is.False);
            m.Tick(0.2f, w); Assert.That(m.Complete);
        }

        [Test]
        public void GradeFormulaMatchesTheWebSource()
        {
            string js = null;
            foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                for (var dir = new DirectoryInfo(start); dir != null && js == null; dir = dir.Parent)
                    foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", "src", "main.js"), Path.Combine(dir.FullName, "apps", "special-soldier", "src", "main.js") })
                        if (File.Exists(p)) { js = File.ReadAllText(p); break; }
            if (js == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("pts += acc >= 45 ? 2 : acc >= 25 ? 1 : 0; pts += st.alarms === 0 ? 2 : st.alarms === 1 ? 1 : 0; pts += st.deaths === 0 ? 2 : st.deaths === 1 ? 1 : 0; pts += st.headshots >= st.kills * 0.3 ? 1 : 0;", js);
            StringAssert.Contains("const grade = pts >= 7 ? 'S' : pts >= 5 ? 'A' : pts >= 3 ? 'B' : 'C'", js);
            StringAssert.Contains("{ S: 60, A: 45, B: 30, C: 15 }", js);
        }
    }
}

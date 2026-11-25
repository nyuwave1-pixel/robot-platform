using System;
using System.IO;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>Campaign unlocks and best records follow the web game (main.js onMissionComplete, menu.js campaign()).</summary>
    public sealed class CampaignProgressTests
    {
        static MissionStats Run(int kills, int heads, int shots, int hits, int alarms, int deaths, float time)
            => new MissionStats { Kills = kills, Headshots = heads, Shots = shots, Hits = hits, Alarms = alarms, Deaths = deaths, Time = time };

        [Test]
        public void FinishingAMissionUnlocksTheNext()
        {
            var p = new CampaignProgress();
            Assert.IsTrue(p.Unlocked(0)); Assert.IsFalse(p.Unlocked(1));
            Assert.IsTrue(p.Complete(0, Run(9, 3, 40, 20, 0, 0, 300)), "first clear");
            Assert.IsTrue(p.Unlocked(1)); Assert.IsFalse(p.Unlocked(2));
            Assert.IsFalse(p.Complete(0, Run(9, 3, 40, 20, 0, 0, 300)), "replaying is not a first clear");
            Assert.AreEqual(1, p.Progress, "replaying an earlier mission never lowers progress");
            Assert.AreEqual(1, p.Current(5)); for (int i = 1; i < 5; i++) p.Complete(i, Run(1, 0, 1, 1, 0, 0, 1)); Assert.AreEqual(4, p.Current(5), "capped at the last mission");
        }

        [Test]
        public void BestRecordKeepsTheBetterGrade()
        {
            var p = new CampaignProgress();
            p.Complete(2, Run(10, 4, 20, 10, 0, 0, 400));   // 50 % acc 2, no alarm 2, no death 2, heads 1 → S
            Assert.AreEqual('S', p.Best(2).Grade); Assert.AreEqual(400, p.Best(2).Time);
            p.Complete(2, Run(10, 0, 100, 10, 2, 2, 200));  // C
            Assert.AreEqual('S', p.Best(2).Grade, "a worse grade does not replace the record");
            p.Complete(2, Run(12, 5, 20, 12, 0, 0, 350));   // S again: equal grade replaces (web >=)
            Assert.AreEqual(350, p.Best(2).Time);
        }

        [Test]
        public void SavesAndLoads_BrokenSavesStartFresh()
        {
            var p = new CampaignProgress(); p.Complete(0, Run(9, 3, 40, 20, 0, 0, 300.4f)); p.Complete(1, Run(5, 0, 50, 10, 1, 1, 61));
            var q = CampaignProgress.FromJson(p.ToJson());
            Assert.AreEqual(2, q.Progress); Assert.AreEqual(p.Best(0).Grade, q.Best(0).Grade); Assert.AreEqual(300, q.Best(0).Time); Assert.AreEqual(p.Best(1).Alarms, q.Best(1).Alarms);
            Assert.AreEqual(0, CampaignProgress.FromJson(null).Progress); Assert.AreEqual(0, CampaignProgress.FromJson("{nonsense").Progress);
            Assert.IsNull(CampaignProgress.FromJson("{\"progress\":1,\"best0\":\"Z|1|2|3|4\"}").Best(0), "unknown grade ignored");
        }

        [Test]
        public void RulesAreTheWebOnes()
        {
            string Find(params string[] rel)
            {
                foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
                    for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
                        foreach (var p in new[] { Path.Combine(dir.FullName, "special-soldier", Path.Combine(rel)), Path.Combine(dir.FullName, "apps", "special-soldier", Path.Combine(rel)) })
                            if (File.Exists(p)) return File.ReadAllText(p);
                return null;
            }
            var main = Find("src", "main.js"); var menu = Find("src", "ui", "menu.js");
            if (main == null || menu == null) Assert.Ignore("web game source not found");
            StringAssert.Contains("s.progress = Math.max(s.progress, i + 1); const old = s.best[i]; if (!old || 'CBAS'.indexOf(grade) >= 'CBAS'.indexOf(old.grade))", main);
            StringAssert.Contains("first = s.progress <= i", main);
            StringAssert.Contains("const locked = i > p", menu);
        }
    }
}

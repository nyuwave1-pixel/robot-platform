using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class TacticsPlannerTests
    {
        static readonly Vec2 Threat = new Vec2(0, 0);
        static CoverBox Crate(float x, float z, float half = 0.7f, float h = 1.2f, bool usable = true) => new CoverBox(x - half, z - half, x + half, z + half, h, usable);

        [Test]
        public void CoverSpotIsOnTheFarSideOfTheObstacle()
        {
            var box = Crate(0, 20);
            var spot = TacticsPlanner.FindCover(new Vec2(3, 25), Threat, new Vec2(3, 25), 24, 20, new[] { box });
            Assert.That(spot.HasValue);
            Assert.That(spot.Value.Z, Is.GreaterThan(box.MaxZ), "behind the crate, away from the threat");
            Assert.That(Math.Abs(spot.Value.X), Is.LessThan(0.01f), "on the threat→crate line");
        }

        [Test]
        public void SkipsLowThinOversizedOrTakenCover()
        {
            var self = new Vec2(0, 30);
            Assert.That(TacticsPlanner.FindCover(self, Threat, self, 24, 20, new[] { Crate(0, 20, h: 0.6f) }).HasValue, Is.False, "too low");
            Assert.That(TacticsPlanner.FindCover(self, Threat, self, 24, 20, new[] { Crate(0, 20, usable: false) }).HasValue, Is.False, "glass/fence");
            Assert.That(TacticsPlanner.FindCover(self, Threat, self, 24, 20, new[] { Crate(0, 20, half: 20f) }).HasValue, Is.False, "a whole building");
            var spot = TacticsPlanner.FindCover(self, Threat, self, 24, 20, new[] { Crate(0, 20) });
            Assert.That(TacticsPlanner.FindCover(self, Threat, self, 24, 20, new[] { Crate(0, 20) }, new List<Vec2> { spot.Value }).HasValue, Is.False, "already taken");
        }

        [Test]
        public void PrefersNearCoverAtTheWantedRange()
        {
            var self = new Vec2(0, 22);
            var near = Crate(1, 20); var far = Crate(-15, 40);
            var spot = TacticsPlanner.FindCover(self, Threat, self, 30, 20, new[] { far, near });
            Assert.That(Vec2.Distance(spot.Value, near.Center), Is.LessThan(2f));
        }

        [Test]
        public void HoldNeverMovesAndSuppressClosesInOnlyFromFar()
        {
            var hold = new TacticsPlanner(CombatBehavior.Hold, new Random(1));
            Assert.That(hold.Plan(10, new Vec2(0, 60), Threat, 1, false, true, Array.Empty<CoverBox>()).HasGoal, Is.False);
            var sup = new TacticsPlanner(CombatBehavior.Suppress, new Random(1));
            var far = sup.Plan(10, new Vec2(0, 50), Threat, 1, false, true, Array.Empty<CoverBox>());
            Assert.That(far.HasGoal); Assert.That(far.Goal.Z, Is.EqualTo(35f).Within(0.01f)); Assert.That(far.InCover, Is.False);
            var sup2 = new TacticsPlanner(CombatBehavior.Suppress, new Random(1));
            Assert.That(sup2.Plan(10, new Vec2(0, 20), Threat, 1, false, true, Array.Empty<CoverBox>()).HasGoal, Is.False);
        }

        [Test]
        public void PushAdvancesTowardTheThreat()
        {
            var p = new TacticsPlanner(CombatBehavior.Push, new Random(2));
            var r = p.Plan(10, new Vec2(0, 50), Threat, 1, false, true, Array.Empty<CoverBox>());
            Assert.That(r.HasGoal); Assert.That(r.Goal.Z, Is.LessThan(50f)); Assert.That(r.Goal.Z, Is.GreaterThan(30f));
        }

        [Test]
        public void FlankSwingsAroundTheThreatAtCombatRange()
        {
            var f = new TacticsPlanner(CombatBehavior.Flank, new Random(3));
            var self = new Vec2(0, 30);
            var r = f.Plan(10, self, Threat, 1, false, true, Array.Empty<CoverBox>());
            Assert.That(r.HasGoal);
            Assert.That(Vec2.Distance(r.Goal, Threat), Is.InRange(12f, 26f));
            double angle = Math.Atan2(r.Goal.X, r.Goal.Z);
            Assert.That(Math.Abs(angle), Is.InRange(0.69, 1.21), "0.7–1.2 rad off the direct line");
        }

        [Test]
        public void ReplansOnlyEveryFewSeconds()
        {
            var c = new TacticsPlanner(CombatBehavior.Cover, new Random(4));
            var boxes = new[] { Crate(2, 20) };
            Assert.That(c.Plan(0.13f, new Vec2(0, 28), Threat, 1, false, true, boxes).HasGoal);
            Assert.That(c.Plan(0.13f, new Vec2(0, 28), Threat, 1, false, true, boxes).HasGoal, Is.False);
            Assert.That(c.Plan(6f, new Vec2(0, 28), Threat, 1, false, true, boxes).HasGoal, Is.True);
        }

        [Test]
        public void BadlyHurtCoverSoldierFallsBackOnce()
        {
            int retreats = 0;
            for (int seed = 0; seed < 50; seed++)
            {
                var c = new TacticsPlanner(CombatBehavior.Cover, new Random(seed));
                var r = c.Plan(0.13f, new Vec2(0, 20), Threat, 0.2f, true, true, Array.Empty<CoverBox>());
                if (!r.Retreat) continue;
                retreats++;
                Assert.That(r.Goal.Z, Is.GreaterThan(30f), "moves away from the threat");
                for (int k = 0; k < 20; k++)
                    Assert.That(c.Plan(0.13f, new Vec2(0, 20), Threat, 0.2f, true, true, Array.Empty<CoverBox>()).Retreat, Is.False, "never falls back twice");
            }
            Assert.That(retreats, Is.InRange(25, 45), "about 70% of the time, like the web game");
        }

        [Test]
        public void BehaviourMatchesTheEnemyType()
        {
            Assert.That(TacticsPlanner.BehaviorFor(EnemyType.Sentry), Is.EqualTo(CombatBehavior.Cover));
            Assert.That(TacticsPlanner.BehaviorFor(EnemyType.Assault), Is.EqualTo(CombatBehavior.Push));
            Assert.That(TacticsPlanner.BehaviorFor(EnemyType.Elite), Is.EqualTo(CombatBehavior.Flank));
            Assert.That(TacticsPlanner.BehaviorFor(EnemyType.Heavy), Is.EqualTo(CombatBehavior.Suppress));
            Assert.That(TacticsPlanner.BehaviorFor(EnemyType.Sniper), Is.EqualTo(CombatBehavior.Hold));
        }

        [Test]
        public void PeekCycleAlternatesWithinTheWebTimings()
        {
            var p = new PeekCycle(new Random(5));
            bool first = p.Tick(0.01f); int flips = 0; bool prev = first;
            for (int i = 0; i < 2000; i++) { bool h = p.Tick(0.01f); if (h != prev) flips++; prev = h; }
            Assert.That(first, Is.True, "first tick ducks");
            Assert.That(flips, Is.InRange(6, 15), "20 s of 0.9–3.0 s phases");
        }
    }
}

using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class HealthModelTests
    {
        [Test]
        public void ArmourSoaksItsShareUntilDepleted()
        {
            var h = new HealthModel(100, 20, 0.5f);
            Assert.That(h.TakeDamage(30), Is.EqualTo(15));   // 15 soaked
            Assert.That(h.Armor, Is.EqualTo(5));
            Assert.That(h.TakeDamage(30), Is.EqualTo(25));   // only 5 armour left
            Assert.That(h.Armor, Is.EqualTo(0));
        }

        [Test]
        public void DiesExactlyOnce()
        {
            var h = new HealthModel(50); int deaths = 0; h.Died += () => deaths++;
            h.TakeDamage(80); h.TakeDamage(10);
            Assert.That(h.Alive, Is.False); Assert.That(h.Health, Is.EqualTo(0)); Assert.That(deaths, Is.EqualTo(1));
        }
    }

    public class AwarenessBrainTests
    {
        static Perception Seen(float dist, bool sprint = false) => new Perception { SeesTarget = true, Distance = dist, TargetSprinting = sprint };

        static float SecondsToCombat(AwarenessBrain b, Perception p)
        {
            for (int i = 1; i <= 400; i++) { b.Tick(0.13f, p); if (b.State == AlertState.Combat) return i * 0.13f; }
            return float.PositiveInfinity;
        }

        [Test]
        public void CloseTargetIsSpottedFasterThanFarTarget()
        {
            float near = SecondsToCombat(new AwarenessBrain(EnemyType.Sentry), Seen(10));
            float far = SecondsToCombat(new AwarenessBrain(EnemyType.Sentry), Seen(60));
            Assert.That(near, Is.LessThan(far));
            Assert.That(near, Is.LessThan(2f));
        }

        [Test]
        public void SprintingAndAlertedEnemiesReactFaster()
        {
            float walk = SecondsToCombat(new AwarenessBrain(EnemyType.Sentry), Seen(40));
            float sprint = SecondsToCombat(new AwarenessBrain(EnemyType.Sentry), Seen(40, true));
            Assert.That(sprint, Is.LessThan(walk));
        }

        [Test]
        public void ASingleNoiseOnlyMakesThemSuspiciousForAWhile()
        {
            var b = new AwarenessBrain(EnemyType.Sentry);
            b.Tick(0.13f, new Perception { Distance = 10, NoiseRadius = 30 });     // heard something once
            Assert.That(b.State, Is.EqualTo(AlertState.Suspicious));
            for (int i = 0; i < 45; i++) b.Tick(0.13f, default);                   // the meter bleeds off at 0.18/s
            Assert.That(b.State, Is.EqualTo(AlertState.Patrol), "after 5 s of quiet they go back to patrol (web)");
        }

        [Test]
        public void KeptMakingNoiseTheySearchThenGiveUp()
        {
            var b = new AwarenessBrain(EnemyType.Sentry);
            for (int i = 0; i < 12; i++) b.Tick(0.13f, new Perception { Distance = 10, NoiseRadius = 30 });   // 1.6 s of noise: meter ≈ 0.93
            Assert.That(b.State, Is.EqualTo(AlertState.Suspicious));
            for (int i = 0; i < 6; i++) b.Tick(0.13f, default);
            Assert.That(b.State, Is.EqualTo(AlertState.Search), "still above 0.3 after 2.2 s suspicious → search");
            var c = new AwarenessBrain(EnemyType.Sentry);
            for (int i = 0; i < 30; i++) c.Tick(0.13f, new Perception { Distance = 10, NoiseRadius = 30 });
            Assert.That(c.State, Is.EqualTo(AlertState.Combat), "keep making noise and the meter fills (web: +0.5/s)");
            for (int i = 0; i < 160; i++) b.Tick(0.13f, default);
            Assert.That(b.State, Is.EqualTo(AlertState.Patrol));
        }

        [Test]
        public void LosingSightInCombatFallsBackToSearch()
        {
            var b = new AwarenessBrain(EnemyType.Assault);
            b.OnDamaged();
            Assert.That(b.State, Is.EqualTo(AlertState.Combat));
            for (int i = 0; i < 50; i++) b.Tick(0.13f, default);   // 6.5 s unseen
            Assert.That(b.State, Is.EqualTo(AlertState.Search));
        }

        [Test]
        public void HoldingSniperStaysSuspiciousInsteadOfSearching()
        {
            var b = new AwarenessBrain(EnemyType.Sniper) { Hold = true };
            b.Tick(0.13f, new Perception { Distance = 10, NoiseRadius = 30 });
            for (int i = 0; i < 25; i++) b.Tick(0.13f, default);
            Assert.That(b.State, Is.Not.EqualTo(AlertState.Search));
        }
    }
}

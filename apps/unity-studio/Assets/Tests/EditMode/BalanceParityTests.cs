using System;
using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>The C# balance model must give the same numbers as the web game's JavaScript model.
    /// Stats are stored as float in C#, so values are compared with a small relative tolerance.</summary>
    public class BalanceParityTests
    {
        const double Rel = 1e-5;
        static void Near(double expected, double actual, string what) =>
            Assert.That(actual, Is.EqualTo(expected).Within(Math.Max(1e-9, Math.Abs(expected) * Rel)), what);

        [TestCaseSource(typeof(BalanceFixture), nameof(BalanceFixture.Cases))]
        public void DamageHitChanceAndFieldDpsMatchJs(ParityCase c)
        {
            var w = WeaponTable.Get(c.Id);
            Near(c.DamageAt, Ballistics.DamageAt(w, c.Dist), "damageAt");
            Near(c.HitChance, Ballistics.HitChance(w, c.Dist), "hitChance");
            Near(c.EffectiveDps, Ballistics.EffectiveDps(w, c.Dist), "effectiveDps");
        }

        [TestCaseSource(typeof(BalanceFixture), nameof(BalanceFixture.Ttk))]
        public void TimeToKillMatchesJs(TtkCase c)
        {
            var (shots, time) = Ballistics.TimeToKill(WeaponTable.Get(c.Id), c.Hp, c.Armor, 20);
            Assert.That(shots, Is.EqualTo(c.Shots));
            Near(c.Time, time, "time");
        }

        [Test]
        public void BurstDpsAndCycleTimeMatchJsForEveryWeapon()
        {
            Assert.That(WeaponTable.All.Count, Is.EqualTo(BalanceFixture.PerWeapon.Count));
            foreach (var kv in BalanceFixture.PerWeapon)
            {
                var w = WeaponTable.Get(kv.Key);
                Near(kv.Value.burstDps, Ballistics.BurstDps(w), kv.Key + " burst");
                Near(kv.Value.cycleTime, Ballistics.CycleTime(w), kv.Key + " cycle");
            }
        }

        [Test]
        public void WeaponRolesHoldInTheirBands()
        {
            double F(string id, double d) => Ballistics.EffectiveDps(WeaponTable.Get(id), d);
            Assert.That(Ballistics.TimeToKill(WeaponTable.Get("shotgun"), 90, 0, 8).shots, Is.EqualTo(1), "shotgun one-shots a sentry in CQB");
            Assert.That(F("smg", 10), Is.GreaterThan(F("pistol", 10)));
            Assert.That(F("bolt", 200), Is.GreaterThan(F("smg", 200)));
            Assert.That(F("m4", 40), Is.GreaterThan(F("smg", 40)));
        }
    }
}

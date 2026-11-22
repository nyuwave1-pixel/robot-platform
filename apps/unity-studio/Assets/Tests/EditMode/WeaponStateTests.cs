using NUnit.Framework;

namespace SpecialSoldier.Core.Tests
{
    public class WeaponStateTests
    {
        static WeaponState M4() => new WeaponState(WeaponTable.Get("m4"));

        [Test]
        public void AutoFireFollowsTheCyclicRate()
        {
            var w = M4(); int shots = 0;
            for (int i = 0; i < 60; i++) shots += w.Tick(1f / 60f, true);   // one second of held trigger at 60 fps
            Assert.That(shots, Is.InRange(13, 14), "800 rpm = 13.3 rounds/s");
            Assert.That(w.Mag, Is.EqualTo(30 - shots));
        }

        [Test]
        public void SemiFiresOncePerPress()
        {
            var w = M4(); w.CycleMode(); Assert.That(w.Mode, Is.EqualTo(FireMode.Semi));
            int shots = 0;
            for (int i = 0; i < 30; i++) shots += w.Tick(1f / 60f, true);
            Assert.That(shots, Is.EqualTo(1));
            shots += w.Tick(1f / 60f, false); shots += w.Tick(1f / 60f, true);
            Assert.That(shots, Is.EqualTo(2));
        }

        [Test]
        public void BurstFiresThreeRoundsFromOneTap()
        {
            var w = new WeaponState(WeaponTable.Get("arx")); w.CycleMode(); Assert.That(w.Mode, Is.EqualTo(FireMode.Burst));
            int shots = w.Tick(1f / 60f, true);
            for (int i = 0; i < 30; i++) shots += w.Tick(1f / 60f, false);
            Assert.That(shots, Is.EqualTo(WeaponState.BurstCount));
        }

        [Test]
        public void EmptyMagazineAutoReloadsFromReserve()
        {
            var w = M4();
            for (int i = 0; i < 600 && w.Mag > 0; i++) w.Tick(1f / 60f, true);
            Assert.That(w.Reloading, Is.True);
            for (int i = 0; i < 60 * 3; i++) w.Tick(1f / 60f, false);
            Assert.That(w.Reloading, Is.False);
            Assert.That(w.Mag, Is.EqualTo(30));
            Assert.That(w.Reserve, Is.EqualTo(210 - 30));
        }

        [Test]
        public void ShotgunReloadsShellByShellAndCanBeInterrupted()
        {
            var w = new WeaponState(WeaponTable.Get("shotgun"));
            w.Tick(0.016f, true); w.Tick(1f, false); w.Tick(0.016f, true); w.Tick(1f, false);   // fire 2 shells
            Assert.That(w.Mag, Is.EqualTo(5));
            Assert.That(w.StartReload(), Is.True);
            w.Tick(0.56f, false);                       // one shell (0.55 s)
            Assert.That(w.Mag, Is.EqualTo(6));
            Assert.That(w.Tick(0.016f, true), Is.EqualTo(1), "the press stops the reload and fires");
            Assert.That(w.Reloading, Is.False);
            Assert.That(w.Mag, Is.EqualTo(5));
        }

        [Test]
        public void NoReloadWhenFullOrOutOfReserve()
        {
            var w = M4();
            Assert.That(w.StartReload(), Is.False);
        }
    }
}

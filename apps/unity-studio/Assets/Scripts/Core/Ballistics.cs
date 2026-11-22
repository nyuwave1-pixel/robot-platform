using System;

namespace SpecialSoldier.Core
{
    public enum BodyPart { Head, Torso, Limb }

    /// <summary>Damage / DPS / hit-probability model. A line-by-line port of apps/special-soldier/src/config/weapons.js,
    /// checked against the JavaScript numbers by BalanceParityTests. Doubles are used so the port matches JS exactly.</summary>
    public static class Ballistics
    {
        public static float BodyMultiplier(BodyPart part) =>
            part == BodyPart.Head ? WeaponTable.HeadMult : part == BodyPart.Limb ? WeaponTable.LimbMult : WeaponTable.TorsoMult;

        /// <summary>Damage of one projectile at a distance (linear falloff between RangeStart and RangeEnd).</summary>
        public static double DamageAt(WeaponStats w, double dist)
        {
            double a = w.RangeStart, b = w.RangeEnd;
            if (w.Explosive > 0) return w.Dmg;
            if (dist <= a) return w.Dmg;
            if (dist >= b) return (double)w.Dmg * w.MinMul;
            return w.Dmg * (1 - (1 - (double)w.MinMul) * ((dist - a) / (b - a)));
        }

        /// <summary>Burst ("paper") DPS: damage × pellets × rounds per second.</summary>
        public static double BurstDps(WeaponStats w) => (double)w.Dmg * w.Pellets * w.Rpm / 60.0;

        /// <summary>Probability that one aimed projectile lands on a 0.6 m wide body at <paramref name="dist"/>.</summary>
        public static double HitChance(WeaponStats w, double dist = 40)
        {
            double ads = w.AdsSpread, gain = (ads + 0.25) * 0.16 * (w.Rpm / 60.0);
            double bloom = Math.Min(3.5, (-3 + Math.Sqrt(9 + 8 * gain)) / 4);
            double cone = (ads + bloom + w.RecoilV * 0.11 * Math.Min(1, w.Rpm / 600.0)) * Math.PI / 180;
            double r = Math.Tan(cone) * Math.Max(1, dist);
            return Math.Max(0.03, Math.Min(0.98, Math.Pow(0.3 / r, 2)));
        }

        /// <summary>Time to empty one magazine and reload it.</summary>
        public static double CycleTime(WeaponStats w)
        {
            double reload = w.ShellReload ? (double)w.Reload * w.Mag : w.Reload;
            return (w.Mag - 1) * 60.0 / w.Rpm + reload;
        }

        /// <summary>Field DPS: reload downtime, range falloff and hit probability included.</summary>
        public static double EffectiveDps(WeaponStats w, double dist = 40) =>
            DamageAt(w, dist) * w.Pellets * w.Mag * HitChance(w, dist) / CycleTime(w);

        /// <summary>Shots and seconds to kill a target; armour soaks 50% of each hit until it is used up.</summary>
        public static (int shots, double time) TimeToKill(WeaponStats w, double hp = 100, double armor = 0, double dist = 20)
        {
            double d = DamageAt(w, dist) * w.Pellets, h = hp, a = armor; int shots = 0;
            while (h > 0 && shots < 999)
            {
                double dm = d;
                if (a > 0) { double s = Math.Min(a, dm * 0.5); a -= s; dm -= s; }
                h -= dm; shots++;
            }
            return (shots, (shots - 1) * 60.0 / w.Rpm);
        }
    }
}

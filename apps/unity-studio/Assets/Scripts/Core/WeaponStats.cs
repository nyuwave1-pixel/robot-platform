using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    public enum FireMode { Semi, Burst, Auto }

    /// <summary>One weapon's stat block. Same fields and units as the web game's WEAPONS table
    /// (dmg per projectile, rpm cyclic rate, spread in degrees, range = falloff start/end in metres).</summary>
    public sealed class WeaponStats
    {
        public readonly string Id, Name, Class, Slot;
        public readonly float Dmg, Rpm, Reload, Ads, Zoom, RecoilV, RecoilH, Spread, AdsSpread, RangeStart, RangeEnd, MinMul, Vel, Weight, Loud, Explosive;
        public readonly int Mag, Reserve, Pellets, Unlock;
        public readonly bool ShellReload, Scope;
        public readonly IReadOnlyList<FireMode> Modes;

        public WeaponStats(string id, string name, string cls, string slot, float dmg, float rpm, int mag, int reserve, float reload,
            float ads, float zoom, float recoilV, float recoilH, float spread, float adsSpread, float rangeStart, float rangeEnd, float minMul,
            float vel, float weight, int pellets, float loud, int unlock, FireMode[] modes, bool shellReload, bool scope, float explosive)
        {
            Id = id; Name = name; Class = cls; Slot = slot; Dmg = dmg; Rpm = rpm; Mag = mag; Reserve = reserve; Reload = reload;
            Ads = ads; Zoom = zoom; RecoilV = recoilV; RecoilH = recoilH; Spread = spread; AdsSpread = adsSpread;
            RangeStart = rangeStart; RangeEnd = rangeEnd; MinMul = minMul; Vel = vel; Weight = weight; Pellets = pellets; Loud = loud;
            Unlock = unlock; Modes = modes; ShellReload = shellReload; Scope = scope; Explosive = explosive;
        }

        /// <summary>Seconds between shots.</summary>
        public float ShotInterval => 60f / Rpm;
    }

    public static partial class WeaponTable
    {
        public static WeaponStats Get(string id) => All[id];
    }
}

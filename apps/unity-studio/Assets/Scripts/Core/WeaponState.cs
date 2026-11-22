using System;

namespace SpecialSoldier.Core
{
    /// <summary>Ammo, fire cadence, fire modes and reload timing for one weapon, driven by Tick(dt).
    /// No engine types: the Unity WeaponController reads it and does the raycast / effects.</summary>
    public sealed class WeaponState
    {
        public readonly WeaponStats Stats;
        public int Mag { get; private set; }
        public int Reserve { get; private set; }
        public FireMode Mode { get; private set; }
        public bool Reloading { get; private set; }
        public float ReloadProgress => Reloading ? 1f - _reloadT / Stats.Reload : 0f;
        public const int BurstCount = 3;

        float _cooldown, _reloadT;
        int _burstLeft;
        bool _triggerWasDown;

        public WeaponState(WeaponStats stats)
        {
            Stats = stats ?? throw new ArgumentNullException(nameof(stats));
            Mag = stats.Mag; Reserve = stats.Reserve; Mode = stats.Modes[0];
        }

        public void CycleMode()
        {
            int i = 0; for (; i < Stats.Modes.Count; i++) if (Stats.Modes[i] == Mode) break;
            Mode = Stats.Modes[(i + 1) % Stats.Modes.Count];
        }

        public bool StartReload()
        {
            if (Reloading || Mag >= Stats.Mag || Reserve <= 0) return false;
            Reloading = true; _reloadT = Stats.Reload; _burstLeft = 0; return true;
        }

        /// <summary>Advances timers and returns how many shots fire this frame (0 or more).
        /// Pulling the trigger during a shell-by-shell reload stops the reload and fires at once, like a pump-action.</summary>
        public int Tick(float dt, bool triggerDown)
        {
            int shots = 0;
            bool pressed = triggerDown && !_triggerWasDown;
            _triggerWasDown = triggerDown;
            if (_cooldown > 0) _cooldown -= dt;

            if (Reloading)
            {
                if (pressed && Stats.ShellReload && Mag > 0) { Reloading = false; }
                else
                {
                    _reloadT -= dt;
                    if (_reloadT <= 0)
                    {
                        if (Stats.ShellReload) { Mag++; Reserve--; if (Mag < Stats.Mag && Reserve > 0) _reloadT += Stats.Reload; else Reloading = false; }
                        else { int take = Math.Min(Stats.Mag - Mag, Reserve); Mag += take; Reserve -= take; Reloading = false; }
                    }
                    return 0;
                }
            }

            if (pressed && Mode == FireMode.Burst) _burstLeft = BurstCount;
            bool want = Mode == FireMode.Auto ? triggerDown : Mode == FireMode.Semi ? pressed : _burstLeft > 0;
            while (want && _cooldown <= 0 && Mag > 0)
            {
                Mag--; shots++; _cooldown += Stats.ShotInterval;
                if (Mode == FireMode.Burst && --_burstLeft <= 0) break;
                if (Mode == FireMode.Semi) break;
            }
            if (_cooldown < 0) _cooldown = 0;
            if (Mag == 0 && shots > 0 && Reserve > 0) StartReload();
            return shots;
        }

        public void AddReserve(int rounds) { if (rounds > 0) Reserve += rounds; }
    }
}

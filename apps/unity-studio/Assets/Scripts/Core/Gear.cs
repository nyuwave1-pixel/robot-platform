using System;

namespace SpecialSoldier.Core
{
    public enum Vision { Off, Night, Thermal }

    /// <summary>One piece of tactical equipment (web gear.js GEAR): key, and the campaign progress that unlocks it.</summary>
    public sealed class GearItem
    {
        public readonly string Id, Name; public readonly char Key; public readonly int Unlock;
        public GearItem(string id, string name, char key, int unlock) { Id = id; Name = name; Key = key; Unlock = unlock; }
    }

    /// <summary>Tactical equipment rules, ported from apps/special-soldier/src/game/gear.js and player.js heal().</summary>
    public static class Gear
    {
        public static readonly GearItem[] Items =
        {
            new GearItem("nvg", "NIGHT VISION", 'N', 0), new GearItem("light", "TAC LIGHT", 'L', 0), new GearItem("medkit", "MED KIT", 'H', 0),
            new GearItem("drone", "RECON DRONE", 'B', 1), new GearItem("thermal", "THERMAL IMAGER", 'T', 2),
        };

        public static GearItem Get(string id) { foreach (var g in Items) if (g.Id == id) return g; return null; }

        /// <summary>web has(id): progress ≥ unlock (or every item outside the campaign, web G.allGear).</summary>
        public static bool Has(string id, int progress, bool all = false) { var g = Get(id); return g != null && (all || progress >= g.Unlock); }

        /// <summary>web setVision(v): pressing the same mode again switches it off; the other mode replaces it.</summary>
        public static Vision Toggle(Vision current, Vision pressed) => current == pressed ? Vision.Off : pressed;

        // ---- med kit (player.js heal): two per mission, +65 health, not at full health ----
        public const int MedkitsPerMission = 2;
        public const float MedkitHeal = 65f;
        public static bool CanHeal(int medkits, float health, float maxHealth) => medkits > 0 && health < maxHealth;

        // ---- recon drone ----
        public const float DroneSpeed = 15f, DroneClimbFactor = 0.7f, DroneMinClearance = 2f, DroneMaxAboveGround = 70f, DroneLeash = 230f;
        public const float ScanEvery = 0.3f, ScanRange = 150f, ScanCos = 0.82f;
        /// <summary>web: no drone below y −30 (the underground facility).</summary>
        public static bool DroneHasSignal(double islandY) => islandY >= -30;

        /// <summary>Keeps the drone between 2 and 72 m above the ground and within 230 m of you (web update).</summary>
        public static (double x, double y, double z) ClampDrone(double x, double y, double z, double ground, double px, double pz)
        {
            double g = Math.Max(ground, 0) + DroneMinClearance;
            y = Math.Min(Math.Max(y, g), g + DroneMaxAboveGround);
            double dx = x - px, dz = z - pz, dl = Math.Sqrt(dx * dx + dz * dz);
            if (dl > DroneLeash) { x = px + dx / dl * DroneLeash; z = pz + dz / dl * DroneLeash; }
            return (x, y, z);
        }

        /// <summary>The drone tags a hostile it looks at: within 150 m and inside the view cone (line of sight is the engine's job).</summary>
        public static bool DroneSees(double distance, double cosToTarget) => distance < ScanRange && cosToTarget > ScanCos;
    }

    /// <summary>Drone battery (web gear.js): drains in 45 s of flight, recharges in 60 s, needs 15 % to launch, lands itself when empty.</summary>
    public sealed class DroneBattery
    {
        public const float FlightSeconds = 45f, RechargeSeconds = 60f, MinLaunch = 0.15f;
        public float Level { get; private set; } = 1f;
        public bool Active { get; private set; }

        /// <summary>Launch (true) or the reason it refuses (web toasts).</summary>
        public bool TryLaunch(bool signal, out string refusal)
        {
            refusal = !signal ? "NO DRONE SIGNAL UNDERGROUND" : Level < MinLaunch ? "DRONE BATTERY LOW" : null;
            if (refusal != null) return false;
            Active = true; return true;
        }

        public void Recall() => Active = false;

        /// <summary>Advances the battery; true when it just ran out (the drone recalls itself).</summary>
        public bool Tick(float dt)
        {
            if (!Active) { Level = Math.Min(1f, Level + dt / RechargeSeconds); return false; }
            Level -= dt / FlightSeconds;
            if (Level > 0f) return false;
            Level = 0f; Active = false; return true;
        }
    }
}

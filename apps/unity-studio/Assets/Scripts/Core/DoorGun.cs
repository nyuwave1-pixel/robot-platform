using System;

namespace SpecialSoldier.Core
{
    /// <summary>Mission 05's door-gunner set piece (web gunner.js, v0.23): after boarding, ANGEL 1-2 climbs out for 6 s and orbits the
    /// port for 40 s (radius 82 m, 36 m above the sea, 0.12 rad/s, right-hand door toward the port) while three waves chase the exfil.
    /// Island coordinates; yaw is the web model yaw (forward = (sin, cos)).</summary>
    public static class DoorGun
    {
        public const string Name = "M134 DOOR GUN";
        public const float Dmg = 46, Rpm = 1500, Spread = 1.1f, RangeStart = 90, RangeEnd = 320, MinMul = 0.7f;
        public const double LiftSeconds = 6, OrbitSeconds = 40, Radius = 82, Altitude = 36, AngularSpeed = 0.12;
        public const double AimArc = 1.25, PitchMin = -1.15, PitchMax = 0.3, PitchStart = -0.32;
        /// <summary>The camera sits 1.45 m out the right-hand door and 2.35 m up from the helicopter's origin.</summary>
        public const double DoorOut = 1.45, DoorUp = 2.35;
        public static readonly (double x, double z) Port = (60, -385);   // web POI.port

        /// <summary>web waves: [time, [kind, dx, dz]…] around the port.</summary>
        public static readonly (double t, (string kind, double dx, double dz)[] list)[] Waves =
        {
            (2, new[] { ("assault", -18.0, 10.0), ("assault", -10.0, 16.0), ("guard", -24.0, 4.0), ("apc", 6.0, 22.0) }),
            (14, new[] { ("assault", 20.0, -8.0), ("heavy", 26.0, -2.0), ("elite", 14.0, -14.0), ("assault", 30.0, 6.0) }),
            (26, new[] { ("elite", -6.0, -26.0), ("assault", 2.0, -30.0), ("heavy", -14.0, -20.0), ("apc", -30.0, -8.0) }),
        };

        public static double StartAngle(double fromX, double fromZ) => Math.Atan2(fromZ - Port.z, fromX - Port.x);

        /// <summary>web pose(): helicopter position and yaw at time t of the set piece.</summary>
        public static (double x, double y, double z, double yaw) Pose(double t, double fromX, double fromY, double fromZ, double a0)
        {
            (double, double) Orb(double a) => (Port.x + Math.Cos(a) * Radius, Port.z + Math.Sin(a) * Radius);
            if (t < LiftSeconds)
            {
                double k = t / LiftSeconds, e = k * k * (3 - 2 * k); var (ox, oz) = Orb(a0);
                double x = fromX + (ox - fromX) * e, z = fromZ + (oz - fromZ) * e, y = fromY + (Altitude - fromY) * Math.Min(1, k * 1.6);
                return (x, y, z, Math.Atan2(ox - fromX, oz - fromZ));
            }
            double a = a0 + (t - LiftSeconds) * AngularSpeed; var (px, pz) = Orb(a);
            return (px, Altitude + Math.Sin(t * 0.7) * 1.2, pz, Math.Atan2(-Math.Sin(a), Math.Cos(a)));
        }

        /// <summary>The door camera: out of the right-hand door; camera yaw = heli yaw + π/2 + aim (web camera convention).</summary>
        public static (double x, double y, double z, double camYaw) DoorEye(double hx, double hy, double hz, double yaw, double aim) =>
            (hx - Math.Cos(yaw) * DoorOut, hy + DoorUp, hz + Math.Sin(yaw) * DoorOut, yaw + Math.PI / 2 + aim);

        /// <summary>Damage at a distance: the web range falloff (Ballistics.DamageAt rule) with the door gun's numbers.</summary>
        public static double DamageAt(double dist) =>
            dist <= RangeStart ? Dmg : dist >= RangeEnd ? Dmg * MinMul : Dmg * (1 - (1 - MinMul) * ((dist - RangeStart) / (RangeEnd - RangeStart)));

        public static bool Over(double t) => t >= LiftSeconds + OrbitSeconds;
    }

    /// <summary>The minigun's barrels and heat (web gunner.js update): spin up (rate 6) / down (rate 2), fire above 0.6 spin,
    /// 1500 rpm, +0.0105 heat a round, cooling 0.05/s while firing and 0.32/s at rest, overheat at 1 until under 0.35.</summary>
    public sealed class DoorGunBarrels
    {
        public double Spin { get; private set; }
        public double Heat { get; private set; }
        public bool Overheated { get; private set; }
        public bool Firing { get; private set; }
        double _cool;

        /// <summary>Advances one frame; returns how many rounds leave the barrels. <paramref name="overheatedNow"/> is true the frame it overheats.</summary>
        public int Step(double dt, bool trigger, out bool overheatedNow)
        {
            overheatedNow = false;
            bool want = trigger && !Overheated;
            Spin = SoldierPose.Damp(Spin, want ? 1 : 0, want ? 6 : 2, dt);
            Firing = want && Spin > 0.6; _cool -= dt;
            int shots = 0;
            if (Firing) while (_cool <= 0) { _cool += 60.0 / DoorGun.Rpm; Heat += 0.0105; shots++; }
            else _cool = Math.Max(_cool, 0);
            Heat = Math.Max(0, Heat - dt * (Firing ? 0.05 : 0.32));
            if (Heat >= 1 && !Overheated) { Overheated = true; overheatedNow = true; }
            if (Overheated && Heat < 0.35) Overheated = false;
            return shots;
        }
    }
}

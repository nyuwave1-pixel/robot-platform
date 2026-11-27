using System;
using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    /// <summary>0..1 RGB colour as the web game writes it in hex (sRGB values; the engine converts to linear).</summary>
    public readonly struct Rgb
    {
        public readonly float R, G, B;
        public Rgb(float r, float g, float b) { R = r; G = g; B = b; }
        public static Rgb Hex(int h) => new Rgb(((h >> 16) & 255) / 255f, ((h >> 8) & 255) / 255f, (h & 255) / 255f);
        public static Rgb Lerp(Rgb a, Rgb b, float t) => new Rgb(a.R + (b.R - a.R) * t, a.G + (b.G - a.G) * t, a.B + (b.B - a.B) * t);
        static float Lin(float c) => c <= 0.04045f ? c / 12.92f : (float)Math.Pow((c + 0.055) / 1.055, 2.4);
        /// <summary>Relative luminance in linear light (Rec. 709 weights).</summary>
        public float Luminance => 0.2126f * Lin(R) + 0.7152f * Lin(G) + 0.0722f * Lin(B);
        public override string ToString() => $"#{(int)Math.Round(R * 255):X2}{(int)Math.Round(G * 255):X2}{(int)Math.Round(B * 255):X2}";
    }

    /// <summary>One weather / time-of-day look. The first five are a straight port of PRESETS in
    /// apps/special-soldier/src/world/sky.js (checked by SkyPresetTests); "day" is the slice's own clear midday.
    /// Hdri names a CC0 Poly Haven sky in Resources/Sky (fetched by Tools~/fetch-hdris.mjs).</summary>
    public sealed class SkyPreset
    {
        public string Id, Label, Hdri;
        public Rgb Top, Bottom, Fog, Sun;
        public float FogDensity, SunIntensity, Hemi, Rain, Wind, Storm, Stars, Night, Exposure;
        /// <summary>Median sky luminance of the HDRI file (measured with Tools~/hdri-preview.py --stats).</summary>
        public float HdriMedian = 1f;
        /// <summary>How bright this sky is relative to the clear day (1 = day). Sky, sun and ambient all follow it, so the ground is
        /// never brightly lit under a black sky. Calibrated 2026-11-25 against the first Unity WebGL screenshots: matching the web
        /// gradient dome directly (storm 0.05, night 0.023) rendered the storm and night skies nearly black.</summary>
        public float Mood = 1f;
        /// <summary>Median displayed sky luminance of the clear day (web day gradient: mean of the top/bottom colours' luminance).</summary>
        public static float DaySkyLuminance => (SkyPresets.Day.Top.Luminance + SkyPresets.Day.Bottom.Luminance) / 2f;
        /// <summary>Skybox exposure: normalise the HDRI to the day sky's brightness, then scale by Mood. Each Poly Haven HDRI is
        /// captured at a different absolute brightness (medians 0.35–1.49), so one fixed exposure cannot work.</summary>
        public float HdriExposure => DaySkyLuminance * Mood / Math.Max(1e-4f, HdriMedian);
        /// <summary>Multiplier for the sun / moon light so it agrees with the sky: 0.4 + 0.6 × Mood (day 1, storm 0.67, night 0.47).</summary>
        public float LightScale => 0.4f + 0.6f * Mood;
        public Vec3 SunDir;          // towards the sun, three.js axes (x right, y up, z towards the viewer)

        /// <summary>The same direction in Unity's left-handed axes (z forward): flip z.</summary>
        public Vec3 SunDirUnity => Normalize(new Vec3(SunDir.X, SunDir.Y, -SunDir.Z));
        /// <summary>three.js renderer.toneMappingExposure → URP Color Adjustments post exposure (EV).</summary>
        public float PostExposureEv => (float)Math.Log(Math.Max(1e-3, Exposure), 2);

        static Vec3 Normalize(Vec3 v) { float l = v.Length; return l > 1e-6f ? v * (1f / l) : new Vec3(0, 1, 0); }

        public SkyPreset Clone() => (SkyPreset)MemberwiseClone();

        /// <summary>Blend of two presets (web: Sky.apply(p, k) lerps every value; the sun direction is re-normalised).</summary>
        public static SkyPreset Lerp(SkyPreset a, SkyPreset b, float t)
        {
            t = Math.Max(0, Math.Min(1, t));
            float L(float x, float y) => x + (y - x) * t;
            var d = new Vec3(L(a.SunDir.X, b.SunDir.X), L(a.SunDir.Y, b.SunDir.Y), L(a.SunDir.Z, b.SunDir.Z));
            return new SkyPreset
            {
                Id = t < 1 ? a.Id : b.Id, Label = t < 0.5f ? a.Label : b.Label, Hdri = t < 0.5f ? a.Hdri : b.Hdri, HdriMedian = t < 0.5f ? a.HdriMedian : b.HdriMedian, Mood = L(a.Mood, b.Mood),
                Top = Rgb.Lerp(a.Top, b.Top, t), Bottom = Rgb.Lerp(a.Bottom, b.Bottom, t), Fog = Rgb.Lerp(a.Fog, b.Fog, t), Sun = Rgb.Lerp(a.Sun, b.Sun, t),
                FogDensity = L(a.FogDensity, b.FogDensity), SunIntensity = L(a.SunIntensity, b.SunIntensity), Hemi = L(a.Hemi, b.Hemi),
                Rain = L(a.Rain, b.Rain), Wind = L(a.Wind, b.Wind), Storm = L(a.Storm, b.Storm), Stars = L(a.Stars, b.Stars),
                Night = L(a.Night, b.Night), Exposure = L(a.Exposure, b.Exposure), SunDir = Normalize(d),
            };
        }

        /// <summary>Per-frame approach toward a target preset (web: apply(target, min(1, dt × 0.6))).
        /// The id, label and HDRI switch to the target at once (the HUD and skybox show where the weather is heading).</summary>
        public static SkyPreset Approach(SkyPreset current, SkyPreset target, float dt)
        {
            var r = Lerp(current, target, Math.Min(1f, dt * 0.6f));
            r.Id = target.Id; r.Label = target.Label; r.Hdri = target.Hdri; r.HdriMedian = target.HdriMedian;
            return r;
        }
    }

    public static class SkyPresets
    {
        static SkyPreset P(string id, int top, int bot, int fog, float dens, int sun, float sunI, float hemi, float dx, float dy, float dz,
            float rain, float wind, float storm, float stars, float night, float exp, string label, string hdri, float hdriMedian = 1f, float mood = 1f) =>
            new SkyPreset
            {
                Id = id, Top = Rgb.Hex(top), Bottom = Rgb.Hex(bot), Fog = Rgb.Hex(fog), FogDensity = dens, Sun = Rgb.Hex(sun), SunIntensity = sunI, Hemi = hemi,
                SunDir = new Vec3(dx, dy, dz), Rain = rain, Wind = wind, Storm = storm, Stars = stars, Night = night, Exposure = exp, Label = label, Hdri = hdri, HdriMedian = hdriMedian, Mood = mood,
            };

        public static readonly SkyPreset Night = P("night", 0x050a18, 0x16263c, 0x0d1826, 0.0036f, 0x9fbcff, 1.7f, 1.15f, -0.3f, 0.36f, -0.88f, 0, 0.6f, 0, 1, 1, 1.5f, "04:30 · NIGHT · CLEAR", "sky_night", 0.477f, 0.12f);
        public static readonly SkyPreset Dawn = P("dawn", 0x24364e, 0xc98a5a, 0x7d8a90, 0.0085f, 0xffc890, 1.6f, 0.8f, 0.8f, 0.22f, 0.4f, 0.35f, 0.9f, 0, 0.15f, 0.45f, 1.0f, "05:40 · DAWN · FOG / LIGHT RAIN", "sky_dawn", 0.568f, 0.75f);
        public static readonly SkyPreset Storm = P("storm", 0x2a3138, 0x59646a, 0x566067, 0.006f, 0xcfd8e0, 1.5f, 1.0f, 0.3f, 0.8f, 0.3f, 1, 1.8f, 1, 0, 0.15f, 0.95f, "09:10 · DAY · THUNDERSTORM", "sky_storm", 1.488f, 0.45f);
        public static readonly SkyPreset Facility = P("facility", 0x1c2228, 0x000000, 0x0a0c0e, 0.009f, 0x000000, 0, 1.0f, 0, 1, 0, 0, 0, 0, 0, 0.8f, 1.1f, "SUBLEVEL 3 · EMERGENCY POWER", null);
        public static readonly SkyPreset Dusk = P("dusk", 0x1a1c34, 0xd0603a, 0x5a4a50, 0.0048f, 0xff9a60, 1.8f, 0.75f, -0.85f, 0.2f, -0.3f, 0.5f, 1.5f, 1, 0.25f, 0.4f, 1.0f, "18:50 · DUSK · STORM FRONT", "sky_dusk", 0.93f, 0.55f);
        /// <summary>Slice-only clear midday (not in the web game): high sun, light haze, no rain. Matches the 'day' HDRI.</summary>
        public static readonly SkyPreset Day = P("day", 0x5f8fc8, 0xc8d6e0, 0xb4c3cf, 0.0028f, 0xfff1dc, 2.2f, 1.0f, 0.45f, 0.75f, 0.45f, 0, 0.7f, 0, 0, 0, 1.0f, "12:00 · DAY · CLEAR", "sky_day", 0.345f, 1.0f);

        /// <summary>Presets the web game defines (parity-tested) plus the slice's day.</summary>
        public static readonly IReadOnlyList<SkyPreset> All = new[] { Day, Dawn, Storm, Dusk, Night, Facility };
        /// <summary>Outdoor presets in the order the [K] key cycles them.</summary>
        public static readonly IReadOnlyList<SkyPreset> Outdoor = new[] { Day, Dawn, Storm, Dusk, Night };

        public static SkyPreset Get(string id)
        {
            foreach (var p in All) if (p.Id == id) return p;
            return Day;
        }
    }

    /// <summary>Lightning for storm presets, ported from Sky.update in sky.js: first bolt after 6 s, then every 5–17 s;
    /// the flash fades at 5/s and strobes (on above 0.5, and again between 0.15 and 0.3); thunder follows 0.3–1.8 s later.</summary>
    public sealed class LightningClock
    {
        readonly Random _rng;
        float _next = 6f;
        public float Flash { get; private set; }            // web: this.flash, 1 at the strike, fading
        public float ThunderIn { get; private set; } = -1;  // seconds until the thunder for the last strike (-1 = none pending)
        /// <summary>Strobe on/off like the web dome shader (two blinks per strike).</summary>
        public bool Lit => Flash > 0.5f || (Flash > 0.15f && Flash < 0.3f);
        public LightningClock(Random rng = null) { _rng = rng ?? new Random(); }

        /// <summary>Advances time; returns true on the frame thunder should play. No lightning when the preset has no storm.</summary>
        public bool Tick(float dt, bool storm)
        {
            Flash = Math.Max(0, Flash - dt * 5f);
            bool thunder = false;
            if (ThunderIn >= 0) { ThunderIn -= dt; if (ThunderIn < 0) { thunder = true; ThunderIn = -1; } }
            if (!storm) return thunder;
            _next -= dt;
            if (_next < 0)
            {
                _next = 5f + (float)_rng.NextDouble() * 12f;
                Flash = 1f;
                ThunderIn = 0.3f + (float)_rng.NextDouble() * 1.5f;
            }
            return thunder;
        }
    }
}

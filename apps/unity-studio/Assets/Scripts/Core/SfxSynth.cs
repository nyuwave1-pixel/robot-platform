using System;
using System.Collections.Generic;

namespace SpecialSoldier.Core
{
    public enum FilterType { Lowpass, Highpass, Bandpass }
    public enum Wave { Sine, Square, Triangle, Sawtooth }

    /// <summary>Offline port of the web game's Web Audio synthesiser (apps/special-soldier/src/core/audio.js: nz / osc / play).
    /// Each recipe renders mono PCM in [-1, 1] that the engine turns into an AudioClip once at start-up, so the slice gets
    /// reload, click, hit, kill, hurt, whiz and surface-impact sounds without any extra audio files.
    /// Envelopes match Web Audio: linear attack to the gain, then an exponential ramp to 0.0008 at the end.</summary>
    public sealed class SfxSynth
    {
        public const int SampleRate = 44100;
        public static readonly string[] Recipes = { "reload", "click", "hit", "kill", "hurt", "whiz", "ui",
            "impact:concrete", "impact:metal", "impact:wood", "impact:sand", "impact:flesh", "explosion-body", "thunder" };

        uint _seed;
        public SfxSynth(uint seed = 0x9E3779B9u) { _seed = seed == 0 ? 1u : seed; }

        float NextNoise() { _seed ^= _seed << 13; _seed ^= _seed >> 17; _seed ^= _seed << 5; return (_seed / (float)uint.MaxValue) * 2f - 1f; }

        /// <summary>Renders a named recipe. <paramref name="t2"/> is the reload's second click time (web: weapon reload × 0.55).</summary>
        public float[] Render(string name, float t2 = 0.5f)
        {
            var b = new Buffer();
            switch (name)
            {
                case "reload":
                    Noise(b, 0.05f, 3000, q: 3, type: FilterType.Bandpass, g: 0.45f);
                    Osc(b, 0.05f, 320, wave: Wave.Square, g: 0.12f);
                    Noise(b, 0.06f, 2200, q: 4, type: FilterType.Bandpass, g: 0.5f, t: t2);
                    Osc(b, 0.04f, 520, wave: Wave.Square, g: 0.14f, t: t2 + 0.25f);
                    break;
                case "click":
                    Osc(b, 0.03f, 900, wave: Wave.Square, g: 0.12f);
                    Noise(b, 0.02f, 5000, type: FilterType.Highpass, g: 0.25f);
                    break;
                case "hit": Osc(b, 0.05f, 1900, g: 0.16f); break;
                case "kill": Osc(b, 0.08f, 1300, g: 0.18f); Osc(b, 0.12f, 1950, g: 0.18f, t: 0.07f); break;
                case "hurt": Noise(b, 0.14f, 500, g: 0.7f); Osc(b, 0.18f, 140, f2: 70, g: 0.5f); break;
                case "whiz": Noise(b, 0.14f, 4200, f2: 1400, q: 6, type: FilterType.Bandpass, g: 0.35f); break;
                case "ui": Osc(b, 0.05f, 880, wave: Wave.Triangle, g: 0.12f); break;
                case "alarm": for (int i = 0; i < 4; i++) Osc(b, 0.4f, 620, f2: 880, wave: Wave.Square, g: 0.14f, t: i * 0.5f); break;   // web: base siren, 4 rising blips
                case "thunder": Noise(b, 3.5f, 260, f2: 50, g: 1.5f, a: 0.08f); Noise(b, 0.3f, 2200, g: 0.7f); break;
                case "explosion-body":   // the synthetic layer under the recorded explosion (web: k = 0.5 when the sample plays)
                    Noise(b, 1.6f, 900, f2: 60, g: 1.1f); Osc(b, 1.1f, 90, f2: 24, g: 2.0f); Noise(b, 0.12f, 4000, g: 0.6f);
                    break;
                default:
                    if (name.StartsWith("impact:")) { Impact(b, name.Substring(7)); break; }
                    throw new ArgumentException("unknown recipe " + name);
            }
            return b.Finish();
        }

        void Impact(Buffer b, string surface)
        {
            var f = new Dictionary<string, float> { ["metal"] = 3800, ["concrete"] = 1800, ["wood"] = 900, ["sand"] = 500, ["grass"] = 600, ["water"] = 1200, ["glass"] = 5000, ["flesh"] = 400 };
            float freq = f.TryGetValue(surface, out var v) ? v : 1500;
            bool metal = surface == "metal";
            Noise(b, 0.09f, freq, q: metal ? 9 : 1, type: metal ? FilterType.Bandpass : FilterType.Lowpass, g: 0.5f);
            if (metal) Osc(b, 0.18f, 2400 + (NextNoise() * 0.5f + 0.5f) * 1500, g: 0.12f);
        }

        /// <summary>Per-class gunshot body (web: play('shot:CLASS')): [gain, noise cutoff, thump pitch, length]
        /// plus the recorded report's playback rate and gain where the web game layers one (SIDEARM has none: suppressed).</summary>
        public static readonly IReadOnlyDictionary<string, (float g, float f, float thump, float len, float rate, float sampleGain)> ShotProfiles =
            new Dictionary<string, (float, float, float, float, float, float)>
            {
                ["ASSAULT RIFLE"] = (1.0f, 2600, 150, 0.22f, 1.0f, 0.8f),
                ["SMG"] = (0.75f, 3400, 210, 0.14f, 1.22f, 0.6f),
                ["SHOTGUN"] = (1.5f, 1500, 90, 0.42f, 0.78f, 1.0f),
                ["LMG"] = (1.15f, 2000, 110, 0.3f, 0.9f, 0.9f),
                ["SNIPER RIFLE"] = (1.6f, 1700, 70, 0.6f, 0.74f, 1.05f),
                ["SIDEARM"] = (0.22f, 5200, 320, 0.07f, 0f, 0f),
                ["SPECIAL"] = (0.9f, 500, 60, 0.3f, 0f, 0f),
                ["ENEMY"] = (0.9f, 2200, 130, 0.24f, 1.04f, 0.75f),
            };

        /// <summary>Synthetic body of a gunshot for a weapon class; thinner (×0.45) when a recording is layered on top.</summary>
        public float[] RenderShot(string weaponClass)
        {
            if (!ShotProfiles.TryGetValue(weaponClass, out var p)) p = (1f, 2400, 140, 0.2f, 0f, 0f);
            float k = p.rate > 0 ? 0.45f : 1f;
            var b = new Buffer();
            Noise(b, p.len, p.f * (0.9f + (NextNoise() * 0.5f + 0.5f) * 0.2f), f2: 300, g: p.g * k);
            Osc(b, p.len * 0.7f, p.thump, f2: 40, wave: Wave.Triangle, g: p.g * 0.9f * k);
            Noise(b, 0.03f, 6000, type: FilterType.Highpass, g: p.g * 0.5f);
            if (p.rate <= 0 && weaponClass != "SIDEARM") Noise(b, p.len * 3.5f, 900, f2: 200, g: p.g * 0.16f, a: 0.05f);   // tail when there is no recording
            return b.Finish();
        }

        // ---------------- voices ----------------

        void Noise(Buffer b, float dur, float f, float? f2 = null, float q = 1, FilterType type = FilterType.Lowpass, float g = 1, float a = 0.002f, float t = 0)
        {
            int start = (int)(t * SampleRate), n = (int)(dur * SampleRate);
            var bq = new Biquad();
            for (int i = 0; i < n; i++)
            {
                if ((i & 31) == 0) bq.Set(type, Sweep(f, f2, i, n), q);
                b.Add(start + i, bq.Process(NextNoise()) * Env(i, n, a, g));
            }
        }

        void Osc(Buffer b, float dur, float f, float? f2 = null, Wave wave = Wave.Sine, float g = 0.5f, float t = 0, float a = 0.002f)
        {
            int start = (int)(t * SampleRate), n = (int)(dur * SampleRate);
            double phase = 0;
            for (int i = 0; i < n; i++)
            {
                phase += Sweep(f, f2, i, n) / SampleRate; phase -= Math.Floor(phase);
                float s = wave switch
                {
                    Wave.Square => phase < 0.5 ? 1f : -1f,
                    Wave.Triangle => (float)(phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4),
                    Wave.Sawtooth => (float)(phase * 2 - 1),
                    _ => (float)Math.Sin(phase * 2 * Math.PI),
                };
                b.Add(start + i, s * Env(i, n, a, g));
            }
        }

        /// <summary>Exponential frequency ramp from f to f2 over the voice (Web Audio exponentialRampToValueAtTime).</summary>
        public static float Sweep(float f, float? f2, int i, int n) => f2.HasValue && n > 1 ? f * (float)Math.Pow(f2.Value / f, i / (double)(n - 1)) : f;

        /// <summary>Gain envelope: 0 → g linearly over the attack, then exponentially to 0.0008 at the end.</summary>
        public static float Env(int i, int n, float attack, float g)
        {
            float t = i / (float)SampleRate, a = Math.Max(1f / SampleRate, attack), dur = n / (float)SampleRate;
            if (t < a) return g * t / a;
            if (g <= 0.0008f) return g;
            double k = (t - a) / Math.Max(1e-6, dur - a);
            return (float)(g * Math.Pow(0.0008 / g, k));
        }

        /// <summary>RBJ-cookbook biquad (the same filter family as Web Audio's BiquadFilterNode).</summary>
        sealed class Biquad
        {
            double b0, b1, b2, a1, a2, x1, x2, y1, y2;
            public void Set(FilterType type, float freq, float q)
            {
                double w = 2 * Math.PI * Math.Min(freq, SampleRate * 0.45) / SampleRate, cos = Math.Cos(w), alpha = Math.Sin(w) / (2 * Math.Max(0.05, q)), a0;
                switch (type)
                {
                    case FilterType.Highpass: b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; break;
                    case FilterType.Bandpass: b0 = alpha; b1 = 0; b2 = -alpha; break;
                    default: b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; break;
                }
                a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
                b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
            }
            public float Process(float x)
            {
                double y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                x2 = x1; x1 = x; y2 = y1; y1 = y;
                return (float)y;
            }
        }

        sealed class Buffer
        {
            readonly List<float> _s = new List<float>();
            public void Add(int i, float v) { while (_s.Count <= i) _s.Add(0); _s[i] += v; }
            /// <summary>Soft-clips like a busy mix bus (tanh), so stacked voices never exceed ±1.</summary>
            public float[] Finish()
            {
                var o = _s.ToArray();
                for (int i = 0; i < o.Length; i++) o[i] = (float)Math.Tanh(o[i]);
                return o;
            }
        }
    }
}

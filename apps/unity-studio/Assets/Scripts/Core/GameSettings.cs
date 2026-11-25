using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace SpecialSoldier.Core
{
    /// <summary>Player options, ported from DEFAULT_SETTINGS and the settings sliders of the web game
    /// (apps/special-soldier/src/core/save.js, src/ui/menu.js): field of view 60–100 (78), mouse sensitivity 0.2–3 (1),
    /// master volume and music 0–1 (0.7 / 0.5), invert Y, difficulty. The slice adds the weather preset.
    /// Values are snapped to the web slider steps and clamped on every change and on load, so a hand-edited or old save
    /// can never break the game (web: { ...DEFAULT_SETTINGS, ...saved }).</summary>
    public sealed class GameSettings
    {
        public const float FovMin = 60, FovMax = 100, FovStep = 1, SensMin = 0.2f, SensMax = 3f, SensStep = 0.05f, VolStep = 0.05f;
        /// <summary>Web look speed: 0.0022 rad per mouse pixel at sensitivity 1 (player.js).</summary>
        public const float RadiansPerPixel = 0.0022f;

        float _fov = 78, _sens = 1, _volume = 0.7f, _music = 0.5f;
        string _difficulty = "regular", _sky = "day";
        public bool InvertY;
        public bool ShowFps = true;

        public float Fov { get => _fov; set => _fov = Snap(value, FovMin, FovMax, FovStep); }
        public float Sensitivity { get => _sens; set => _sens = Snap(value, SensMin, SensMax, SensStep); }
        public float Volume { get => _volume; set => _volume = Snap(value, 0, 1, VolStep); }
        public float Music { get => _music; set => _music = Snap(value, 0, 1, VolStep); }
        public string DifficultyId { get => _difficulty; set => _difficulty = Difficulty.FromId(value).Id; }
        public string SkyId { get => _sky; set => _sky = SkyPresets.Get(value).Id; }

        public Difficulty Difficulty => Difficulty.FromId(_difficulty);

        static float Snap(float v, float min, float max, float step)
        {
            if (float.IsNaN(v)) return min;
            v = Math.Max(min, Math.Min(max, v));
            return (float)Math.Round(Math.Round((v - min) / step) * step + min, 4);
        }

        /// <summary>Camera degrees per mouse pixel (web: 0.0022 × sens radians), slower while aiming down a zoomed sight
        /// (web: ÷ lerp(1, zoom, 0.75)).</summary>
        public float LookDegreesPerPixel(float zoom = 1f, bool aiming = false)
        {
            float k = RadiansPerPixel * _sens * (float)(180.0 / Math.PI);
            if (aiming) k /= 1f + (zoom - 1f) * 0.75f;
            return k;
        }

        /// <summary>Music bus gain (web audio.setVolume: music × 0.55, under the master volume).</summary>
        public float MusicGain => _music * 0.55f;

        public GameSettings Clone() => (GameSettings)MemberwiseClone();

        // ---- persistence: a flat JSON object, readable and hand-editable ----

        public string ToJson()
        {
            var sb = new StringBuilder("{");
            void Num(string k, float v) => sb.Append('"').Append(k).Append("\":").Append(v.ToString("0.####", CultureInfo.InvariantCulture)).Append(',');
            void Str(string k, string v) => sb.Append('"').Append(k).Append("\":\"").Append(v).Append("\",");
            void Bool(string k, bool v) => sb.Append('"').Append(k).Append("\":").Append(v ? "true" : "false").Append(',');
            Num("fov", _fov); Num("sens", _sens); Num("volume", _volume); Num("music", _music);
            Bool("invertY", InvertY); Bool("showFps", ShowFps); Str("difficulty", _difficulty); Str("sky", _sky);
            sb.Length--; sb.Append('}');
            return sb.ToString();
        }

        /// <summary>Reads settings saved by <see cref="ToJson"/>. Missing, unknown or broken values fall back to the defaults.</summary>
        public static GameSettings FromJson(string json)
        {
            var s = new GameSettings();
            if (string.IsNullOrWhiteSpace(json)) return s;
            foreach (var kv in ParseFlat(json))
            {
                string v = kv.Value;
                float F(float fallback) => float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out var f) ? f : fallback;
                switch (kv.Key)
                {
                    case "fov": s.Fov = F(s.Fov); break;
                    case "sens": s.Sensitivity = F(s.Sensitivity); break;
                    case "volume": s.Volume = F(s.Volume); break;
                    case "music": s.Music = F(s.Music); break;
                    case "invertY": s.InvertY = v == "true"; break;
                    case "showFps": s.ShowFps = v != "false"; break;
                    case "difficulty": s.DifficultyId = v; break;
                    case "sky": s.SkyId = v; break;
                }
            }
            return s;
        }

        /// <summary>Tiny parser for one flat JSON object of strings, numbers and booleans (no nesting needed here).</summary>
        static Dictionary<string, string> ParseFlat(string json)
        {
            var d = new Dictionary<string, string>();
            int i = json.IndexOf('{'); if (i < 0) return d; i++;
            while (i < json.Length)
            {
                int k0 = json.IndexOf('"', i); if (k0 < 0) break;
                int k1 = json.IndexOf('"', k0 + 1); if (k1 < 0) break;
                string key = json.Substring(k0 + 1, k1 - k0 - 1);
                int colon = json.IndexOf(':', k1); if (colon < 0) break;
                int j = colon + 1; while (j < json.Length && char.IsWhiteSpace(json[j])) j++;
                string val;
                if (j < json.Length && json[j] == '"') { int e = json.IndexOf('"', j + 1); if (e < 0) break; val = json.Substring(j + 1, e - j - 1); i = e + 1; }
                else { int e = j; while (e < json.Length && json[e] != ',' && json[e] != '}') e++; val = json.Substring(j, e - j).Trim(); i = e; }
                d[key] = val;
                int comma = json.IndexOf(',', i); if (comma < 0) break; i = comma + 1;
            }
            return d;
        }
    }
}

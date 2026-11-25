using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace SpecialSoldier.Core
{
    /// <summary>A mission's best result (web save.best[i]: grade, time, kills, accuracy, alarms).</summary>
    public sealed class MissionRecord
    {
        public char Grade; public int Time, Kills, Accuracy, Alarms;
    }

    /// <summary>Campaign progress, the web game's rules (apps/special-soldier/src/main.js onMissionComplete, src/ui/menu.js campaign()):
    /// mission i is locked while i &gt; Progress; finishing mission i raises Progress to at least i + 1; the best record is replaced
    /// when the new grade is at least as good ('CBAS' order). Saved as one flat JSON object like GameSettings.</summary>
    public sealed class CampaignProgress
    {
        const string Order = "CBAS";
        public int Progress { get; private set; }
        readonly Dictionary<int, MissionRecord> _best = new Dictionary<int, MissionRecord>();

        public bool Unlocked(int index) => index >= 0 && index <= Progress;
        public MissionRecord Best(int index) => _best.TryGetValue(index, out var r) ? r : null;
        /// <summary>The mission the campaign screen highlights (web: min(progress, last)).</summary>
        public int Current(int missionCount) => Math.Min(Progress, missionCount - 1);

        /// <summary>Records a finished mission. Returns true the first time it is completed (web: first = progress &lt;= i → unlocks shown).</summary>
        public bool Complete(int index, MissionStats st)
        {
            bool first = Progress <= index;
            Progress = Math.Max(Progress, index + 1);
            var old = Best(index);
            if (old == null || Order.IndexOf(st.Grade) >= Order.IndexOf(old.Grade))
                _best[index] = new MissionRecord { Grade = st.Grade, Time = (int)Math.Round(st.Time, MidpointRounding.AwayFromZero), Kills = st.Kills, Accuracy = st.AccuracyPercent, Alarms = st.Alarms };
            return first;
        }

        public string ToJson()
        {
            var sb = new StringBuilder("{\"progress\":").Append(Progress.ToString(CultureInfo.InvariantCulture));
            foreach (var kv in _best)
            {
                var r = kv.Value;
                sb.Append(",\"best").Append(kv.Key.ToString(CultureInfo.InvariantCulture)).Append("\":\"")
                  .Append(r.Grade).Append('|').Append(r.Time).Append('|').Append(r.Kills).Append('|').Append(r.Accuracy).Append('|').Append(r.Alarms).Append('"');
            }
            return sb.Append('}').ToString();
        }

        /// <summary>Reads <see cref="ToJson"/>; anything missing or broken is ignored (a fresh campaign).</summary>
        public static CampaignProgress FromJson(string json)
        {
            var p = new CampaignProgress();
            if (string.IsNullOrEmpty(json)) return p;
            int i = 0;
            while ((i = json.IndexOf('"', i)) >= 0)
            {
                int k1 = json.IndexOf('"', i + 1); if (k1 < 0) break;
                string key = json.Substring(i + 1, k1 - i - 1);
                int colon = json.IndexOf(':', k1); if (colon < 0) break;
                int j = colon + 1; string val;
                if (j < json.Length && json[j] == '"') { int e = json.IndexOf('"', j + 1); if (e < 0) break; val = json.Substring(j + 1, e - j - 1); i = e + 1; }
                else { int e = j; while (e < json.Length && json[e] != ',' && json[e] != '}') e++; val = json.Substring(j, e - j); i = e; }
                if (key == "progress" && int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out int pr)) p.Progress = Math.Max(0, pr);
                else if (key.StartsWith("best", StringComparison.Ordinal) && int.TryParse(key.Substring(4), NumberStyles.Integer, CultureInfo.InvariantCulture, out int idx))
                {
                    var f = val.Split('|');
                    if (f.Length == 5 && f[0].Length == 1 && Order.IndexOf(f[0][0]) >= 0
                        && int.TryParse(f[1], out int t) && int.TryParse(f[2], out int k) && int.TryParse(f[3], out int a) && int.TryParse(f[4], out int al))
                        p._best[idx] = new MissionRecord { Grade = f[0][0], Time = t, Kills = k, Accuracy = a, Alarms = al };
                }
            }
            return p;
        }
    }
}

using System;
using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Saves Core.CampaignProgress in PlayerPrefs (browser storage on WebGL), next to the settings.</summary>
    public static class ProgressStore
    {
        public const string Key = "special-soldier.campaign";
        static CampaignProgress _current;

        public static CampaignProgress Current
        {
            get
            {
                if (_current == null && !SettingsStore.Volatile)
                {
                    string json = null;
                    try { json = PlayerPrefs.GetString(Key, null); } catch (Exception) { /* no storage: fresh campaign */ }
                    _current = CampaignProgress.FromJson(json);
                }
                return _current ?? (_current = new CampaignProgress());
            }
        }

        /// <summary>Records a won mission and saves; true on the first clear.</summary>
        public static bool Complete(int index, MissionStats st)
        {
            bool first = Current.Complete(index, st);
            if (!SettingsStore.Volatile) try { PlayerPrefs.SetString(Key, _current.ToJson()); PlayerPrefs.Save(); } catch (Exception) { /* keep it for this run */ }
            return first;
        }

        /// <summary>Tests (SettingsStore.UseDefaultsForTests): a fresh campaign that is never written.</summary>
        public static void ResetForTests() => _current = new CampaignProgress();
    }
}

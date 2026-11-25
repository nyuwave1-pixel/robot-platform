using System;
using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Loads and saves Core.GameSettings in PlayerPrefs (on WebGL that is the browser's IndexedDB), and tells the game
    /// when something changed. Everything that depends on an option reads <see cref="Current"/> or listens to <see cref="Changed"/>.</summary>
    public static class SettingsStore
    {
        public const string Key = "special-soldier.settings";
        static GameSettings _current;
        public static event Action<GameSettings> Changed;

        public static GameSettings Current
        {
            get
            {
                if (_current == null && !Volatile)
                {
                    string json = null;
                    try { json = PlayerPrefs.GetString(Key, null); } catch (Exception) { /* no storage (private window): defaults */ }
                    _current = GameSettings.FromJson(json);
                }
                return _current ?? (_current = new GameSettings());
            }
        }

        /// <summary>Applies an edit, saves it and notifies listeners.</summary>
        public static void Edit(Action<GameSettings> change)
        {
            change(Current);
            if (!Volatile) try { PlayerPrefs.SetString(Key, _current.ToJson()); PlayerPrefs.Save(); } catch (Exception) { /* keep the change for this run */ }
            // master volume is global: apply it here, not only in SliceFx.Update — SliceFx is created by the first sound, so a
            // change made in the menu before any shot or step never reached the listener (PlayMode PauseMenuTests, 2026-11-25)
            AudioListener.volume = _current.Volume;
            Changed?.Invoke(_current);
        }

        /// <summary>Tests: start from the defaults and never write PlayerPrefs, so a player's saved options can't change test
        /// results and tests can't overwrite them.</summary>
        public static bool Volatile { get; private set; }
        public static void UseDefaultsForTests() { Volatile = true; _current = new GameSettings(); }
    }
}

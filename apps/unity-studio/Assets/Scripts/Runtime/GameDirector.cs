using System.Collections.Generic;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

namespace SpecialSoldier
{
    /// <summary>Win / lose rules for the slice and the "noise" broadcast that lets enemies hear gunshots.
    /// Winning means finishing the mission's objectives (Core.MissionRunner); the result is graded S/A/B/C like the web game.</summary>
    public sealed class GameDirector : MonoBehaviour, IMissionWorld
    {
        public enum MissionMode { EliminateAll, IslandSlice }
        public MissionMode missionMode = MissionMode.EliminateAll;
        public Transform intelTerminal, extraction;     // IslandSlice objectives (placed by SliceBuilder)
        public MissionRunner Mission { get; private set; }
        public string ObjectiveLine => Mission != null ? Mission.ObjectiveText(this) : "";
        /// <summary>An enemy died: (enemy, killed by the player with a headshot). The HUD kill feed listens.</summary>
        public event System.Action<EnemyAgent, bool> EnemyKilled;
        /// <summary>Enemy in combat this long without dying calls it in (web: callT ≈ 5 s → mission 'alarm').</summary>
        public const float AlarmDelay = 5f;
        public static GameDirector Instance { get; private set; }
        /// <summary>Tests only: a batch-mode Editor has no window, so the cursor can never be locked there.</summary>
        public static bool AssumeCursorCaptured;
        public static bool CursorCaptured => AssumeCursorCaptured || Cursor.lockState == CursorLockMode.Locked;
        /// <summary>Campaign difficulty for this run (RECRUIT / REGULAR / VETERAN): a value set by code (tests), else
        /// <c>-difficulty recruit|regular|veteran</c> on the command line, else the saved setting (pause menu). Read lazily, so
        /// enemies get the right value whatever order their Awake runs in.</summary>
        public static SpecialSoldier.Core.Difficulty CurrentDifficulty
        {
            get => _difficultyOverride ?? FromCommandLine() ?? SettingsStore.Current.Difficulty;
            set => _difficultyOverride = value;
        }
        static SpecialSoldier.Core.Difficulty _difficultyOverride;
        static SpecialSoldier.Core.Difficulty FromCommandLine()
        {
            var args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++) if (args[i] == "-difficulty") return SpecialSoldier.Core.Difficulty.FromId(args[i + 1]);
            return null;
        }
        public PlayerMotor player;
        public readonly List<EnemyAgent> enemies = new List<EnemyAgent>();
        public enum Outcome { Playing, Won, Lost }
        public Outcome State { get; private set; } = Outcome.Playing;
        public float ElapsedTime { get; private set; }
        public int Kills { get; private set; }

        void Awake() { Instance = this; }

        void Start()
        {
            enemies.AddRange(FindObjectsByType<EnemyAgent>());
            if (!player) player = FindAnyObjectByType<PlayerMotor>();
            foreach (var e in enemies) { var d = e.GetComponent<Damageable>(); if (d) d.Died += OnEnemyDied; }
            if (player) { var d = player.GetComponent<Damageable>(); if (d) d.Died += () => { if (Mission != null) Mission.Stats.Deaths++; End(Outcome.Lost); }; }
            Mission = BuildMission();
            Mission.MissionCompleted += () => End(Outcome.Won);
            Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false;
        }

        MissionRunner BuildMission()
        {
            if (missionMode == MissionMode.IslandSlice && intelTerminal && extraction)
            {
                var t = intelTerminal.position; var x = extraction.position;
                return new MissionRunner("SLICE 01", "ISLAND SLICE",
                    Objective.Any("Take the compound",
                        Objective.Kill("compound", "Clear the compound"),
                        Objective.Interact(new Vec2(t.x, t.z), "DOWNLOAD INTEL", 3f, "Download the base intel")),
                    Objective.Reach(new Vec2(x.x, x.z), 8f, "Get to the extraction point"));
            }
            return new MissionRunner("SLICE 00", "ISLAND SLICE", Objective.Kill("*", "Eliminate all hostiles"));
        }

        // ---- IMissionWorld ----
        public Vec2 PlayerPosition => player ? new Vec2(player.transform.position.x, player.transform.position.z) : new Vec2(0, 0);
        public bool InteractHeld => Keyboard.current != null && Keyboard.current.eKey.isPressed && CursorCaptured;
        public int Alive(string group)
        {
            int n = 0;
            foreach (var e in enemies) if (e && e.Alive && (group == "*" || e.group == group)) n++;
            return n;
        }

        void Update()
        {
            if (State == Outcome.Playing)
            {
                ElapsedTime += Time.deltaTime;
                Mission.Tick(Time.deltaTime, this);
                // alarms: a squad that fights you for 5 s calls it in once (web: stats.alarms)
                foreach (var e in enemies)
                    if (e && e.Alive && !e.AlarmRaised && e.Brain != null && e.Brain.State == AlertState.Combat && e.Brain.StateTime > AlarmDelay)
                    {
                        Mission.Stats.Alarms++;
                        foreach (var o in enemies) if (o && o.group == e.group) o.AlarmRaised = true;
                    }
            }
            var kb = Keyboard.current;
            if (kb == null) return;
            if (State != Outcome.Playing && kb.rKey.wasPressedThisFrame) SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
            if (kb.escapeKey.wasPressedThisFrame && !PauseMenu.Instance) { Cursor.lockState = CursorLockMode.None; Cursor.visible = true; }   // the pause menu owns Esc when present
            var mouse = Mouse.current;
            if (State == Outcome.Playing && !PauseMenu.IsOpen && mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState != CursorLockMode.Locked)
            { Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false; }
        }

        void OnEnemyDied()
        {
            Kills++;
            if (Mission == null) return;
            foreach (var e in enemies)
            {
                if (!e || e.Alive || _counted.Contains(e)) continue;
                _counted.Add(e);
                var d = e.GetComponent<Damageable>();
                bool head = d && d.LastHitByPlayer && d.LastHitPart == BodyPart.Head;
                if (d && d.LastHitByPlayer) Mission.Stats.AddKill(e.Type.Score, head);
                else Mission.Stats.Kills++;   // grenades, scripted kills: still a kill, no style bonus
                EnemyKilled?.Invoke(e, head);
            }
            Mission.Tick(0f, this);          // the last kill can finish the objective in the same frame
        }
        readonly HashSet<EnemyAgent> _counted = new HashSet<EnemyAgent>();

        void End(Outcome o)
        {
            if (State != Outcome.Playing) return;
            State = o; Cursor.lockState = CursorLockMode.None; Cursor.visible = true;
            if (o == Outcome.Won && Mission != null)
                PortalBridge.ReportResult(Mission.Code, Mission.Stats.Grade.ToString(), Mathf.RoundToInt(Mission.Stats.Score), Mission.Stats.PortalRp);
        }

        /// <summary>Tells every enemy within <paramref name="radius"/> that something was heard at <paramref name="pos"/>.</summary>
        public void ReportNoise(Vector3 pos, float radius)
        {
            foreach (var e in enemies) if (e && e.Alive) e.Hear(pos, radius);
        }
    }
}

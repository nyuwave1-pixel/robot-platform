using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

namespace SpecialSoldier
{
    /// <summary>Win / lose rules for the slice and the "noise" broadcast that lets enemies hear gunshots.</summary>
    public sealed class GameDirector : MonoBehaviour
    {
        public static GameDirector Instance { get; private set; }
        /// <summary>Tests only: a batch-mode Editor has no window, so the cursor can never be locked there.</summary>
        public static bool AssumeCursorCaptured;
        public static bool CursorCaptured => AssumeCursorCaptured || Cursor.lockState == CursorLockMode.Locked;
        /// <summary>Campaign difficulty for this run (RECRUIT / REGULAR / VETERAN). Set it before the scene loads;
        /// the player build reads <c>-difficulty recruit|regular|veteran</c> from the command line.</summary>
        public static SpecialSoldier.Core.Difficulty CurrentDifficulty = FromCommandLine();
        static SpecialSoldier.Core.Difficulty FromCommandLine()
        {
            var args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++) if (args[i] == "-difficulty") return SpecialSoldier.Core.Difficulty.FromId(args[i + 1]);
            return SpecialSoldier.Core.Difficulty.Regular;
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
            if (player) { var d = player.GetComponent<Damageable>(); if (d) d.Died += () => End(Outcome.Lost); }
            Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false;
        }

        void Update()
        {
            if (State == Outcome.Playing) ElapsedTime += Time.deltaTime;
            var kb = Keyboard.current;
            if (kb == null) return;
            if (State != Outcome.Playing && kb.rKey.wasPressedThisFrame) SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
            if (kb.escapeKey.wasPressedThisFrame) { Cursor.lockState = CursorLockMode.None; Cursor.visible = true; }
            var mouse = Mouse.current;
            if (State == Outcome.Playing && mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState != CursorLockMode.Locked)
            { Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false; }
        }

        void OnEnemyDied()
        {
            Kills++;
            if (enemies.TrueForAll(e => !e.Alive)) End(Outcome.Won);
        }

        void End(Outcome o)
        {
            if (State != Outcome.Playing) return;
            State = o; Cursor.lockState = CursorLockMode.None; Cursor.visible = true;
        }

        /// <summary>Tells every enemy within <paramref name="radius"/> that something was heard at <paramref name="pos"/>.</summary>
        public void ReportNoise(Vector3 pos, float radius)
        {
            foreach (var e in enemies) if (e && e.Alive) e.Hear(pos, radius);
        }
    }
}

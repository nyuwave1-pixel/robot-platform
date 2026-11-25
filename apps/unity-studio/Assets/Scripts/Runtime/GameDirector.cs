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
        public enum MissionMode { EliminateAll, IslandSlice, Campaign }
        public MissionMode missionMode = MissionMode.EliminateAll;
        /// <summary>Campaign mode: which web mission this scene plays (Core.Campaign id, e.g. "m01").</summary>
        public string campaignId;
        /// <summary>Reinforcements placed inactive in the scene; switched on by the mission's first alarm (web: alarm() → wave()).</summary>
        public GameObject[] alarmWave;
        /// <summary>A named wave the mission's objective hooks send in (Core MissionRunner.WaveRequested, web wave(list, group)).</summary>
        [System.Serializable] public sealed class WaveGroup { public string name; public GameObject[] members; }
        public WaveGroup[] waves = new WaveGroup[0];
        /// <summary>Mission 02: the relay mast that falls when the C4 goes off (event "detonate").</summary>
        public Transform relayMast;
        /// <summary>Mission 04: the security door (slides up when overridden) and the glowing bio-sample (taken from the vault).</summary>
        public Transform securityDoor;
        public GameObject bioSample;
        /// <summary>Mission 04: a security camera saw you (once; also counts as the mission's alarm).</summary>
        public bool CameraAlarmed { get; private set; }
        /// <summary>Mission 05: the extraction helicopter (flies in when the LZ is held) and where the smoke goes.</summary>
        public Transform heli;
        public bool HeliLanded => Mission != null && Mission.Flags.Contains("heliLanded");
        /// <summary>Campaign: this mission's place in Core.Campaign.All (−1 outside the campaign).</summary>
        public int CampaignIndex => missionMode == MissionMode.Campaign ? System.Array.IndexOf(Campaign.All, Campaign.Get(campaignId)) : -1;
        /// <summary>The following campaign mission's scene, when it is in this build (N on the result screen).</summary>
        public string NextScene
        {
            get
            {
                int i = CampaignIndex; if (i < 0 || i + 1 >= Campaign.All.Length) return null;
                string s = SceneRouter.SceneFor(Campaign.All[i + 1].Id);
                return Application.CanStreamedLevelBeLoaded(s) ? s : null;
            }
        }
        public bool LastMission => CampaignIndex == Campaign.All.Length - 1;
        /// <summary>The win was this mission's first clear (web: unlocks are announced).</summary>
        public bool FirstClear { get; private set; }
        /// <summary>A mission intro is playing (IntroDirector): the mission clock and objectives wait.</summary>
        public bool Cinematic { get; set; }
        /// <summary>SQUAD 07 may shoot anyone (web squad.weaponsFree: the first shot or the first enemy in combat).</summary>
        public bool SquadWeaponsFree { get; private set; }
        public void WeaponsFree()
        {
            if (SquadWeaponsFree) return; SquadWeaponsFree = true;
            if (State == Outcome.Playing && FindAnyObjectByType<SquadMate>()) Radio("REAPER: Contact! Weapons free!");
        }
        public bool Detonated { get; private set; }
        /// <summary>Latest radio line for the HUD and when it was said (Time.time).</summary>
        public string RadioLine { get; private set; }
        public float RadioTime { get; private set; } = -99f;
        public void Radio(string line) { RadioLine = line; RadioTime = Time.time; }
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
        /// <c>-difficulty recruit|regular|veteran</c> on the command line, else the saved setting (pause menu). A WebGL page opened
        /// from the classic edition with <c>?difficulty=</c> writes that into the saved setting once (<see cref="AdoptUrlDifficulty"/>),
        /// so the pause menu shows it and can still change it. Read lazily, so
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

        void Awake() { Instance = this; AdoptUrlDifficulty(); }

        static bool _urlDifficultyAdopted;
        /// <summary>Once per page load: the classic edition's PLAY MODE screen sends the player's difficulty as ?difficulty=
        /// (Core/EditionLinks). Saving it (instead of overriding every read) keeps the pause menu truthful and editable;
        /// a mission restart reloads the scene but not the page, so it is adopted only the first time.</summary>
        static void AdoptUrlDifficulty()
        {
            if (_urlDifficultyAdopted) return; _urlDifficultyAdopted = true;
            string id = SpecialSoldier.Core.EditionLinks.DifficultyId(Application.absoluteURL);
            if (id != null && id != SettingsStore.Current.DifficultyId) SettingsStore.Edit(s => s.DifficultyId = id);
        }

        void Start()
        {
            enemies.AddRange(FindObjectsByType<EnemyAgent>());
            if (!player) player = FindAnyObjectByType<PlayerMotor>();
            foreach (var e in enemies) { var d = e.GetComponent<Damageable>(); if (d) d.Died += OnEnemyDied; }
            if (player) { var d = player.GetComponent<Damageable>(); if (d) d.Died += () => { if (Mission != null) Mission.Stats.Deaths++; End(Outcome.Lost); }; }
            Mission = BuildMission();
            Mission.MissionCompleted += () => End(Outcome.Won);
            Mission.AlarmRaised += OnAlarm;
            Mission.RadioSaid += Radio;
            Mission.WaveRequested += SendWave;
            Mission.EventRaised += OnMissionEvent;
            Mission.Begin(this);   // first objective's radio / start hook, now that everything listens
            if (!BriefingScreen.IsOpen) { Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false; }
        }

        MissionRunner BuildMission()
        {
            var campaign = missionMode == MissionMode.Campaign ? Campaign.Get(campaignId) : null;
            if (campaign != null) return campaign.NewRunner();
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
            if (State == Outcome.Playing && !Cinematic)
            {
                ElapsedTime += Time.deltaTime;
                Mission.Tick(Time.deltaTime, this);
                // alarm: an enemy that survives 5 s in combat calls for reinforcements — counted once per mission (web: flags.alarm)
                // (a copy: the alarm's reinforcements join `enemies` while this loop runs)
                foreach (var e in enemies.ToArray())
                    if (e && e.Alive && !e.AlarmRaised && e.Brain != null && e.Brain.State == AlertState.Combat && e.Brain.StateTime > AlarmDelay)
                    {
                        e.AlarmRaised = true;
                        Mission.RaiseAlarm();
                    }
            }
            var kb = Keyboard.current;
            if (kb == null) return;
            if (State != Outcome.Playing && kb.rKey.wasPressedThisFrame) SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
            if (State == Outcome.Won && kb.nKey.wasPressedThisFrame && NextScene != null) SceneManager.LoadScene(NextScene);   // campaign: on to the next mission
            if (kb.escapeKey.wasPressedThisFrame && !PauseMenu.Instance) { Cursor.lockState = CursorLockMode.None; Cursor.visible = true; }   // the pause menu owns Esc when present
            var mouse = Mouse.current;
            if (State == Outcome.Playing && !PauseMenu.IsOpen && !BriefingScreen.IsOpen && mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState != CursorLockMode.Locked)
            { Cursor.lockState = CursorLockMode.Locked; Cursor.visible = false; }
        }

        /// <summary>First alarm of the mission: radio call-out and the reinforcement wave heads for you (web: def.alarm → wave).</summary>
        void OnAlarm()
        {
            var campaign = missionMode == MissionMode.Campaign ? Campaign.Get(campaignId) : null;
            if (campaign == null) Radio("ENEMY CALLED FOR REINFORCEMENTS");
            else if (campaign.AlarmRadio != null) Radio(campaign.AlarmRadio);   // M04: the web alarm() says nothing (the cameras speak)
            if (campaign?.AlarmSearchPrefix != null && player)
                // web M02 alarm(): patrols not yet searching head for where you are
                foreach (var e in enemies)
                    if (e && e.Alive && e.group.StartsWith(campaign.AlarmSearchPrefix) && e.Brain != null && e.Brain.State < AlertState.Search)
                        e.Hear(player.transform.position, 9999f);
            Activate(alarmWave, int.MaxValue);
        }

        public void SendWave(string name, int count)
        {
            foreach (var w in waves) if (w != null && w.name == name) { Activate(w.members, count); return; }
            Debug.LogWarning($"[Mission] wave '{name}' is not in this scene");
        }

        /// <summary>Switches on the first <paramref name="count"/> soldiers of a wave; they know where you are (web: wave(..., alert: true)).</summary>
        void Activate(GameObject[] members, int count)
        {
            if (members == null) return;
            int sent = 0;   // the next `count` soldiers still waiting (a pool can be called several times: M04 uplink waves)
            for (int i = 0; i < members.Length && sent < count; i++)
            {
                var go = members[i];
                if (!go || go.activeSelf) continue;
                sent++;
                go.SetActive(true);
                var e = go.GetComponent<EnemyAgent>(); if (!e) continue;
                enemies.Add(e);
                var d = e.GetComponent<Damageable>(); if (d) d.Died += OnEnemyDied;
                if (player) e.Hear(player.transform.position, 9999f);
            }
        }

        void OnMissionEvent(string evt)
        {
            if (evt == "detonate") StartCoroutine(Detonate());
            else if (evt == "sabotage") StartCoroutine(Sabotage());
            else if (evt == "siren") SliceFx.I.Alarm(IslandGround(Campaign.Hq.x, Campaign.Hq.z));
            else if (evt == "openDoor") StartCoroutine(OpenDoor());
            else if (evt == "sample" && bioSample) bioSample.SetActive(false);
            else if (evt == "sirenServer") SliceFx.I.Alarm(player ? player.transform.position : Vector3.zero);
            else if (evt == "smoke") SmokeColumn.Spawn(IslandGround(IslandProps.Helipad.x + 6, IslandProps.Helipad.z + 5), new Color(0.25f, 0.82f, 0.38f), 160f);   // web 0x40d060
            else if (evt == "heliArrive") StartCoroutine(HeliArrive());
            else if (evt == "gunner") DoorGunner.Begin(this);   // web v0.23: the door-gunner orbit
        }

        /// <summary>VIPER at half health (web Missions.event bossPhase2): his shout, the siren, and four more onto the runway.</summary>
        public void OnBossPhase2(EnemyAgent boss)
        {
            var campaign = missionMode == MissionMode.Campaign ? Campaign.Get(campaignId) : null;
            if (campaign?.BossPhase2Radio != null) Radio(campaign.BossPhase2Radio);
            SliceFx.I.Alarm(boss.transform.position);
            SendWave("phase2", 4);
        }

        /// <summary>web heliArrive / updateHeli 'in': over 8.5 s the helicopter eases in from 240 m east, 70 m up and 120 m south
        /// (cubic ease-out) onto the pad, then you can board. Island coordinates, mapped to Unity with the z mirror.</summary>
        System.Collections.IEnumerator HeliArrive()
        {
            Radio("ANGEL 1-2: On final. Get your people ready!");
            if (!heli) { Mission?.Flags.Add("heliLanded"); yield break; }
            heli.gameObject.SetActive(true);
            var p = IslandProps.Helipad; var rotor = FindChild(heli, "rotor"); var tail = FindChild(heli, "tail");
            for (float t = 0f; ; t += Time.deltaTime)
            {
                if (DoorGunner.Instance) yield break;   // the door-gunner orbit flies it from here
                float k = Mathf.Clamp01(t / 8.5f), e = 1f - Mathf.Pow(1f - k, 3f);
                var w = IslandTerrain.ToWorld(p.x + (1 - e) * 240, 7.2 + (1 - e) * 70 + (k < 1 ? Mathf.Sin(Time.time * 2f) * 0.3f : 0f), p.z - (1 - e) * 120);
                heli.position = new Vector3((float)w.x, (float)w.y, (float)w.z);
                heli.rotation = Quaternion.Euler(-(1 - k) * 0.25f * Mathf.Rad2Deg, -(-1.9f + e * 0.35f) * Mathf.Rad2Deg, 0f);   // island yaw → Unity (mirrored)
                if (rotor) rotor.Rotate(0f, 26f * Mathf.Rad2Deg * Time.deltaTime, 0f, Space.Self);
                if (tail) tail.Rotate(40f * Mathf.Rad2Deg * Time.deltaTime, 0f, 0f, Space.Self);
                if (k >= 1f && !HeliLanded) { Mission?.Flags.Add("heliLanded"); Radio("HELICOPTER LANDED — BOARD NOW"); }
                if (State != Outcome.Playing) yield break;
                yield return null;
            }
        }

        static Transform FindChild(Transform root, string name)
        {
            foreach (var t in root.GetComponentsInChildren<Transform>(true)) if (t.name == name) return t;
            return null;
        }

        /// <summary>web: door.position.y = FAC_Y + 2.1 + min(4, t × 2.5) — it slides 4 m up into the ceiling in 1.6 s.</summary>
        System.Collections.IEnumerator OpenDoor()
        {
            if (!securityDoor) yield break;
            SliceFx.I.HitConfirm(false);   // stand-in for the web 'beep' (700 Hz)
            Vector3 from = securityDoor.position;
            for (float t = 0f; t < 1.6f; t += Time.deltaTime) { securityDoor.position = from + Vector3.up * Mathf.Min(4f, t * 2.5f); yield return null; }
            securityDoor.position = from + Vector3.up * 4f;
        }

        /// <summary>A Mission 04 camera locked the facility down (web: camAlarm — siren, radio, alarm stat, everyone searches).</summary>
        public void CameraAlarm(Vector3 at)
        {
            if (CameraAlarmed || State != Outcome.Playing) return;
            CameraAlarmed = true;
            var campaign = missionMode == MissionMode.Campaign ? Campaign.Get(campaignId) : null;
            SliceFx.I.Alarm(at);
            Radio("CAMERA ALERT — FACILITY ON LOCKDOWN   " + (campaign?.CameraAlarmRadio ?? ""));
            Mission?.RaiseAlarm();   // counts the alarm and sends everyone not yet searching after you (OnAlarm)
        }

        /// <summary>A point on the island (web coordinates) at ground height in this scene.</summary>
        static Vector3 IslandGround(double ix, double iz)
        {
            var w = IslandTerrain.ToWorld(ix, 0, iz); var p = new Vector3((float)w.x, 0f, (float)w.z);
            var t = Terrain.activeTerrain; if (t) p.y = t.SampleHeight(p) + t.transform.position.y;
            return p;
        }

        /// <summary>Mission 03 motor-pool charge (web: two blasts at the fuel bowser, then every vehicle within 70 m is destroyed, credited to you).</summary>
        System.Collections.IEnumerator Sabotage()
        {
            var m = Campaign.Motor; Vector3 a = IslandGround(m.x, m.z) + Vector3.up, b = IslandGround(m.x + 4, m.z - 3) + Vector3.up;
            Grenade.Flash(a); SliceFx.I.Explosion(a); ReportNoise(a, 120f);
            yield return new WaitForSeconds(0.3f);
            Grenade.Flash(b); SliceFx.I.Explosion(b);
            foreach (var e in enemies.ToArray())
                if (e && e.Alive && e.Type != null && e.Type.Vehicle && Vector3.Distance(e.transform.position, a) < 70f)
                    e.GetComponent<Damageable>().ApplyDamage(1e6f, a, BodyPart.Torso, true, true);
        }

        /// <summary>The C4 on the relay mast goes off (web detonateTower: three blasts, the mast topples). Stand-in for the web cinematic.</summary>
        System.Collections.IEnumerator Detonate()
        {
            Detonated = true;
            if (!relayMast) yield break;
            Vector3 b = relayMast.position;
            foreach (var (off, delay) in new[] { (Vector3.up, 0f), (new Vector3(1f, 9f, 0f), 0.35f), (new Vector3(-8f, 1f, -2f), 0.35f) })
            {
                if (delay > 0f) yield return new WaitForSeconds(delay);
                Grenade.Flash(b + off); SliceFx.I.Explosion(b + off);
            }
            ReportNoise(b, 200f);
            foreach (var c in relayMast.GetComponentsInChildren<Collider>()) c.enabled = false;
            var from = relayMast.rotation; var to = Quaternion.AngleAxis(82f, Vector3.forward) * from;
            for (float t = 0f; t < 2.6f; t += Time.deltaTime)
            {
                float k = t / 2.6f; relayMast.rotation = Quaternion.Slerp(from, to, k * k);   // slow start, then it crashes down
                yield return null;
            }
            relayMast.rotation = to;
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
            if (o == Outcome.Won && Mission != null && CampaignIndex >= 0) FirstClear = ProgressStore.Complete(CampaignIndex, Mission.Stats);   // web: save.progress / best
            if (o == Outcome.Won && Mission != null)
                PortalBridge.ReportResult(Mission.Code, Mission.Stats.Grade.ToString(), Mathf.RoundToInt(Mission.Stats.Score), Mission.Stats.PortalRp);
        }

        /// <summary>Tells every enemy within <paramref name="radius"/> that something was heard at <paramref name="pos"/>.</summary>
        public void ReportNoise(Vector3 pos, float radius)
        {
            if (!Cinematic) WeaponsFree();   // any shot or blast: the squad goes weapons free (web weapons.js / enemies.js)
            foreach (var e in enemies) if (e && e.Alive) e.Hear(pos, radius);
        }
    }
}

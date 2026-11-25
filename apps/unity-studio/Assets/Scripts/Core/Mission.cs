using System;
using System.Collections.Generic;
using System.Linq;

namespace SpecialSoldier.Core
{
    /// <summary>What happened during a mission (web: Missions.newStats). Grading is the web game's G.onMissionComplete.</summary>
    public sealed class MissionStats
    {
        public int Kills, Headshots, Shots, Hits, Alarms, Deaths, Intel;
        public float Score, Time;

        public int AccuracyPercent => Shots > 0 ? (int)Math.Round(Hits * 100.0 / Shots, MidpointRounding.AwayFromZero) : 0;

        /// <summary>Accuracy ≥45% 2 pts (≥25% 1), no alarm 2 (one 1), no death 2 (one 1), headshots ≥30% of kills 1.
        /// 7+ = S, 5+ = A, 3+ = B, else C.</summary>
        public int GradePoints
        {
            get
            {
                int acc = AccuracyPercent, pts = 0;
                pts += acc >= 45 ? 2 : acc >= 25 ? 1 : 0;
                pts += Alarms == 0 ? 2 : Alarms == 1 ? 1 : 0;
                pts += Deaths == 0 ? 2 : Deaths == 1 ? 1 : 0;
                pts += Headshots >= Kills * 0.3 ? 1 : 0;
                return pts;
            }
        }

        public char Grade { get { int p = GradePoints; return p >= 7 ? 'S' : p >= 5 ? 'A' : p >= 3 ? 'B' : 'C'; } }

        /// <summary>Reward points the BIT PARK / RobotVerse portal credits for the grade (web: postMessage game_result).</summary>
        public int PortalRp => Grade switch { 'S' => 60, 'A' => 45, 'B' => 30, _ => 15 };

        /// <summary>Kill score (web: Enemies.damage → stats.score += type.score × 1.5 for a headshot).</summary>
        public void AddKill(int typeScore, bool headshot) { Kills++; if (headshot) Headshots++; Score += typeScore * (headshot ? 1.5f : 1f); }
    }

    public enum ObjectiveKind { Kill, Reach, Interact, Defend, Any, Custom }

    /// <summary>One mission objective (web: MISSIONS[i].objectives[k]). For Any, every part must be done, in any order.</summary>
    public sealed class Objective
    {
        public ObjectiveKind Kind;
        public string Text, Group, Label;
        public Vec2 At;
        public float Radius = 2.6f, Hold, Time;
        public List<Objective> Parts;
        public bool Done { get; internal set; }
        /// <summary>Radio line said when this objective becomes current (web: o.radio).</summary>
        public string Radio;
        /// <summary>Runs when this objective becomes current (web: o.start(M)) — e.g. send a counter-attack.</summary>
        public Action<MissionRunner> OnStart;
        /// <summary>Runs when this objective or part is completed (web: o.done(M)) — e.g. set a flag, say something.</summary>
        public Action<MissionRunner> OnDone;
        /// <summary>Runs every frame while this objective is current (web: o.tick(M, dt)) — e.g. uplink defence waves.</summary>
        public Action<MissionRunner, float> OnTick;
        /// <summary>Custom objectives: complete when this returns true (web: type 'custom', check(M)).</summary>
        public Func<MissionRunner, IMissionWorld, bool> Check;

        public static Objective Kill(string group, string text) => new Objective { Kind = ObjectiveKind.Kill, Group = group, Text = text };
        public static Objective Reach(Vec2 at, float radius, string text) => new Objective { Kind = ObjectiveKind.Reach, At = at, Radius = radius, Text = text };
        public static Objective Interact(Vec2 at, string label, float hold, string text, float radius = 2.6f) => new Objective { Kind = ObjectiveKind.Interact, At = at, Label = label, Hold = hold, Radius = radius, Text = text };
        public static Objective Defend(float seconds, string text) => new Objective { Kind = ObjectiveKind.Defend, Time = seconds, Text = text };
        public static Objective Any(string text, params Objective[] parts) => new Objective { Kind = ObjectiveKind.Any, Text = text, Parts = parts.ToList() };
        public static Objective Custom(string text, Func<MissionRunner, IMissionWorld, bool> check) => new Objective { Kind = ObjectiveKind.Custom, Text = text, Check = check };
        /// <summary>Get farther than <paramref name="radius"/> from a point (web: 'Get clear of the blast (30 m)').</summary>
        public static Objective Leave(Vec2 from, float radius, string text) =>
            new Objective { Kind = ObjectiveKind.Custom, Text = text, At = from, Radius = radius, Check = (m, w) => Vec2.Distance(w.PlayerPosition, from) > radius };
        public Objective With(string radio = null, Action<MissionRunner> onStart = null, Action<MissionRunner> onDone = null, Action<MissionRunner, float> onTick = null)
        { if (radio != null) Radio = radio; if (onStart != null) OnStart = onStart; if (onDone != null) OnDone = onDone; if (onTick != null) OnTick = onTick; return this; }
    }

    /// <summary>What the engine tells the mission each frame.</summary>
    public interface IMissionWorld
    {
        Vec2 PlayerPosition { get; }
        bool InteractHeld { get; }          // the interact key is held this frame
        int Alive(string group);            // living enemies in a group
    }

    /// <summary>Runs a list of objectives in order (web: Missions.update / advance / partDone / objText).
    /// Engine-free: the Unity GameDirector feeds it an IMissionWorld each frame.</summary>
    public sealed class MissionRunner
    {
        public readonly string Code, Name;
        public readonly IReadOnlyList<Objective> Objectives;
        public readonly MissionStats Stats = new MissionStats();
        public int Index { get; private set; }
        public bool Complete => Index >= Objectives.Count;
        public Objective Current => Complete ? null : Objectives[Index];
        public float HoldProgress { get; private set; }     // 0..1 while holding an interact
        public float DefendLeft { get; private set; }
        public Objective HoldTarget { get; private set; }
        public event Action<Objective> ObjectiveCompleted, PartCompleted;
        public event Action AlarmRaised;
        /// <summary>Someone called for reinforcements. Counts once per mission, like the web game (missions.js event('alarm'):
        /// flags.alarm → stats.alarms++ only the first time).</summary>
        public bool Alarmed { get; private set; }

        /// <summary>Returns true (and counts it) only for the first alarm of the mission.</summary>
        public bool RaiseAlarm()
        {
            if (Alarmed || Complete) return false;
            Alarmed = true; Stats.Alarms++;
            AlarmRaised?.Invoke();
            return true;
        }
        public event Action MissionCompleted;
        /// <summary>A radio line to show (objective radio, hooks).</summary>
        public event Action<string> RadioSaid;
        /// <summary>A hook asks the engine to send in the first <c>count</c> soldiers of a named wave (web: wave(list, group)).</summary>
        public event Action<string, int> WaveRequested;
        /// <summary>A scripted event for the engine (e.g. "detonate" — the relay mast blows).</summary>
        public event Action<string> EventRaised;
        /// <summary>Mission flags hooks set (web: M.flags), e.g. "powerCut".</summary>
        public readonly HashSet<string> Flags = new HashSet<string>();
        /// <summary>The world as of the last Tick (hooks read it, like the web hooks read G).</summary>
        public IMissionWorld World { get; private set; }

        public void Say(string line) { if (!string.IsNullOrEmpty(line)) RadioSaid?.Invoke(line); }
        public void SendWave(string wave, int count) => WaveRequested?.Invoke(wave, count);
        public void Raise(string evt) => EventRaised?.Invoke(evt);

        public MissionRunner(string code, string name, params Objective[] objectives)
        {
            Code = code; Name = name; Objectives = objectives;
            if (Current?.Kind == ObjectiveKind.Defend) DefendLeft = Current.Time;   // the timer reads right before the first tick
        }

        bool _begun;
        /// <summary>Starts the first objective (its start hook and radio). Called by the first Tick; call it earlier once the
        /// engine has subscribed to the events if the first objective sends something.</summary>
        public void Begin(IMissionWorld w = null)
        {
            if (_begun) return;
            _begun = true; if (w != null) World = w;
            Start();
        }

        void Start()
        {
            var o = Current; if (o == null) return;
            if (o.Kind == ObjectiveKind.Defend) DefendLeft = o.Time;
            o.OnStart?.Invoke(this);
            Say(o.Radio);
        }

        public void Tick(float dt, IMissionWorld w)
        {
            World = w;
            if (!_begun) Begin(w);
            if (Complete) return;
            Stats.Time += dt;
            var o = Current;
            HoldTarget = null;
            o.OnTick?.Invoke(this, dt);
            switch (o.Kind)
            {
                case ObjectiveKind.Any:
                    foreach (var p in o.Parts) if (!p.Done && Check(p, dt, w)) { p.Done = true; HoldProgress = 0; p.OnDone?.Invoke(this); PartCompleted?.Invoke(p); }
                    if (o.Parts.All(p => p.Done)) Advance();
                    break;
                case ObjectiveKind.Defend:
                    DefendLeft -= dt;
                    if (DefendLeft <= 0) Advance();
                    break;
                default:
                    if (Check(o, dt, w)) Advance();
                    break;
            }
            if (HoldTarget == null) HoldProgress = 0;
        }

        bool Check(Objective o, float dt, IMissionWorld w)
        {
            switch (o.Kind)
            {
                case ObjectiveKind.Kill: return w.Alive(o.Group) == 0;
                case ObjectiveKind.Reach: return Vec2.Distance(w.PlayerPosition, o.At) < o.Radius;
                case ObjectiveKind.Custom: return o.Check != null && o.Check(this, w);
                case ObjectiveKind.Interact:
                    if (Vec2.Distance(w.PlayerPosition, o.At) > o.Radius) return false;
                    HoldTarget = o;
                    if (!w.InteractHeld) { HoldProgress = 0; return false; }   // letting go starts the hold over (web: interact hold)
                    HoldProgress += dt / Math.Max(0.01f, o.Hold);
                    return HoldProgress >= 1f;
                default: return false;
            }
        }

        void Advance()
        {
            var done = Current; done.Done = true; HoldProgress = 0;
            done.OnDone?.Invoke(this);   // web advance(): prev.done(this) first
            Index++;
            ObjectiveCompleted?.Invoke(done);
            if (Complete) MissionCompleted?.Invoke(); else Start();
        }

        /// <summary>HUD line for the current objective (web: objText): "Clear the compound — 3 left", any-order checklists, defend timer.</summary>
        public string ObjectiveText(IMissionWorld w)
        {
            var o = Current;
            if (o == null) return "MISSION COMPLETE";
            switch (o.Kind)
            {
                case ObjectiveKind.Any:
                    return o.Text + ": " + string.Join("   ", o.Parts.Select(p => (p.Done ? "✓ " : "○ ") + (p.Kind == ObjectiveKind.Kill && !p.Done ? $"{p.Text} ({w.Alive(p.Group)})" : p.Text)));
                case ObjectiveKind.Kill: return $"{o.Text} — {w.Alive(o.Group)} left";
                case ObjectiveKind.Defend: return $"{o.Text} — {Math.Max(0, (int)Math.Ceiling(DefendLeft)) / 60}:{Math.Max(0, (int)Math.Ceiling(DefendLeft)) % 60:00}";
                default: return o.Text;
            }
        }
    }
}

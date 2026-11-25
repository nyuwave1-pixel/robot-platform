using System.Collections.Generic;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.UIElements;

namespace SpecialSoldier
{
    /// <summary>The slice HUD in UI Toolkit (replaces the IMGUI <see cref="Hud"/>): compass with objective bearing, rotating minimap
    /// (70 m, enemies that fired in the last 2.5 s, objective pinned to the rim), awareness meter, objective line, kill feed, vitals,
    /// ammo and weapon slots, dynamic crosshair, hit marker, damage-direction arcs, grenade warning, hold-[E] prompt, world waypoint,
    /// weather label, lightning flash and the graded result screen. Layout in Assets/UI/SliceHud.uss; maths in Core.HudMath (tested).</summary>
    [RequireComponent(typeof(UIDocument))]
    public sealed class HudToolkit : MonoBehaviour
    {
        public PlayerMotor player;
        public WeaponController weapon;
        public StyleSheet style;
        public string callsign = "NOMAD";

        static readonly Color Yellow = new Color(1f, 0.82f, 0.23f), Red = new Color(1f, 0.23f, 0.19f), Green = new Color(0.31f, 0.9f, 0.47f), Ink = new Color(0.94f, 0.96f, 0.94f);

        readonly DamageIndicators _hits = new DamageIndicators();
        readonly KillFeed _feed = new KillFeed();
        VisualElement _root, _compass, _minimap, _overlay, _hitmarker, _awareFill, _awareBox, _hpFill, _arFill, _vitals, _promptFill, _prompt, _reload, _reloadFill, _waypoint, _flash, _result, _feedBox, _slots;
        Label _heading, _awareLabel, _objective, _counters, _weather, _miniInfo, _hp, _ar, _mag, _reserve, _wname, _wmode, _nades, _promptText, _nade, _wpDist, _click, _resTitle, _resGrade, _resLine1, _resLine2, _miniN;
        readonly Label[] _cardinals = new Label[8];
        readonly VisualElement[] _arms = new VisualElement[4];
        Damageable _playerHp;
        GameDirector _dir;
        float _textT, _heading0;
        bool _hasMarker; Vector3 _marker;

        void OnEnable()
        {
            var doc = GetComponent<UIDocument>();
            _root = doc.rootVisualElement;
            if (_root == null) return;
            _root.Clear();
            if (style) _root.styleSheets.Add(style);
            Build();
        }

        void Start()
        {
            _dir = GameDirector.Instance;
            if (!player && _dir) player = _dir.player;
            if (!weapon && player) weapon = player.GetComponentInChildren<WeaponController>();
            _playerHp = player ? player.GetComponent<Damageable>() : null;
            if (_playerHp) _playerHp.Hit += (dmg, from) => _hits.Add(HudMath.Bearing(V(player.transform.position), V(from)));
            if (_dir) _dir.EnemyKilled += (e, head) => _feed.Add(callsign, e.Type.Name, head);
        }

        static Vec2 V(Vector3 v) => new Vec2(v.x, v.z);
        static VisualElement E(VisualElement parent, string cls) { var e = new VisualElement(); if (cls != null) foreach (var c in cls.Split(' ')) e.AddToClassList(c); e.pickingMode = PickingMode.Ignore; parent.Add(e); return e; }
        static Label T(VisualElement parent, string cls, string text = "") { var l = new Label(text); l.AddToClassList("hud-text"); if (cls != null) foreach (var c in cls.Split(' ')) l.AddToClassList(c); l.pickingMode = PickingMode.Ignore; parent.Add(l); return l; }

        void Build()
        {
            var r = E(_root, "hud-root");

            _overlay = E(r, "overlay"); _overlay.generateVisualContent += DrawOverlay;
            for (int i = 0; i < 4; i++) _arms[i] = E(r, "arm");
            _hitmarker = E(r, "hitmarker"); _hitmarker.generateVisualContent += DrawHitmarker;

            _compass = E(r, "compass"); _compass.generateVisualContent += DrawCompass;
            for (int i = 0; i < 8; i++) _cardinals[i] = T(_compass, "compass-label" + (i == 0 ? " compass-north" : ""), new[] { "N", "NE", "E", "SE", "S", "SW", "W", "NW" }[i]);
            _heading = T(r, "heading");

            var tl = E(r, "top-left");
            _awareBox = E(tl, null); _awareLabel = T(_awareBox, "hud-small", "HIDDEN"); var ab = E(_awareBox, "aware-bar"); _awareFill = E(ab, "aware-fill");
            T(tl, "objective-title", "OBJECTIVE"); _objective = T(tl, "objective");
            _counters = T(tl, "hud-small hud-dim");

            var tr = E(r, "top-right");
            _weather = T(tr, "hud-small hud-dim");
            _minimap = E(tr, "minimap"); _minimap.generateVisualContent += DrawMinimap;
            _miniN = T(_minimap, "compass-label compass-north", "N");
            _miniInfo = T(tr, "minimap-info hud-dim");
            _feedBox = E(tr, null);

            _vitals = E(r, "vitals");
            _nades = T(_vitals, "hud-small hud-dim");
            var hpRow = E(_vitals, null); _hp = T(hpRow, "hud-small"); var hb = E(hpRow, "bar"); _hpFill = E(hb, "bar-fill hp-fill");
            var arRow = E(_vitals, null); _ar = T(arRow, "hud-small"); var arb = E(arRow, "bar"); _arFill = E(arb, "bar-fill ar-fill");

            var w = E(r, "weapon");
            var ammo = E(w, "ammo"); _mag = T(ammo, "mag"); _reserve = T(ammo, "hud-dim");
            _wname = T(w, null); _wmode = T(w, "hud-small hud-dim"); _slots = E(w, "slots");

            _reload = E(r, "reload"); _reloadFill = E(_reload, "reload-fill");
            _prompt = E(r, "prompt"); _promptText = T(_prompt, null); var pb = E(_prompt, "prompt-bar"); _promptFill = E(pb, "prompt-fill");
            _nade = T(r, "nade");
            _waypoint = E(r, "waypoint"); var dia = E(_waypoint, null); dia.style.width = 14; dia.style.height = 14; dia.style.backgroundColor = Yellow; dia.style.rotate = new Rotate(Angle.Degrees(45f)); _wpDist = T(_waypoint, "waypoint-dist");

            _flash = E(r, "flash");
            _click = T(r, "click", "CLICK TO PLAY");
            _result = E(r, "result");
            _resTitle = T(_result, "result-title"); _resGrade = T(_result, "result-grade"); _resLine1 = T(_result, null); _resLine2 = T(_result, null); T(_result, "hud-small hud-dim", "press R to restart");
        }

        void Update()
        {
            if (_root == null || !player) return;
            float dt = Time.deltaTime;
            _hits.Tick(dt); _feed.Tick(dt);
            if (!_dir) _dir = GameDirector.Instance;
            var cam = Camera.main;
            var f = cam ? cam.transform.forward : player.transform.forward;
            _heading0 = HudMath.Heading(f.x, f.z);
            _hasMarker = TryMarker(out _marker);

            CrosshairAndCentre();
            Waypoint(cam);
            _compass.MarkDirtyRepaint(); _minimap.MarkDirtyRepaint(); _overlay.MarkDirtyRepaint(); _hitmarker.MarkDirtyRepaint();
            PositionCompassLabels();

            var sky = SkyDirector.Instance;
            _flash.style.display = sky != null && sky.Flash > 0.5f ? DisplayStyle.Flex : DisplayStyle.None;
            bool playing = !_dir || _dir.State == GameDirector.Outcome.Playing;
            _click.style.display = playing && !GameDirector.CursorCaptured ? DisplayStyle.Flex : DisplayStyle.None;

            if ((_textT -= dt) > 0f) return;
            _textT = 0.09f;   // web HUD throttles text updates the same way
            Texts(sky, playing);
        }

        void CrosshairAndCentre()
        {
            float W = _root.resolvedStyle.width, H = _root.resolvedStyle.height;
            bool show = weapon && weapon.Current != null && !(weapon.Aiming && weapon.Current.Stats.AdsSpread < 0.5f);
            float spread = weapon && weapon.Current != null ? (weapon.Aiming ? weapon.Current.Stats.AdsSpread : weapon.Current.Stats.Spread) + weapon.Bloom : 0f;
            float gap = HudMath.CrosshairGap(spread), len = 9f, th = 2f;
            var rects = new[] { new Rect(W / 2 - th / 2, H / 2 - gap - len, th, len), new Rect(W / 2 - th / 2, H / 2 + gap, th, len), new Rect(W / 2 - gap - len, H / 2 - th / 2, len, th), new Rect(W / 2 + gap, H / 2 - th / 2, len, th) };
            for (int i = 0; i < 4; i++)
            {
                var a = _arms[i]; a.style.display = show ? DisplayStyle.Flex : DisplayStyle.None;
                a.style.left = rects[i].x; a.style.top = rects[i].y; a.style.width = rects[i].width; a.style.height = rects[i].height;
            }
            _hitmarker.style.opacity = weapon && weapon.HitMarkerTime > 0f ? 1f : 0f;

            var cur = weapon ? weapon.Current : null;
            bool reloading = cur != null && cur.Reloading;
            _reload.style.display = reloading ? DisplayStyle.Flex : DisplayStyle.None;
            if (reloading) _reloadFill.style.width = Length.Percent(cur.ReloadProgress * 100f);

            var m = _dir ? _dir.Mission : null;
            bool hold = m != null && m.HoldTarget != null && (!_dir || _dir.State == GameDirector.Outcome.Playing);
            _prompt.style.display = hold ? DisplayStyle.Flex : DisplayStyle.None;
            if (hold) { _promptText.text = $"HOLD [E] — {m.HoldTarget.Label}"; _promptFill.style.width = Length.Percent(m.HoldProgress * 100f); }

            Grenade near = null; float nd = 11f;   // web nadeWarn: nearest live enemy frag within 11 m
            foreach (var g in Grenade.Live) if (g && !g.thrownByPlayer) { float d = Vector3.Distance(g.transform.position, player.transform.position); if (d < nd) { nd = d; near = g; } }
            _nade.style.display = near ? DisplayStyle.Flex : DisplayStyle.None;
            if (near) { _nade.text = $"GRENADE!  {nd:0} m  {near.FuseLeft:0.0}s"; _nade.style.color = nd < near.radius ? Red : Yellow; }
        }

        void Waypoint(Camera cam)
        {
            if (!_hasMarker || !cam || _root.panel == null || (_dir && _dir.State != GameDirector.Outcome.Playing)) { _waypoint.style.display = DisplayStyle.None; return; }
            Vector3 world = _marker + Vector3.up * 2.2f;
            Vector3 vp = cam.WorldToViewportPoint(world);
            Vector2 p = RuntimePanelUtils.CameraTransformWorldToPanel(_root.panel, world, cam);
            float W = _root.resolvedStyle.width, H = _root.resolvedStyle.height;
            if (vp.z < 0f) { p.x = W - p.x; p.y = H - 160f; }   // behind you: show it at the bottom edge on the correct side
            p.x = Mathf.Clamp(p.x, 40f, W - 40f); p.y = Mathf.Clamp(p.y, 70f, H - 170f);
            _waypoint.style.display = DisplayStyle.Flex; _waypoint.style.left = p.x; _waypoint.style.top = p.y;
            _wpDist.text = HudMath.Distance(Vector2.Distance(new Vector2(player.transform.position.x, player.transform.position.z), new Vector2(_marker.x, _marker.z)));
        }

        void PositionCompassLabels()
        {
            float w = _compass.resolvedStyle.width;
            for (int i = 0; i < 8; i++)
            {
                float? x = HudMath.CompassX(_heading0, i * 45f);
                _cardinals[i].style.display = x.HasValue ? DisplayStyle.Flex : DisplayStyle.None;
                if (x.HasValue) _cardinals[i].style.left = w / 2f + x.Value * w / 2f;
            }
            float R = 88f, a = -_heading0 * Mathf.Deg2Rad;
            _miniN.style.left = R + Mathf.Sin(a) * (R - 12f); _miniN.style.top = R - Mathf.Cos(a) * (R - 12f) - 10f;
        }

        void Texts(SkyDirector sky, bool playing)
        {
            _heading.text = $"{HudMath.HeadingText(_heading0)} {HudMath.Cardinal(_heading0)}";
            if (sky != null && sky.Target != null) _weather.text = $"{sky.Target.Label}   [K]";

            int combat = 0, alive = 0; float det = 0f;
            if (_dir) foreach (var e in _dir.enemies) if (e && e.Alive && e.Brain != null) { alive++; if (e.Brain.State == AlertState.Combat) combat++; else det = Mathf.Max(det, e.Brain.Detect); }
            var aw = HudMath.Awareness(det, combat);
            _awareLabel.text = aw.label; _awareFill.style.width = Length.Percent(aw.fill * 100f);
            foreach (var c in new[] { "aware-sus", "aware-warn", "aware-combat" }) _awareBox.RemoveFromClassList(c);
            if (aw.cls.Length > 0) _awareBox.AddToClassList("aware-" + aw.cls);

            var m = _dir ? _dir.Mission : null;
            _objective.text = _dir ? _dir.ObjectiveLine : "";
            _counters.text = _dir ? $"HOSTILES {alive}   KILLS {_dir.Kills}   {HudMath.Clock(_dir.ElapsedTime)}" : "";
            _miniInfo.text = $"{HudMath.HeadingText(_heading0)} · ISLAND SLICE";

            _feedBox.Clear();
            foreach (var line in _feed.Lines) T(_feedBox, "feed-line", line);

            if (_playerHp != null && _playerHp.Model != null)
            {
                var hm = _playerHp.Model;
                _hp.text = $"HP {Mathf.CeilToInt(hm.Health)}"; _ar.text = $"AR {Mathf.CeilToInt(hm.Armor)}";
                _hpFill.style.width = Length.Percent(hm.Health / hm.MaxHealth * 100f);
                _arFill.style.width = Length.Percent(hm.MaxArmor > 0 ? hm.Armor / hm.MaxArmor * 100f : 0f);
                _vitals.EnableInClassList("vitals-low", hm.Health < 35f);
            }
            var thrower = weapon ? weapon.GetComponent<GrenadeThrower>() : null;
            _nades.text = thrower ? $"[G] FRAG ×{thrower.grenades}" : "";

            var cur = weapon ? weapon.Current : null;
            if (cur != null)
            {
                _mag.text = cur.Reloading ? "--" : cur.Mag.ToString(); _mag.EnableInClassList("mag-low", cur.Mag <= cur.Stats.Mag * 0.25f);
                _reserve.text = $" / {cur.Reserve}";
                _wname.text = cur.Stats.Name; _wmode.text = $"{cur.Mode.ToString().ToUpper()} · {cur.Stats.Class}{(cur.Reloading ? " · RELOADING" : "")}";
                _slots.Clear();
                for (int i = 0; i < weapon.loadout.Length; i++)
                {
                    var s = T(_slots, "slot", $"{i + 1} {WeaponTable.Get(weapon.loadout[i]).Name.Split(' ')[0]}");
                    s.EnableInClassList("slot-on", weapon.loadout[i] == cur.Stats.Id);
                }
            }

            _result.style.display = playing ? DisplayStyle.None : DisplayStyle.Flex;
            if (!playing && _dir)
            {
                bool won = _dir.State == GameDirector.Outcome.Won;
                _resTitle.text = won ? "MISSION COMPLETE" : "K.I.A.";
                if (won && m != null)
                {
                    var st = m.Stats;
                    _resGrade.text = st.Grade.ToString();
                    _resLine1.text = $"TIME {HudMath.Clock(st.Time)}   KILLS {st.Kills} ({st.Headshots} HS)   ACCURACY {st.AccuracyPercent}%   ALARMS {st.Alarms}";
                    _resLine2.text = $"SCORE {st.Score:0}   PORTAL +{st.PortalRp} RP";
                }
                else { _resGrade.text = ""; _resLine1.text = $"{_dir.Kills} kills in {HudMath.Clock(_dir.ElapsedTime)}"; _resLine2.text = ""; }
            }
        }

        /// <summary>Current objective position (web: Missions.marker): reach/interact point, nearest unfinished part of an any-order
        /// objective, or the nearest living enemy of a kill objective's group.</summary>
        bool TryMarker(out Vector3 pos)
        {
            pos = default;
            var m = _dir ? _dir.Mission : null;
            if (m == null || m.Current == null) return false;
            var parts = m.Current.Kind == ObjectiveKind.Any ? m.Current.Parts : new List<Objective> { m.Current };
            float best = float.MaxValue; bool found = false;
            foreach (var o in parts)
            {
                if (o.Done) continue;
                if (o.Kind == ObjectiveKind.Reach || o.Kind == ObjectiveKind.Interact)
                {
                    var p = new Vector3(o.At.X, 0f, o.At.Z); float d = (p - player.transform.position).sqrMagnitude;
                    if (d < best) { best = d; pos = p; found = true; }
                }
                else if (o.Kind == ObjectiveKind.Kill)
                    foreach (var e in _dir.enemies)
                        if (e && e.Alive && (o.Group == "*" || e.group == o.Group))
                        { float d = (e.transform.position - player.transform.position).sqrMagnitude; if (d < best) { best = d; pos = e.transform.position; found = true; } }
            }
            return found;
        }

        // ---------------- vector drawing ----------------

        void DrawCompass(MeshGenerationContext ctx)
        {
            var p = ctx.painter2D; var r = ctx.visualElement.contentRect; float w = r.width, h = r.height;
            p.strokeColor = new Color(1f, 1f, 1f, 0.55f); p.lineWidth = 2f;
            int start = Mathf.FloorToInt((_heading0 - 90f) / 15f) * 15;
            for (int deg = start; deg <= _heading0 + 90f; deg += 15)
            {
                float? x = HudMath.CompassX(_heading0, deg); if (!x.HasValue) continue;
                float px = w / 2f + x.Value * w / 2f, len = HudMath.Wrap360(deg) % 45f == 0 ? 10f : 5f;
                p.BeginPath(); p.MoveTo(new Vector2(px, 0)); p.LineTo(new Vector2(px, len)); p.Stroke();
            }
            p.strokeColor = Ink; p.BeginPath(); p.MoveTo(new Vector2(w / 2f, h - 8f)); p.LineTo(new Vector2(w / 2f, h)); p.Stroke();
            if (_hasMarker)
            {
                float b = HudMath.Bearing(V(player.transform.position), V(_marker));
                float x = Mathf.Clamp(HudMath.Relative(_heading0, b) / 90f, -1f, 1f), px = w / 2f + x * (w / 2f - 6f);
                p.fillColor = Yellow; p.BeginPath(); p.MoveTo(new Vector2(px, h - 2f)); p.LineTo(new Vector2(px - 6f, h - 12f)); p.LineTo(new Vector2(px + 6f, h - 12f)); p.ClosePath(); p.Fill();
            }
        }

        void DrawMinimap(MeshGenerationContext ctx)
        {
            var p = ctx.painter2D; const float R = 88f; var c = new Vector2(R, R);
            p.fillColor = new Color(0.05f, 0.1f, 0.11f, 0.78f); p.BeginPath(); p.Arc(c, R - 2f, Angle.Degrees(0f), Angle.Degrees(360f)); p.Fill();
            var me = V(player.transform.position);
            if (_dir)
                foreach (var e in _dir.enemies)
                {
                    if (!e || !e.Alive || !HudMath.OnRadar(float.PositiveInfinity, Time.time - e.LastFireTime)) continue;
                    var q = HudMath.MinimapPoint(me, _heading0, V(e.transform.position), out bool outside);
                    if (outside) continue;
                    p.fillColor = Red; p.BeginPath(); p.Arc(c + new Vector2(q.x, q.y) * (R - 2f), 3f, Angle.Degrees(0f), Angle.Degrees(360f)); p.Fill();
                }
            if (_hasMarker)
            {
                var q = HudMath.MinimapPoint(me, _heading0, V(_marker), out _, clampToRim: true);
                var m = c + new Vector2(q.x, q.y) * R;
                p.fillColor = Yellow; p.BeginPath(); p.MoveTo(m + new Vector2(0, -6)); p.LineTo(m + new Vector2(5, 0)); p.LineTo(m + new Vector2(0, 6)); p.LineTo(m + new Vector2(-5, 0)); p.ClosePath(); p.Fill();
            }
            p.fillColor = Color.white; p.BeginPath(); p.MoveTo(c + new Vector2(0, -7)); p.LineTo(c + new Vector2(5, 5)); p.LineTo(c + new Vector2(0, 2)); p.LineTo(c + new Vector2(-5, 5)); p.ClosePath(); p.Fill();
            p.strokeColor = new Color(0.7f, 0.78f, 0.75f, 0.5f); p.lineWidth = 2f; p.BeginPath(); p.Arc(c, R - 2f, Angle.Degrees(0f), Angle.Degrees(360f)); p.Stroke();
        }

        void DrawOverlay(MeshGenerationContext ctx)
        {
            var p = ctx.painter2D; var r = ctx.visualElement.contentRect; var c = new Vector2(r.width / 2f, r.height / 2f);
            p.lineWidth = 6f; p.lineCap = LineCap.Round;
            foreach (var arc in _hits.Relative(_heading0))
            {
                // Painter2D angles: 0 = +x (right), clockwise in screen space; compass 0 (ahead) is straight up (−90)
                float mid = arc.Bearing - 90f;
                p.strokeColor = new Color(1f, 0.2f, 0.15f, 0.85f * arc.Alpha);
                p.BeginPath(); p.Arc(c, 86f, Angle.Degrees(mid - 16f), Angle.Degrees(mid + 16f)); p.Stroke();
            }
        }

        void DrawHitmarker(MeshGenerationContext ctx)
        {
            var p = ctx.painter2D; var r = ctx.visualElement.contentRect; var c = new Vector2(r.width / 2f, r.height / 2f);
            bool kill = weapon && weapon.LastHitWasKill, head = weapon && weapon.LastHitWasHead;
            p.strokeColor = kill ? Red : head ? Yellow : Ink; p.lineWidth = kill ? 3f : 2f;
            foreach (var d in new[] { new Vector2(1, 1), new Vector2(1, -1), new Vector2(-1, 1), new Vector2(-1, -1) })
            { p.BeginPath(); p.MoveTo(c + d * 5f); p.LineTo(c + d * 12f); p.Stroke(); }
        }
    }
}

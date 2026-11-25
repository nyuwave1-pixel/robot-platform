using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Minimal immediate-mode HUD (no UI assets needed): health/armour, ammo, fire mode, reload bar,
    /// dynamic crosshair, hit marker, enemy alert level and the end screen. A UI Toolkit HUD is the next learning step.</summary>
    public sealed class Hud : MonoBehaviour
    {
        public PlayerMotor player;
        public WeaponController weapon;
        GUIStyle _big, _small, _center;
        Texture2D _white;

        void Ensure()
        {
            if (_white) return;
            _white = Texture2D.whiteTexture;
            _small = new GUIStyle(GUI.skin.label) { fontSize = 16, fontStyle = FontStyle.Bold };
            _big = new GUIStyle(_small) { fontSize = 30 };
            _center = new GUIStyle(_big) { alignment = TextAnchor.MiddleCenter, fontSize = 40 };
        }

        void Bar(float x, float y, float w, float h, float t, Color c)
        {
            GUI.color = new Color(0f, 0f, 0f, 0.5f); GUI.DrawTexture(new Rect(x, y, w, h), _white);
            GUI.color = c; GUI.DrawTexture(new Rect(x, y, w * Mathf.Clamp01(t), h), _white); GUI.color = Color.white;
        }

        void OnGUI()
        {
            Ensure();
            float W = Screen.width, H = Screen.height;
            var hp = player ? player.GetComponent<Damageable>() : null;
            if (hp && hp.Model != null)
            {
                Bar(24, H - 60, 260, 14, hp.Model.Health / hp.Model.MaxHealth, new Color(0.9f, 0.25f, 0.2f));
                Bar(24, H - 40, 260, 8, hp.Model.MaxArmor > 0 ? hp.Model.Armor / hp.Model.MaxArmor : 0, new Color(0.35f, 0.65f, 1f));
                GUI.Label(new Rect(24, H - 90, 300, 30), $"HP {hp.Model.Health:0}   AR {hp.Model.Armor:0}", _small);
            }
            if (weapon && weapon.Current != null)
            {
                var w = weapon.Current;
                GUI.Label(new Rect(W - 300, H - 96, 280, 40), $"{w.Mag} / {w.Reserve}", _big);
                GUI.Label(new Rect(W - 300, H - 56, 280, 30), $"{w.Stats.Name}  [{w.Mode.ToString().ToUpper()}]", _small);
                if (w.Reloading) Bar(W / 2 - 60, H / 2 + 40, 120, 6, w.ReloadProgress, Color.white);

                // crosshair gap grows with spread + bloom
                float spread = (weapon.Aiming ? w.Stats.AdsSpread : w.Stats.Spread) + weapon.Bloom;
                float gap = 6f + spread * 6f, len = 8f;
                if (!weapon.Aiming || spread > 0.5f)
                {
                    GUI.DrawTexture(new Rect(W / 2 - gap - len, H / 2 - 1, len, 2), _white);
                    GUI.DrawTexture(new Rect(W / 2 + gap, H / 2 - 1, len, 2), _white);
                    GUI.DrawTexture(new Rect(W / 2 - 1, H / 2 - gap - len, 2, len), _white);
                    GUI.DrawTexture(new Rect(W / 2 - 1, H / 2 + gap, 2, len), _white);
                }
                else GUI.DrawTexture(new Rect(W / 2 - 2, H / 2 - 2, 4, 4), _white);
                if (weapon.HitMarkerTime > 0)
                {
                    GUI.color = weapon.LastHitWasKill ? new Color(1f, 0.3f, 0.2f) : Color.white;
                    GUI.Label(new Rect(W / 2 - 20, H / 2 - 20, 40, 40), "X", _center);
                    GUI.color = Color.white;
                }
            }

            var thrower = weapon ? weapon.GetComponent<GrenadeThrower>() : null;
            if (thrower) GUI.Label(new Rect(W - 300, H - 126, 280, 30), $"GRENADES {thrower.grenades}  [G]", _small);
            if (player)
            {
                // danger indicator (web v0.18): an enemy grenade about to go off near you
                foreach (var g in Grenade.Live)
                    if (g && !g.thrownByPlayer && Vector3.Distance(g.transform.position, player.transform.position) < g.radius + 3f)
                    {
                        GUI.color = new Color(1f, 0.25f, 0.2f);
                        GUI.Label(new Rect(0, H * 0.28f, W, 50), $"GRENADE!  {g.FuseLeft:0.0}", _center);
                        GUI.color = Color.white; break;
                    }
            }

            var dir = GameDirector.Instance;
            if (!dir) return;
            int alive = 0; AlertState worst = AlertState.Patrol;
            foreach (var e in dir.enemies) if (e && e.Alive) { alive++; if (e.Brain != null && e.Brain.State > worst) worst = e.Brain.State; }
            GUI.Label(new Rect(24, 20, 400, 30), $"HOSTILES {alive}   KILLS {dir.Kills}   {dir.ElapsedTime:0.0}s", _small);
            GUI.color = worst >= AlertState.Combat ? new Color(1f, 0.3f, 0.25f) : worst >= AlertState.Search ? new Color(1f, 0.7f, 0.2f) : new Color(0.6f, 1f, 0.6f);
            GUI.Label(new Rect(24, 44, 400, 30), worst.ToString().ToUpper(), _small);
            GUI.color = Color.white;
            var m = dir.Mission;
            if (m != null && dir.State == GameDirector.Outcome.Playing)
            {
                GUI.Label(new Rect(24, 72, W - 48, 30), "▶ " + dir.ObjectiveLine, _small);
                if (m.HoldTarget != null)
                {
                    GUI.Label(new Rect(0, H / 2 + 60, W, 30), $"HOLD [E]  {m.HoldTarget.Label}", new GUIStyle(_small) { alignment = TextAnchor.MiddleCenter });
                    Bar(W / 2 - 90, H / 2 + 92, 180, 6, m.HoldProgress, new Color(0.3f, 0.9f, 0.5f));
                }
            }

            if (dir.State != GameDirector.Outcome.Playing)
            {
                GUI.color = new Color(0f, 0f, 0f, 0.6f); GUI.DrawTexture(new Rect(0, 0, W, H), _white); GUI.color = Color.white;
                bool won = dir.State == GameDirector.Outcome.Won;
                GUI.Label(new Rect(0, H / 2 - 110, W, 60), won ? "MISSION COMPLETE" : "K.I.A.", _center);
                var mid = new GUIStyle(_small) { alignment = TextAnchor.MiddleCenter };
                if (won && m != null)
                {
                    var st = m.Stats;
                    GUI.Label(new Rect(0, H / 2 - 50, W, 60), $"GRADE  {st.Grade}", _center);
                    GUI.Label(new Rect(0, H / 2 + 10, W, 30), $"TIME {st.Time:0}s   KILLS {st.Kills} ({st.Headshots} HS)   ACCURACY {st.AccuracyPercent}%   ALARMS {st.Alarms}", mid);
                    GUI.Label(new Rect(0, H / 2 + 36, W, 30), $"SCORE {st.Score:0}   PORTAL +{st.PortalRp} RP", mid);
                }
                GUI.Label(new Rect(0, H / 2 + 70, W, 40), $"{dir.Kills} kills in {dir.ElapsedTime:0.0}s  —  press R to restart", mid);
            }
            else if (Cursor.lockState != CursorLockMode.Locked)
                GUI.Label(new Rect(0, H / 2 + 80, W, 40), "CLICK TO PLAY", new GUIStyle(_big) { alignment = TextAnchor.MiddleCenter });
        }
    }
}

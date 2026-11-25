using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>Plays the real Island Slice scene with simulated keyboard/mouse (Input System test devices):
    /// scene boots, WASD moves the player, the gun damages an enemy, and the win / lose rules fire.</summary>
    public sealed class SliceSmokeTests : InputTestFixture
    {
        const string ScenePath = "Assets/Scenes/IslandSlice.unity";
        Keyboard _kb;
        Mouse _mouse;

        public override void Setup()
        {
            base.Setup();
            _kb = InputSystem.AddDevice<Keyboard>();
            _mouse = InputSystem.AddDevice<Mouse>();
            SliceFx.Shots = SliceFx.Steps = SliceFx.Impacts = 0;
        }

        public override void TearDown() { GameDirector.AssumeCursorCaptured = false; base.TearDown(); }

        static IEnumerator LoadSlice()
        {
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("IslandSlice");
#endif
            yield return null; yield return null;   // Awake/Start of every object
            Assert.NotNull(GameDirector.Instance, "GameDirector missing from the scene");
        }

        static IEnumerator Wait(float seconds) { for (float t = 0; t < seconds; t += Time.deltaTime) yield return null; }

        static void MakeInvulnerable(PlayerMotor p) => p.GetComponent<Damageable>().Configure(1e9f, 0f, 0.5f);

        [UnityTest]
        public IEnumerator SceneBoots_SevenEnemiesOnNavMesh_PlayerAlive()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance;
            Assert.AreEqual(7, d.enemies.Count, "enemy count");
            Assert.NotNull(d.player, "player");
            Assert.IsTrue(d.player.GetComponent<Damageable>().Alive);
            Assert.AreEqual(GameDirector.Outcome.Playing, d.State);
            foreach (var e in d.enemies) Assert.IsTrue(e.GetComponent<NavMeshAgent>().isOnNavMesh, $"{e.name} is not on the navmesh");
        }

        [UnityTest]
        public IEnumerator HoldingW_MovesPlayerForward()
        {
            yield return LoadSlice();
            var p = GameDirector.Instance.player; MakeInvulnerable(p);
            Vector3 start = p.transform.position, fwd = p.transform.forward;
            Press(_kb.wKey);
            yield return Wait(1f);
            Release(_kb.wKey);
            Assert.Greater(SliceFx.Steps, 0, "no footstep sound while walking");
            float moved = Vector3.Dot(p.transform.position - start, fwd);
            Assert.Greater(moved, 1.5f, $"moved {moved:F2} m in 1 s (walk speed 4.2 m/s)");
        }

        [UnityTest]
        public IEnumerator LeftMouse_ShootsAndDamagesAnEnemy()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance; var p = d.player; MakeInvulnerable(p);
            // stand 5 m from the first enemy we can see, facing it (pitch 0: the eye ray passes through the head sphere)
            EnemyAgent target = null; Vector3 spot = default;
            foreach (var e in d.enemies)
            {
                for (int k = 0; k < 8 && !target; k++)
                {
                    float a = k * Mathf.PI / 4f;
                    var s = e.transform.position + new Vector3(Mathf.Cos(a), 0f, Mathf.Sin(a)) * 5f;
                    var eye = s + Vector3.up * 1.65f; var aim = e.transform.position + Vector3.up * 1.65f;
                    if (Physics.Raycast(eye, aim - eye, out var hit, 10f) && hit.collider.GetComponentInParent<EnemyAgent>() == e && !Physics.CheckSphere(s + Vector3.up * 0.9f, 0.4f, ~0, QueryTriggerInteraction.Ignore))
                    { target = e; spot = s; }
                }
                if (target) break;
            }
            Assert.NotNull(target, "no enemy with a clear 5 m line of sight");
            var cc = p.GetComponent<CharacterController>(); cc.enabled = false;
            p.transform.position = spot;
            var flat = target.transform.position - spot; flat.y = 0f; p.transform.rotation = Quaternion.LookRotation(flat);
            cc.enabled = true;
            GameDirector.AssumeCursorCaptured = true;   // the gun only fires while the cursor is captured; batch mode cannot lock it
            // this test checks the gun, not the AI: freeze the target so the shot noise does not make it duck behind cover (model sinks 0.55 m)
            target.enabled = false; var agent = target.GetComponent<NavMeshAgent>(); if (agent.isOnNavMesh) agent.isStopped = true;
            var hp = target.GetComponent<Damageable>(); float before = hp.Model.Health;
            yield return null;
            Press(_mouse.leftButton);
            yield return Wait(0.6f);
            Release(_mouse.leftButton);
            yield return null;
            Assert.Less(hp.Model.Health, before, $"enemy {target.name} took no damage ");
            Assert.Greater(SliceFx.Shots, 0, "no gunshot sound"); Assert.Greater(SliceFx.Impacts, 0, "no impact effect");
        }

        static void Teleport(PlayerMotor p, Vector3 pos)
        {
            var cc = p.GetComponent<CharacterController>(); cc.enabled = false; p.transform.position = pos; cc.enabled = true;
        }

        [UnityTest]
        public IEnumerator MissionFlow_ClearCompound_DownloadIntel_Extract_WinsWithGrade()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance; MakeInvulnerable(d.player); GameDirector.AssumeCursorCaptured = true;
            Assert.AreEqual(GameDirector.MissionMode.IslandSlice, d.missionMode, "slice should run the compound mission");
            foreach (var e in d.enemies) e.GetComponent<Damageable>().ApplyDamage(1e6f, Vector3.zero);
            yield return null;
            Assert.AreEqual(7, d.Kills);
            Assert.AreEqual(GameDirector.Outcome.Playing, d.State, "killing everyone is not enough: intel + extraction remain");

            Teleport(d.player, d.intelTerminal.position + new Vector3(0f, 0f, -1.4f));
            Press(_kb.eKey);
            yield return Wait(3.4f);
            Release(_kb.eKey);
            yield return null;
            Assert.AreEqual(1, d.Mission.Index, "holding E for 3 s at the terminal finishes 'Take the compound'");

            Teleport(d.player, d.extraction.position);
            yield return null; yield return null;
            Assert.AreEqual(GameDirector.Outcome.Won, d.State);
            Assert.That("SABC".IndexOf(d.Mission.Stats.Grade) >= 0);
            StringAssert.Contains("special-soldier-unity SLICE 01", PortalBridge.LastReport);
        }

        [UnityTest]
        public IEnumerator Opening_EnemiesHesitateBeforeFiring()
        {
            yield return LoadSlice();
            var hp = GameDirector.Instance.player.GetComponent<Damageable>();
            float max = hp.Model.Health;
            yield return Wait(0.3f);   // the fastest possible reaction (ELITE on VETERAN) is 0.5 × 0.65 × 0.7 ≈ 0.23 s after it spots you
            Assert.AreEqual(max, hp.Model.Health, 1e-3, "took fire in the first 0.3 s");
            yield return Wait(5.7f);
            Debug.Log($"[Balance] standing still at spawn on {GameDirector.CurrentDifficulty.Label}: HP {hp.Model.Health:F0}/{max:F0} after 6 s");
        }

        [UnityTest]
        public IEnumerator Combat_SentriesTakeCover_EliteFlanks()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance; var p = d.player; MakeInvulnerable(p);
            // a 1-damage shot "from the player" puts every enemy into COMBAT with the player as last known position
            foreach (var e in d.enemies) e.GetComponent<Damageable>().ApplyDamage(1f, p.Eye);
            bool sentryInCover = false, eliteOffLine = false;
            for (float t = 0; t < 8f && !(sentryInCover && eliteOffLine); t += Time.deltaTime)
            {
                foreach (var e in d.enemies)
                {
                    if (!e.Alive) continue;
                    if (e.typeId == "guard" && e.InCover) sentryInCover = true;
                    if (e.typeId == "elite" && e.Goal.HasValue)
                    {
                        // flanking goal sits clearly to the side of the straight enemy → player line
                        Vector3 a = e.transform.position, b = p.transform.position, g = e.Goal.Value;
                        Vector3 line = b - a; line.y = 0f; Vector3 off = g - a; off.y = 0f;
                        if (line.sqrMagnitude > 1f && Vector3.Cross(line.normalized, off).magnitude > 3f) eliteOffLine = true;
                    }
                }
                yield return null;
            }
            Assert.IsTrue(sentryInCover, "no SENTRY reached cover within 8 s of combat");
            Assert.IsTrue(eliteOffLine, "the ELITE never picked a goal off the straight line to the player (no flank)");
        }

        [UnityTest]
        public IEnumerator Grenade_DroppedNextToEnemy_DamagesIt()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance; MakeInvulnerable(d.player);
            var e = d.enemies[0]; var hp = e.GetComponent<Damageable>(); float before = hp.Model.Health;
            Grenade.Throw(e.transform.position + e.transform.right * 1.5f + Vector3.up * 0.5f, Vector3.zero, true, 0.5f);
            yield return Wait(1.5f);
            Assert.Less(hp.Model.Health, before, "a grenade 1.5 m away did no damage");
        }

        [UnityTest]
        public IEnumerator PlayerDeath_Loses()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance;
            d.player.GetComponent<Damageable>().ApplyDamage(1e6f, Vector3.zero);
            yield return null;
            Assert.AreEqual(GameDirector.Outcome.Lost, d.State);
        }
    }
}

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
            var hp = target.GetComponent<Damageable>(); float before = hp.Model.Health;
            yield return null;
            Press(_mouse.leftButton);
            yield return Wait(0.6f);
            Release(_mouse.leftButton);
            yield return null;
            Assert.Less(hp.Model.Health, before, $"enemy {target.name} took no damage ");
        }

        [UnityTest]
        public IEnumerator KillingEveryEnemy_Wins()
        {
            yield return LoadSlice();
            var d = GameDirector.Instance; MakeInvulnerable(d.player);
            foreach (var e in d.enemies) e.GetComponent<Damageable>().ApplyDamage(1e6f, Vector3.zero);
            yield return null;
            Assert.AreEqual(GameDirector.Outcome.Won, d.State);
            Assert.AreEqual(7, d.Kills);
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

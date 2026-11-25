using System.Collections;
using System.Linq;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>U3 soldier animation in the real Island Slice: every enemy soldier has a SoldierAnimator on the model's pivots,
    /// uses the Quaternius UAL rig when it is in the project, the legs move on patrol, and a killed soldier goes down by animation.</summary>
    public sealed class SoldierAnimTests
    {
        const string ScenePath = "Assets/Scenes/IslandSlice.unity";

        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load()
        {
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(ScenePath, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("IslandSlice");
#endif
            yield return null; yield return null;
        }

        static IEnumerator Wait(float s) { for (float t = 0; t < s; t += Time.deltaTime) yield return null; }

        [UnityTest]
        public IEnumerator EverySoldierIsAnimated_UalRigWhenPresent()
        {
            yield return Load();
            var anims = Object.FindObjectsByType<SoldierAnimator>();
            if (anims.Length == 0) Assert.Ignore("soldier visual is the capsule fallback (no Blender GLB imported)");
            Assert.AreEqual(GameDirector.Instance.enemies.Count, anims.Length, "one animator per enemy");
            Assert.IsTrue(anims.All(a => a.enabled && a.HasPivots), "found legL/legR/upper/arms on every soldier");
            bool ual = System.IO.File.Exists("Assets/ThirdParty/Quaternius/UAL/UAL1_Standard.fbx");
            if (ual) Assert.IsTrue(anims.All(a => a.UsesRig), "the UAL Humanoid rig drives every soldier");
            Debug.Log($"[Anim] {anims.Length} soldiers, {(anims.All(a => a.UsesRig) ? "UAL rig" : "procedural web pose")}");
        }

        [UnityTest]
        public IEnumerator PatrollingLegsSwing_DeathGoesDownWithoutTipping()
        {
            yield return Load();
            var walker = Object.FindObjectsByType<SoldierAnimator>().FirstOrDefault(a => a.GetComponent<EnemyAgent>().patrolPoints?.Length > 0);
            if (!walker) Assert.Ignore("no patrolling soldier with a model");
            var leg = walker.visual.GetComponentsInChildren<Transform>().First(t => t.name == "legL");
            float min = 999f, max = -999f;
            for (float t = 0; t < 2.5f; t += Time.deltaTime)
            {
                float x = leg.localEulerAngles.x; if (x > 180f) x -= 360f;
                min = Mathf.Min(min, x); max = Mathf.Max(max, x);
                yield return null;
            }
            Assert.That(walker.Speed, Is.GreaterThan(0.3), "the patrol is walking");
            Assert.That(max - min, Is.GreaterThan(10f), "the thigh swings while walking");

            var root = walker.transform; float yawBefore = root.eulerAngles.y;
            var body = walker.visual.GetComponentsInChildren<Transform>().First(t => t.name == "body");
            float hipBefore = body.position.y;
            walker.GetComponent<Damageable>().ApplyDamage(99999f, root.position + root.forward * 5f);
            yield return Wait(2.5f);
            Assert.That(Mathf.Abs(Mathf.DeltaAngle(root.eulerAngles.x, 0f)), Is.LessThan(1f), "the old tip-over is not used");
            Assert.That(root.eulerAngles.y, Is.EqualTo(yawBefore).Within(1f));
            float down = walker.UsesRig ? hipBefore - body.position.y : 0f;
            if (walker.UsesRig)
            {
                // say what the rig is doing if this fails: is the Dead state playing, and where are the mannequin's hips?
                var st = walker.rig.GetCurrentAnimatorStateInfo(0); var hips = walker.rig.GetBoneTransform(HumanBodyBones.Hips);
                string why = $"Death01 brings the hips down (state Dead={st.IsName("Dead")} t={st.normalizedTime:F2}, param Dead={walker.rig.GetBool("Dead")}, " +
                    $"rig hips local y={walker.transform.InverseTransformPoint(hips.position).y:F2}, body y {hipBefore:F2} -> {body.position.y:F2})";
                Assert.That(down, Is.GreaterThan(0.4f), why);
            }
            else Assert.That(Mathf.Abs(Mathf.DeltaAngle(walker.visual.localEulerAngles.x, 0f)), Is.GreaterThan(60f), "web pose: the model falls");
        }
    }
}

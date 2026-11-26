using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpecialSoldier.Core;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
#endif

namespace SpecialSoldier.PlayModeTests
{
    /// <summary>Which way the vehicles point (PC 2026-11-26: "helicopter, truck and APC facing unchecked — the embedded browser
    /// cannot turn the view"). Ground truth from the Blender GLB itself: every vehicle faces glTF +z (the APC's muzzle sits at
    /// z +3.4, the helicopter's tail at z −8.9). In the web game a +z-facing model at yaw θ points along (sin θ, cos θ) on the
    /// island; Unity mirrors island z, so it must point along (sin θ, 0, −cos θ). Each test measures the model's real front
    /// in Unity (muzzle / tail / the import convention) and compares — the failure message gives the angle to fix.</summary>
    public sealed class VehicleFacingTests
    {
        const string Glb = "Assets/Imported/special_soldier_assets.glb";
        [SetUp] public void Setup() => SettingsStore.UseDefaultsForTests();

        static IEnumerator Load(string scene)
        {
#if UNITY_EDITOR
            string path = $"Assets/Scenes/{scene}.unity";
            if (!System.IO.File.Exists(path)) Assert.Ignore($"{scene} scene not built yet");
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode(path, new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync(scene);
#endif
            yield return null; yield return null;
        }

        /// <summary>The web direction a +z model at island yaw <paramref name="webYaw"/> points, in Unity world space.</summary>
        static Vector3 WebFront(double webYaw) => new Vector3((float)System.Math.Sin(webYaw), 0f, -(float)System.Math.Cos(webYaw));

        static float Yaw(Vector3 v) => Mathf.Atan2(v.x, v.z) * Mathf.Rad2Deg;
        static string Say(string what, Vector3 actual, Vector3 expected) =>
            $"{what}: points {Yaw(actual):F0}° (Unity yaw), the web direction is {Yaw(expected):F0}° — off by {Mathf.DeltaAngle(Yaw(expected), Yaw(actual)):F0}°";

        static Transform Child(Transform root, string prefix) =>
            root.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name.StartsWith(prefix));

        /// <summary>+1 when the importer keeps glTF +z as the model's local +z (an x-mirroring import), −1 when it turns it into −z.
        /// Measured on the GLB's APC: where its muzzle ends up.</summary>
        static float ImportFront()
        {
#if UNITY_EDITOR
            var glb = AssetDatabase.LoadAssetAtPath<GameObject>(Glb);
            var apc = glb ? glb.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == "APC") : null;
            var muzzle = apc ? Child(apc, "muzzle") : null;
            if (!muzzle) Assert.Ignore("Blender GLB (APC/muzzle) not imported");
            return Mathf.Sign(apc.InverseTransformPoint(muzzle.position).z);
#else
            Assert.Ignore("needs the editor (AssetDatabase)"); return 1f;
#endif
        }

        [UnityTest]
        public IEnumerator Apc_BarrelPointsWhereTheHullFaces()
        {
            yield return Load("Mission03");
            var apc = Object.FindObjectsByType<EnemyAgent>().FirstOrDefault(e => e.typeId == "apc");
            if (!apc) Assert.Ignore("no APC in Mission03");
            var muzzle = Child(apc.transform, "muzzle");
            if (!muzzle) Assert.Ignore("APC is the box stand-in (no Blender model)");
            // EnemyAgent turns the root toward where it drives and shoots: the barrel must lie along root +z
            Vector3 local = apc.transform.InverseTransformPoint(muzzle.position);
            Debug.Log($"[Facing] APC muzzle in hull space {local}, import front {ImportFront():+0;-0}");
            Assert.That(local.z, Is.GreaterThan(1f), $"APC barrel points backward in hull space (muzzle at local {local}) — turn the Visual 180°");
        }

        [UnityTest]
        public IEnumerator Heli_NoseFollowsTheWebHeading()
        {
            yield return Load("Mission05");
            var heli = GameDirector.Instance ? GameDirector.Instance.heli : null;
            if (!heli) Assert.Ignore("Mission05 has no extraction helicopter");
            var tail = Child(heli, "tail");
            if (!tail) Assert.Ignore("helicopter is the box stand-in (no Blender model)");
            // the same rotation GameDirector gives it on the approach (web yaw −1.9 + e × 0.35, mirrored), at e = 0.5
            double webYaw = -1.9 + 0.5 * 0.35;
            heli.rotation = Quaternion.Euler(0f, -(float)(webYaw * Mathf.Rad2Deg), 0f);
            Vector3 nose = heli.position - tail.position; nose.y = 0f;
            Assert.That(Vector3.Dot(nose.normalized, WebFront(webYaw)), Is.GreaterThan(0.9f), Say("helicopter nose", nose, WebFront(webYaw)));
        }

        [UnityTest]
        public IEnumerator Boat_BowTowardTheIsland()
        {
            float s = ImportFront();
            yield return Load("Mission01");
            var boat = IntroDirector.Instance ? IntroDirector.Instance.boat : null;
            if (!boat) Assert.Ignore("Mission01 has no intro boat");
            // web: boat.rotation.y = π for the ride and on the beach (it sails toward −z, the island)
            Vector3 bow = boat.TransformDirection(Vector3.forward * s); bow.y = 0f;
            Assert.That(Vector3.Dot(bow.normalized, WebFront(System.Math.PI)), Is.GreaterThan(0.9f), Say("beached boat bow", bow, WebFront(System.Math.PI)));
        }

        [UnityTest]
        public IEnumerator Trucks_FaceLikeTheWeb()
        {
            float s = ImportFront();
            yield return Load("Mission03");
            // motor pool: build.js truck(-40, -112, alongX=false) → yaw 0 (cab toward +z on the island)
            var at = IslandTerrain.ToWorld(-40, 0, -112);
            var truck = Object.FindObjectsByType<Transform>(FindObjectsInactive.Include, FindObjectsSortMode.None).Where(t => t.name == "Truck")
                .OrderBy(t => new Vector2(t.position.x - (float)at.x, t.position.z - (float)at.z).sqrMagnitude).FirstOrDefault();
            if (!truck) Assert.Ignore("no Blender truck in Mission03");
            Vector3 cab = truck.TransformDirection(Vector3.forward * s); cab.y = 0f;
            Assert.That(Vector3.Dot(cab.normalized, WebFront(0)), Is.GreaterThan(0.9f), Say("truck (-40, -112)", cab, WebFront(0)));
        }
    }
}

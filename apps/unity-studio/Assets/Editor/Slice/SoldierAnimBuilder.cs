// Soldier animation (U3): Quaternius Universal Animation Library [Standard] (CC0) as a Humanoid rig + an Animator controller
// built from code. The rig is an invisible mannequin inside each enemy; Runtime/SoldierAnimator copies its bone rotations onto
// the game soldier's rigid pivots (legs, shins, torso, head), so the Blender / Higgsfield soldiers move with motion-captured clips.
using System.IO;
using System.Linq;
using SpecialSoldier.Core;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace SpecialSoldier.EditorTools
{
    /// <summary>Import settings from Quaternius's Unity setup sheet: Bake Axis Conversion, Humanoid (create from this model),
    /// loop every clip whose name ends in "_Loop". The mannequin is never drawn, so its materials are not imported.</summary>
    public sealed class UalImport : AssetPostprocessor
    {
        public const string Folder = "Assets/ThirdParty/Quaternius/UAL/";

        public override uint GetVersion() => 3;   // bump to reimport the UAL file after changing these settings (3: hip height baked into the pose)

        bool IsUal => assetPath.Replace('\\', '/').StartsWith(Folder) && assetPath.EndsWith(".fbx", System.StringComparison.OrdinalIgnoreCase);

        public static bool Apply(ModelImporter mi)
        {
            bool changed = mi.animationType != ModelImporterAnimationType.Human || mi.avatarSetup != ModelImporterAvatarSetup.CreateFromThisModel || !mi.bakeAxisConversion;
            mi.globalScale = 1f; mi.useFileUnits = true; mi.bakeAxisConversion = true;
            mi.animationType = ModelImporterAnimationType.Human; mi.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
            mi.importAnimation = true; mi.importBlendShapes = false; mi.importCameras = false; mi.importLights = false;
            mi.materialImportMode = ModelImporterMaterialImportMode.None;
            mi.animationCompression = ModelImporterAnimationCompression.Optimal;
            return changed;
        }

        void OnPreprocessModel() { if (IsUal) Apply((ModelImporter)assetImporter); }

        void OnPreprocessAnimation()
        {
            if (!IsUal) return;
            var mi = (ModelImporter)assetImporter;
            var clips = mi.clipAnimations.Length > 0 ? mi.clipAnimations : mi.defaultClipAnimations;
            foreach (var c in clips)
            {
                bool loop = SoldierClips.Loops(ShortName(c.name));
                c.loopTime = loop; c.loopPose = loop;
                // in place: the NavMeshAgent moves the soldier; the hips keep their height so crouch and death go down
                c.lockRootRotation = true; c.keepOriginalOrientation = true;
                // Bake the hip height into the pose: with lockRootHeightY = false it became root motion, which
                // applyRootMotion = false throws away, so Death01 played but the hips stayed at 0.91 m (PlayMode, 2026-11-25).
                c.lockRootHeightY = true; c.keepOriginalPositionY = true;
                c.lockRootPositionXZ = true; c.keepOriginalPositionXZ = true;
            }
            mi.clipAnimations = clips;
        }

        /// <summary>"Armature|Walk_Loop" → "Walk_Loop" (FBX takes can carry the armature name).</summary>
        public static string ShortName(string clip) { int i = clip.LastIndexOf('|'); return i >= 0 ? clip.Substring(i + 1) : clip; }
    }

    public static class SoldierAnimBuilder
    {
        public const string FbxPath = UalImport.Folder + "UAL1_Standard.fbx";
        public const string ControllerPath = "Assets/Animation/Soldier.controller";
        static AnimatorController _built;   // rebuilt once per Editor process (both scenes of a build share it)

        /// <summary>The UAL mannequin model (with its Humanoid Animator), or null when the file is missing — enemies then use the
        /// web game's procedural pose (Core.SoldierPose).</summary>
        public static GameObject RigPrefab()
        {
            var mi = AssetImporter.GetAtPath(FbxPath) as ModelImporter;
            if (mi == null) { Debug.LogWarning($"[Slice] soldier animation: {FbxPath} missing (node apps/unity-studio/Tools~/fetch-ual.mjs) — procedural pose only"); return null; }
            if (UalImport.Apply(mi)) { mi.SaveAndReimport(); Debug.Log("[Slice] soldier animation: UAL reimported as Humanoid"); }
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(FbxPath);
            var anim = go ? go.GetComponent<Animator>() : null;
            if (!anim || !anim.avatar || !anim.avatar.isValid || !anim.avatar.isHuman)
            { Debug.LogWarning("[Slice] soldier animation: UAL avatar is not a valid Humanoid — procedural pose only"); return null; }
            return go;
        }

        public static AnimationClip Clip(string name) =>
            AssetDatabase.LoadAllAssetsAtPath(FbxPath).OfType<AnimationClip>()
                .FirstOrDefault(c => !c.name.StartsWith("__preview__") && UalImport.ShortName(c.name) == name);

        /// <summary>Locomotion 2D blend (Speed × Crouch) + Hit + Dead. Written in place over the existing controller file so
        /// scenes that already reference it keep the same GUID.</summary>
        public static AnimatorController Controller()
        {
            if (_built) return _built;
            var missing = SoldierClips.Required.Where(n => !Clip(n)).ToArray();
            if (missing.Length > 0) { Debug.LogWarning("[Slice] soldier animation: clips missing from UAL: " + string.Join(", ", missing)); return null; }

            Directory.CreateDirectory(Path.GetDirectoryName(ControllerPath));
            const string tmp = "Assets/Animation/_Soldier_build.controller";
            AssetDatabase.DeleteAsset(tmp);
            var ctrl = AnimatorController.CreateAnimatorControllerAtPath(tmp);
            ctrl.AddParameter("Speed", AnimatorControllerParameterType.Float);
            ctrl.AddParameter("Crouch", AnimatorControllerParameterType.Float);
            ctrl.AddParameter("Dead", AnimatorControllerParameterType.Bool);
            ctrl.AddParameter("Hit", AnimatorControllerParameterType.Trigger);
            ctrl.AddParameter("HitHead", AnimatorControllerParameterType.Trigger);
            var sm = ctrl.layers[0].stateMachine;

            var move = ctrl.CreateBlendTreeInController("Locomotion", out BlendTree tree, 0);
            tree.blendType = BlendTreeType.FreeformCartesian2D; tree.blendParameter = "Speed"; tree.blendParameterY = "Crouch";
            tree.AddChild(Clip(SoldierClips.Idle), new Vector2(0f, 0f));
            tree.AddChild(Clip(SoldierClips.Walk), new Vector2(SoldierClips.WalkSpeed, 0f));
            tree.AddChild(Clip(SoldierClips.Jog), new Vector2(SoldierClips.JogSpeed, 0f));
            tree.AddChild(Clip(SoldierClips.Sprint), new Vector2(SoldierClips.SprintSpeed, 0f));
            tree.AddChild(Clip(SoldierClips.CrouchIdle), new Vector2(0f, 1f));
            tree.AddChild(Clip(SoldierClips.CrouchWalk), new Vector2(SoldierClips.CrouchWalkSpeed, 1f));
            sm.defaultState = move;

            foreach (var (state, trigger, clip) in new[] { ("Hit", "Hit", SoldierClips.Hit), ("HitHead", "HitHead", SoldierClips.HitHead) })
            {
                var s = sm.AddState(state); s.motion = Clip(clip);
                var into = move.AddTransition(s); into.AddCondition(AnimatorConditionMode.If, 0f, trigger); into.hasExitTime = false; into.duration = 0.06f;
                var back = s.AddTransition(move); back.hasExitTime = true; back.exitTime = 0.75f; back.duration = 0.2f;
            }
            var dead = sm.AddState("Dead"); dead.motion = Clip(SoldierClips.Death);
            var die = sm.AddAnyStateTransition(dead); die.AddCondition(AnimatorConditionMode.If, 0f, "Dead");
            die.hasExitTime = false; die.duration = 0.08f; die.canTransitionToSelf = false;
            AssetDatabase.SaveAssets();

            // keep the GUID scenes point at: copy the new file's contents over the old one (the .meta stays)
            if (File.Exists(ControllerPath))
            {
                File.Copy(tmp, ControllerPath, true);
                AssetDatabase.DeleteAsset(tmp);
                AssetDatabase.ImportAsset(ControllerPath, ImportAssetOptions.ForceUpdate);
            }
            else AssetDatabase.MoveAsset(tmp, ControllerPath);
            _built = AssetDatabase.LoadAssetAtPath<AnimatorController>(ControllerPath);
            Debug.Log($"[Slice] soldier animation: controller {(_built ? "ok" : "MISSING")} {ControllerPath} ({SoldierClips.Required.Length} UAL clips)");
            return _built;
        }

        /// <summary>Adds the invisible animation rig to an enemy and returns its Animator (null → procedural pose).</summary>
        public static Animator AddRig(GameObject enemy)
        {
            var prefab = RigPrefab(); var ctrl = prefab ? Controller() : null;
            if (!prefab || !ctrl) return null;
            var rig = Object.Instantiate(prefab, enemy.transform); rig.name = "Rig";
            rig.transform.localPosition = Vector3.zero; rig.transform.localRotation = Quaternion.identity; rig.transform.localScale = Vector3.one;
            foreach (var r in rig.GetComponentsInChildren<Renderer>(true)) r.enabled = false;   // only its bones are used
            foreach (var c in rig.GetComponentsInChildren<Collider>(true)) Object.DestroyImmediate(c);
            var a = rig.GetComponent<Animator>();
            a.runtimeAnimatorController = ctrl; a.applyRootMotion = false; a.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            return a;
        }
    }
}

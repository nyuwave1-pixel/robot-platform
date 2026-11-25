using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace SpecialSoldier
{
    /// <summary>Draws the island's trees, palms and rocks with GPU instancing (Graphics.RenderMeshInstanced): each model's meshes
    /// are stored once (the shared Blender GLB) and every plant is a single transform, grouped in 160 m cells like the web game.
    /// The earlier version merged every plant into per-cell meshes, which made vegetation 76 % of the WebGL download
    /// (55.7 MB uncompressed, PC build report 2026-11-25). Cells beyond <see cref="drawDistance"/> (past the fog) are skipped.</summary>
    [ExecuteAlways]
    public sealed class InstancedVegetation : MonoBehaviour
    {
        [System.Serializable]
        public sealed class Part { public Mesh mesh; public int subMesh; public Material material; public Matrix4x4 rel = Matrix4x4.identity; }

        [System.Serializable]
        public sealed class Model { public string name; public Part[] parts; }

        [System.Serializable]
        public sealed class Cell { public int model; public Bounds bounds; public Matrix4x4[] items; }

        public Model[] models = new Model[0];
        public Cell[] cells = new Cell[0];
        [Tooltip("Cells whose bounds are farther than this from the camera are not drawn (fog ends at 240 m).")]
        public float drawDistance = 420f;
        public bool castShadows = true;

        /// <summary>Instances drawn last frame (tests, profiling).</summary>
        public int DrawnLastFrame { get; private set; }
        public int TotalPlants { get { int n = 0; foreach (var c in cells) n += c.items?.Length ?? 0; return n; } }

        Matrix4x4[][][] _world;   // [cell][part] → item matrix × part matrix
        readonly Plane[] _planes = new Plane[6];
        static readonly List<Matrix4x4> Chunk = new List<Matrix4x4>(1023);

        void OnEnable() => _world = null;
        void OnValidate() => _world = null;

        void Prepare()
        {
            _world = new Matrix4x4[cells.Length][][];
            for (int c = 0; c < cells.Length; c++)
            {
                var cell = cells[c]; var model = models[cell.model];
                _world[c] = new Matrix4x4[model.parts.Length][];
                for (int p = 0; p < model.parts.Length; p++)
                {
                    var m = new Matrix4x4[cell.items.Length];
                    for (int i = 0; i < m.Length; i++) m[i] = cell.items[i] * model.parts[p].rel;
                    _world[c][p] = m;
                }
            }
        }

        void LateUpdate()
        {
            if (_world == null) Prepare();
            var cam = Camera.main;
            if (cam) GeometryUtility.CalculateFrustumPlanes(cam, _planes);
            int drawn = 0;
            for (int c = 0; c < cells.Length; c++)
            {
                var cell = cells[c];
                if (cam)
                {
                    if (cell.bounds.SqrDistance(cam.transform.position) > drawDistance * drawDistance) continue;
                    var wide = cell.bounds; wide.Expand(40f);   // trees just off-screen still cast shadows into view
                    if (!GeometryUtility.TestPlanesAABB(_planes, wide)) continue;
                }
                var model = models[cell.model];
                for (int p = 0; p < model.parts.Length; p++)
                {
                    var part = model.parts[p];
                    if (!part.mesh || !part.material) continue;
                    var rp = new RenderParams(part.material)
                    {
                        worldBounds = cell.bounds, receiveShadows = true,
                        shadowCastingMode = castShadows ? ShadowCastingMode.On : ShadowCastingMode.Off,
                    };
                    var all = _world[c][p];
                    for (int start = 0; start < all.Length; start += 1023)
                    {
                        Chunk.Clear();
                        for (int i = start; i < Mathf.Min(all.Length, start + 1023); i++) Chunk.Add(all[i]);
                        Graphics.RenderMeshInstanced(rp, part.mesh, part.subMesh, Chunk);
                    }
                    drawn += all.Length;
                }
            }
            DrawnLastFrame = drawn;
        }
    }
}

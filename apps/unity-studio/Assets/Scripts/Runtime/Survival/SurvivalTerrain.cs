using SurvivalWorld.Core;
using UnityEngine;

namespace SurvivalWorld.Runtime
{
    /// <summary>
    /// Builds the island ground from SurvivalRules.HeightAt / BiomeAt — the same numbers the web edition draws.
    /// Web (x, z) maps to Unity (x, -z) (three.js is right-handed, Unity left-handed); see <see cref="ToWorld"/>.
    /// Biome colours go into a texture (URP Lit ignores vertex colours).
    /// </summary>
    public static class SurvivalTerrain
    {
        public const int Segments = 168;   // as in the web edition (169² vertices fits a 16-bit index buffer)

        public static Vector3 ToWorld(long seed, double x, double z, float lift = 0f) =>
            new Vector3((float)x, Mathf.Max(0.3f, (float)SurvivalRules.HeightAt(seed, x, z)) + lift, (float)-z);
        public static Vector3 ToWorldRaw(long seed, double x, double z) => new Vector3((float)x, (float)SurvivalRules.HeightAt(seed, x, z), (float)-z);
        /// <summary>Unity world point back to web (x, z).</summary>
        public static (double x, double z) ToGame(Vector3 p) => (p.x, -p.z);

        static readonly Color Water = new Color(0.83f, 0.77f, 0.55f), Beach = new Color(0.86f, 0.79f, 0.56f), Grass = new Color(0.36f, 0.56f, 0.24f),
            Forest = new Color(0.24f, 0.42f, 0.18f), Rock = new Color(0.5f, 0.48f, 0.44f);
        static Color BiomeColor(string b) => b == "water" ? Water : b == "beach" ? Beach : b == "forest" ? Forest : b == "rock" ? Rock : Grass;

        public static Mesh BuildMesh(long seed)
        {
            int n = Segments + 1; double W = SurvivalRules.World, step = W / Segments;
            var v = new Vector3[n * n]; var uv = new Vector2[n * n];
            for (int j = 0; j < n; j++)
                for (int i = 0; i < n; i++)
                {
                    double x = -W / 2 + i * step, uz = -W / 2 + j * step;
                    v[j * n + i] = new Vector3((float)x, (float)SurvivalRules.HeightAt(seed, x, -uz), (float)uz);
                    uv[j * n + i] = new Vector2(i / (float)Segments, j / (float)Segments);
                }
            var t = new int[Segments * Segments * 6]; int k = 0;
            for (int j = 0; j < Segments; j++)
                for (int i = 0; i < Segments; i++)
                {
                    int a = j * n + i, b = a + 1, c = a + n, d = c + 1;   // clockwise seen from above = faces up in Unity
                    t[k++] = a; t[k++] = c; t[k++] = d; t[k++] = a; t[k++] = d; t[k++] = b;
                }
            var m = new Mesh { name = "SurvivalIsland", vertices = v, uv = uv, triangles = t };
            m.RecalculateNormals(); m.RecalculateBounds();
            return m;
        }

        public static Texture2D BuildTexture(long seed, int size = 512)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGB24, true) { name = "SurvivalBiomes", wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            var px = new Color[size * size]; double W = SurvivalRules.World;
            for (int j = 0; j < size; j++)
                for (int i = 0; i < size; i++)
                {
                    double x = -W / 2 + (i + 0.5) / size * W, uz = -W / 2 + (j + 0.5) / size * W, z = -uz;
                    double h = SurvivalRules.HeightAt(seed, x, z);
                    float shade = 0.9f + 0.1f * Mathf.Sin((float)x * 0.7f) * Mathf.Cos((float)z * 0.6f);
                    px[j * size + i] = BiomeColor(SurvivalRules.BiomeAt(seed, x, z, h)) * shade;
                }
            tex.SetPixels(px); tex.Apply(true);
            return tex;
        }
    }
}

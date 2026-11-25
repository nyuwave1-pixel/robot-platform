using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>A coloured smoke marker (web fx.smokes: the Mission 05 green LZ smoke, life 160 s). Puffs are plain spheres that rise,
    /// grow and shrink away — no particle shader to strip from the WebGL build.</summary>
    public sealed class SmokeColumn : MonoBehaviour
    {
        public Color color = Color.green;
        public float life = 160f, rate = 3f;
        float _t, _next;
        Material _mat;

        public static SmokeColumn Spawn(Vector3 at, Color color, float life)
        {
            var go = new GameObject("Smoke"); go.transform.position = at;
            var s = go.AddComponent<SmokeColumn>(); s.color = color; s.life = life;
            return s;
        }

        void Update()
        {
            _t += Time.deltaTime;
            if (_t > life) { Destroy(gameObject); return; }
            if ((_next -= Time.deltaTime) > 0f) return;
            _next = 1f / rate;
            var puff = GameObject.CreatePrimitive(PrimitiveType.Sphere); Destroy(puff.GetComponent<Collider>());
            puff.name = "Puff"; puff.transform.position = transform.position + new Vector3(Random.Range(-0.4f, 0.4f), 0.3f, Random.Range(-0.4f, 0.4f));
            var r = puff.GetComponent<Renderer>();
            if (!_mat) { _mat = new Material(r.sharedMaterial); _mat.color = color; if (_mat.HasProperty("_BaseColor")) _mat.SetColor("_BaseColor", color); }
            r.sharedMaterial = _mat; r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            puff.AddComponent<Puff>();
        }

        sealed class Puff : MonoBehaviour
        {
            float _age; Vector3 _drift;
            void Start() { _drift = new Vector3(Random.Range(-0.4f, 0.4f), Random.Range(1.6f, 2.4f), Random.Range(-0.4f, 0.4f)); }
            void Update()
            {
                _age += Time.deltaTime;
                if (_age > 6f) { Destroy(gameObject); return; }
                transform.position += _drift * Time.deltaTime;
                float s = Mathf.Lerp(0.6f, 3.2f, _age / 6f) * Mathf.Clamp01((6f - _age) / 1.5f);   // swell, then thin out
                transform.localScale = Vector3.one * s;
            }
        }
    }
}

using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Grows the fireball and fades the light for half a second, then removes the effect.</summary>
    public sealed class ExplosionFade : MonoBehaviour
    {
        float _t;
        void Update()
        {
            _t += Time.deltaTime;
            float k = Mathf.Clamp01(_t / 0.5f);
            transform.localScale = Vector3.one * Mathf.Lerp(0.5f, 4.5f, k);
            var l = GetComponent<Light>(); if (l) l.intensity = Mathf.Lerp(30f, 0f, k);
            if (k >= 1f) Destroy(gameObject);
        }
    }
}

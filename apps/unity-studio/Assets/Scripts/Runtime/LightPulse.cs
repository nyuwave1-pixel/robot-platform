using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Facility emergency light (web: intensity 60 + sin(t × 5 + x) × 40, scaled to Unity units).</summary>
    public sealed class LightPulse : MonoBehaviour
    {
        public float baseIntensity = 1.5f, swing = 1f, phase;
        Light _l;
        void Awake() => _l = GetComponent<Light>();
        void Update() { if (_l) _l.intensity = baseIntensity + Mathf.Sin(Time.time * 5f + phase) * swing; }
    }
}

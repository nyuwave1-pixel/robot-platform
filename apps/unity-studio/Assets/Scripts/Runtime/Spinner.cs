using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Turns a part around its local y axis at a steady rate (web: radar dish, piv.rotation.y += dt * 0.7).</summary>
    public sealed class Spinner : MonoBehaviour
    {
        public float degreesPerSecond = -40f;   // 0.7 rad/s; negative because the island's z is mirrored in Unity
        void Update() => transform.Rotate(0f, degreesPerSecond * Time.deltaTime, 0f, Space.Self);
    }
}

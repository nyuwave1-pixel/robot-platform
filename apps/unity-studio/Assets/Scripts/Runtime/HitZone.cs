using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Marks a collider as a body part of the Damageable above it (head 2.6x, torso 1x, limbs 0.72x).</summary>
    public sealed class HitZone : MonoBehaviour
    {
        public BodyPart part = BodyPart.Torso;
        Damageable _owner;
        public Damageable Owner => _owner ? _owner : (_owner = GetComponentInParent<Damageable>());
    }
}

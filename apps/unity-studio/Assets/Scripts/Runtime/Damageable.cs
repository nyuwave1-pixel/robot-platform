using System;
using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Unity wrapper around the engine-free HealthModel. Colliders on the same object or its children
    /// carry a <see cref="HitZone"/> that says which body part was hit.</summary>
    public sealed class Damageable : MonoBehaviour
    {
        public float maxHealth = 100, armor = 0, armorSoak = 0.5f;
        public HealthModel Model { get; private set; }
        public bool Alive => Model != null && Model.Alive;
        public event Action<float, Vector3> Hit;     // damage, source position
        public event Action Died;

        void Awake() => Init();

        public void Init()
        {
            if (Model != null) return;
            Model = new HealthModel(maxHealth, armor, armorSoak);
            Model.Died += () => Died?.Invoke();
        }

        /// <summary>Sets health/armour regardless of Awake order (used by EnemyAgent from its EnemyType).</summary>
        public void Configure(float health, float armorValue, float soak)
        {
            maxHealth = health; armor = armorValue; armorSoak = soak;
            Model = new HealthModel(maxHealth, armor, armorSoak);
            Model.Died += () => Died?.Invoke();
        }

        public float ApplyDamage(float amount, Vector3 from)
        {
            Init();
            float lost = Model.TakeDamage(amount);
            if (lost > 0) Hit?.Invoke(lost, from);
            return lost;
        }
    }
}

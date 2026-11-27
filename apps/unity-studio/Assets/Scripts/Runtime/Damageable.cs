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
        public BodyPart LastHitPart { get; private set; } = BodyPart.Torso;
        public bool LastHitByPlayer { get; private set; }
        /// <summary>Changes incoming damage before armour (amount, explosive) → amount. Vehicles: EnemyType.DamageTaken (small arms ×0.1).</summary>
        public Func<float, bool, float> DamageFilter;

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

        /// <summary>Damage that remembers who hit where (mission stats count player headshot kills).</summary>
        public float ApplyDamage(float amount, Vector3 from, BodyPart part, bool byPlayer, bool explosive = false)
        {
            LastHitPart = part; LastHitByPlayer = byPlayer;
            return ApplyDamage(amount, from, explosive);
        }

        public float ApplyDamage(float amount, Vector3 from, bool explosive = false)
        {
            Init();
            if (DamageFilter != null) amount = DamageFilter(amount, explosive);
            float lost = Model.TakeDamage(amount);
            if (lost > 0) Hit?.Invoke(lost, from);
            return lost;
        }
    }
}

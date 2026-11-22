using System;

namespace SpecialSoldier.Core
{
    /// <summary>Health + armour. Armour absorbs <see cref="ArmorSoak"/> of each hit until depleted
    /// (player 0.6, enemies 0.5 — the same split the web game uses).</summary>
    public sealed class HealthModel
    {
        public float Health { get; private set; }
        public float Armor { get; private set; }
        public float MaxHealth { get; }
        public float MaxArmor { get; }
        public float ArmorSoak { get; }
        public bool Alive => Health > 0;
        public event Action<float> Damaged;
        public event Action Died;

        public HealthModel(float health, float armor = 0, float armorSoak = 0.5f)
        {
            if (health <= 0) throw new ArgumentOutOfRangeException(nameof(health));
            MaxHealth = Health = health; MaxArmor = Armor = Math.Max(0, armor); ArmorSoak = armorSoak;
        }

        /// <summary>Applies damage and returns the health actually lost.</summary>
        public float TakeDamage(float amount)
        {
            if (!Alive || amount <= 0) return 0;
            if (Armor > 0) { float s = Math.Min(Armor, amount * ArmorSoak); Armor -= s; amount -= s; }
            float before = Health;
            Health = Math.Max(0, Health - amount);
            float lost = before - Health;
            Damaged?.Invoke(lost);
            if (!Alive) Died?.Invoke();
            return lost;
        }

        public void Heal(float amount) { if (Alive && amount > 0) Health = Math.Min(MaxHealth, Health + amount); }
    }
}

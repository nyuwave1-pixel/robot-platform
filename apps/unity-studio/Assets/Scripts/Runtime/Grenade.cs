using System.Collections.Generic;
using SpecialSoldier.Core;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>A thrown fragmentation grenade: a small bouncing rigidbody with a fuse. Damage rules come from Core.Explosives
    /// (linear falloff to 7.5 m, 25% behind cover beyond 1.5 m, your own grenade hurts you 60%).</summary>
    [RequireComponent(typeof(Rigidbody))]
    public sealed class Grenade : MonoBehaviour
    {
        public static readonly List<Grenade> Live = new List<Grenade>();
        public float fuse = Explosives.HandGrenadeFuse, radius = Explosives.HandGrenadeRadius, damage = Explosives.HandGrenadeDamage;
        public bool thrownByPlayer;
        public LayerMask losMask = ~0;
        public float FuseLeft => fuse;

        static PhysicsMaterial _bouncy;
        static readonly Collider[] Hits = new Collider[64];

        /// <summary>Spawns a grenade at <paramref name="pos"/> with <paramref name="velocity"/> (m/s).</summary>
        public static Grenade Throw(Vector3 pos, Vector3 velocity, bool byPlayer, float fuseSeconds)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            go.name = byPlayer ? "Grenade_Player" : "Grenade_Enemy";
            go.transform.position = pos; go.transform.localScale = Vector3.one * 0.12f;
            var col = go.GetComponent<SphereCollider>();
            if (!_bouncy) _bouncy = new PhysicsMaterial("Grenade") { bounciness = Explosives.Bounce, bounceCombine = PhysicsMaterialCombine.Maximum, dynamicFriction = 0.6f, staticFriction = 0.6f };
            col.sharedMaterial = _bouncy;
            var r = go.GetComponent<Renderer>(); if (r) r.material.color = new Color(0.2f, 0.25f, 0.15f);
            var rb = go.AddComponent<Rigidbody>();
            rb.mass = 0.4f; rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic; rb.linearVelocity = velocity; rb.angularVelocity = Random.insideUnitSphere * 9f;
            var g = go.AddComponent<Grenade>(); g.thrownByPlayer = byPlayer; g.fuse = fuseSeconds;
            return g;
        }

        void OnEnable() => Live.Add(this);
        void OnDisable() => Live.Remove(this);

        void Update()
        {
            fuse -= Time.deltaTime;
            if (fuse <= 0f) Explode();
        }

        void Explode()
        {
            Vector3 c = transform.position;
            var done = new HashSet<Damageable>();
            int n = Physics.OverlapSphereNonAlloc(c, radius + 1f, Hits, ~0, QueryTriggerInteraction.Ignore);
            for (int i = 0; i < n; i++)
            {
                var d = Hits[i] ? Hits[i].GetComponentInParent<Damageable>() : null;
                if (!d || !d.Alive || !done.Add(d)) continue;
                Vector3 chest = d.transform.position + Vector3.up * 1f;
                float dist = Vector3.Distance(c, chest);
                bool los = !Physics.Linecast(c + Vector3.up * 0.3f, chest, out RaycastHit hit, losMask, QueryTriggerInteraction.Ignore)
                           || hit.collider.GetComponentInParent<Damageable>() == d;
                float dmg = Explosives.Damage(dist, los, radius, damage);
                if (thrownByPlayer && d.GetComponent<PlayerMotor>()) dmg *= Explosives.SelfDamageFactor;
                if (dmg > 1f) d.ApplyDamage(dmg, c);
            }
            if (GameDirector.Instance) GameDirector.Instance.ReportNoise(c, Explosives.HearingRadius);
            Flash(c);
            Destroy(gameObject);
        }

        static void Flash(Vector3 c)
        {
            // stand-in VFX until a VFX Graph explosion exists: an orange light + a fading fireball sphere
            var fx = new GameObject("Explosion");
            fx.transform.position = c + Vector3.up * 0.5f;
            var light = fx.AddComponent<Light>(); light.type = LightType.Point; light.color = new Color(1f, 0.63f, 0.25f); light.range = 14f; light.intensity = 30f;
            var ball = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Object.Destroy(ball.GetComponent<Collider>()); ball.transform.SetParent(fx.transform, false);
            var r = ball.GetComponent<Renderer>(); r.material.color = new Color(1f, 0.55f, 0.15f);
            fx.AddComponent<ExplosionFade>();
        }
    }
}

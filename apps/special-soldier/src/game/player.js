// First-person character: movement states (walk / sprint / crouch / prone / slide / jump), stamina,
// health + armour, cover detection, footsteps, interaction. UE5: ACharacter + CharacterMovement + Enhanced Input.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp, damp, lerp } from '../core/util.js';
import { DIFFICULTY } from '../core/save.js';

const HEIGHTS = [1.78, 1.15, 0.5], SPEED = [4.5, 2.3, 0.95];
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3();
export class Player {
  constructor() {
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.eye = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0; this.stance = 0; this.height = HEIGHTS[0]; this.radius = 0.38;
    this.interact = null; this.holdT = 0; this.medkits = 2; this.reset();
  }
  reset() {
    this.health = 100; this.armor = 100; this.stamina = 100; this.alive = true; this.grounded = true; this.vel.set(0, 0, 0);
    this.stance = 0; this.sprinting = false; this.sliding = 0; this.shake = 0; this.hurt = 0; this.suppress = 0; this.recoilOff = 0; this.bob = 0; this.stepDist = 0;
    this.lastHurt = -99; this.inCover = false; this.staminaWait = 0; this.frozen = false; this.speedNow = 0; this.roll = 0; this.landed = 0; this.noise = 0;
  }
  place(x, z, yaw = 0, y) { this.pos.set(x, y ?? G.world.groundAt(x, z, y ?? 999), z); this.yaw = yaw; this.pitch = 0; this.vel.set(0, 0, 0); this.updateCamera(0); }
  get moving() { return this.speedNow > 0.5; }
  damage(amt, sx, sz, kind) {
    if (!this.alive || G.state !== 'playing' || G.godMode) return;
    amt *= DIFFICULTY[G.settings.difficulty].dmg;
    if (this.armor > 0) { const a = Math.min(this.armor, amt * 0.6); this.armor -= a; amt -= a; }
    this.health -= amt; this.hurt = Math.min(1, this.hurt + amt / 45); this.lastHurt = G.time; this.shake = Math.max(this.shake, 0.25);
    G.hud.hitFrom(Math.atan2(sx - this.pos.x, sz - this.pos.z)); G.audio.play('hurt');
    if (this.health <= 0) { this.health = 0; this.alive = false; G.onPlayerDeath(kind); }
  }
  heal() { if (this.medkits <= 0 || this.health >= 100) return false; this.medkits--; this.health = Math.min(100, this.health + 65); G.audio.play('heal'); G.hud.toast('MED KIT USED'); return true; }
  update(dt) {
    const I = G.input, W = G.world, wp = G.weapons;
    if (!this.alive) { this.height = damp(this.height, 0.3, 4, dt); this.roll = damp(this.roll, 1.1, 3, dt); this.updateCamera(dt); return; }
    const drone = G.gear.droneActive;
    // ---- look ----
    if (!drone && !this.frozen) { const s = 0.0022 * G.settings.sens * (wp.adsT > 0.5 ? 1 / lerp(1, wp.zoomNow, 0.75) : 1); this.yaw -= I.mx * s; this.pitch = clamp(this.pitch - I.my * s * (G.settings.invertY ? -1 : 1), -1.5, 1.5); }
    // ---- stance ----
    const canMove = !drone && !this.frozen;
    if (canMove) {
      if (I.pressed('ControlLeft') || I.pressed('KeyC')) { if (this.sprinting && this.grounded && this.speedNow > 5.5 && this.stamina > 12) { this.sliding = 0.75; this.stamina -= 12; this.stance = 1; G.audio.play('step:sand', null, { g: 0.4 }); } else this.stance = this.stance === 1 ? 0 : 1; }
      if (I.pressed('KeyZ')) this.stance = this.stance === 2 ? 0 : 2;
      if (this.stance !== 0 && (I.pressed('Space') || I.pressed('ShiftLeft')) && this.sliding <= 0) { if (this.canStand()) this.stance = 0; }
      else if (I.pressed('Space') && this.grounded && this.stamina > 8 && this.stance === 0) { this.vel.y = 5.4; this.grounded = false; this.stamina -= 8; this.staminaWait = 0.8; }
    }
    this.height = damp(this.height, HEIGHTS[this.stance], 11, dt);
    // ---- horizontal movement ----
    let ix = 0, iz = 0; if (canMove) { ix = (I.down('KeyD') ? 1 : 0) - (I.down('KeyA') ? 1 : 0); iz = (I.down('KeyW') ? 1 : 0) - (I.down('KeyS') ? 1 : 0); }
    const il = Math.hypot(ix, iz) || 1; ix /= il; iz /= il;
    this.sprinting = canMove && I.down('ShiftLeft') && iz > 0 && this.stance === 0 && this.stamina > 1 && wp.adsT < 0.3 && this.grounded && !wp.reloading;
    const depth = this.pos.y < -30 ? 0 : clamp(-W.heightAt(this.pos.x, this.pos.z), 0, 1.4);
    let sp = SPEED[this.stance] * (this.sprinting ? 1.62 : 1) * (1 - (wp.weight - 3) * 0.022) * lerp(1, 0.62, wp.adsT) * (1 - depth * 0.38);
    _f.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); _r.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    _t.set(0, 0, 0).addScaledVector(_f, iz * sp).addScaledVector(_r, ix * sp * 0.85);
    if (this.sliding > 0) { this.sliding -= dt; _t.copy(_f).multiplyScalar(4 + this.sliding * 8); if (this.sliding <= 0 && !I.down('ControlLeft') && this.canStand()) this.stance = 0; }
    const acc = this.grounded ? 12 : 2.5; this.vel.x = damp(this.vel.x, _t.x, acc, dt); this.vel.z = damp(this.vel.z, _t.z, acc, dt);
    // ---- stamina ----
    if (this.sprinting) { this.stamina = Math.max(0, this.stamina - 13 * dt); this.staminaWait = 1.1; } else if ((this.staminaWait -= dt) <= 0) this.stamina = Math.min(100, this.stamina + (this.moving ? 14 : 24) * dt);
    // ---- integrate + collide ----
    const nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    if (this.pos.y > -30 && W.heightAt(nx, nz) < -1.45) { this.vel.x = this.vel.z = 0; } // deep water boundary
    else W.moveCircle(this.pos, this.vel.x * dt, this.vel.z * dt, this.radius, this.height);
    this.vel.y -= 15 * dt; this.pos.y += this.vel.y * dt;
    const g = W.groundAt(this.pos.x, this.pos.z, this.pos.y);
    if (this.pos.y <= g) { if (!this.grounded && this.vel.y < -6) { this.landed = 0.25; G.audio.play('step:' + W.surfaceAt(this.pos.x, this.pos.z, this.pos.y), null, { g: 0.5 }); if (this.vel.y < -13) this.damage((-this.vel.y - 13) * 6, this.pos.x, this.pos.z, 'fall'); } this.pos.y = g; this.vel.y = 0; this.grounded = true; }
    else if (this.pos.y > g + 0.25) this.grounded = false; else if (this.grounded) this.pos.y = g; // stick to slopes / steps
    this.speedNow = Math.hypot(this.vel.x, this.vel.z);
    // ---- footsteps + noise for AI hearing ----
    this.noise = 0;
    if (this.grounded && this.speedNow > 0.6 && this.sliding <= 0) { this.stepDist += this.speedNow * dt; const stride = this.sprinting ? 2.1 : this.stance === 2 ? 1.1 : 1.55; if (this.stepDist > stride) { this.stepDist = 0; const surf = depth > 0.05 ? 'water' : W.surfaceAt(this.pos.x, this.pos.z, this.pos.y); G.audio.play('step:' + surf, null, { g: this.sprinting ? 0.3 : this.stance ? 0.07 : 0.16 }); if (depth > 0.05) G.fx.puff(this.pos.x, 0.15, this.pos.z, 0xe8f4ff, 0.5, 0.5, 0.5, 0, 1.2, 0, false, 5); }
      this.noise = this.sprinting ? 16 : this.stance === 0 ? 7 : this.stance === 1 ? 2.5 : 1; if (depth > 0.05) this.noise *= 1.4; }
    this.bob += this.speedNow * dt * (this.sprinting ? 1.5 : 1.9);
    // ---- cover: crouched/prone next to a solid object at least waist-high ----
    this.inCover = false;
    if (this.stance > 0) for (const c of W.near(this.pos.x, this.pos.z, 1.5, this._cv || (this._cv = []))) { if (c.pass || c.max.y < this.pos.y + 0.8 || c.min.y > this.pos.y + 0.5) continue; const dx = this.pos.x - clamp(this.pos.x, c.min.x, c.max.x), dz = this.pos.z - clamp(this.pos.z, c.min.z, c.max.z); if (dx * dx + dz * dz < 1.2) { this.inCover = true; break; } }
    // ---- regen, effects ----
    if (G.time - this.lastHurt > 7 && this.health < 40) this.health = Math.min(40, this.health + 5 * dt);
    this.hurt = Math.max(this.health < 30 ? 0.35 + Math.sin(G.time * 5) * 0.1 : 0, this.hurt - dt * 0.7); this.suppress = Math.max(0, this.suppress - dt * 0.5);
    this.shake = Math.max(0, this.shake - dt * 1.8); this.recoilOff = damp(this.recoilOff, 0, 9, dt); this.landed = Math.max(0, this.landed - dt);
    if (canMove && I.pressed('KeyH')) this.heal();
    this.updateInteract(dt, canMove);
    this.updateCamera(dt);
  }
  canStand() { for (const c of G.world.near(this.pos.x, this.pos.z, 1, [])) { if (c.pass) continue; if (c.min.y < this.pos.y + HEIGHTS[0] && c.min.y > this.pos.y + 0.6 && this.pos.x > c.min.x - 0.3 && this.pos.x < c.max.x + 0.3 && this.pos.z > c.min.z - 0.3 && this.pos.z < c.max.z + 0.3) return false; } return true; }
  updateInteract(dt, can) {
    let best = null, bd = 1e9; const lists = [G.world.interactables, G.mission ? G.mission.interactables : []];
    if (can) for (const L of lists) for (const it of L) { if (it.done || (it.enabled && !it.enabled()) || (it.cool && it.cool > G.time)) continue; const d = Math.hypot(it.x - this.pos.x, it.z - this.pos.z, (it.y ?? this.pos.y) - (this.pos.y + 1)); if (d < (it.r || 2.2) && d < bd) { bd = d; best = it; } }
    if (best !== this.interact) this.holdT = 0; this.interact = best;
    if (!best) return;
    const I = G.input;
    if (best.hold) { if (I.down('KeyE')) { this.holdT += dt; if (this.holdT >= best.hold) { this.holdT = 0; this.trigger(best); } } else this.holdT = Math.max(0, this.holdT - dt * 2); }
    else if (I.pressed('KeyE')) this.trigger(best);
  }
  trigger(it) { if (it.once) it.done = true; if (it.repeat) it.cool = G.time + it.repeat; G.audio.play('ui:ok'); it.act(it); this.interact = null; }
  updateCamera(dt) {
    const cam = G.camera, wp = G.weapons, sh = this.shake * this.shake;
    const peek = this.inCover && wp && wp.adsT > 0.5 ? 0.38 : 0;
    const bobY = this.grounded ? Math.sin(this.bob * 2) * 0.035 * Math.min(1, this.speedNow / 4) * (wp && wp.adsT > 0.5 ? 0.25 : 1) : 0;
    this.eye.set(this.pos.x, this.pos.y + this.height - 0.1 + peek + bobY - this.landed * 0.3, this.pos.z);
    if (G.gear && G.gear.droneActive) return;
    cam.position.copy(this.eye);
    const lean = this.alive ? -this.vel.dot(_r.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))) * 0.006 : 0; this.roll = this.alive ? damp(this.roll, lean, 8, dt || 0.016) : this.roll;
    cam.rotation.set(this.pitch + this.recoilOff + (Math.random() - 0.5) * sh * 0.09, this.yaw + (Math.random() - 0.5) * sh * 0.09, this.roll + (Math.random() - 0.5) * sh * 0.05, 'YXZ'); cam.updateMatrixWorld();
  }
}

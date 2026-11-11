// SQUAD 07 team-mates: formation follow, hold-fire discipline until contact, target selection + bursts,
// down / self-revive. UE5: AIController with a team-mate behavior tree.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp, angDiff, damp } from '../core/util.js';
import { makeSoldier, poseSoldier } from './models.js';
import { raySphere } from './fx.js';
import { ST } from './enemies.js';

const NAMES = ['REAPER', 'NOMAD', 'ATLAS'], OFFS = [[-2.6, 3.2], [2.6, 3.8], [0, 6.4]], GUN = { dmg: 8, vel: 860, range: [50, 140], minMul: 0.6, pellets: 1 };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
export class Squad {
  constructor() { this.list = []; this.free = false; this.lastBark = 0; }
  clear() { for (const m of this.list) G.scene.remove(m.model); this.list.length = 0; this.free = false; }
  spawn(n = 3) { this.clear(); const P = G.player; for (let i = 0; i < n; i++) { const model = makeSoldier('squad'); G.scene.add(model); this.list.push({ name: NAMES[i], model, pos: new THREE.Vector3(), yaw: P.yaw, hp: 200, down: false, downT: 0, off: OFFS[i], think: i * 0.15, tgt: null, burst: 0, shotT: 0, pauseT: 1, walk: 0, moveK: 0, crouch: 0 }); } this.regroup(); }
  regroup() { const P = G.player; this.list.forEach((m) => { const s = Math.sin(P.yaw), c = Math.cos(P.yaw); _a.set(P.pos.x + m.off[0] * c + m.off[1] * s, P.pos.y, P.pos.z - m.off[0] * s + m.off[1] * c); m.pos.copy(P.pos); G.world.moveCircle(m.pos, _a.x - P.pos.x, _a.z - P.pos.z, 0.35, 1.7); m.pos.y = G.world.groundAt(m.pos.x, m.pos.z, P.pos.y + 0.6); m.model.position.copy(m.pos); }); }
  weaponsFree() { if (!this.free) { this.free = true; if (G.state === 'playing' && this.list.length) G.hud.radio('REAPER: Contact! Weapons free!'); } }
  hitTest(o, d, max) { let best = null, bt = max; for (const m of this.list) { if (m.down) continue; for (const [y, r] of [[1.6, 0.16], [1.15, 0.3], [0.5, 0.24]]) { const t = raySphere(o, d, m.pos.x, m.pos.y + y, m.pos.z, r, bt); if (t >= 0 && t < bt) { bt = t; best = { mate: m, t }; } } } return best; }
  damage(m, dmg) { if (m.down) return; m.hp -= dmg; if (m.hp <= 0) { m.down = true; m.downT = 18; G.hud.radio(`${m.name}: I'm hit! Going down!`); } }
  update(dt) {
    const P = G.player, W = G.world, E = G.enemies;
    for (const m of this.list) {
      if (m.down) { m.downT -= dt; m.crouch = damp(m.crouch, 1, 6, dt); if (m.downT <= 0) { m.down = false; m.hp = 120; G.hud.radio(`${m.name}: Back in the fight.`); } poseSoldier(m.model, { crouch: 1, aim: -0.9 }); m.model.position.copy(m.pos); continue; }
      m.hp = Math.min(200, m.hp + dt * 4);
      // formation follow
      const s = Math.sin(P.yaw), c = Math.cos(P.yaw), gx = P.pos.x + m.off[0] * c + m.off[1] * s, gz = P.pos.z - m.off[0] * s + m.off[1] * c;
      let dx = gx - m.pos.x, dz = gz - m.pos.z; const dl = Math.hypot(dx, dz); let speed = 0, wantYaw = m.yaw;
      if (dl > 75 || Math.abs(P.pos.y - m.pos.y) > 15) { this.regroup(); continue; }
      const fighting = m.tgt && m.tgt.alive;
      if (dl > (fighting ? 14 : 1.6) && !P.frozen) { speed = Math.min(7.2, 1.5 + dl * 1.2); dx /= dl; dz /= dl; const px = m.pos.x, pz = m.pos.z; if (W.heightAt(m.pos.x + dx, m.pos.z + dz) > -1.2 || m.pos.y < -30) W.moveCircle(m.pos, dx * speed * dt, dz * speed * dt, 0.35, 1.7); if (Math.hypot(m.pos.x - px, m.pos.z - pz) < speed * dt * 0.3) W.moveCircle(m.pos, -dz * speed * dt, dx * speed * dt, 0.35, 1.7); wantYaw = Math.atan2(dx, dz); }
      else if (!fighting) wantYaw = P.yaw + Math.PI + (m.off[0] > 0 ? -0.5 : 0.5);
      m.pos.y = damp(m.pos.y, W.groundAt(m.pos.x, m.pos.z, m.pos.y + 0.6), 14, dt);
      // targeting
      if ((m.think -= dt) <= 0) { m.think = 0.4; if (m.tgt && !m.tgt.alive && G.time - this.lastBark > 6) { this.lastBark = G.time; G.hud.radio(`${m.name}: ${['Tango down.', 'Target neutralised.', 'One less.', 'Clear on my side.'][Math.random() * 4 | 0]}`); } m.tgt = null; let bd = 60 * 60; _a.set(m.pos.x, m.pos.y + 1.6, m.pos.z);
        for (const e of E.list) { if (!e.alive || (!this.free && e.state < ST.COMBAT)) continue; const d2 = e.pos.distanceToSquared(m.pos); if (d2 < bd && W.los(_a, _b.set(e.pos.x, e.pos.y + (e.type.vehicle ? 2 : 1.3), e.pos.z))) { bd = d2; m.tgt = e; } } }
      if (m.tgt && m.tgt.alive) { const e = m.tgt; wantYaw = Math.atan2(e.pos.x - m.pos.x, e.pos.z - m.pos.z);
        if (m.burst > 0) { if ((m.shotT -= dt) <= 0) { m.shotT = 0.1; m.burst--; _a.set(m.pos.x + Math.sin(m.yaw) * 0.7, m.pos.y + 1.42 - m.crouch * 0.4, m.pos.z + Math.cos(m.yaw) * 0.7); _d.set(e.pos.x - _a.x + (Math.random() - 0.5) * 0.11 * Math.sqrt(e.pos.distanceTo(m.pos)) * 3, e.pos.y + (e.type.vehicle ? 1.6 : 1.15) - _a.y + (Math.random() - 0.5) * 2.2, e.pos.z - _a.z + (Math.random() - 0.5) * 0.11 * Math.sqrt(e.pos.distanceTo(m.pos)) * 3).normalize(); G.fx.fire(_a, _d, GUN, 'squad', m); G.fx.puff(_a.x, _a.y, _a.z, 0xffc070, 0.5, 0.06, 1, 0, 0, 0, true, 0, 0.5); G.audio.play('shot:ASSAULT RIFLE', m.pos); if (m.burst === 0) m.pauseT = 1.4 + Math.random() * 2.2; } }
        else if ((m.pauseT -= dt) <= 0 && Math.abs(angDiff(wantYaw, m.yaw)) < 0.25) { m.burst = 2 + (Math.random() * 3 | 0); m.shotT = 0; } }
      m.yaw += clamp(angDiff(wantYaw, m.yaw), -6 * dt, 6 * dt);
      m.crouch = damp(m.crouch, (fighting && speed === 0) || (P.stance > 0 && speed === 0) ? 1 : 0, 7, dt); m.moveK = damp(m.moveK, speed > 0 ? 1 : 0, 8, dt); m.walk += speed * dt * 2.4;
      poseSoldier(m.model, { walk: m.walk, moveK: m.moveK, crouch: m.crouch * 0.8, aim: fighting ? 0 : -0.35 });
      m.model.position.copy(m.pos); m.model.rotation.set(0, m.yaw, 0); m.model.visible = !G.cine.active || G.cine.showSquad;
    }
  }
}

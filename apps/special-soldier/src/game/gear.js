// Tactical equipment: night vision, thermal imager, weapon light, recon drone (free-fly camera that tags
// hostiles), med kit. Unlocks follow campaign progress. UE5: GAS abilities + post-process materials.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp } from '../core/util.js';

export const GEAR = [
  { id: 'nvg', name: 'NIGHT VISION', key: 'N', unlock: 0 }, { id: 'light', name: 'TAC LIGHT', key: 'L', unlock: 0 }, { id: 'medkit', name: 'MED KIT', key: 'H', unlock: 0 },
  { id: 'drone', name: 'RECON DRONE', key: 'B', unlock: 1 }, { id: 'thermal', name: 'THERMAL IMAGER', key: 'T', unlock: 2 },
];
const _d = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
export class Gear {
  constructor() {
    this.vision = 0; this.light = false; this.droneActive = false; this.battery = 1; this.sel = 0; this.dronePos = new THREE.Vector3(); this.dyaw = 0; this.dpitch = 0;
    this.spot = new THREE.SpotLight(0xf2f6ff, 0, 55, 0.42, 0.5, 1.3); this.spot.position.set(0.15, -0.1, 0); G.camera.add(this.spot); const t = new THREE.Object3D(); t.position.set(0, 0, -6); G.camera.add(t); this.spot.target = t;
  }
  has(id) { return G.save.progress >= GEAR.find((g) => g.id === id).unlock || G.allGear; }
  list() { return GEAR.filter((g) => this.has(g.id)); }
  reset() { this.vision = 0; this.light = false; this.spot.intensity = 0; if (this.droneActive) this.toggleDrone(); this.battery = 1; G.enemies.setThermal(false); }
  setVision(v) { this.vision = this.vision === v ? 0 : v; G.enemies.setThermal(this.vision === 2); G.audio.play('nvg'); }
  toggleDrone() {
    if (!this.droneActive) { if (this.battery < 0.15 || G.player.pos.y < -30) { G.hud.toast(G.player.pos.y < -30 ? 'NO DRONE SIGNAL UNDERGROUND' : 'DRONE BATTERY LOW', true); return; } this.droneActive = true; this.dronePos.copy(G.player.eye).y += 2; this.dyaw = G.player.yaw; this.dpitch = -0.3; G.audio.play('beep', null, { f: 1400 }); }
    else { this.droneActive = false; G.audio.loop('drone', 0); G.player.updateCamera(0); }
  }
  use(id) { if (!this.has(id)) return; if (id === 'nvg') this.setVision(1); else if (id === 'thermal') this.setVision(2); else if (id === 'light') { this.light = !this.light; this.spot.intensity = this.light ? 140 : 0; G.audio.play('click'); } else if (id === 'drone') this.toggleDrone(); else if (id === 'medkit') G.player.heal(); }
  update(dt) {
    const I = G.input, P = G.player; if (!P.alive) return;
    if (!P.frozen) { for (const g of GEAR) if (g.id !== 'medkit' && I.pressed('Key' + g.key)) { if (this.has(g.id)) this.use(g.id); else G.hud.toast(g.name + ' — LOCKED', true); }
      const L = this.list(); if (I.pressed('KeyX')) { this.sel = (this.sel + 1) % L.length; G.hud.toast('EQUIPMENT: ' + L[this.sel].name); G.audio.play('click'); } if (I.pressed('KeyF')) this.use(L[this.sel % L.length].id); }
    if (this.droneActive) {
      this.battery -= dt / 45; this.dyaw -= I.mx * 0.002; this.dpitch = clamp(this.dpitch - I.my * 0.002, -1.5, 0.6);
      _d.set(-Math.sin(this.dyaw), 0, -Math.cos(this.dyaw)); const f = (I.down('KeyW') ? 1 : 0) - (I.down('KeyS') ? 1 : 0), r = (I.down('KeyD') ? 1 : 0) - (I.down('KeyA') ? 1 : 0), u = (I.down('Space') ? 1 : 0) - (I.down('ControlLeft') ? 1 : 0), sp = 15 * dt;
      this.dronePos.x += (_d.x * f + -_d.z * r) * sp; this.dronePos.z += (_d.z * f + _d.x * r) * sp; this.dronePos.y += u * sp * 0.7;
      const g = Math.max(G.world.heightAt(this.dronePos.x, this.dronePos.z), 0) + 2; this.dronePos.y = clamp(this.dronePos.y, g, g + 70);
      const dx = this.dronePos.x - P.pos.x, dz = this.dronePos.z - P.pos.z, dl = Math.hypot(dx, dz); if (dl > 230) { this.dronePos.x = P.pos.x + (dx / dl) * 230; this.dronePos.z = P.pos.z + (dz / dl) * 230; }
      G.camera.position.copy(this.dronePos); G.camera.rotation.set(this.dpitch, this.dyaw, Math.sin(G.time * 2) * 0.01, 'YXZ'); G.camera.updateMatrixWorld(); G.audio.loop('drone', 0.25);
      // tag hostiles in the camera's view
      if ((this.scanT = (this.scanT || 0) - dt) <= 0) { this.scanT = 0.3; G.camera.getWorldDirection(_d); for (const e of G.enemies.list) { if (!e.alive) continue; _a.set(e.pos.x, e.pos.y + 1.2, e.pos.z); _b.subVectors(_a, this.dronePos); const d = _b.length(); if (d < 150 && _b.multiplyScalar(1 / d).dot(_d) > 0.82 && G.world.los(this.dronePos, _a)) { if (G.time - e.marked > 30) G.audio.play('beep', null, { f: 1800 }); e.marked = G.time; } } }
      if (this.battery <= 0) { this.battery = 0; this.toggleDrone(); G.hud.toast('DRONE BATTERY DEPLETED', true); }
    } else this.battery = Math.min(1, this.battery + dt / 60);
  }
}

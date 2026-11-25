// Perspective-switch set piece (genre convention: the helicopter door gunner).
// MISSION 05: after boarding, ANGEL 1-2 orbits the port while BLACK COBRA's last units chase the exfil.
// The player rides the right-hand door with a minigun: mouse aims (limited arc), hold fire, watch the barrel heat.
// The helicopter's path is scripted; the shooting uses the normal ballistics (fx.fire), so hits, kills, score
// and hit markers work exactly like on foot.
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { clamp, damp } from '../core/util.js';
import { POI } from '../world/build.js';

export const GUN = { name: 'M134 DOOR GUN', cls: 'LMG', dmg: 46, rpm: 1500, vel: 900, range: [90, 320], minMul: 0.7, spread: 1.1 };
const LIFT_S = 6, ORBIT_S = 40, R = 82, ALT = 36, W = 0.12; // orbit radius (m), altitude above sea, angular speed (rad/s)
const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3(), _o = new THREE.Vector3();

export class Gunner {
  constructor() { this.active = false; this.el = null; }
  ui() {
    if (this.el) return this.el;
    const el = (this.el = document.createElement('div')); el.id = 'gunnerHud';
    el.innerHTML = '<div class="g-name">M134 DOOR GUN</div><div class="g-heat"><i></i></div><div class="g-note">HOLD FIRE · MIND THE HEAT</div><div class="g-time"></div>';
    const st = document.createElement('style');
    st.textContent = '#gunnerHud{position:fixed;right:28px;bottom:120px;width:240px;display:none;z-index:11;font-family:var(--font);text-transform:uppercase;letter-spacing:.14em;color:#e8ecea;text-shadow:0 1px 3px #000}#gunnerHud.on{display:block}#gunnerHud .g-name{font-size:15px}#gunnerHud .g-heat{height:7px;background:#fff2;margin:6px 0}#gunnerHud .g-heat i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd23a,#ff5a2a)}#gunnerHud.hot .g-heat i{background:#ff2a1a}#gunnerHud .g-note,#gunnerHud .g-time{font-size:11px;color:var(--gr)}body.gunnerOn #ammo,body.gunnerOn #slots,body.gunnerOn #gearRow{display:none}#gunnerHud.hot .g-note{color:#ff5a2a}';
    document.head.appendChild(st); document.body.appendChild(el); return el;
  }
  model() {
    if (this.gun) return this.gun;
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.45, metalness: 0.7 }), b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.42), m); body.position.z = 0.05; g.add(body);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.7, 6), m); c.rotation.x = Math.PI / 2; c.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.045, -0.5); b.add(c); }
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.03), m); grip.position.set(0, -0.02, 0.28); g.add(grip, b);
    g.position.set(0.0, -0.3, -0.55); g.userData.barrels = b; this.gun = g; return g;
  }
  /** Called by the objective's start: lift off and begin the orbit. */
  start(M) {
    const h = M.heli; if (!h) return;
    this.M = M; this.h = h; this.t = 0; this.heat = 0; this.over = false; this.cool = 0; this.rel = 0; this.pitch = -0.32; this.spin = 0; this.kills0 = M.stats.kills; this.active = true;
    this.from = h.position.clone(); this.c = { x: POI.port.x, z: POI.port.z }; this.a0 = Math.atan2(this.from.z - this.c.z, this.from.x - this.c.x);
    M.heliMode = 'gunner'; G.squad.clear(); G.enemies.clear(); G.player.frozen = true; G.weapons.root.visible = false;
    G.camera.add(this.model()); this.gun.visible = true; this.ui().classList.add('on'); document.body.classList.add('gunnerOn');
    G.hud.radio('ANGEL 1-2: Technicals and boats leaving the port — they want this bird. Door gun is yours!');
    this.waves = [[2, [['assault', -18, 10], ['assault', -10, 16], ['guard', -24, 4], ['apc', 6, 22]]], [14, [['assault', 20, -8], ['heavy', 26, -2], ['elite', 14, -14], ['assault', 30, 6]]], [26, [['elite', -6, -26], ['assault', 2, -30], ['heavy', -14, -20], ['apc', -30, -8]]]];
  }
  spawnWave(list) {
    for (const [k, dx, dz] of list) {
      const x = this.c.x + dx, z = this.c.z + dz, e = G.enemies.spawn(k, x, z, { group: 'port', squad: 'port', alert: true });
      if (e) { e.lk.copy(G.player.pos); e.goal = e.lk.clone(); }
    }
  }
  pose(dt) {
    const h = this.h, t = this.t;
    let x, y, z, yaw;
    const orb = (a) => [this.c.x + Math.cos(a) * R, this.c.z + Math.sin(a) * R];
    if (t < LIFT_S) { // climb out of the LZ and swing onto the orbit
      const k = t / LIFT_S, e = k * k * (3 - 2 * k), [ox, oz] = orb(this.a0);
      x = this.from.x + (ox - this.from.x) * e; z = this.from.z + (oz - this.from.z) * e; y = this.from.y + (ALT - this.from.y) * Math.min(1, k * 1.6);
      const fx = ox - this.from.x, fz = oz - this.from.z; yaw = Math.atan2(fx, fz);
    } else { // counter-clockwise orbit: the right-hand door faces the port
      const a = this.a0 + (t - LIFT_S) * W, [ox, oz] = orb(a); x = ox; z = oz; y = ALT + Math.sin(t * 0.7) * 1.2;
      yaw = Math.atan2(-Math.sin(a), Math.cos(a));
    }
    h.position.set(x, y, z); h.rotation.set(0.06, yaw, t < LIFT_S ? 0 : -0.12);
    return yaw;
  }
  /** Returns true when the set piece is over. */
  update(dt) {
    if (!this.active) return false;
    const I = G.input, P = G.player, cam = G.camera, h = this.h; this.t += dt;
    for (const w of this.waves) if (!w.done && this.t >= w[0]) { w.done = true; this.spawnWave(w[1]); }
    const yaw = this.pose(dt); G.weapons.root.visible = false; // the carry weapon stays slung while on the door gun
    // camera at the right-hand door, looking out to the right, limited arc
    _r.set(-Math.cos(yaw), 0, Math.sin(yaw));
    _p.copy(h.position).addScaledVector(_r, 1.45).add(_o.set(0, 2.35, 0));
    if (P.alive) { const s = 0.0022 * G.settings.sens; this.rel = clamp(this.rel - I.mx * s, -1.25, 1.25); this.pitch = clamp(this.pitch - I.my * s * (G.settings.invertY ? -1 : 1), -1.15, 0.3); }
    const camYaw = yaw + Math.PI / 2 + this.rel, shake = this.firing ? 0.004 : 0;
    P.pos.set(_p.x, _p.y - 1.68, _p.z); P.vel.set(0, 0, 0); P.yaw = camYaw; P.pitch = this.pitch; P.eye.copy(_p);
    cam.position.copy(_p); cam.rotation.set(this.pitch + (Math.random() - 0.5) * shake, camYaw + (Math.random() - 0.5) * shake, -0.05, 'YXZ'); cam.updateMatrixWorld();
    // minigun: spin up, fire, heat
    const want = P.alive && I.btn[0] && (I.locked || G.test) && !this.over;
    this.spin = damp(this.spin, want ? 1 : 0, want ? 6 : 2, dt); this.gun.userData.barrels.rotation.z += dt * this.spin * 40;
    this.firing = want && this.spin > 0.6; this.cool -= dt;
    if (this.firing) while (this.cool <= 0) {
      this.cool += 60 / GUN.rpm; this.heat += 0.0105;
      cam.getWorldDirection(_d); const s = (GUN.spread * Math.PI) / 180, a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * Math.tan(s);
      _r.setFromMatrixColumn(cam.matrixWorld, 0); _o.setFromMatrixColumn(cam.matrixWorld, 1); _d.addScaledVector(_r, Math.cos(a) * rr).addScaledVector(_o, Math.sin(a) * rr).normalize();
      G.fx.fire(_p.clone().addScaledVector(_d, 1.2), _d, GUN, 'player'); this.M.stats.shots++;
      if ((this.shotN = (this.shotN || 0) + 1) % 2 === 0) G.audio.play('shot:LMG');
    }
    if (!this.firing) this.cool = Math.max(this.cool, 0);
    this.heat = Math.max(0, this.heat - dt * (this.firing ? 0.05 : 0.32));
    if (this.heat >= 1) { this.over = true; G.hud.toast('DOOR GUN OVERHEATED'); G.audio.play('click'); } if (this.over && this.heat < 0.35) this.over = false;
    const el = this.ui(); el.querySelector('i').style.width = Math.min(100, this.heat * 100) + '%'; el.classList.toggle('hot', this.over);
    const left = Math.max(0, LIFT_S + ORBIT_S - this.t); el.querySelector('.g-time').textContent = `EXFIL IN ${Math.ceil(left)} S · KILLS ${this.M.stats.kills - this.kills0}`;
    if (left <= 0) { this.stop(); return true; }
    return false;
  }
  stop() {
    this.active = false; if (this.gun) { this.gun.visible = false; G.camera.remove(this.gun); } if (this.el) this.el.classList.remove('on'); document.body.classList.remove('gunnerOn');
    G.enemies.clear();
  }
}

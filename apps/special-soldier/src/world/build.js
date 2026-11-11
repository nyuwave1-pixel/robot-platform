// Island content: five zones (Beach, Jungle, Military Base, Underground Facility, Airport & Port).
// All geometry is procedural placeholder art (see docs/ASSET_LIST.md).
import * as THREE from 'three';
import { G } from '../core/ctx.js';
import { mulberry, fbm, TAU } from '../core/util.js';
import { MAT, FAC_Y, FAC_H, FLATS } from './world.js';

export const POI = {
  landing: { x: 0, z: 329 }, trailhead: { x: 0, z: 236 }, comms: { x: -140, z: 150 }, waterfall: { x: 190, z: 150 },
  gate: { x: 0, z: 0 }, hq: { x: 0, z: -130 }, intel: { x: 6, z: -134 }, bunker: { x: 90, z: -150 }, motor: { x: -55, z: -100 },
  fac: { x: 90, z: -150 }, hangar: { x: 40, z: -262 }, runway: { x: 110, z: -295 }, helipad: { x: 205, z: -300 }, port: { x: 60, z: -385 },
};
export const ZONES = [
  { name: 'ZONE 01 · BEACH', x: 0, z: 320, r: 95 }, { name: 'ZONE 02 · JUNGLE', x: 0, z: 150, r: 150 },
  { name: 'ZONE 03 · BLACK COBRA BASE', x: 0, z: -95, r: 135 }, { name: 'ZONE 05 · AIRFIELD & PORT', x: 100, z: -310, r: 170 },
];
const inFlat = (x, z, pad = 8) => FLATS.some((f) => x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad);

export function buildIsland() {
  const W = G.world, H = (x, z) => W.heightAt(x, z), rnd = mulberry(1337);
  const sandbags = (x, z, len, alongX = true) => { const y = H(x, z) - 0.15; alongX ? W.box(x, y, z, len, 1.15, 0.8, MAT.sand, { mat: 'sand', kind: 'cover' }) : W.box(x, y, z, 0.8, 1.15, len, MAT.sand, { mat: 'sand', kind: 'cover' }); };
  const crate = (x, z, s = 1.1, y) => W.box(x, y ?? H(x, z) - 0.05, z, s, s, s, MAT.wood, { mat: 'wood', hp: 70, kind: 'crate' });
  const ammoBox = (x, z, y) => { const yy = y ?? H(x, z); W.box(x, yy, z, 0.9, 0.5, 0.6, MAT.olive, { mat: 'metal', kind: 'cover' }); W.interactables.push({ x, y: yy + 0.5, z, r: 2.4, label: 'RESUPPLY AMMO', repeat: 20, act: () => G.weapons.resupply() }); };
  const barrel = (x, z, y) => W.box(x, y ?? H(x, z) - 0.05, z, 0.75, 1.15, 0.75, MAT.red, { mat: 'metal', hp: 25, kind: 'barrel', explosive: 6 });
  const lamp = (x, z, h = 6, light = false) => { const y = H(x, z); W.box(x, y, z, 0.18, h, 0.18, MAT.dark, { noCol: true }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), MAT.lamp); b.position.set(x, y + h, z); W.group.add(b); if (light) { const p = new THREE.PointLight(0xffe2a0, 60, 38, 1.8); p.position.set(x, y + h - 0.3, z); W.group.add(p); } };
  const container = (x, z, m, alongX = true, y) => W.box(x, y ?? H(x, z) - 0.1, z, alongX ? 6.1 : 2.5, 2.6, alongX ? 2.5 : 6.1, m, { mat: 'metal', kind: 'cover' });
  const truck = (x, z, alongX = true) => {
    const y = H(x, z), L = 6.4, Wd = 2.5, g = new THREE.Group(); g.position.set(x, y, z); if (!alongX) g.rotation.y = Math.PI / 2;
    const part = (px, py, pz, sx, sy, sz, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(px, py, pz); b.castShadow = true; g.add(b); return b; };
    part(1.9, 1.75, 0, 2.2, 1.9, 2.4, MAT.olive); part(-1.2, 2.0, 0, 4, 2.2, 2.45, MAT.olive); part(0, 0.8, 0, L, 0.5, 2.3, MAT.dark);
    for (const wx of [-2.1, -0.9, 2]) for (const wz of [-1.15, 1.15]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.4, 10), MAT.rubber); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.52, wz); g.add(w); }
    W.group.add(g);
    const c = W.addCollider({ min: new THREE.Vector3(x - (alongX ? L : Wd) / 2, y, z - (alongX ? Wd : L) / 2), max: new THREE.Vector3(x + (alongX ? L : Wd) / 2, y + 3.1, z + (alongX ? Wd : L) / 2), mat: 'metal', hp: 260, kind: 'vehicle', explosive: 8, mesh: null,
      onDestroy: () => { g.traverse((o) => { if (o.isMesh) o.material = MAT.rubber; }); g.rotation.z = 0.08; W.addCollider({ min: c.min, max: c.max.clone().setY(y + 2.4), mat: 'metal', kind: 'cover' }); } });
  };
  const tower = (x, z, h = 6.5) => {
    const y = H(x, z); for (const [ax, az] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) W.box(x + ax, y, z + az, 0.25, h, 0.25, MAT.wood, { noCol: true });
    W.box(x, y + h, z, 3.6, 0.25, 3.6, MAT.wood, { mat: 'wood' });
    W.box(x, y + h + 0.25, z - 1.7, 3.6, 0.7, 0.15, MAT.wood, { mat: 'wood' }); W.box(x, y + h + 0.25, z + 1.7, 3.6, 0.7, 0.15, MAT.wood, { mat: 'wood' });
    W.box(x - 1.7, y + h + 0.25, z, 0.15, 0.7, 3.6, MAT.wood, { mat: 'wood' }); W.box(x + 1.7, y + h + 0.25, z, 0.15, 0.7, 3.6, MAT.wood, { mat: 'wood' });
    W.box(x, y + h + 2.6, z, 4, 0.2, 4, MAT.rust, { noCol: true });
    for (const [ax, az] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) W.box(x + ax, y + h, z + az, 0.15, 2.6, 0.15, MAT.wood, { noCol: true });
    // searchlight beam (animated cone)
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 46, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x8fa8c8, transparent: true, opacity: 0.012, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.geometry.translate(0, -23, 0); beam.geometry.rotateX(-Math.PI / 2); const piv = new THREE.Group(); piv.position.set(x, y + h + 2.2, z); piv.add(beam); W.group.add(piv);
    const ph = rnd() * 6; W.animated.push((dt, t) => { piv.rotation.y = Math.sin(t * 0.25 + ph) * 1.2 + ph; piv.rotation.x = 0.16; beam.visible = G.sky.night > 0.4; });
    return { x, y: y + h + 0.25, z };
  };
  const building = (x, z, w, d, h, mat, gaps, opts = {}) => {
    const y = H(x, z) - 0.05; W.walls(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, h, mat, gaps, 0.5, opts.surf || 'concrete');
    W.box(x, y + h, z, w + 0.8, 0.35, d + 0.8, opts.roof || MAT.dark, { mat: 'metal' });
    if (opts.light !== false) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.3), MAT.lamp); l.position.set(x, y + h - 0.1, z); W.group.add(l); }
    return y;
  };
  const glass = (x, y, z, sx, sy, sz) => W.box(x, y, z, sx, sy, sz, MAT.glass, { mat: 'glass', hp: 8, kind: 'glass', seeThrough: true, noShadow: true });
  const radar = (x, z, h = 7) => { const y = H(x, z); W.box(x, y, z, 2.4, h, 2.4, MAT.concrete, {}); const dish = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 8, 0, TAU, 0, 1.1), MAT.white); dish.material.side = THREE.DoubleSide; dish.rotation.x = -1.2; const piv = new THREE.Group(); piv.position.set(x, y + h + 1.6, z); piv.add(dish); W.group.add(piv); W.animated.push((dt) => { piv.rotation.y += dt * 0.7; }); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), MAT.redLamp); bl.position.set(x, y + h + 0.2, z); W.group.add(bl); };

  // ================= ZONE 01 — BEACH =================
  sandbags(-42, 306, 7); sandbags(-46.5, 303, 5, false); sandbags(46, 300, 7); sandbags(50.5, 297, 5, false);
  sandbags(-12, 312, 5); sandbags(18, 316, 5);
  building(-44, 292, 9, 7, 3, MAT.wood, { s: [[-45.2, -42.8]] }, { surf: 'wood', roof: MAT.rust });
  POI.beachTower = tower(10, 284); tower(-70, 292); radar(72, 292);
  crate(-38, 301); crate(-36.6, 301.4); crate(52, 293); barrel(54, 294.5); barrel(-30, 298); ammoBox(-41, 296.5);
  lamp(-40, 298, 5, true); lamp(44, 296, 5, true);
  for (let i = 0; i < 9; i++) { const x = -90 + i * 22 + rnd() * 6, z = 322 + rnd() * 10, y = H(x, z); W.box(x, y - 0.2, z, 0.25, 1.3, 0.25, MAT.rust, { noCol: true }); W.box(x, y + 0.5, z, 1.8, 0.2, 0.2, MAT.rust, { noCol: true }); } // beach obstacles
  // ================= ZONE 02 — JUNGLE: comms station, waterfall, cave =================
  { const c = POI.comms, y = H(c.x, c.z);
    building(c.x - 14, c.z + 8, 10, 8, 3.2, MAT.concrete, { e: [[c.z + 6.8, c.z + 9.2]] });
    W.box(c.x - 16, y, c.z + 6, 1, 1.4, 3, MAT.metal, { mat: 'metal' }); const scr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 2), MAT.screen); scr.position.set(c.x - 15.45, y + 1.2, c.z + 6); W.group.add(scr);
    // lattice tower (visual) + collider core
    const tg = new THREE.Group(); tg.position.set(c.x, y, c.z);
    for (const [ax, az] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 34, 0.22), MAT.metal); l.position.set(ax * 0.6, 17, az * 0.6); l.rotation.set(az * 0.018, 0, -ax * 0.018); l.castShadow = true; tg.add(l); }
    for (let i = 1; i < 9; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(2.6 - i * 0.14, 0.12, 2.6 - i * 0.14), MAT.metal); r.position.y = i * 3.8; tg.add(r); }
    for (const a of [0.5, 2.6, 4.4]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 12), MAT.white); d.rotation.z = Math.PI / 2; d.rotation.y = a; d.position.set(Math.cos(a) * 1.3, 24 + a * 1.5, Math.sin(a) * 1.3); tg.add(d); }
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), MAT.redLamp); bl.position.y = 34.3; tg.add(bl); W.group.add(tg);
    POI.commsTower = { group: tg, col: W.addCollider({ min: new THREE.Vector3(c.x - 1.3, y, c.z - 1.3), max: new THREE.Vector3(c.x + 1.3, y + 30, c.z + 1.3), mat: 'metal', noStand: true }) };
    W.animated.push((dt, t) => { bl.visible = Math.sin(t * 4) > 0; });
    W.box(c.x + 8, y, c.z - 6, 3, 2.2, 2, MAT.olive, { mat: 'metal', kind: 'cover' }); // generator
    sandbags(c.x + 18, c.z + 22, 7); sandbags(c.x - 4, c.z + 26, 6); sandbags(c.x + 24, c.z + 4, 6, false); sandbags(c.x + 6, c.z + 14, 4);
    crate(c.x + 6, c.z + 5); crate(c.x + 7.3, c.z + 5.2); barrel(c.x + 10, c.z - 3); ammoBox(c.x - 8, c.z + 3); tower(c.x + 26, c.z + 26); lamp(c.x + 4, c.z + 10, 6, true);
  }
  { const p = POI.waterfall, y = H(p.x, p.z); // rock cliff + falling water + pond + cave shelter
    for (let i = 0; i < 7; i++) W.box(p.x - 12 + i * 4, y - 1, p.z - 8 - (i % 2) * 1.5, 4.6, 13 + (i % 3) * 2.5, 5, MAT.rock, { mat: 'concrete' });
    const wt = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 32, height: 128 })); { const g = wt.image.getContext('2d'); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(220,240,255,${0.15 + rnd() * 0.5})`; g.fillRect(rnd() * 32, rnd() * 128, 1 + rnd() * 2, 6 + rnd() * 22); } } wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(6, 14), new THREE.MeshBasicMaterial({ map: wt, transparent: true, opacity: 0.85, depthWrite: false })); fall.position.set(p.x, y + 6, p.z - 5.4); W.group.add(fall);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(9, 20), new THREE.MeshStandardMaterial({ color: 0x1d4a50, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.85 })); pond.rotation.x = -Math.PI / 2; pond.position.set(p.x, y + 0.12, p.z + 3); W.group.add(pond);
    W.animated.push((dt, t) => { wt.offset.y = t * 1.6; if (G.player && Math.hypot(G.player.pos.x - p.x, G.player.pos.z - p.z) < 60 && Math.random() < 0.3) G.fx.puff(p.x + (Math.random() - 0.5) * 5, y + 0.6, p.z - 4.5, 0xdff4ff, 2.4, 1.2, 0.35); });
    POI.waterfallY = y;
    // cave: rock shelter with supply cache
    const cx = p.x + 22, cz = p.z - 2, cy = H(cx, cz); W.box(cx - 4, cy - 0.5, cz, 2, 4.5, 9, MAT.rock, {}); W.box(cx + 4, cy - 0.5, cz, 2, 4.5, 9, MAT.rock, {}); W.box(cx, cy - 0.5, cz - 4.5, 10, 4.5, 2, MAT.rock, {}); W.box(cx, cy + 3.6, cz, 10.5, 1.6, 10, MAT.rock, {});
    ammoBox(cx, cz - 2.4, cy); W.interactables.push({ x: cx - 1.5, y: cy + 0.5, z: cz - 2.4, r: 2.2, label: 'TAKE MED KIT', once: true, act: () => { G.player.medkits++; G.hud.toast('MED KIT +1'); } });
  }
  // ================= ZONE 03 — MILITARY BASE =================
  { const y = 16;
    W.walls(-120, -185, 120, 0, y, 3.2, MAT.concrete, { s: [[-6, 6]], n: [[-6, 6]], e: [[-154, -146]] }, 0.8);
    for (const [tx, tz] of [[-112, -8], [112, -8], [-112, -177], [112, -177]]) tower(tx, tz, 7);
    sandbags(-10, -10, 6); sandbags(11, -12, 6); sandbags(0, -26, 8); W.box(-7.5, y, 2, 1, 1.2, 1, MAT.red, {}); W.box(7.5, y, 2, 1, 1.2, 1, MAT.red, {});
    // barracks ×2
    building(62, -40, 26, 12, 3.4, MAT.olive, { w: [[-41.5, -38.5]], n: [[55, 58]] }); building(62, -72, 26, 12, 3.4, MAT.olive, { w: [[-73.5, -70.5]] });
    for (const bz of [-40, -72]) for (let i = 0; i < 4; i++) W.box(54 + i * 5.5, y, bz + 3.6, 2, 0.6, 1, MAT.dark, { mat: 'metal' });
    // armory / warehouse
    building(-72, -48, 30, 20, 5, MAT.metal, { e: [[-51, -45]], s: [[-80, -76]] }, { surf: 'metal', roof: MAT.rust });
    for (let i = 0; i < 6; i++) crate(-82 + (i % 3) * 7, -54 + ((i / 3) | 0) * 7, 1.4, y); crate(-82, -54, 1.2, y + 1.4); barrel(-62, -41, y); barrel(-61, -42.2, y); ammoBox(-66, -55, y);
    W.box(-70, y, -48, 4, 1.1, 1.2, MAT.dark, { mat: 'metal', kind: 'cover' });
    // HQ: two rooms, windows, intel terminal
    building(0, -132, 28, 18, 4, MAT.concrete, { s: [[-10, -6], [-2, 2], [6, 10]], e: [[-131, -128]], w: [[-136, -133]] });
    W.box(0, y, -134, 0.4, 4, 9, MAT.concrete, {}); // partition (leaves gaps both ends)
    glass(-8, y, -123, 4, 4, 0.3); glass(8, y, -123, 4, 4, 0.3); // HQ front windows (breakable)
    W.box(8, y, -138, 5, 1, 1.4, MAT.dark, { mat: 'metal', kind: 'cover' }); W.box(-7, y, -136, 3, 1, 1.4, MAT.dark, { mat: 'metal', kind: 'cover' });
    const scr = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.1), MAT.screen); scr.position.set(8, y + 1.6, -138.5); W.group.add(scr);
    POI.intel = { x: 8, y: y + 1.2, z: -137 };
    // comms hut + radar, motor pool
    building(-78, -152, 12, 10, 3.4, MAT.concrete, { e: [[-153.5, -150.5]] }); radar(-92, -168, 8);
    truck(-62, -92); truck(-62, -100); truck(-40, -112, false); container(-30, -88, MAT.rust); container(-30, -84.5, MAT.blue, true, y + 0); container(-84, -112, MAT.olive, false);
    barrel(-48, -92, y); barrel(-47, -93.2, y); sandbags(-48, -122, 7); sandbags(-20, -70, 7, false);
    // bunker (elevator to underground facility)
    building(90, -150, 12, 12, 3.6, MAT.dark, { w: [[-152, -148]] }, { roof: MAT.concrete });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), MAT.metal); pad.position.set(92, y + 0.05, -150); W.group.add(pad);
    const rl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), MAT.redLamp); rl.position.set(84, y + 3.3, -150); W.group.add(rl);
    // yard clutter / cover lanes
    sandbags(30, -100, 7); sandbags(-18, -105, 6); sandbags(40, -128, 6, false); container(28, -60, MAT.blue, false); container(96, -100, MAT.rust); container(96, -96.6, MAT.olive);
    crate(20, -82, 1.2, y); crate(21.4, -82.3, 1.2, y); crate(60, -112, 1.3, y); barrel(34, -62, y); barrel(70, -120, y); barrel(-100, -70, y); ammoBox(24, -98, y);
    W.box(0, y, -60, 3, 0.2, 3, MAT.concrete, { noCol: true }); W.box(0, y, -60, 0.25, 11, 0.25, MAT.metal, {}); // flag pole
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8, 6, 2), new THREE.MeshStandardMaterial({ color: 0x151515, side: THREE.DoubleSide, emissive: 0x3a0505 })); flag.position.set(1.6, y + 9.8, -60); W.group.add(flag);
    W.animated.push((dt, t) => { const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2 + t * 5) * 0.18 * (p.getX(i) + 1.5) * G.sky.wind); p.needsUpdate = true; });
    for (const [lx, lz, on] of [[-30, -20, 1], [30, -20, 0], [-30, -80, 0], [30, -80, 1], [-30, -160, 0], [40, -165, 1], [80, -120, 0], [-95, -90, 0]]) lamp(lx, lz, 7, !!on);
  }
  // fence line between base north gate and airfield
  for (const sx of [-1, 1]) W.box(sx * 12, 14.5, -210, 0.15, 3, 46, MAT.fence, { mat: 'metal', thin: true, seeThrough: true, noShadow: true });
  // ================= ZONE 05 — AIRFIELD & PORT =================
  { const y = 7;
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(300, 26), new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.85 })); rw.rotation.x = -Math.PI / 2; rw.position.set(105, y + 0.04, -296); rw.receiveShadow = true; W.group.add(rw);
    for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.6), new THREE.MeshBasicMaterial({ color: 0xcfcfc0 })); s.rotation.x = -Math.PI / 2; s.position.set(-30 + i * 21, y + 0.06, -296); W.group.add(s); }
    // hangar (facility exit elevator inside) — open to the north (runway side)
    building(40, -262, 40, 24, 9, MAT.metal, { n: [[26, 54]] }, { surf: 'metal', roof: MAT.rust });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), MAT.metal); pad.position.set(40, y + 0.05, -256); W.group.add(pad);
    crate(28, -256, 1.4, y); crate(29.6, -256, 1.4, y); container(52, -254, MAT.olive, true, y); ammoBox(34, -253, y);
    building(120, -262, 16, 12, 9, MAT.concrete, { n: [[118, 122]] }); const ct = new THREE.Mesh(new THREE.BoxGeometry(9, 3, 9), MAT.glass); ct.position.set(120, y + 10.7, -262); W.group.add(ct); W.box(120, y + 12.2, -262, 10, 0.3, 10, MAT.dark, { noCol: true });
    // helipad
    const hp = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 0.12, 28), new THREE.MeshStandardMaterial({ color: 0x2a2c2e, roughness: 0.8 })); hp.position.set(POI.helipad.x, y + 0.06, POI.helipad.z); W.group.add(hp);
    const ring = new THREE.Mesh(new THREE.RingGeometry(8.6, 9.2, 32), new THREE.MeshBasicMaterial({ color: 0xe8e060 })); ring.rotation.x = -Math.PI / 2; ring.position.set(POI.helipad.x, y + 0.14, POI.helipad.z); W.group.add(ring);
    for (const [ax, az, sx, sz] of [[-2.4, 0, 0.9, 7], [2.4, 0, 0.9, 7], [0, 0, 4.2, 0.9]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ color: 0xf0f0e8 })); m.rotation.x = -Math.PI / 2; m.position.set(POI.helipad.x + ax, y + 0.15, POI.helipad.z + az); W.group.add(m); }
    sandbags(190, -286, 7); sandbags(220, -288, 7); sandbags(188, -314, 6); sandbags(222, -312, 6); sandbags(205, -282, 5); sandbags(186, -300, 5, false); container(232, -300, MAT.blue, false, y); container(176, -318, MAT.rust, true, y);
    ammoBox(205, -310, y); barrel(170, -284, y);
    // runway cover + parked vehicles + fuel
    truck(80, -280); truck(150, -312, false); container(100, -280, MAT.rust, true, y); container(60, -312, MAT.blue, true, y); container(130, -280, MAT.olive, true, y); sandbags(110, -305, 8); sandbags(85, -300, 6, false); sandbags(140, -296, 6, false);
    W.box(0, y, -300, 6, 3.4, 6, MAT.white, { mat: 'metal', hp: 120, kind: 'tank', explosive: 10 }); barrel(6, -296, y); barrel(7, -297.4, y);
    for (let i = 0; i < 8; i++) lamp(-40 + i * 40, -278, 5, i === 2 || i === 6);
    // port: quay, cranes, cargo ship
    const py = 2.2; for (let i = 0; i < 5; i++) container(10 + i * 9, -368 - (i % 2) * 4, [MAT.rust, MAT.blue, MAT.olive][i % 3], i % 2 === 0, py); container(19, -368, MAT.blue, true, py + 2.6);
    W.box(100, py, -372, 1.2, 18, 1.2, MAT.rust, {}); W.box(100, py + 18, -380, 1.6, 1.2, 26, MAT.rust, { noCol: true }); lamp(40, -356, 7, true); lamp(100, -356, 7);
    const hull = W.box(55, -1.5, -452, 96, 9, 20, MAT.dark, { mat: 'metal' }); W.box(88, 7.5, -452, 16, 10, 16, MAT.white, { mat: 'metal' }); W.box(88, 17.5, -452, 6, 3, 6, MAT.red, { noCol: true });
    for (let i = 0; i < 9; i++) W.box(14 + i * 7, 7.5, -452 + ((i % 3) - 1) * 5, 6.1, 2.6 * (1 + (i % 2)), 2.5, [MAT.rust, MAT.blue, MAT.olive, MAT.red][i % 4], { mat: 'metal' });
    W.box(55, 1.6, -432, 60, 0.6, 22, MAT.concrete, {}); // pier
  }
  buildFacility();
  buildVegetation(rnd);
  W.finalize();
}

// ================= ZONE 04 — UNDERGROUND FACILITY =================
function buildFacility() {
  const W = G.world, ox = POI.fac.x, oz = POI.fac.z, y = FAC_Y, h = FAC_H, WM = MAT.white, DM = MAT.dark;
  const L = (x, z) => [ox + x, oz + z];
  const room = (x0, z0, x1, z1, gaps, mat = WM) => {
    const g = {}; for (const k in gaps) g[k] = gaps[k].map(([a, b]) => (k === 'n' || k === 's') ? [ox + a, ox + b] : [oz + a, oz + b]);
    W.walls(ox + x0, oz + z0, ox + x1, oz + z1, y, h, mat, g, 0.5, 'metal');
    const fl = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 1, 0.3, z1 - z0 + 1), MAT.dark); fl.position.set(ox + (x0 + x1) / 2, y - 0.15, oz + (z0 + z1) / 2); fl.receiveShadow = true; W.statics.push(fl);
    const cl = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 1, 0.3, z1 - z0 + 1), MAT.concrete); cl.position.set(ox + (x0 + x1) / 2, y + h + 0.15, oz + (z0 + z1) / 2); W.statics.push(cl);
  };
  const light = (x, z, red, on) => { const [wx, wz] = L(x, z); const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), red ? MAT.redLamp : MAT.lamp); m.position.set(wx, y + h - 0.06, wz); W.group.add(m); if (on) { const p = new THREE.PointLight(red ? 0xff3020 : 0xdfeaff, red ? 90 : 170, 30, 1.6); p.position.set(wx, y + h - 0.5, wz); W.group.add(p); if (red) W.animated.push((dt, t) => { p.intensity = 60 + Math.sin(t * 5 + x) * 40; }); } };
  // A: elevator hall  (z 8 → -16)
  room(-8, -16, 8, 8, { n: [[-2.5, 2.5]] }); light(0, -4, false, true); light(-5, 4, true, false);
  { const [px, pz] = L(0, 4); const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), MAT.metal); pad.position.set(px, y + 0.05, pz); W.group.add(pad); }
  W.box(...ins(L(-5, -10), y), 2.4, 1.1, 1.2, DM, { mat: 'metal', kind: 'cover' }); W.box(...ins(L(5, -12), y), 1.2, 1.1, 2.4, DM, { mat: 'metal', kind: 'cover' });
  // B: corridor with cameras
  room(-2.5, -46, 2.5, -16, { n: [[-2.5, 2.5]], s: [[-2.5, 2.5]] }); light(0, -24, true, true); light(0, -38, true, false);
  POI.cameras = [];
  for (const [cx, cz] of [[2, -25], [-2, -41]]) { const [wx, wz] = L(cx, cz); const g = new THREE.Group(); g.position.set(wx, y + h - 0.5, wz); const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.55), DM); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), MAT.redLamp); lens.position.z = 0.3; g.add(b, lens); W.group.add(g);
    const col = W.addCollider({ min: new THREE.Vector3(wx - 0.3, y + h - 0.8, wz - 0.35), max: new THREE.Vector3(wx + 0.3, y + h - 0.2, wz + 0.35), mat: 'metal', hp: 10, kind: 'camera', mesh: g, pass: true, onDestroy: () => { cam.dead = true; G.fx.sparks(wx, y + h - 0.5, wz, 10); } });
    const cam = { x: wx, y: y + h - 0.5, z: wz, g, dead: false, col }; POI.cameras.push(cam); W.animated.push((dt, t) => { if (!cam.dead) g.rotation.y = Math.sin(t * 0.7 + cx) * 0.7; }); }
  // security door (opened by mission script)
  { const [dx, dz] = L(0, -46); POI.secDoor = W.box(dx, y, dz, 5, h, 0.4, MAT.rust, { mat: 'metal', dynamic: true }); POI.secDoorPos = { x: dx, y: y + 1.3, z: dz + 1.6 }; }
  // C: laboratory with glass partitions
  room(-14, -76, 14, -46, { s: [[-2.5, 2.5]], n: [[-2.5, 2.5]], e: [[-63, -59]] }); light(-7, -55, false, true); light(7, -68, false, true); light(0, -61, true, false);
  for (const gx of [-9, -5, 5, 9]) W.box(...ins(L(gx, -61), y), 3.9, h - 0.4, 0.2, MAT.glass, { mat: 'glass', hp: 8, kind: 'glass', seeThrough: true, noShadow: true });
  for (const [tx, tz, sx, sz] of [[-8, -53, 5, 1.4], [8, -53, 5, 1.4], [-8, -69, 5, 1.4], [6, -70, 1.4, 5], [0, -56, 1.4, 3]]) W.box(...ins(L(tx, tz), y), sx, 1.05, sz, WM, { mat: 'metal', kind: 'cover' });
  for (const [tx, tz] of [[-12, -72], [12, -49]]) W.box(...ins(L(tx, tz), y), 1.4, 2.6, 1.4, MAT.blue, { mat: 'metal', kind: 'cover' });
  // F: bio vault (east of lab)
  room(14, -70, 34, -52, { w: [[-63, -59]] }, DM); light(24, -61, true, true);
  { const [vx, vz] = L(29, -61); W.box(vx, y, vz, 1.6, 1.0, 1.6, MAT.metal, { mat: 'metal' }); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0x60ff90, emissive: 0x30ff60, emissiveIntensity: 2.5, transparent: true, opacity: 0.85 })); s.position.set(vx, y + 1.5, vz); W.group.add(s); POI.sample = { x: vx - 1.4, y: y + 1.2, z: vz, mesh: s }; }
  for (const [tx, tz] of [[19, -56], [19, -66], [26, -55]]) W.box(...ins(L(tx, tz), y), 1.5, 1.3, 1.5, MAT.olive, { mat: 'metal', kind: 'cover' });
  // D: corridor, E: server room
  room(-2.5, -90, 2.5, -76, { n: [[-2.5, 2.5]], s: [[-2.5, 2.5]] }); light(0, -83, true, true);
  room(-13, -118, 13, -90, { s: [[-2.5, 2.5]] }, DM); light(-6, -98, false, true); light(6, -110, true, true);
  for (const rx of [-9, -4.5, 4.5, 9]) for (const rz of [-97, -105]) { const [wx, wz] = L(rx, rz); W.box(wx, y, wz, 1.1, 2.7, 4.6, DM, { mat: 'metal', kind: 'cover' }); const s = new THREE.Mesh(new THREE.BoxGeometry(1.14, 2.2, 0.06), MAT.screen); s.position.set(wx, y + 1.4, wz + 2.31); W.group.add(s); }
  { const [tx, tz] = L(4, -116); W.box(tx, y, tz, 3, 1.1, 1, MAT.metal, { mat: 'metal' }); const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 0.1), MAT.screen); s.position.set(tx, y + 1.8, tz - 0.3); W.group.add(s); POI.server = { x: tx, y: y + 1.3, z: tz + 1.3 }; }
  { const [ex, ez] = L(-9, -114); const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), MAT.metal); pad.position.set(ex, y + 0.05, ez); W.group.add(pad); POI.exitLift = { x: ex, y: y + 1, z: ez }; }
  POI.facSpawn = { x: ox, y, z: oz + 4 }; POI.facL = L;
}
const ins = (p, y) => [p[0], y, p[1]];

// ================= Vegetation (GPU instanced, wind sway in vertex shader) =================
export const windUniform = { value: 0 }, windStrength = { value: 1 };
function swayMaterial(mat, amp) {
  mat.onBeforeCompile = (s) => { s.uniforms.uT = windUniform; s.uniforms.uW = windStrength;
    s.vertexShader = 'uniform float uT; uniform float uW;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float ph = instanceMatrix[3][0]*0.31 + instanceMatrix[3][2]*0.17;
      float k = max(0.0, position.y) * ${amp.toFixed(3)} * uW;
      transformed.x += sin(uT*1.7 + ph) * k; transformed.z += cos(uT*1.3 + ph*1.3) * k * 0.7;
      #endif`); };
  return mat;
}
function buildVegetation(rnd) {
  const W = G.world, dummy = new THREE.Object3D();
  const place = (mesh, list) => { list.forEach((p, i) => { dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.tx || 0, p.r, p.tz || 0); dummy.scale.setScalar(p.s); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }); mesh.count = list.length; mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; W.group.add(mesh); };
  // jungle trees
  const trunks = [], palms = [], rocks = [], ferns = [];
  for (let i = 0; i < 5200; i++) {
    const x = (rnd() - 0.5) * 860, z = (rnd() - 0.5) * 860, h = W.heightAt(x, z);
    if (h < 2.8 || inFlat(x, z, 6)) continue;
    const dens = fbm(x * 0.012 + 3, z * 0.012, 2); if (dens < 0.36) continue;
    if (Math.abs(x) < 5 + fbm(z * 0.05, 1, 2) * 4 && z > 0 && z < 300) continue; // trail from the beach to the base gate
    if (Math.hypot(x - POI.waterfall.x, z - POI.waterfall.z) < 16) continue;
    trunks.push({ x, y: h - 0.3, z, r: rnd() * 6, s: 0.8 + rnd() * 0.9, tx: (rnd() - 0.5) * 0.12, tz: (rnd() - 0.5) * 0.12 });
  }
  for (let i = 0; i < 900; i++) { const a = rnd() * TAU, r = 300 + rnd() * 110, x = Math.cos(a) * r, z = Math.sin(a) * r, h = W.heightAt(x, z); if (h < 1.1 || h > 5 || inFlat(x, z, 4)) continue; if (Math.abs(x) < 7 && z > 300) continue; palms.push({ x, y: h - 0.3, z, r: rnd() * 6, s: 0.8 + rnd() * 0.6, tx: (rnd() - 0.5) * 0.3, tz: (rnd() - 0.5) * 0.3 }); }
  for (let i = 0; i < 420; i++) { const x = (rnd() - 0.5) * 900, z = (rnd() - 0.5) * 900, h = W.heightAt(x, z); if (h < -1.5 || inFlat(x, z, 3)) continue; rocks.push({ x, y: h - 0.3, z, r: rnd() * 6, s: 0.5 + rnd() * rnd() * 3.2, tx: rnd(), tz: rnd() }); }
  for (let i = 0; i < 9000; i++) { const x = (rnd() - 0.5) * 820, z = (rnd() - 0.5) * 820, h = W.heightAt(x, z); if (h < 2.6 || inFlat(x, z, 1)) continue; ferns.push({ x, y: h - 0.05, z, r: rnd() * 6, s: 0.6 + rnd() * 1.1 }); }
  const bark = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 1 }), leaf = swayMaterial(new THREE.MeshStandardMaterial({ color: 0x1f5a22, roughness: 0.9, side: THREE.DoubleSide }), 0.012), palmLeaf = swayMaterial(new THREE.MeshStandardMaterial({ color: 0x3c7a2c, roughness: 0.85, side: THREE.DoubleSide }), 0.018), fernMat = swayMaterial(new THREE.MeshStandardMaterial({ color: 0x2c6a26, roughness: 0.9, side: THREE.DoubleSide }), 0.12);
  const tg = new THREE.CylinderGeometry(0.22, 0.42, 9, 6); tg.translate(0, 4.5, 0);
  const cg = (() => { const a = new THREE.IcosahedronGeometry(3.4, 1); a.scale(1, 0.7, 1); a.translate(0, 9.6, 0); const b = new THREE.IcosahedronGeometry(2.5, 0); b.scale(1, 0.6, 1); b.translate(1.4, 7.2, 0.8); const c = new THREE.IcosahedronGeometry(2.2, 0); c.scale(1, 0.6, 1); c.translate(-1.2, 11.2, -0.6); return mergeGeo([a, b, c]); })();
  place(new THREE.InstancedMesh(tg, bark, trunks.length), trunks); place(new THREE.InstancedMesh(cg, leaf, trunks.length), trunks);
  const pg = new THREE.CylinderGeometry(0.16, 0.3, 8.5, 6); pg.translate(0, 4.25, 0);
  const pl = (() => { const gs = []; for (let i = 0; i < 7; i++) { const f = new THREE.PlaneGeometry(0.9, 4.4, 1, 4); f.translate(0, 2.2, 0); const p = f.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k); p.setZ(k, -yy * yy * 0.09); } f.rotateX(1.05); f.rotateY((i / 7) * TAU); f.translate(0, 8.4, 0); gs.push(f); } return mergeGeo(gs); })();
  place(new THREE.InstancedMesh(pg, bark, palms.length), palms); place(new THREE.InstancedMesh(pl, palmLeaf, palms.length), palms);
  place(new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), MAT.rock, rocks.length), rocks);
  const fg = (() => { const gs = []; for (let i = 0; i < 7; i++) { const f = new THREE.BufferGeometry(), a = (i / 7) * TAU, hgt = 0.7 + (i % 3) * 0.22; f.setAttribute('position', new THREE.Float32BufferAttribute([-0.09, 0, 0, 0.09, 0, 0, 0, hgt, 0.34], 3)); f.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.8, -0.6, 0, 0.8, -0.6, 0, 0.8, -0.6], 3)); f.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); f.rotateY(a); f.translate(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1); gs.push(f); } return mergeGeo(gs); })();
  const fm = new THREE.InstancedMesh(fg, fernMat, ferns.length); place(fm, ferns); fm.castShadow = false;
  // tree + big rock collisions
  for (const t of trunks) W.addCollider({ min: new THREE.Vector3(t.x - 0.3, t.y, t.z - 0.3), max: new THREE.Vector3(t.x + 0.3, t.y + 8, t.z + 0.3), mat: 'wood', noStand: true, kind: 'tree' });
  for (const t of palms) W.addCollider({ min: new THREE.Vector3(t.x - 0.22, t.y, t.z - 0.22), max: new THREE.Vector3(t.x + 0.22, t.y + 7, t.z + 0.22), mat: 'wood', noStand: true, kind: 'tree' });
  for (const r of rocks) if (r.s > 1.3) W.addCollider({ min: new THREE.Vector3(r.x - r.s * 0.7, r.y - 1, r.z - r.s * 0.7), max: new THREE.Vector3(r.x + r.s * 0.7, r.y + r.s * 0.75, r.z + r.s * 0.7), mat: 'concrete', kind: 'cover' });
  W.vegCount = { trees: trunks.length, palms: palms.length, rocks: rocks.length, ferns: ferns.length };
}
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const mergeGeo = (a) => mergeGeometries(a);

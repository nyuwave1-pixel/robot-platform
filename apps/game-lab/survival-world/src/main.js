// SURVIVAL WORLD — browser side (three.js r170, vendored). Rules live in ./logic.js; this file draws the island and turns
// keys and mouse into actions. Controls: click to look (pointer lock) · WASD move · Shift sprint · E gather · F drink ·
// Q eat · left click attack / gather · C craft · B build (R rotate, click place, Esc leave) · ?seed=123 picks the world.
import * as THREE from 'three';
import { newGame, step, heightAt, biomeAt, gather, craft, eat, drink, canDrink, place, canPlace, attack, nearestNode, movePlayer, isNight, dayPhase, nearFire,
  save, load, ITEMS, RECIPES, NODE, WORLD, DAY, REACH, snap } from './logic.js';
import { createPortal } from './portal.js';

const $ = (s) => document.querySelector(s);
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private */ } } };
const SAVE = 'survival-world.save';
const portal = createPortal('survival-world'); portal.ready();

// ------------------------------------------------------------ renderer, sky, light
const canvas = $('#view'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = false;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 1, 0.1, 600);
scene.fog = new THREE.Fog(0x9cc4d8, 60, 260);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a5a32, 0.9), sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
scene.add(hemi, sun, sun.target);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let G = null, world = null, inst = {}, fireMeshes = new Map(), wallMeshes = new Map(), wolfMeshes = new Map(), ghost = null;
let yaw = 0, pitch = 0, keys = new Set(), buildKind = null, buildRot = 0, lastSave = 0, ended = false, msgs = [];

// ------------------------------------------------------------ world meshes
const BIOME_COL = { water: [0.83, 0.77, 0.55], beach: [0.86, 0.79, 0.56], grass: [0.36, 0.56, 0.24], forest: [0.24, 0.42, 0.18], rock: [0.5, 0.48, 0.44] };
function buildWorld() {
  for (const o of [...scene.children]) if (o.userData.world) scene.remove(o);
  const seed = G.seed, seg = 168, geo = new THREE.PlaneGeometry(WORLD, WORLD, seg, seg); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = heightAt(seed, x, z); pos.setY(i, h);
    const c = BIOME_COL[biomeAt(seed, x, z, h)], shade = 0.9 + 0.1 * Math.sin(x * 0.7) * Math.cos(z * 0.6);
    col.set([c[0] * shade, c[1] * shade, c[2] * shade], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); ground.userData.world = true; ground.name = 'ground';
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2b6f8c, transparent: true, opacity: 0.82 }));
  sea.position.y = 0.05; sea.userData.world = true;
  scene.add(ground, sea);
  // instanced resource nodes: trees = trunk + canopy, rocks, bushes
  const byKind = { tree: [], rock: [], bush: [] }; for (const n of G.world.nodes) byKind[n.kind].push(n);
  const mk = (g, m, list) => { const im = new THREE.InstancedMesh(g, m, list.length); im.userData.world = true; scene.add(im); return im; };
  inst = {
    trunk: mk(new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6).translate(0, 1.2, 0), new THREE.MeshLambertMaterial({ color: 0x6b4a2b }), byKind.tree),
    canopy: mk(new THREE.ConeGeometry(1.5, 3.6, 7).translate(0, 3.6, 0), new THREE.MeshLambertMaterial({ color: 0x2f6a2c }), byKind.tree),
    rock: mk(new THREE.DodecahedronGeometry(0.9, 0).translate(0, 0.4, 0), new THREE.MeshLambertMaterial({ color: 0x8a8680, flatShading: true }), byKind.rock),
    bush: mk(new THREE.IcosahedronGeometry(0.75, 0).translate(0, 0.55, 0), new THREE.MeshLambertMaterial({ color: 0x4f8a3a, flatShading: true }), byKind.bush),
  };
  inst.lists = byKind; refreshNodes();
  ghost = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.3).translate(0, 1.1, 0), new THREE.MeshBasicMaterial({ color: 0x8fe08a, transparent: true, opacity: 0.45 }));
  ghost.visible = false; ghost.userData.world = true; scene.add(ghost);
  for (const m of [...fireMeshes.values(), ...wallMeshes.values(), ...wolfMeshes.values()]) scene.remove(m);
  fireMeshes.clear(); wallMeshes.clear(); wolfMeshes.clear();
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function refreshNodes() {
  const set = (im, list, scaleOf) => { list.forEach((n, i) => { const k = n.hp > 0 ? scaleOf(n) : 0.0001; _q.setFromAxisAngle(_up, n.id * 1.7); _s.set(k, k, k); _p.set(n.x, n.y - 0.1, n.z); im.setMatrixAt(i, _m.compose(_p, _q, _s)); }); im.instanceMatrix.needsUpdate = true; };
  const size = (n) => 0.8 + ((n.id * 37) % 10) / 20;
  set(inst.trunk, inst.lists.tree, size); set(inst.canopy, inst.lists.tree, size); set(inst.rock, inst.lists.rock, size); set(inst.bush, inst.lists.bush, size);
}
function syncStructures() {
  for (const s of G.structures) {
    const key = `${s.kind}:${s.x}:${s.z}`, map = s.kind === 'campfire' ? fireMeshes : wallMeshes; if (map.has(key)) continue;
    const y = heightAt(G.seed, s.x, s.z); let m;
    if (s.kind === 'campfire') {
      m = new THREE.Group(); const stones = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.15, 5, 10).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x77736c }));
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 7).translate(0, 0.45, 0), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
      const light = new THREE.PointLight(0xff9a40, 18, 14, 1.6); light.position.y = 1; m.add(stones, flame, light); m.userData.flame = flame;
    } else m = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.3).translate(0, 1.1, 0), new THREE.MeshLambertMaterial({ color: 0x8a6440 }));
    m.position.set(s.x, y, s.z); m.rotation.y = s.rot || 0; scene.add(m); map.set(key, m);
  }
}
function syncWolves() {
  const alive = new Set(G.wolves.map((w) => w.id));
  for (const [id, m] of wolfMeshes) if (!alive.has(id)) { scene.remove(m); wolfMeshes.delete(id); }
  for (const w of G.wolves) {
    let m = wolfMeshes.get(w.id);
    if (!m) {
      m = new THREE.Group(); const mat = new THREE.MeshLambertMaterial({ color: 0x4a4a52 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), mat); body.position.y = 0.6;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 5).rotateX(Math.PI / 2), mat); head.position.set(0, 0.8, 0.75);
      const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0xffe066 })); eyes.position.set(0, 0.88, 0.62);
      m.add(body, head, eyes); scene.add(m); wolfMeshes.set(w.id, m);
    }
    const y = heightAt(G.seed, w.x, w.z); m.rotation.y = Math.atan2(G.player.x - w.x, G.player.z - w.z); m.position.set(w.x, Math.max(0, y), w.z);
  }
}

// ------------------------------------------------------------ sky / time of day
const SKY_DAY = new THREE.Color(0x9cc4d8), SKY_DUSK = new THREE.Color(0xd8895a), SKY_NIGHT = new THREE.Color(0x0b1424);
function lightFor(dt) {
  const k = dayPhase(G), a = (k - 0.25) * Math.PI * 2, elev = Math.sin(a + Math.PI / 2);   // noon at 0.5
  const day = Math.max(0, Math.min(1, (Math.cos((k - 0.5) * Math.PI * 2) + 0.35) / 1.0));
  const glow = Math.max(0, 1 - Math.abs(k - 0.77) / 0.06, 1 - Math.abs(k - 0.24) / 0.05);   // sunset ~18:30, sunrise ~05:45
  const c = new THREE.Color().copy(SKY_NIGHT).lerp(SKY_DAY, day).lerp(SKY_DUSK, glow * 0.7);
  scene.background = c; scene.fog.color.copy(c);
  sun.intensity = 0.15 + 1.6 * day; hemi.intensity = 0.25 + 0.75 * day;
  sun.position.set(G.player.x + Math.cos(a) * 80, 20 + Math.max(0, elev) * 90, G.player.z + 40); sun.target.position.set(G.player.x, 0, G.player.z);
  for (const m of fireMeshes.values()) { const f = m.userData.flame; f.scale.y = 0.85 + Math.sin(performance.now() * 0.02 + m.position.x) * 0.15; }
}

// ------------------------------------------------------------ input
canvas.addEventListener('click', () => { if (!G || ended || !$('#panel').hidden) return; if (document.pointerLockElement !== canvas) canvas.requestPointerLock(); else primary(); });
addEventListener('mousemove', (e) => { if (document.pointerLockElement !== canvas) return; yaw -= e.movementX * 0.0025; pitch = Math.max(-1.4, Math.min(1.4, pitch - e.movementY * 0.0025)); });
addEventListener('keydown', (e) => {
  keys.add(e.code); if (!G || ended) return;
  if (e.code === 'KeyE') gatherNearest();
  if (e.code === 'KeyF') toast(drink(G).ok ? '물을 마셨다 (+25)' : '물가에서만 마실 수 있다');
  if (e.code === 'KeyQ') { const f = ['cooked', 'berry', 'meat'].find((k) => G.inv[k] > 0); toast(f && eat(G, f).ok ? `${ITEMS[f].name} 먹음` : '먹을 것이 없다'); }
  if (e.code === 'KeyC') openCraft();
  if (e.code === 'KeyB') { const opts = ['campfire', 'wall'].filter((k) => G.inv[k] > 0); buildKind = opts.length ? opts[(opts.indexOf(buildKind) + 1) % (opts.length + 1)] || null : null; if (!opts.length) toast('지을 것이 없다 — C 로 만들기'); }
  if (e.code === 'KeyR') buildRot = buildRot ? 0 : Math.PI / 2;
  if (e.code === 'Escape') buildKind = null;
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

function primary() {
  if (buildKind) { const t = aimPoint(); if (t && place(G, buildKind, t.x, t.z, buildRot).ok) { toast(`${ITEMS[buildKind].name} 설치`); syncStructures(); if (!(G.inv[buildKind] > 0)) buildKind = null; } else toast('여기에는 놓을 수 없다'); return; }
  const w = G.wolves.filter((x) => Math.hypot(x.x - G.player.x, x.z - G.player.z) < 2.4).sort((a, b) => Math.hypot(a.x - G.player.x, a.z - G.player.z) - Math.hypot(b.x - G.player.x, b.z - G.player.z))[0];
  if (w) { const r = attack(G, w); if (r.killed) toast('늑대를 쓰러뜨렸다 (+날고기 2)'); return; }
  gatherNearest();
}
function gatherNearest() {
  const n = nearestNode(G); if (!n) return;
  const r = gather(G, n); if (r.drop) { toast('+ ' + Object.entries(r.drop).map(([k, v]) => `${ITEMS[k].name} ${v}`).join(', ')); refreshNodes(); }
}
const ray = new THREE.Raycaster();
function aimPoint() {
  const ground = scene.getObjectByName('ground'); ray.setFromCamera({ x: 0, y: 0 }, camera); ray.far = 9;
  const hit = ray.intersectObject(ground)[0]; return hit ? { x: hit.point.x, z: hit.point.z } : null;
}

// ------------------------------------------------------------ HUD and panels
function toast(t) { msgs.push({ t, at: performance.now() }); if (msgs.length > 5) msgs.shift(); }
function hud() {
  const P = G.player, bar = (ic, v, c) => `<div class="bar"><span>${ic}</span><span class="t"><i style="width:${Math.max(0, v)}%;background:${c}"></i></span></div>`;
  $('#bars').innerHTML = bar('❤️', P.hp, 'var(--hp)') + bar('🍖', P.hunger, 'var(--food)') + bar('💧', P.thirst, 'var(--water)') + bar('🔥', P.warmth, 'var(--warm)') + bar('⚡', P.stamina, 'var(--stam)');
  const k = dayPhase(G), hh = Math.floor((k * 24 + 0) % 24), mm = Math.floor(((k * 24) % 1) * 60);
  $('#clock').textContent = `${G.day}일째 · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${isNight(G) ? '🌙 밤 — 늑대 주의' : '☀️'}${nearFire(G) ? ' · 🔥 따뜻함' : ''}`;
  const n = nearestNode(G), wolfNear = G.wolves.some((w) => Math.hypot(w.x - P.x, w.z - P.z) < 2.4);
  $('#hint').textContent = buildKind ? `${ITEMS[buildKind].name} 짓기 — 클릭 설치 · R 회전 · B 바꾸기 · Esc 그만` : wolfNear ? '클릭: 공격' : n ? `E: ${{ tree: '나무 베기', rock: '돌 캐기', bush: '열매 따기' }[n.kind]} (${NODE[n.kind].hp - n.hp + 1}/${NODE[n.kind].hp})` : canDrink(G) ? 'F: 물 마시기' : document.pointerLockElement !== canvas ? '화면을 클릭하면 둘러볼 수 있습니다' : '';
  const shown = Object.entries(G.inv).filter(([, v]) => v > 0);
  $('#hotbar').innerHTML = shown.map(([k, v]) => `<div class="slot ${buildKind === k ? 'sel' : ''}"><b>${v}</b>${ITEMS[k].name}</div>`).join('') || '<div class="slot">빈손</div>';
  const now = performance.now(); msgs = msgs.filter((m) => now - m.at < 3500);
  $('#log').innerHTML = msgs.map((m) => `<div>${m.t}</div>`).join('');
}
function panel(html) { const p = $('#panel'); p.hidden = false; p.innerHTML = `<div class="card">${html}</div>`; if (document.pointerLockElement) document.exitPointerLock(); return p; }
function closePanel() { $('#panel').hidden = true; }
function openCraft() {
  const need = (r) => Object.entries(RECIPES[r].need).map(([k, v]) => `${ITEMS[k].name} ${G.inv[k] || 0}/${v}`).join(' · ');
  const p = panel(`<h2>제작</h2><p>필요한 재료가 있으면 만들 수 있습니다. 도구는 하나씩, 고기는 모닥불 옆에서.</p><div class="recipes">${Object.keys(RECIPES).map((r) => {
    const okFire = !RECIPES[r].nearFire || nearFire(G), ok = okFire && Object.entries(RECIPES[r].need).every(([k, v]) => (G.inv[k] || 0) >= v) && !(ITEMS[r].tool && G.inv[r]);
    return `<div class="recipe"><div><b>${ITEMS[r].name}</b><br/><small>${need(r)}${RECIPES[r].nearFire ? ' · 모닥불 옆' : ''}${ITEMS[r].tool ? ` · 공격 ${ITEMS[r].dmg}` : ''}</small></div><button class="btn" data-craft="${r}" ${ok ? '' : 'disabled'}>만들기</button></div>`; }).join('')}</div>
    <div class="row"><button class="btn primary" data-close>닫기 (C)</button></div>`);
  p.querySelectorAll('[data-craft]').forEach((b) => (b.onclick = () => { const r = craft(G, b.dataset.craft); toast(r.ok ? `${ITEMS[b.dataset.craft].name} 제작` : '재료가 부족하다'); openCraft(); }));
  p.querySelector('[data-close]').onclick = closePanel;
  const k = (e) => { if (e.code === 'KeyC' || e.code === 'Escape') { removeEventListener('keydown', k); closePanel(); } }; setTimeout(() => addEventListener('keydown', k), 0);
}

function title() {
  ended = false; const saved = store.get(SAVE);
  const p = panel(`<h1>SURVIVAL WORLD</h1><p>기술 프로토타입 · 시드로 만들어지는 섬에서 살아남으세요. 나무·돌·열매를 모아 도구와 모닥불을 만들고, 밤에는 불 곁에서 늑대를 피하세요.</p>
    <p class="keys">클릭 둘러보기 · WASD 이동 · Shift 달리기 · E 채집 · 클릭 공격/채집 · F 물 마시기(물가) · Q 먹기 · C 제작 · B 짓기(R 회전)</p>
    <div class="row"><button class="btn primary" data-new>새 섬</button>${saved ? '<button class="btn" data-resume>이어 하기</button>' : ''}<input id="seed" placeholder="섬 시드 (숫자)" inputmode="numeric" /></div>`);
  p.querySelector('[data-new]').onclick = () => { const v = +$('#seed').value; start(newGame(Number.isFinite(v) && v > 0 ? v >>> 0 : (Date.now() % 1e9) >>> 0)); };
  const r = p.querySelector('[data-resume]'); if (r) r.onclick = () => { try { start(load(saved)); } catch { toast('저장을 읽지 못했습니다'); start(newGame(1)); } };
}
function start(g) {
  G = g; ended = false; buildKind = null; closePanel(); $('#hud').hidden = false; buildWorld(); syncStructures(); portal.levelStart(1);
  yaw = 0; pitch = -0.05; toast(`${G.day}일째 — 섬 #${G.seed}`);
}
function died() {
  ended = true; store.set(SAVE, ''); const P = G.player, days = G.day - 1 + dayPhase(G);
  const grade = days >= 5 ? 'S' : days >= 3 ? 'A' : days >= 2 ? 'B' : days >= 1 ? 'C' : 'D';
  const rp = portal.result({ level: 1, score: Math.round(days * 100 + G.kills * 20), grade, mode: `seed ${G.seed}`, seconds: Math.round(G.time - DAY * 0.25), clear: false });
  const p = panel(`<h2>쓰러졌다</h2><p>${G.day}일째 · 생존 ${days.toFixed(1)}일 · 늑대 ${G.kills}마리 · 등급 ${grade}${portal.embedded && rp ? ` · +${rp} RP` : ''}</p>
    <p>${P.hunger <= 0 ? '굶주림' : P.thirst <= 0 ? '목마름' : P.warmth <= 0 ? '추위' : '늑대'}에 쓰러졌습니다.</p><div class="row"><button class="btn primary" data-again>처음으로</button></div>`);
  p.querySelector('[data-again]').onclick = title;
}

// ------------------------------------------------------------ loop
let prev = performance.now(), hudT = 0;
function frame(now) {
  requestAnimationFrame(frame);
// ?debug=1: hooks for automated browser tests (teleport, time) — not used by the game itself
if (q.get('debug')) window.__sw = { G: () => G, primary, gatherNearest, openCraft, setBuild: (k) => { buildKind = k; }, aim: (p) => { pitch = p; }, turn: (y) => { yaw = y; } };
  const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
  if (G && !ended && $('#panel').hidden) {
    const P = G.player, sprint = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && P.stamina > 5;
    const f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0), r = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    if (f || r) { const sp = (sprint ? 7 : 4.2) * dt, L = Math.hypot(f, r); movePlayer(G, ((-Math.sin(yaw) * f + Math.cos(yaw) * r) / L) * sp, ((-Math.cos(yaw) * f - Math.sin(yaw) * r) / L) * sp); }
    step(G, dt, { sprinting: sprint && (f || r) });
    syncWolves();
    if (!G.player.alive) died();
    if (now - lastSave > 10000) { store.set(SAVE, save(G)); lastSave = now; }
  }
  if (G) {
    const P = G.player, y = Math.max(0.3, heightAt(G.seed, P.x, P.z)) + 1.7;
    camera.position.set(P.x, y, P.z); camera.rotation.set(pitch, yaw, 0, 'YXZ'); lightFor(dt);
    if (buildKind && ghost) { const t = aimPoint(); ghost.visible = !!t; if (t) { ghost.position.set(snap(t.x), heightAt(G.seed, snap(t.x), snap(t.z)), snap(t.z)); ghost.rotation.y = buildRot; ghost.material.color.set(canPlace(G, buildKind, t.x, t.z) ? 0x8fe08a : 0xe08a8a); ghost.scale.set(buildKind === 'wall' ? 1 : 0.6, buildKind === 'wall' ? 1 : 0.3, buildKind === 'wall' ? 1 : 3); } }
    else if (ghost) ghost.visible = false;
    if ((hudT -= dt) <= 0) { hudT = 0.1; hud(); }
  }
  renderer.render(scene, camera);
}
// regrowth is detected by comparing hp against what was drawn
setInterval(() => { if (!G) return; let changed = false; for (const n of G.world.nodes) { const v = n.hp > 0 ? 1 : 0; if (n._drawn !== v) { n._drawn = v; changed = true; } } if (changed) refreshNodes(); }, 1000);

// a world to look at behind the title, then the title
const q = new URLSearchParams(location.search);
G = newGame(+q.get('seed') || 2026); buildWorld(); yaw = Math.PI * 0.8; pitch = -0.12;
if (q.get('seed')) start(newGame(+q.get('seed') >>> 0)); else title();
requestAnimationFrame(frame);
// ?debug=1: hooks for automated browser tests (teleport, time) — not used by the game itself
if (q.get('debug')) window.__sw = { G: () => G, primary, gatherNearest, openCraft, setBuild: (k) => { buildKind = k; }, aim: (p) => { pitch = p; }, turn: (y) => { yaw = y; } };

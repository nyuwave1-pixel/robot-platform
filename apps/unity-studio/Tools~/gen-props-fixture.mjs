// Parity fixture for Core/IslandProps.cs: runs the web game's own beach section of buildIsland() (src/world/build.js) against a
// recording stand-in world and writes every W.box / W.addStatic / W.walls call it makes.
//   node "apps/unity-studio/Tools~/gen-props-fixture.mjs"
// build.js imports three.js, Vite asset globs and the live game, so its source is cut out and run with stubs (assets "loaded").
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry, fbm, TAU } from '../../special-soldier/src/core/util.js';
import { gridHeights, heightAtGrid } from '../../special-soldier/src/world/terrain.js';
import { WATERFALL } from '../../special-soldier/src/world/vegetation.js';

const here = dirname(fileURLToPath(import.meta.url));
const web = (f) => readFileSync(join(here, '..', '..', 'special-soldier', 'src', 'world', f), 'utf8');
const build = web('build.js'), world = web('world.js');
const z2 = build.indexOf('  // ================= ZONE 02'), z2end = build.indexOf('  { const p = POI.waterfall');
const z3 = build.indexOf('  // ================= ZONE 03'), z3end = build.indexOf('  // fence line between base north gate');
const z5 = build.indexOf('  // ================= ZONE 05'), z5end = build.indexOf('  buildFacility();');
// beach | jungle comms station | (waterfall + cave: run for the shared random sequence, not recorded) | military base
const body = build.slice(build.indexOf('  const W = G.world'), z2) + '  __mark("beach");\n' + build.slice(z2, z2end) + '  __mark("jungle");\n'
  + build.slice(z2end, z3) + '  __mark("waterfall");\n' + build.slice(z3, z3end) + '  __mark("base");\n'
  + build.slice(z3end, z5) + '  __mark("fence");\n' + build.slice(z5, z5end) + '  __mark("airfield");\n';   // (fence: not ported yet)
if (!body.includes('ZONE 01 — BEACH') || !body.includes('POI.commsTower') || !body.includes('POI.intel')) throw new Error('build.js beach / jungle / base section not found');
const missions = readFileSync(join(here, '..', '..', 'special-soldier', 'src', 'game', 'missions.js'), 'utf8');
const gs = missions.indexOf('function buildGenOutpost()');
let gd = 0, ge = missions.indexOf('{', gs);
for (let i = ge; i < missions.length; i++) { if (missions[i] === '{') gd++; else if (missions[i] === '}' && --gd === 0) { ge = i + 1; break; } }
const GEN = JSON.parse(missions.match(/export const GEN = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
const POI_COMMS = JSON.parse(build.match(/comms: (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
// World.walls() source → a function bound to the stub world
const ws = world.indexOf('  walls(x0, z0, x1, z1');
let depth = 0, we = world.indexOf(') {', ws) + 2;
for (let i = we; i < world.length; i++) { if (world[i] === '{') depth++; else if (world[i] === '}' && --depth === 0) { we = i + 1; break; } }
const wallsFn = new Function('MAT', 'assetGeo', `return function ${world.slice(ws + 2, we)}`);

const any = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : any()), apply: () => any(), construct: () => any(), set: () => true });
const MAT = new Proxy({}, { get: (t, k) => (t[k] ??= { name: String(k) }) });   // same object per name: walls() compares materials
const H = gridHeights(), calls = [];
const r = (v) => (typeof v === 'number' ? v : null);
const W = {
  heightAt: (x, z) => heightAtGrid(H, x, z),
  box(x, y, z, sx, sy, sz, material, o = {}) { calls.push({ op: 'box', a: [x, y, z, sx, sy, sz], mat: material?.name || '', geo: o.geo || '', hidden: !!o.hidden, noCol: !!o.noCol, rot90: !!o.rot90, kind: o.kind || '', surf: o.mat || '', tint: o.tint || null }); return { mesh: null }; },
  addStatic(geo, x, y, z, sx = 1, sy = 1, sz = 1, rotY = 0, tint = null, origin = false) { calls.push({ op: 'static', geo, a: [x, y, z, sx, sy, sz, rotY], origin: !!origin, tint }); return true; },
  addCollider(o) { calls.push({ op: 'box', a: [(o.min.x + o.max.x) / 2, o.min.y, (o.min.z + o.max.z) / 2, o.max.x - o.min.x, o.max.y - o.min.y, o.max.z - o.min.z], mat: '', geo: '', hidden: true, noCol: false, rot90: false, kind: o.kind || '', surf: o.mat || '', tint: null, noStand: !!o.noStand }); return {}; }, group: any(), statics: { push: () => 0 }, animated: { push: () => 0 }, interactables: { push: () => 0 },
};
W.walls = wallsFn(MAT, () => true);
const POI = { waterfall: { ...WATERFALL } };   // the web POI table (build.js), every entry
for (const m of build.slice(build.indexOf('export const POI'), build.indexOf('export const ZONES')).matchAll(/(\w+): \{ x: (-?[\d.]+), z: (-?[\d.]+) \}/g)) POI[m[1]] = { x: +m[2], z: +m[3] };
const G = { world: W, sky: { night: 1 }, weapons: any() };
class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } }
const THREE = new Proxy({ Vector3 }, { get: (t, k) => t[k] || any() });
const cut = {}; let from = 0;
const document = { createElement: () => ({}) };
new Function('G', 'THREE', 'MAT', 'assetGeo', 'mulberry', 'fbm', 'TAU', 'POI', 'photoDetail', 'FAC_Y', 'FAC_H', 'FLATS', 'document', '__mark', body)(
  G, THREE, MAT, () => any(), mulberry, fbm, TAU, POI, any(), -40, 6, [], document, (name) => { cut[name] = calls.slice(from); from = calls.length; });
new Function('G', 'MAT', 'GEN', `let genBuilt = false; ${missions.slice(gs, ge)}; buildGenOutpost();`)(G, MAT, GEN);
cut.gen = calls.slice(from); from = calls.length;
// ZONE 04 underground facility: build.js buildFacility() + its ins() helper
{
  const fs = build.indexOf('function buildFacility()'); let fd = 0, fe = build.indexOf('{', fs);
  for (let i = fe; i < build.length; i++) { if (build[i] === '{') fd++; else if (build[i] === '}' && --fd === 0) { fe = i + 1; break; } }
  const insLine = build.match(/const ins = [^\n]+/)[0];
  new Function('G', 'THREE', 'MAT', 'POI', 'FAC_Y', 'FAC_H', `${insLine}\n${build.slice(fs, fe)}\nbuildFacility();`)(G, THREE, MAT, POI, -60, 4.2);
  cut.facility = calls.slice(from);
}

const d = (x) => (x ?? 0).toPrecision(17);
const tint = (t) => (t ? `new double[] { ${t.map(d).join(', ')} }` : 'null');
const row = (c) => (c.op === 'box'
  ? `            new PropCall("box", "${c.geo}", "${c.mat}", ${c.a.map(d).join(', ')}, 0, ${c.hidden}, ${c.noCol}, ${c.rot90}, false, "${c.kind}", "${c.surf}", ${tint(c.tint)}${c.noStand ? ', noStand: true' : ''}),`
  : `            new PropCall("static", "${c.geo}", "", ${c.a.slice(0, 6).map(d).join(', ')}, ${d(c.a[6])}, false, false, false, ${c.origin}, "", "", ${tint(c.tint)}),`);
const rows = (name) => cut[name].map(row).join('\n');
writeFileSync(join(here, '..', 'Assets', 'Tests', 'EditMode', 'PropsFixture.g.cs'), `// <auto-generated> by apps/unity-studio/Tools~/gen-props-fixture.mjs from the beach section of apps/special-soldier/src/world/build.js. Do not edit.
namespace SpecialSoldier.Core.Tests
{
    public static class PropsFixture
    {
        public static readonly double BeachTowerTopY = ${d(POI.beachTower.y)};
        public static readonly (double x, double z) Comms = (${d(POI_COMMS.x)}, ${d(POI_COMMS.z)}), Gen = (${d(GEN.x)}, ${d(GEN.z)});
        public static readonly (double x, double y, double z) Intel = (${d(POI.intel.x)}, ${d(POI.intel.y)}, ${d(POI.intel.z)});
        public static readonly PropCall[] Beach =
        {
${rows('beach')}
        };
        public static readonly PropCall[] Jungle =
        {
${rows('jungle')}
        };
        public static readonly PropCall[] GenOutpost =
        {
${rows('gen')}
        };
        public static readonly PropCall[] Base =
        {
${rows('base')}
        };
        public static readonly PropCall[] Airfield =
        {
${rows('airfield')}
        };
        public static readonly PropCall[] Facility =
        {
${rows('facility')}
        };
        public static readonly (string name, double x, double y, double z)[] FacilityPoints =
        {
${['secDoorPos', 'sample', 'server', 'exitLift', 'facSpawn'].map((k) => `            ("${k}", ${d(POI[k].x)}, ${d(POI[k].y)}, ${d(POI[k].z)}),`).join('\n')}
        };
        public static readonly (double x, double y, double z)[] Cameras =
        {
${POI.cameras.map((c) => `            (${d(c.x)}, ${d(c.y)}, ${d(c.z)}),`).join('\n')}
        };
    }
}
`);
console.log(`[props] beach ${cut.beach.length}, jungle ${cut.jungle.length}, base ${cut.base.length}, airfield ${cut.airfield.length}, gen outpost ${cut.gen.length}, facility ${cut.facility.length} — total ${calls.length} calls (${calls.filter((c) => c.op === 'box').length} box, ${calls.filter((c) => c.op === 'static').length} static), tower top ${POI.beachTower.y.toFixed(3)}`);

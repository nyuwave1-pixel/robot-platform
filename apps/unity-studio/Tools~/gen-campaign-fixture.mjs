// Parity fixture for Core/Campaign.cs: evaluates the web game's own mission objects (apps/special-soldier/src/game/missions.js)
// with a recording stand-in game and writes what they do: setup() spawns, spawn point, sky, objectives (with their radio
// lines and interact points), the alarm() reaction and the waves the objective hooks send (with every flag combination).
//   node "apps/unity-studio/Tools~/gen-campaign-fixture.mjs"
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (...p) => readFileSync(join(here, '..', '..', 'special-soldier', 'src', ...p), 'utf8');
const missions = src('game', 'missions.js'), build = src('world', 'build.js');
const obj = (text) => JSON.parse(text.replace(/(\w+):/g, '"$1":').replace(/\.\.\.\{[^}]*\}/g, '"_": 0').replace(/'/g, '"'));
const POI = {}; for (const m of build.matchAll(/(\w+): \{ x: (-?[\d.]+), z: (-?[\d.]+) \}/g)) POI[m[1]] = { x: +m[2], z: +m[3] };
const GEN = obj(missions.match(/export const GEN = (\{[^}]+\})/)[1]);
const CODES = ['MISSION 01', 'MISSION 02'];

function block(code) {
  const a = missions.indexOf(`{ code: '${code}'`); if (a < 0) throw new Error(code + ' not found');
  let d = 0; for (let i = a; i < missions.length; i++) { if (missions[i] === '{') d++; else if (missions[i] === '}' && --d === 0) return missions.slice(a, i + 1); }
  throw new Error('unbalanced ' + code);
}
const any = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'list' ? [] : any()), apply: () => any(), construct: () => any() });

function run(code) {
  const rec = { spawns: [], radio: [], waves: [] }; let alive = 1;
  const sp = (kind, x, z, o = {}) => { rec.spawns.push({ kind, x, z, group: o.group || '', yaw: o.yaw ?? null, patrol: o.patrol || null, top: o.y === 'TOP' }); return { lk: { set() {} }, pos: { y: 0 } }; };
  const wave = (list, group) => rec.waves.push({ group, list: list.map(([k, x, z]) => ({ kind: k, x, z })) });
  const G = { hud: { radio: (t) => rec.radio.push(t), toast() {}, banner() {}, objective() {} }, enemies: { count: () => alive }, world: { heightAt: () => 0, groundAt: () => 0, interactables: [] }, player: { pos: { x: 0, z: 0 } }, cine: any(), fx: any(), audio: any(), squad: any(), weapons: any(), gear: any() };
  const scope = new Proxy({ G, POI, GEN, sp, wave, top: () => 'TOP', E: () => ({ list: [] }), ST: { SEARCH: 2, COMBAT: 3 }, buildGenOutpost() {}, Math, console }, { has: (t, k) => k !== 'def', get: (t, k) => (k === Symbol.unscopables ? undefined : k in t ? t[k] : any()) });
  const def = new Function('scope', `with (scope) { return (${block(code)}); }`)(scope);
  const M = { flags: {} };
  def.setup(M);
  const s = def.spawn();
  const objectives = [];
  const one = (o, parent) => { const at = o.at ? o.at() : o; objectives.push({ parent, type: o.type, text: o.text, group: o.group || '', x: at.x ?? null, z: at.z ?? null, r: o.r ?? null, label: o.label || '', hold: o.hold ?? null, radio: o.radio || '' }); };
  def.objectives.forEach((o, i) => { one(o, -1); (o.parts || []).forEach((p) => one(p, i)); });
  const hooks = [];
  const hook = (name, fn, flags, aliveNow) => { const r0 = rec.radio.length, w0 = rec.waves.length; const m = { flags: { ...flags } }; alive = aliveNow; fn(m); hooks.push({ name, flags: JSON.stringify(flags), alive: aliveNow, radio: rec.radio.slice(r0), waves: rec.waves.slice(w0), setFlags: JSON.stringify(m.flags) }); };
  if (def.alarm) hook('alarm', () => def.alarm(), {}, 1);
  def.objectives.forEach((o, i) => {
    if (o.start) for (const f of [{}, { powerCut: true }]) hook(`start ${i}`, (m) => o.start(m), f, 1);
    (o.parts || []).forEach((p, k) => { if (p.done) for (const a of [1, 0]) hook(`done ${i}.${k}`, (m) => p.done(m), {}, a); });
  });
  return { code, name: def.name, zone: def.zone, sky: def.sky, spawn: s, spawns: rec.spawns, objectives, hooks };
}

const d = (v) => (v === null || v === undefined ? 'null' : Number(v).toPrecision(17));
const str = (t) => JSON.stringify(t ?? '');
const out = CODES.map(run).map((m) => `        public static readonly MissionFixture ${m.code.replace(' ', '')} = new MissionFixture
        {
            Code = ${str(m.code)}, Name = ${str(m.name)}, Zone = ${str(m.zone)}, Sky = ${str(m.sky)}, SpawnX = ${d(m.spawn.x)}, SpawnZ = ${d(m.spawn.z)}, SpawnYaw = ${d(m.spawn.yaw)},
            Spawns = new (string, double, double, string, double?, double[], bool)[]
            {
${m.spawns.map((s) => `                (${str(s.kind)}, ${d(s.x)}, ${d(s.z)}, ${str(s.group)}, ${s.yaw === null ? '(double?)null' : d(s.yaw)}, ${s.patrol ? `new double[] { ${s.patrol.flat().map(d).join(', ')} }` : 'null'}, ${s.top}),`).join('\n')}
            },
            Objectives = new (int, string, string, string, double?, double?, double?, string, double?, string)[]
            {
${m.objectives.map((o) => `                (${o.parent}, ${str(o.type)}, ${str(o.text)}, ${str(o.group)}, ${d(o.x)}, ${d(o.z)}, ${d(o.r)}, ${str(o.label)}, ${d(o.hold)}, ${str(o.radio)}),`).join('\n')}
            },
            Hooks = new (string, string, int, string[], string[], string)[]
            {
${m.hooks.map((h) => `                (${str(h.name)}, ${str(h.flags)}, ${h.alive}, new string[] { ${h.radio.map(str).join(', ')} }, new string[] { ${h.waves.map((w) => str(w.group + ':' + w.list.map((e) => `${e.kind}@${e.x},${e.z}`).join(';'))).join(', ')} }, ${str(h.setFlags)}),`).join('\n')}
            },
        };`);
writeFileSync(join(here, '..', 'Assets', 'Tests', 'EditMode', 'CampaignFixture.g.cs'), `// <auto-generated> by apps/unity-studio/Tools~/gen-campaign-fixture.mjs from apps/special-soldier/src/game/missions.js. Do not edit.
namespace SpecialSoldier.Core.Tests
{
    public sealed class MissionFixture
    {
        public string Code, Name, Zone, Sky; public double SpawnX, SpawnZ, SpawnYaw;
        public (string kind, double x, double z, string group, double? yaw, double[] patrol, bool onStructure)[] Spawns;
        /// <summary>parent = −1 for a top-level objective, else the index of its 'any' objective. x/z = target or interact point.</summary>
        public (int parent, string type, string text, string group, double? x, double? z, double? r, string label, double? hold, string radio)[] Objectives;
        /// <summary>A hook run with the given flags (JSON) and living-enemy count: radio lines, waves "group:kind@x,z;…", flags after.</summary>
        public (string name, string flags, int alive, string[] radio, string[] waves, string flagsAfter)[] Hooks;
    }

    public static class CampaignFixture
    {
${out.join('\n')}
    }
}
`);
console.log('[campaign] ' + CODES.join(', ') + ' -> Assets/Tests/EditMode/CampaignFixture.g.cs');

// Multiplayer rules (src/net/authority.js): teams, caps, hit checks, kills, respawn, score limit, timer, host migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Authority, MODES, MAX_HP, RESPAWN_S } from '../src/net/authority.js';

function setup(mode = 'duel') {
  let t = 1000; const ev = [];
  const a = new Authority({ mode, now: () => t, emit: (e) => ev.push(e), rnd: () => 0.5 });
  return { a, ev, adv: (s) => { t += s; }, of: (k) => ev.filter((e) => e.k === k) };
}

test('duel: one player per team, third player is refused', () => {
  const { a, of } = setup('duel');
  assert.equal(a.join('A', 'alpha'), true); assert.equal(a.join('B', 'bravo'), true); assert.equal(a.join('C', 'charlie'), false);
  assert.deepEqual([...a.players.values()].map((p) => p.team).sort(), ['blue', 'red']);
  assert.equal(of('full').length, 1);
});

test('tdm: 15 v 15 cap, teams balanced, 31st refused', () => {
  const { a } = setup('tdm');
  for (let i = 0; i < 30; i++) assert.equal(a.join('p' + i, 'P' + i), true);
  assert.equal(a.teamCount('blue'), 15); assert.equal(a.teamCount('red'), 15); assert.equal(a.join('p30', 'late'), false);
  assert.equal(MODES.tdm.perTeam, 15);
});

test('hits are checked: friendly fire, spawn protection, damage cap, shooter drift, dead players', () => {
  const { a, adv, of } = setup('tdm');
  a.join('A', 'a'); a.join('B', 'b'); a.join('C', 'c'); a.start(); // A blue, B red, C blue
  const team = (id) => a.players.get(id).team; assert.equal(team('A'), team('C'));
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso' }), false, 'spawn protection');
  adv(3);
  assert.equal(a.hit({ i: 'A', t: 'C', d: 30, z: 'torso' }), false, 'friendly fire');
  assert.equal(a.hit({ i: 'A', t: 'B', d: 999, z: 'head' }), false, 'damage cap');
  a.state('A', [0, 0, -14]); assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [80, 0, -14] }), false, 'shooter drift');
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [1, 0, -14] }), true);
  assert.equal(a.players.get('B').hp, MAX_HP - 30); assert.equal(of('dmg').length, 1);
  assert.ok(a.rejected >= 4);
});

test('rate limit stops impossible damage per second', () => {
  const { a, adv } = setup('tdm');
  a.join('A'); a.join('B'); a.join('C'); a.join('D'); a.start(); adv(3);
  const reds = [...a.players.values()].filter((p) => p.team === 'red').map((p) => p.id), blue = [...a.players.values()].find((p) => p.team === 'blue').id;
  let ok = 0; for (let i = 0; i < 40; i++) { for (const r of reds) { a.players.get(r).hp = MAX_HP; a.players.get(r).alive = true; } if (a.hit({ i: blue, t: reds[i % 2], d: 90, z: 'torso' })) ok++; }
  assert.ok(ok <= 17, `accepted ${ok} × 90 dmg in one second`);
});

test('kill → score, respawn after the delay, duel ends at the score limit', () => {
  const { a, adv, of } = setup('duel');
  a.join('A'); a.join('B'); a.start(); adv(3);
  const killB = () => { for (let i = 0; i < 4; i++) { a.hit({ i: 'A', t: 'B', d: 30, z: 'torso' }); adv(0.3); } };
  killB(); assert.equal(of('kill').length, 1); assert.equal(a.players.get('B').alive, false); assert.equal(a.score[a.players.get('A').team], 1);
  adv(RESPAWN_S - 1); a.tick(); assert.equal(a.players.get('B').alive, false);
  adv(1.1); a.tick(); assert.equal(a.players.get('B').alive, true); assert.equal(a.players.get('B').hp, MAX_HP);
  for (let k = 1; k < MODES.duel.scoreLimit; k++) { adv(SPAWN(a)); killB(); adv(RESPAWN_S + 0.1); a.tick(); }
  assert.equal(a.phase, 'ended'); assert.equal(of('end').at(-1).winner, a.players.get('A').team);
});
const SPAWN = () => 2.1;

test('timer ends the match; equal score is a draw', () => {
  const { a, adv, of } = setup('tdm');
  a.join('A'); a.join('B'); a.start(); adv(MODES.tdm.timeLimit + 1); a.tick();
  assert.equal(a.phase, 'ended'); assert.equal(of('end')[0].winner, 'draw');
});

test('host migration rebuilds the match from the last roster', () => {
  const { a, adv } = setup('tdm');
  a.join('A', 'a'); a.join('B', 'b'); a.start(); adv(3);
  for (let i = 0; i < 4; i++) a.hit({ i: 'A', t: 'B', d: 30, z: 'torso' });
  const r = a.roster(), b = Authority.fromRoster(r, { now: () => 2000, emit: () => {} });
  assert.equal(b.phase, 'live'); assert.deepEqual(b.score, a.score); assert.equal(b.players.get('A').kills, 1); assert.equal(b.players.get('B').alive, false);
});

test('impact point must be on the target (lag window), eye near the shooter, and not through the terrain', () => {
  let t = 1000; const ev = []; const hill = (x, z) => (x > 40 && x < 60 ? 30 : 0); // a 30 m ridge between x 40 and 60
  const a = new Authority({ mode: 'duel', now: () => t, emit: (e) => ev.push(e), rnd: () => 0.5, ground: hill, strict: true });
  a.join('A'); a.join('B'); a.start(); t += 3;
  a.state('A', [0, 0, 0]); a.state('B', [20, 0, 0]);
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso' }), false, 'strict: claim without impact point');
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [25, 1.2, 0] }), false, 'impact 5 m beside the target');
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [10, 1.6, 0], h: [20, 1.2, 0] }), false, 'eye far from the shooter');
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [20, 1.2, 0] }), true, 'clean hit');
  // lag compensation: B moved 4 m after the shot; the impact at its old spot is still accepted inside the window
  t += 0.2; a.state('B', [20, 0, 4]); assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [20, 1.2, 0] }), true, 'old position within 0.6 s');
  t += 1.0; a.state('B', [20, 0, 4]); assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [20, 1.2, 0] }), false, 'old position after the window');
  // terrain: B behind the ridge
  a.state('B', [80, 0, 0]); assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [80, 1.2, 0] }), false, 'through the ridge');
  assert.ok(ev.filter((e) => e.k === 'reject').map((e) => e.why).includes('terrain'));
});

test('walls: a box between shooter and impact blocks the hit; grazing past an edge does not', async () => {
  const { segBox } = await import('../src/net/authority.js');
  assert.equal(segBox([0, 1, 0], [10, 1, 0], [4, 0, -1, 5, 3, 1]), true); assert.equal(segBox([0, 1, 0], [10, 1, 0], [4, 0, 2, 5, 3, 3]), false);
  let t = 1000; const wall = [[9, 0, -3, 10, 4, 3]];
  const a = new Authority({ mode: 'duel', now: () => t, emit: () => {}, rnd: () => 0.5, strict: true, boxes: wall });
  a.join('A'); a.join('B'); a.start(); t += 3; a.state('A', [0, 0, 0]); a.state('B', [20, 0, 0]);
  assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [20, 1.2, 0] }), false, 'through the wall');
  a.state('B', [20, 0, 12]); assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'torso', sp: [0, 0, 0], o: [0, 1.6, 0], h: [20, 1.2, 12] }), true, 'clear line beside the wall');
  a.state('B', [20, 0, 0]); assert.equal(a.hit({ i: 'A', t: 'B', d: 30, z: 'head', sp: [0, 0, 0], o: [0, 8, 0], h: [20, 1.7, 0] }), true, 'from a roof, over the top of the wall');
});
test('the real island colliders load and block a shot through a building', async () => {
  const { readFileSync } = await import('node:fs'); const boxes = JSON.parse(readFileSync(new URL('../src/net/colliders.json', import.meta.url))).boxes;
  assert.ok(boxes.length > 500, `${boxes.length} boxes`);
  const big = boxes.filter((b) => b[3] - b[0] > 6 && b[5] - b[2] > 6 && b[4] - b[1] > 3)[0]; assert.ok(big, 'a building-sized box exists');
  const cx = (big[0] + big[3]) / 2, cz = (big[2] + big[5]) / 2, y = big[1] + 1.5, a = new Authority({ mode: 'duel', boxes });
  assert.equal(a.clearOfBoxes([big[0] - 5, y, cz], [big[3] + 5, y, cz]), false, 'line through the middle of a building');
  assert.equal(a.clearOfBoxes([big[0] - 5, 200, cz], [big[3] + 5, 200, cz]), true, 'line high above the island');
  void cx;
});

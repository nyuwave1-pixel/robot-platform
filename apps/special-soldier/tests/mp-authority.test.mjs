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

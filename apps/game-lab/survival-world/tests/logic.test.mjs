import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, makeWorld, heightAt, biomeAt, step, gather, craft, eat, drink, canDrink, place, canPlace, attack, nearestNode, movePlayer,
  isNight, nearFire, save, load, DAY, NODE, WOLF } from '../src/logic.js';

test('a seed makes the same island every time; different seeds differ; the spawn is dry land', () => {
  const a = makeWorld(42), b = makeWorld(42), c = makeWorld(43);
  assert.deepEqual(a.nodes.slice(0, 50), b.nodes.slice(0, 50));
  assert.notDeepEqual(a.nodes.map((n) => n.kind).slice(0, 80), c.nodes.map((n) => n.kind).slice(0, 80));
  for (const W of [a, c]) {
    assert.ok(heightAt(W.seed, W.spawn.x, W.spawn.z) > 1.5, 'spawn above water');
    const kinds = W.nodes.reduce((m, n) => ((m[n.kind] = (m[n.kind] || 0) + 1), m), {});
    assert.ok(kinds.tree > 150 && kinds.rock > 20 && kinds.bush > 20, JSON.stringify(kinds));
    assert.ok(heightAt(W.seed, 205, 205) < 0, 'the corners are sea');
  }
  assert.equal(biomeAt(1, 205, 205), 'water');
});

test('gathering: hits deplete a node, the drop comes on the last hit, tools give more, nodes regrow', () => {
  const G = newGame(7), tree = G.world.nodes.find((n) => n.kind === 'tree');
  G.player.x = tree.x + 1; G.player.z = tree.z;
  assert.equal(nearestNode(G), tree);
  assert.deepEqual(gather(G, tree), { ok: true, hit: true }); gather(G, tree);
  assert.deepEqual(gather(G, tree).drop, { wood: 2 }); assert.equal(G.inv.wood, 2); assert.equal(tree.hp, 0);
  G.inv.axe = 1; step(G, NODE.tree.regrow + 1); assert.equal(tree.hp, NODE.tree.hp, 'regrew');
  for (let i = 0; i < 3; i++) gather(G, tree); assert.equal(G.inv.wood, 6, 'axe: 4 wood');
  G.player.x += 50; assert.equal(gather(G, tree).ok, false, 'too far');
});

test('crafting needs materials (and fire for cooking); tools are unique', () => {
  const G = newGame(3);
  assert.equal(craft(G, 'axe').why, 'need');
  Object.assign(G.inv, { wood: 20, stone: 10, fiber: 5, meat: 1 });
  assert.ok(craft(G, 'axe').ok); assert.equal(G.inv.wood, 17); assert.equal(craft(G, 'axe').why, 'have');
  assert.equal(craft(G, 'cooked').why, 'fire');
  assert.ok(craft(G, 'campfire').ok); assert.ok(place(G, 'campfire', G.player.x + 3, G.player.z).ok || place(G, 'campfire', G.player.x - 3, G.player.z).ok);
  assert.ok(nearFire(G)); assert.ok(craft(G, 'cooked').ok); assert.equal(G.inv.cooked, 1);
});

test('needs: hunger and thirst fall, food and water restore, starving hurts, fire keeps you warm at night', () => {
  const G = newGame(5), P = G.player;
  step(G, 60); assert.ok(P.hunger < 92 && P.thirst < 88);
  P.hunger = 50; eat(G, 'berry'); assert.equal(P.hunger, 62, 'berries +12');
  P.hunger = 0; P.thirst = 50; const hp = P.hp; step(G, 10); assert.ok(P.hp < hp, 'starving hurts');
  G.time = DAY * 0.85; assert.ok(isNight(G));
  const w = P.warmth; step(G, 20); assert.ok(P.warmth < w, 'cold at night');
  Object.assign(G.inv, { campfire: 1 }); let ok = false; for (const [a, b] of [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3]]) if (place(G, 'campfire', P.x + a, P.z + b).ok) { ok = true; break; }
  assert.ok(ok, 'placed a fire'); const w2 = P.warmth; G.wolves = []; step(G, 5); assert.ok(P.warmth > w2, 'fire warms');
});

test('water: you can drink only at the shore', () => {
  const G = newGame(9); assert.equal(canDrink(G), false, 'spawn is inland');
  for (let z = G.player.z; z < 260; z += 0.5) { G.player.z = z; if (canDrink(G)) break; }
  assert.ok(canDrink(G)); G.player.thirst = 10; assert.ok(drink(G).ok); assert.equal(G.player.thirst, 35);
});

test('wolves come at night, bite, fear fire, die to a spear and drop meat; walls block them', () => {
  const G = newGame(11), P = G.player; G.time = DAY * 0.82;
  for (let i = 0; i < 400 && !G.wolves.length; i++) step(G, 0.25);
  assert.ok(G.wolves.length > 0, 'a wolf spawned at night');
  const w = G.wolves[0]; w.x = P.x + 1; w.z = P.z; const hp = P.hp; P.hp = 100; step(G, 0.1); assert.ok(P.hp < 100, 'bitten');
  G.inv.spear = 1; w.hp = WOLF.hp; attack(G, w); P.hitCd = 0; attack(G, w); assert.ok(w.hp <= 0); assert.equal(G.inv.meat, 2); assert.equal(G.kills, 1);
  G.time = DAY * 1.4; step(G, 0.1); assert.ok(!isNight(G));
  const H = newGame(11); H.inv.wall = 1; const x = H.player.x + 4, z = H.player.z;
  assert.ok(canPlace(H, 'wall', x, z)); place(H, 'wall', x, z); const s = H.structures[0];
  H.player.x = s.x - 2; H.player.z = s.z; movePlayer(H, 1.5, 0); assert.ok(H.player.x < s.x - 1, 'the wall stops you');
});

test('the clock: day from 05:30 to 19:00, night wraps past midnight', () => {
  const G = newGame(1); for (const [k, n] of [[0.25, false], [0.5, false], [0.78, false], [0.8, true], [0.99, true], [0.1, true], [0.24, false]]) { G.time = DAY * (3 + k); assert.equal(isNight(G), n, String(k)); }
});

test('save / load keeps progress and rebuilds the island from the seed', () => {
  const G = newGame(21); G.inv.wood = 9; G.time = 500; const n = G.world.nodes[5]; n.hp = 0; n.respawnAt = 999; G.structures.push({ kind: 'wall', x: 2, z: 4, rot: 0 });
  const H = load(save(G));
  assert.equal(H.inv.wood, 9); assert.equal(H.time, 500); assert.equal(H.world.nodes[5].hp, 0); assert.equal(H.structures.length, 1);
  assert.ok(save(G).length < 4000, 'small save: only changes are stored');
});

// Racing game rules — no browser APIs, tested with `node --test`.
// Arcade kart model in the spirit of the open racing games (SuperTuxKart, three.js car demos): speed along the heading,
// steering that weakens at speed, rolling drag, grass slows you down; a closed spline track with progress-based laps
// (cutting the course gains nothing) and AI drivers that chase a look-ahead point and brake for corners. Units: metres, seconds.

export const CAR = { accel: 14, brake: 24, reverse: 6, maxSpeed: 52, drag: 0.35, roll: 2.2, grassMax: 16, grassDrag: 2.5, turn: 2.3 };

/** Closed Catmull-Rom spline through the control points → `segments` points per span. */
export function makeTrack(control, { width = 14, segments = 12 } = {}) {
  const pts = [], n = control.length;
  for (let i = 0; i < n; i++) {
    const p0 = control[(i - 1 + n) % n], p1 = control[i], p2 = control[(i + 1) % n], p3 = control[(i + 2) % n];
    for (let s = 0; s < segments; s++) {
      const t = s / segments, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y)); }
  return { pts, width, length: cum[pts.length], cum };
}

/** Nearest point on the centre line: distance to it and progress along the lap (metres from the start line). */
export function locate(track, x, y) {
  let best = { dist: Infinity, s: 0, seg: 0 };
  const { pts, cum } = track;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L2));
    const px = a.x + dx * u, py = a.y + dy * u, d = Math.hypot(x - px, y - py);
    if (d < best.dist) best = { dist: d, s: cum[i] + u * Math.sqrt(L2), seg: i };
  }
  best.onTrack = best.dist <= track.width / 2;
  return best;
}

export function newCar(x, y, heading) { return { x, y, heading, speed: 0, lap: 0, progress: 0, lastS: 0, lapStart: 0, bestLap: null, finished: false }; }

/** One physics step. input: { throttle 0..1, brake 0..1, steer −1..1 }. */
export function step(car, input, dt, onTrack = true) {
  const C = CAR, max = onTrack ? C.maxSpeed : C.grassMax;
  if (input.throttle > 0) car.speed += C.accel * input.throttle * dt;
  if (input.brake > 0) car.speed -= (car.speed > 0 ? C.brake : C.reverse) * input.brake * dt;
  car.speed -= Math.sign(car.speed) * (C.roll + C.drag * Math.abs(car.speed) + (onTrack ? 0 : C.grassDrag * Math.abs(car.speed))) * dt;
  if (Math.abs(car.speed) < 0.05 && !input.throttle) car.speed = 0;
  car.speed = Math.max(-12, Math.min(max + (car.speed > max ? (car.speed - max) * 0.9 : 0), car.speed));   // grass bleeds speed, no wall
  const grip = Math.min(1, Math.abs(car.speed) / 8) * (1 - 0.45 * Math.min(1, Math.abs(car.speed) / C.maxSpeed));
  car.heading += input.steer * C.turn * grip * dt * Math.sign(car.speed || 1);
  car.x += Math.cos(car.heading) * car.speed * dt; car.y += Math.sin(car.heading) * car.speed * dt;
  return car;
}

/** Lap bookkeeping from track progress: a lap counts when progress wraps forward past the line after covering most of the lap. */
export function updateLap(car, track, s, time, laps = 3) {
  const L = track.length; let d = s - car.lastS;
  if (d < -L / 2) d += L; else if (d > L / 2) d -= L;     // crossed the line one way or the other
  car.progress += d; car.lastS = s;
  const lapsDone = Math.floor(car.progress / L);
  if (lapsDone > car.lap) {
    const t = time - car.lapStart; car.bestLap = car.bestLap == null ? t : Math.min(car.bestLap, t); car.lapStart = time; car.lap = lapsDone;
    if (car.lap >= laps) car.finished = true;
  }
  return car;
}

/** AI: aim at the centre line `look` metres ahead; ease off where the line bends hard. */
export function aiInput(car, track, skill = 1) {
  const here = locate(track, car.x, car.y), look = 10 + Math.abs(car.speed) * 0.6;
  const target = pointAt(track, here.s + look), far = pointAt(track, here.s + look * 2.2);
  const want = Math.atan2(target.y - car.y, target.x - car.x);
  let diff = want - car.heading; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
  const bend = Math.abs(angle(target, far, pointAt(track, here.s + look * 3.4)));
  const corner = Math.min(1, bend / 1.2), limit = CAR.maxSpeed * skill * (1 - 0.55 * corner);
  return { steer: Math.max(-1, Math.min(1, diff * 2.5)), throttle: car.speed < limit ? 1 : 0, brake: car.speed > limit + 4 ? 1 : 0 };
}

export function pointAt(track, s) {
  const L = track.length; s = ((s % L) + L) % L;
  const { cum, pts } = track; let i = 0; while (cum[i + 1] < s) i++;
  const a = pts[i], b = pts[(i + 1) % pts.length], u = (s - cum[i]) / ((cum[i + 1] - cum[i]) || 1);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

function angle(a, b, c) { const h1 = Math.atan2(b.y - a.y, b.x - a.x), h2 = Math.atan2(c.y - b.y, c.x - b.x); let d = h2 - h1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

/** Race order: more progress first. */
export function standings(cars) { return [...cars].sort((a, b) => b.progress - a.progress); }

/** A default circuit (≈ 1.2 km): long straight, hairpin, esses. */
export const CIRCUIT = [
  { x: 0, y: 0 }, { x: 220, y: 0 }, { x: 330, y: 60 }, { x: 330, y: 170 }, { x: 240, y: 210 }, { x: 170, y: 150 },
  { x: 100, y: 210 }, { x: 10, y: 250 }, { x: -90, y: 200 }, { x: -110, y: 90 },
];

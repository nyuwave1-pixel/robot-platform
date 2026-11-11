// Keyboard / mouse with pointer lock and edge-triggered key queries.
import { G } from './ctx.js';
export class Input {
  constructor(canvas) {
    this.keys = new Set(); this.hit = new Set(); this.mx = 0; this.my = 0; this.btn = [false, false, false]; this.btnHit = [false, false, false]; this.wheel = 0; this.locked = false; this.canvas = canvas;
    addEventListener('keydown', (e) => { if (G.state === 'playing' || G.state === 'cinematic' || G.state === 'briefing') { if (['Tab', 'Space', 'ControlLeft', 'F1', 'F5', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'KeyG'].includes(e.code) || e.ctrlKey) e.preventDefault(); } if (!e.repeat) this.hit.add(e.code); this.keys.add(e.code); });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.btn = [false, false, false]; });
    addEventListener('mousemove', (e) => { if (this.locked) { this.mx += e.movementX; this.my += e.movementY; } });
    canvas.addEventListener('mousedown', (e) => { if (G.state === 'playing' && !this.locked && !G.test) { this.lock(); return; } this.btn[e.button] = true; this.btnHit[e.button] = true; });
    addEventListener('mouseup', (e) => { this.btn[e.button] = false; });
    addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; if (!this.locked && G.state === 'playing' && !G.test) G.pause(); });
  }
  lock() { try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* headless */ } }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
  down(c) { return this.keys.has(c); }
  pressed(c) { return this.hit.has(c); }
  endFrame() { this.hit.clear(); this.mx = this.my = 0; this.wheel = 0; this.btnHit = [false, false, false]; }
}

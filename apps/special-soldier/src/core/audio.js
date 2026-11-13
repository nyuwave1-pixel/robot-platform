// Fully procedural 3D audio (WebAudio). No sample files: every sound is synthesised, so all of them are
// placeholders for recorded/Foley assets. Positional sounds use HRTF panners with distance low-pass
// (far gunshots get duller) and an indoor reverb send. UE5 equivalent: MetaSounds + Audio Volumes.
import { G } from './ctx.js';
import { clamp } from './util.js';

export class AudioSys {
  constructor() { this.ctx = null; this.loops = {}; this.enabled = false; this.lastStep = 0; }
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = (this.ctx = new AC()); this.enabled = true;
    this.master = c.createGain(); this.comp = c.createDynamicsCompressor(); this.master.connect(this.comp); this.comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master); this.amb = c.createGain(); this.amb.connect(this.master);
    this.rev = c.createConvolver(); this.revGain = c.createGain(); this.revGain.gain.value = 0.12; this.rev.connect(this.revGain); this.revGain.connect(this.master);
    const len = c.sampleRate * 1.8, ir = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); } this.rev.buffer = ir;
    const nl = c.sampleRate * 2; this.noise = c.createBuffer(1, nl, c.sampleRate); const nd = this.noise.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    this.setVolume();
  }
  setVolume() { if (this.master) this.master.gain.value = G.settings.volume; }
  listener(cam) {
    if (!this.enabled) return; const l = this.ctx.listener, p = cam.position, e = cam.matrixWorld.elements;
    if (l.positionX) { l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z; l.forwardX.value = -e[8]; l.forwardY.value = -e[9]; l.forwardZ.value = -e[10]; l.upX.value = e[4]; l.upY.value = e[5]; l.upZ.value = e[6]; }
    else { l.setPosition(p.x, p.y, p.z); l.setOrientation(-e[8], -e[9], -e[10], e[4], e[5], e[6]); }
    this.revGain.gain.value = p.y < -30 ? 0.5 : 0.1;
  }
  out(pos, ref = 6) { // returns node to connect a voice into (spatialised if pos given)
    const c = this.ctx; if (!pos) return this.sfx;
    const pn = c.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = ref; pn.rolloffFactor = 1.1; pn.maxDistance = 600;
    const cam = G.camera.position, py = Number.isFinite(pos.y) ? pos.y : cam.y; if (!Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return this.sfx;
    pn.positionX.value = pos.x; pn.positionY.value = py; pn.positionZ.value = pos.z; const d = Math.hypot(pos.x - cam.x, py - cam.y, pos.z - cam.z);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = clamp(16000 - d * 70, 700, 16000); // air absorption
    lp.connect(pn); pn.connect(this.sfx); pn.connect(this.rev); return lp;
  }
  nz(dur, { f = 1000, q = 1, type = 'lowpass', g = 1, a = 0.002, f2, dest, t = 0, rate = 1 }) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const t0 = c.currentTime + t; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const gn = c.createGain(); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(g, t0 + a); gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    s.connect(fl); fl.connect(gn); gn.connect(dest); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  osc(dur, { f = 200, f2, type = 'sine', g = 0.5, dest, t = 0, a = 0.002 }) {
    const c = this.ctx, o = c.createOscillator(); o.type = type; const t0 = c.currentTime + t; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const gn = c.createGain(); gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(g, t0 + a); gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(gn); gn.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  /** One-shot. name: shot:<cls> | explosion | impact:<surf> | step:<surf> | reload | click | glass | wood | thunder | whiz | radio | hit | hurt | ui | beep | heli... */
  play(name, pos, opt = {}) {
    if (!this.enabled || this.ctx.state !== 'running') return; const [k, v] = name.split(':'), d = this.out(pos, opt.ref || 6);
    switch (k) {
      case 'shot': {
        const P = { 'ASSAULT RIFLE': [1.0, 2600, 150, 0.22], SMG: [0.75, 3400, 210, 0.14], SHOTGUN: [1.5, 1500, 90, 0.42], LMG: [1.15, 2000, 110, 0.3], 'SNIPER RIFLE': [1.6, 1700, 70, 0.6], SIDEARM: [0.22, 5200, 320, 0.07], SPECIAL: [0.9, 500, 60, 0.3], ENEMY: [0.9, 2200, 130, 0.24] }[v] || [1, 2400, 140, 0.2];
        const dd = this.out(pos, v === 'SIDEARM' ? 3 : 14);
        this.nz(P[3], { f: P[1] * (0.9 + Math.random() * 0.2), f2: 300, g: P[0], dest: dd }); this.osc(P[3] * 0.7, { f: P[2], f2: 40, type: 'triangle', g: P[0] * 0.9, dest: dd }); this.nz(0.03, { f: 6000, type: 'highpass', g: P[0] * 0.5, dest: dd });
        if (v !== 'SIDEARM') this.nz(P[3] * 3.5, { f: 900, f2: 200, g: P[0] * 0.16, a: 0.05, dest: dd }); // tail
        break; }
      case 'explosion': { const dd = this.out(pos, 30); this.nz(1.6, { f: 900, f2: 60, g: 2.2, dest: dd }); this.osc(1.1, { f: 90, f2: 24, g: 2.0, dest: dd }); this.nz(0.12, { f: 4000, g: 1.2, dest: dd }); break; }
      case 'impact': { const f = { metal: 3800, concrete: 1800, wood: 900, sand: 500, grass: 600, water: 1200, glass: 5000, flesh: 400 }[v] || 1500; this.nz(0.09, { f, q: v === 'metal' ? 9 : 1, type: v === 'metal' ? 'bandpass' : 'lowpass', g: 0.5, dest: d }); if (v === 'metal') this.osc(0.18, { f: 2400 + Math.random() * 1500, g: 0.12, dest: d }); break; }
      case 'step': { const f = { sand: 700, grass: 1100, concrete: 2000, metal: 2600, water: 1500, wood: 900 }[v] || 1000; const g = opt.g || 0.2; this.nz(v === 'water' ? 0.22 : 0.09, { f, g, a: 0.008, dest: d }); if (v === 'metal') this.osc(0.08, { f: 180, g: g * 0.6, dest: d }); if (v === 'concrete') this.osc(0.04, { f: 110, g: g * 0.5, dest: d }); break; }
      case 'reload': this.nz(0.05, { f: 3000, type: 'bandpass', q: 3, g: 0.45, dest: d }); this.osc(0.05, { f: 320, type: 'square', g: 0.12, dest: d }); this.nz(0.06, { f: 2200, type: 'bandpass', q: 4, g: 0.5, dest: d, t: opt.t2 || 0.5 }); this.osc(0.04, { f: 520, type: 'square', g: 0.14, dest: d, t: (opt.t2 || 0.5) + 0.25 }); break;
      case 'click': this.osc(0.03, { f: 900, type: 'square', g: 0.12, dest: d }); this.nz(0.02, { f: 5000, type: 'highpass', g: 0.25, dest: d }); break;
      case 'bolt': this.nz(0.05, { f: 2600, type: 'bandpass', q: 5, g: 0.4, dest: d, t: 0.25 }); this.nz(0.05, { f: 2000, type: 'bandpass', q: 5, g: 0.4, dest: d, t: 0.6 }); break;
      case 'glass': for (let i = 0; i < 5; i++) this.osc(0.2, { f: 2500 + Math.random() * 4000, g: 0.14, dest: d, t: i * 0.03 }); this.nz(0.3, { f: 5000, type: 'highpass', g: 0.5, dest: d }); break;
      case 'wood': this.nz(0.25, { f: 700, g: 0.8, dest: d }); this.osc(0.12, { f: 160, f2: 70, type: 'square', g: 0.25, dest: d }); break;
      case 'thunder': this.nz(3.5, { f: 260, f2: 50, g: 1.5, a: 0.08, dest: this.sfx }); this.nz(0.3, { f: 2200, g: 0.7, dest: this.sfx }); break;
      case 'whiz': this.nz(0.14, { f: 4200, f2: 1400, type: 'bandpass', q: 6, g: 0.35, dest: this.sfx }); break;
      case 'radio': this.osc(0.07, { f: 1250, type: 'square', g: 0.05, dest: this.sfx }); this.nz(0.35, { f: 2400, type: 'bandpass', q: 1.5, g: 0.05, dest: this.sfx, t: 0.08 }); break;
      case 'hit': this.osc(0.05, { f: 1900, g: 0.16, dest: this.sfx }); break;
      case 'kill': this.osc(0.08, { f: 1300, g: 0.18, dest: this.sfx }); this.osc(0.12, { f: 1950, g: 0.18, dest: this.sfx, t: 0.07 }); break;
      case 'hurt': this.nz(0.14, { f: 500, g: 0.7, dest: this.sfx }); this.osc(0.18, { f: 140, f2: 70, g: 0.5, dest: this.sfx }); break;
      case 'ui': this.osc(0.05, { f: v === 'ok' ? 880 : 620, type: 'triangle', g: 0.12, dest: this.sfx }); break;
      case 'beep': this.osc(0.12, { f: opt.f || 1000, type: 'sine', g: 0.15, dest: d }); break;
      case 'voice': { const f0 = 300 + Math.random() * 200; for (let i = 0; i < 3; i++) this.osc(0.11, { f: f0 * (1 + i * 0.12 * (Math.random() - 0.3)), type: 'sawtooth', g: 0.3, dest: d, t: i * 0.13 }); break; } // enemy shout placeholder
      case 'splash': this.nz(0.5, { f: 1800, f2: 500, g: 0.5, a: 0.02, dest: d }); break;
      case 'heal': this.osc(0.3, { f: 500, f2: 900, g: 0.15, dest: this.sfx }); this.nz(0.5, { f: 3000, type: 'highpass', g: 0.08, dest: this.sfx }); break;
      case 'nvg': this.osc(0.5, { f: 3000, f2: 9000, g: 0.05, dest: this.sfx }); break;
      case 'alarm': for (let i = 0; i < 4; i++) this.osc(0.4, { f: 620, f2: 880, type: 'square', g: 0.14, dest: d, t: i * 0.5 }); break;
    }
  }
  /** Continuous layer (ocean, rain, jungle, boat, heli, wind, drone). vol 0 stops it. */
  loop(name, vol) {
    if (!this.enabled) return; const c = this.ctx; let L = this.loops[name];
    if (!L) {
      if (vol <= 0) return; const g = c.createGain(); g.gain.value = 0; g.connect(this.amb); L = this.loops[name] = { g, nodes: [] };
      const N = (f, q, type, rate = 1) => { const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true; s.playbackRate.value = rate; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); s.start(); return fl; };
      const LFO = (rate, depth, param) => { const o = c.createOscillator(); o.frequency.value = rate; const og = c.createGain(); og.gain.value = depth; o.connect(og); og.connect(param); o.start(); };
      if (name === 'ocean') { const n = N(480, 0.6, 'lowpass'); const lg = c.createGain(); lg.gain.value = 0.6; LFO(0.13, 0.4, lg.gain); n.connect(lg); lg.connect(g); }
      else if (name === 'rain') { N(5200, 0.4, 'highpass').connect(g); const n2 = N(1400, 0.5, 'bandpass'); const g2 = c.createGain(); g2.gain.value = 0.5; n2.connect(g2); g2.connect(g); }
      else if (name === 'wind') { const n = N(320, 1.2, 'bandpass'); LFO(0.2, 180, n.frequency); n.connect(g); }
      else if (name === 'jungle') { const n = N(6200, 9, 'bandpass'); const lg = c.createGain(); lg.gain.value = 0.2; LFO(11, 0.2, lg.gain); n.connect(lg); lg.connect(g); const n2 = N(3600, 14, 'bandpass'); const l2 = c.createGain(); l2.gain.value = 0.15; LFO(0.7, 0.15, l2.gain); n2.connect(l2); l2.connect(g); L.bird = true; }
      else if (name === 'boat') { for (const f of [46, 69, 92.5]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = c.createBiquadFilter(); lp.frequency.value = 420; const og = c.createGain(); og.gain.value = 0.22; o.connect(lp); lp.connect(og); og.connect(g); o.start(); } const n = N(900, 0.5, 'lowpass'); const ng = c.createGain(); ng.gain.value = 0.5; n.connect(ng); ng.connect(g); }
      else if (name === 'heli') { const n = N(240, 0.8, 'lowpass'); const lg = c.createGain(); lg.gain.value = 0.5; LFO(13, 0.5, lg.gain); n.connect(lg); lg.connect(g); const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 86; const og = c.createGain(); og.gain.value = 0.1; o.connect(og); og.connect(g); o.start(); const w = N(3000, 0.7, 'bandpass'); const wg = c.createGain(); wg.gain.value = 0.12; w.connect(wg); wg.connect(g); }
      else if (name === 'drone') { for (const f of [210, 318]) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; const og = c.createGain(); og.gain.value = 0.05; o.connect(og); og.connect(g); o.start(); } }
      else if (name === 'hum') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 50; const lp = c.createBiquadFilter(); lp.frequency.value = 200; o.connect(lp); lp.connect(g); o.start(); N(180, 1, 'lowpass').connect(g); }
    }
    L.g.gain.setTargetAtTime(vol, c.currentTime, 0.4);
    if (L.bird && vol > 0.02 && Math.random() < 0.006) { const f = 1800 + Math.random() * 2400; for (let i = 0; i < 2 + (Math.random() * 3 | 0); i++) this.osc(0.09, { f, f2: f * (0.7 + Math.random() * 0.7), g: 0.03 * vol * 6, dest: this.amb, t: i * 0.13 }); }
  }
  stopLoops() { for (const k in this.loops) this.loops[k].g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); }
  /** Radio line: squelch + browser speech synthesis (placeholder for recorded VO). */
  say(text) {
    this.play('radio'); if (!G.settings.voice || !window.speechSynthesis || G.test) return;
    try { const u = new SpeechSynthesisUtterance(text.replace(/^[A-Z0-9 ]+:\s*/, '')); u.rate = 1.08; u.pitch = 0.7; u.volume = G.settings.volume * 0.9; u.lang = 'en-US'; speechSynthesis.speak(u); } catch (e) { /* no TTS available */ }
  }
  hush() { if (window.speechSynthesis) speechSynthesis.cancel(); }
}

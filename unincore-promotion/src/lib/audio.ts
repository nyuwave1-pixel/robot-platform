"use client";

/**
 * Global audio controller: only one sound source plays at a time.
 * Any player (intro pad, a film with sound) claims the channel; the previous
 * owner is stopped first. Nothing plays until the visitor asks for sound.
 */
type Stop = () => void;
let current: { id: string; stop: Stop } | null = null;

export function claimAudio(id: string, stop: Stop) {
  if (current && current.id !== id) current.stop();
  current = { id, stop };
}

export function releaseAudio(id: string) {
  if (current?.id === id) current = null;
}

/**
 * A soft ambient pad synthesised with Web Audio (no audio file needed).
 * Returns a stop function that fades out over ~1 s.
 */
export function startAmbientPad(): Stop {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.connect(master);
  master.connect(ctx.destination);

  // A major-ninth chord voiced low and wide, slightly detuned for warmth.
  const notes = [130.81, 196.0, 246.94, 293.66, 392.0];
  const oscs = notes.flatMap((f, i) =>
    [-4, 4].map((detune) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.18 : 0.06;
      o.connect(g);
      g.connect(filter);
      o.start();
      return o;
    }),
  );
  // Slow filter swell gives the "light opening up" feeling of the intro.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 500;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const now = ctx.currentTime;
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.32, now + 1.6);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 1);
    setTimeout(() => {
      oscs.forEach((o) => o.stop());
      lfo.stop();
      ctx.close();
    }, 1100);
  };
}

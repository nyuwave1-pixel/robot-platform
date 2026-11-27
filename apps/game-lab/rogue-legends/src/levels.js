// BIT PARK level list (verify(levelIndex0, proof)): one entry per hero × difficulty (level = enemy scaling: +8 % hp and +1 damage per step).
export const LEVELS = [
  { id: 'warden-0', hero: 'warden', level: 0 }, { id: 'arcanist-0', hero: 'arcanist', level: 0 },
  { id: 'warden-1', hero: 'warden', level: 1 }, { id: 'arcanist-1', hero: 'arcanist', level: 1 },
  { id: 'warden-2', hero: 'warden', level: 2 }, { id: 'arcanist-2', hero: 'arcanist', level: 2 },
  // rule-twist variants for A/B playtests (appended so the indices above never change)
  { id: 'warden-echo-0', hero: 'warden', level: 0, variant: 'echo' }, { id: 'arcanist-echo-0', hero: 'arcanist', level: 0, variant: 'echo' },
  { id: 'warden-tide-0', hero: 'warden', level: 0, variant: 'tide' }, { id: 'arcanist-tide-0', hero: 'arcanist', level: 0, variant: 'tide' },
];

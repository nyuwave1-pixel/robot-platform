// BIT PARK level list (verify(levelIndex0, proof)): one entry per difficulty, same presets as logic.js LEVELS.
import { LEVELS as PRESETS } from './logic.js';
export const LEVELS = ['EASY', 'NORMAL', 'HARD'].map((id) => ({ id, ...PRESETS[id], bars: 16 }));

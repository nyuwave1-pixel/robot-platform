// __NAME__ — game rules go here (no browser APIs), tested with `node --test`. Start by replacing this tiny example.
export function newState() { return { t: 0, score: 0 }; }
export function update(state, dt, input) { state.t += dt; if (input.action) state.score += 1; return state; }

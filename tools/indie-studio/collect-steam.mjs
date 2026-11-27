#!/usr/bin/env node
// Steam indie market snapshot collector (Node 22+, no npm deps).
//
//   node tools/indie-studio/collect-steam.mjs            # resume: keep finished entries, fetch the rest
//   node tools/indie-studio/collect-steam.mjs --fresh    # refetch everything
//   node tools/indie-studio/collect-steam.mjs --out <path.json> --skip-tags --all-pages 10 --tag-top 20
//
// Also: steamrankings.com/genres (외부 추정, parsed table) + /data/genres.json (main-genre classification),
// joined with SteamSpy request=all pages -> genre_top_joined. steamrankings needs the system curl (bot check on fetch).
//
// Sources (all public, no API key):
//   - Steam Web API GetNumberOfCurrentPlayers  -> 실측 current players at fetch time
//   - SteamSpy appdetails / tag / top100in2weeks -> 추정 (owners are ranges, ccu = yesterday's peak)
//   - Steam store appdetails (cc=us)            -> release date, price, DLC list, developers
// SteamDB is NOT used (403 to scripts).
//
// The JSON is written after every request so a killed run keeps its partial data;
// re-running resumes from the file.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FRESH = args.includes('--fresh');
const SKIP_TAGS = args.includes('--skip-tags');
const today = new Date().toISOString().slice(0, 10);
const OUT = resolve(argVal('--out', resolve(REPO, 'docs/indie-studio/data', `steam-snapshot-${today}.json`)));
const TAG_TOP = Number(argVal('--tag-top', 20));
const SLEEP_MS = 1100;

// Benchmark titles (appid verified against the name SteamSpy/store returns; mismatches are flagged).
const BENCHMARKS = [
  ['Slay the Spire 2', 2868840], ['Slay the Spire', 646570], ['Stardew Valley', 413150],
  ['Terraria', 105600], ['Valheim', 892970], ['Project Zomboid', 108600], ['RimWorld', 294100],
  ['Balatro', 2379780], ['Vampire Survivors', 1794680], ['Hollow Knight: Silksong', 1030300],
  ['Hollow Knight', 367520], ["Don't Starve Together", 322330], ['Hades II', 1145350],
  ['Dead Cells', 588650], ['Factorio', 427520], ['Satisfactory', 526870], ['Lethal Company', 1966720],
  ['Enshrouded', 1203620], ['Brotato', 1942280], ['DAVE THE DIVER', 1868140], ['Cult of the Lamb', 1313140],
];

// Genre -> SteamSpy tag candidates (first one returning data wins; all attempts are recorded).
const GENRES = [
  ['Survival Crafting', ['Open World Survival Craft', 'Survival', 'Crafting']],
  ['Roguelike/Roguelite', ['Roguelite', 'Roguelike', 'Rogue-lite', 'Rogue-like']],
  ['Bullet Heaven', ['Bullet Heaven', 'Survivors-like', 'Auto Battler', 'Bullet Hell']],
  ['Metroidvania', ['Metroidvania', 'Platformer']],
  ['Deck Building', ['Deckbuilding', 'Card Battler', 'Deckbuilder', 'Card Game']],
  ['MMORPG', ['MMORPG', 'MMO', 'Massively Multiplayer']],
  ['Open World RPG', ['Open World', 'RPG', 'Action RPG']],
  ['Simulation', ['Simulation']],
  ['Farming Sim', ['Farming Sim', 'Farming', 'Life Sim']],
  ['Colony Sim', ['Colony Sim']],
  ['Strategy/RTS', ['RTS', 'Strategy']],
  ['Tower Defense', ['Tower Defense', 'Tower+Defense']],
  ['Tactical FPS', ['Tactical', 'FPS']],
  ['Multiplayer Co-op', ['Online Co-Op', 'Co-op']],
  ['Sandbox', ['Sandbox', 'Building']],
  ['Puzzle', ['Puzzle']],
  ['Cooking/Restaurant', ['Cooking', 'Food', 'Management']],
  ['Horror Survival', ['Survival Horror', 'Horror']],
  ['Automation/Factory', ['Automation']],
  ['Action Adventure', ['Action-Adventure']],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function getJson(url, { pace = true, timeoutMs = 60000 } = {}) {
  if (pace) { const wait = lastCall + SLEEP_MS - Date.now(); if (wait > 0) await sleep(wait); }
  lastCall = Date.now();
  const at = new Date().toISOString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'indie-market-research/1.0' } });
    const text = await res.text();
    if (!res.ok) return { ok: false, at, url, error: `HTTP ${res.status}` };
    try { return { ok: true, at, url, data: JSON.parse(text) }; }
    catch { return { ok: false, at, url, error: `invalid JSON (${text.slice(0, 80)})` }; }
  } catch (e) { return { ok: false, at, url, error: String(e?.message || e) }; }
}

function parseOwners(s) {
  if (typeof s !== 'string') return null;
  const m = s.replace(/,/g, '').match(/(\d+)\s*\.\.\s*(\d+)/);
  return m ? { low: Number(m[1]), high: Number(m[2]), raw: s } : null;
}
function topTags(tags, n = 8) {
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) return [];
  return Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);
}

let snap;
async function load() {
  if (!FRESH && existsSync(OUT)) {
    try { snap = JSON.parse(await readFile(OUT, 'utf8')); return; } catch { /* start over */ }
  }
  snap = {
    schema: 'indie-studio-steam-snapshot/1',
    collected_on: today,
    started_at: new Date().toISOString(),
    notes: [
      'current_players: Steam Web API GetNumberOfCurrentPlayers, 실측 at fetched_at.',
      'steamspy.*: SteamSpy estimates. owners is a range; ccu is yesterday peak concurrent; playtime in minutes.',
      'store.*: Steam store appdetails (cc=us), price in USD cents.',
      'SteamDB not used (blocks scripts).',
    ],
    games: {}, genres: {}, top100in2weeks: null,
  };
}
async function save() {
  snap.updated_at = new Date().toISOString();
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(snap, null, 1));
}

async function collectGame(name, appid) {
  const g = snap.games[appid] ||= { name, appid };
  if (!g.current_players?.ok) {
    const r = await getJson(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`);
    const pc = r.data?.response?.player_count;
    g.current_players = r.ok && r.data?.response?.result === 1
      ? { ok: true, value: pc, fetched_at: r.at, url: r.url }
      : { ok: false, fetched_at: r.at, url: r.url, error: r.error || `result=${r.data?.response?.result}` };
    await save();
  }
  if (!g.steamspy?.ok) {
    const r = await getJson(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`);
    const d = r.data;
    g.steamspy = r.ok && d && d.name
      ? {
          ok: true, fetched_at: r.at, url: r.url, name: d.name, developer: d.developer, publisher: d.publisher,
          owners: parseOwners(d.owners), positive: d.positive, negative: d.negative,
          positive_pct: d.positive + d.negative > 0 ? Math.round((1000 * d.positive) / (d.positive + d.negative)) / 10 : null,
          price_cents: Number(d.price), initialprice_cents: Number(d.initialprice), discount: Number(d.discount),
          ccu_yesterday_peak: d.ccu, average_forever_min: d.average_forever, median_forever_min: d.median_forever,
          average_2weeks_min: d.average_2weeks, genre: d.genre, languages: d.languages, top_tags: topTags(d.tags),
        }
      : { ok: false, fetched_at: r.at, url: r.url, error: r.error || 'empty response' };
    await save();
  }
  if (!g.store?.ok) {
    const r = await getJson(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`);
    const e = r.data?.[appid];
    g.store = r.ok && e?.success
      ? {
          ok: true, fetched_at: r.at, url: r.url, name: e.data.name, type: e.data.type,
          release_date: e.data.release_date, developers: e.data.developers, publishers: e.data.publishers,
          is_free: e.data.is_free, price: e.data.price_overview || null, dlc_count: (e.data.dlc || []).length,
          genres: (e.data.genres || []).map((x) => x.description),
          categories: (e.data.categories || []).map((x) => x.description),
          metacritic: e.data.metacritic?.score ?? null, recommendations: e.data.recommendations?.total ?? null,
          platforms: e.data.platforms,
        }
      : { ok: false, fetched_at: r.at, url: r.url, error: r.error || 'success=false' };
    await save();
  }
  const seen = g.store?.name || g.steamspy?.name;
  g.name_check = seen ? (seen.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '') ? 'match' : `differs: ${seen}`) : 'unknown';
  console.log(`[game] ${name} (${appid}) players=${g.current_players.ok ? g.current_players.value : 'FAIL'} spy=${g.steamspy.ok} store=${g.store.ok} ${g.name_check}`);
}

async function collectGenre(genre, candidates) {
  const G = snap.genres[genre] ||= { genre, attempts: [] };
  if (G.ok) return;
  for (const tag of candidates) {
    if (G.attempts.some((a) => a.tag === tag && a.count === 0 && !a.error)) continue; // tag answered but empty: don't retry
    const url = `https://steamspy.com/api.php?request=tag&tag=${encodeURIComponent(tag).replace(/%20/g, '+')}`;
    const r = await getJson(url, { timeoutMs: 120000 });
    const rows = r.ok && r.data && typeof r.data === 'object' ? Object.values(r.data) : [];
    G.attempts.push({ tag, ok: r.ok && rows.length > 0, count: rows.length, at: r.at, error: r.error });
    if (rows.length > 0) {
      const sorted = rows
        .map((d) => ({ appid: d.appid, name: d.name, developer: d.developer, owners: parseOwners(d.owners), positive: d.positive, negative: d.negative, price_cents: Number(d.price), ccu_yesterday_peak: d.ccu, average_forever_min: d.average_forever }))
        .sort((a, b) => (b.owners?.low ?? 0) - (a.owners?.low ?? 0) || (b.positive ?? 0) - (a.positive ?? 0));
      Object.assign(G, {
        ok: true, tag_used: tag, url, fetched_at: r.at, total_in_tag: rows.length,
        owners_buckets: sorted.reduce((acc, x) => { const k = x.owners?.raw || 'unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
        top: sorted.slice(0, TAG_TOP),
        top_by_reviews: [...sorted].sort((a, b) => (b.positive + b.negative) - (a.positive + a.negative)).slice(0, 10).map((x) => x.appid),
      });
      await save();
      console.log(`[genre] ${genre} via "${tag}": ${rows.length} titles`);
      return;
    }
    await save();
    console.log(`[genre] ${genre} tag "${tag}" -> ${r.error || 'no rows'}`);
  }
  G.ok = false;
  await save();
}

await load();
for (const [name, id] of BENCHMARKS) await collectGame(name, id);
if (!snap.top100in2weeks?.ok) {
  const r = await getJson('https://steamspy.com/api.php?request=top100in2weeks', { timeoutMs: 120000 });
  snap.top100in2weeks = r.ok
    ? { ok: true, fetched_at: r.at, url: r.url, items: Object.values(r.data).map((d) => ({ appid: d.appid, name: d.name, developer: d.developer, owners: parseOwners(d.owners), positive: d.positive, negative: d.negative, price_cents: Number(d.price), ccu_yesterday_peak: d.ccu })) }
    : { ok: false, fetched_at: r.at, url: r.url, error: r.error };
  await save();
  console.log(`[top100in2weeks] ok=${snap.top100in2weeks.ok}`);
}
// steamrankings.com answers Node's fetch with a bot-check page (HTTP 202 + sgcaptcha refresh) but serves the
// public page to curl, so fall back to the system curl binary (no npm dep). The method used is recorded.
import { execFileSync } from 'node:child_process';
async function fetchText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'indie-market-research/1.0' } });
    const text = await res.text();
    if (res.status === 200 && !text.includes('sgcaptcha')) return { text, method: 'fetch' };
  } catch { /* fall through */ }
  const text = execFileSync('curl', ['-s', '-f', '-m', '60', url], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (!text || text.includes('sgcaptcha')) throw new Error('bot-check page returned');
  return { text, method: 'curl' };
}

// External published estimate: steamrankings.com/genres (indie games >= $4.99, Jan 2023..Oct 2025).
// Stored verbatim as 외부 추정 — these are the site's revenue estimates, not Steam data.
async function collectSteamRankings() {
  if (snap.steamrankings_genres?.ok && snap.steamrankings_genres.genres?.length) return;
  const url = 'https://steamrankings.com/genres/';
  const at = new Date().toISOString();
  try {
    const got = await fetchText(url);
    let s = got.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
    s = s.replace(/&middot;/g, '·').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
    const intro = (s.match(/We looked at[^.]*\.[^.]*\.[^.]*\.[^.]*\./) || [''])[0];
    const updated = (s.match(/Updated (\d+ \w+ \d{4})/) || [])[1] || null;
    const row = / (\d{1,2}) ([^$|]{2,45}?) (?:small sample )?([SABCDF]) (\d+) ([\d.]+%) ([\d.]+%) (\$[\d.]+[kM]) (\$[\d.]+[kM]) (\d+) (\d+%) (\d+) \+/g;
    const parse = (part) => [...part.matchAll(row)].map((m) => ({ rank: +m[1], name: m[2].trim(), grade: m[3], score: +m[4], odds_100k: m[5], odds_1m: m[6], avg_release: m[7], typical_100k_game: m[8], releases_per_year: +m[9], aa_aaa_share: m[10], wishlisted_coming: +m[11] }));
    const split = s.indexOf('# Steam tag');
    snap.steamrankings_genres = { ok: true, fetched_at: at, url, label: '외부 추정 (steamrankings.com)', fetch_method: got.method, updated, intro, genres: parse(split > 0 ? s.slice(0, split) : s), tags: split > 0 ? parse(s.slice(split)) : [] };
  } catch (e) { snap.steamrankings_genres = { ok: false, fetched_at: at, url, error: String(e?.message || e) }; }
  await save();
  console.log(`[steamrankings] ok=${snap.steamrankings_genres.ok} genres=${snap.steamrankings_genres.genres?.length ?? 0}`);
}
// SteamSpy request=all pages (≈1000 apps each, highest owner buckets first; SteamSpy allows 1 call / 60 s).
const ALL_PAGES = Number(argVal('--all-pages', 5));
async function collectAllPages() {
  snap.steamspy_all ||= { pages: {} };
  for (let p = 0; p < ALL_PAGES; p++) {
    if (snap.steamspy_all.pages[p]?.ok) continue;
    if (Object.keys(snap.steamspy_all.pages).length) await sleep(61000);
    const r = await getJson(`https://steamspy.com/api.php?request=all&page=${p}`, { timeoutMs: 120000 });
    snap.steamspy_all.pages[p] = r.ok
      ? { ok: true, fetched_at: r.at, url: r.url, items: Object.values(r.data).map((d) => [d.appid, d.name, d.developer, d.owners, d.positive, d.negative, Number(d.price), d.ccu]) }
      : { ok: false, fetched_at: r.at, url: r.url, error: r.error };
    snap.steamspy_all.item_fields = ['appid', 'name', 'developer', 'owners', 'positive', 'negative', 'price_cents', 'ccu_yesterday_peak'];
    await save();
    console.log(`[steamspy all] page ${p} ok=${snap.steamspy_all.pages[p].ok} n=${snap.steamspy_all.pages[p].items?.length ?? 0}`);
  }
}

// Our 20 genres -> steamrankings.com genre ids (their classification: one main genre per game).
const SR_MAP = {
  'Survival Crafting': ['survival-craft'], 'Roguelike/Roguelite': ['roguelite'], 'Bullet Heaven': ['bullet-heaven'],
  Metroidvania: ['metroidvania'], 'Deck Building': ['deckbuilder'], MMORPG: ['mmo'], 'Open World RPG': ['rpg', 'open-world-action', 'arpg-loot'],
  Simulation: ['vehicle-sim', 'management', 'job-sim'], 'Farming Sim': ['life-sim'], 'Colony Sim': ['colony'],
  'Strategy/RTS': ['rts', '4x-grand'], 'Tower Defense': ['tower-defense'], 'Tactical FPS': ['shooter', 'extraction'],
  'Multiplayer Co-op': ['co-op-horror', 'friend-slop', 'party'], Sandbox: ['sandbox'], Puzzle: ['puzzle'],
  'Cooking/Restaurant': ['cooking'], 'Horror Survival': ['horror', 'co-op-horror'], 'Automation/Factory': ['automation'],
  'Action Adventure': ['action-adventure'],
};
async function joinGenres() {
  const at = new Date().toISOString();
  const url = 'https://steamrankings.com/data/genres.json';
  let cls;
  try {
    cls = JSON.parse((await fetchText(url)).text);
  } catch (e) { snap.genre_top_joined = { ok: false, fetched_at: at, url, error: String(e?.message || e) }; await save(); return; }
  // SteamSpy's "all" pages are not a clean owners ranking (e.g. Valheim is in none of pages 0-4), so the
  // benchmark titles fetched via appdetails are merged into the pool too.
  const pooled = Object.values(snap.steamspy_all?.pages || {}).filter((p) => p.ok).flatMap((p) => p.items);
  const seen = new Set(pooled.map((r) => r[0]));
  const bench = Object.values(snap.games).filter((g) => g.steamspy?.ok && g.steamspy.owners && !seen.has(g.appid))
    .map((g) => [g.appid, g.steamspy.name, g.steamspy.developer, g.steamspy.owners.raw, g.steamspy.positive, g.steamspy.negative, g.steamspy.price_cents, g.steamspy.ccu_yesterday_peak]);
  const rows = [...pooled, ...bench];
  const out = {};
  for (const [genre, ids] of Object.entries(SR_MAP)) {
    const hits = rows
      .filter(([appid]) => (cls.g?.[appid] || []).some((x) => ids.includes(x)))
      .map(([appid, name, developer, owners, positive, negative, price, ccu]) => ({ appid, name, developer, owners: parseOwners(owners), positive, negative, positive_pct: positive + negative ? Math.round((1000 * positive) / (positive + negative)) / 10 : null, price_cents: price, ccu_yesterday_peak: ccu, sr_genre: cls.g[appid], tier: cls.t?.[appid] || 'indie/unknown' }))
      .sort((a, b) => (b.owners?.low ?? 0) - (a.owners?.low ?? 0) || (b.positive + b.negative) - (a.positive + a.negative));
    out[genre] = { sr_ids: ids, count_in_pool: hits.length, top: hits.slice(0, TAG_TOP) };
  }
  snap.genre_top_joined = {
    ok: true, fetched_at: at, classification_url: url, pool_size: rows.length,
    method: 'SteamSpy request=all pages (highest-owner apps) joined with steamrankings.com main-genre classification; sorted by SteamSpy owners lower bound, then review count. tier: steamrankings AA/AAA label (absent = indie or unlabelled).',
    genres: out,
  };
  await save();
  console.log(`[join] pool=${rows.length}`);
}

await collectSteamRankings();
if (!SKIP_TAGS) for (const [g, c] of GENRES) await collectGenre(g, c);
await collectAllPages();
await joinGenres();
snap.finished_at = new Date().toISOString();
await save();
console.log(`done -> ${OUT}`);

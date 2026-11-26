// Exports the "GAME DEV LAB" data that the BIT PARK portal shows (separate repo: bitpark-portal).
//   node tools/portal/export-bitpark-feed.mjs
// Writes docs/game-dev/bitpark/feed.json. Every value is read from this repo (docs, test reports, git history),
// nothing is typed in by hand, so the portal never shows a number the repo does not back up.
// Contract for the portal: docs/game-dev/bitpark/README.md (schemaVersion 1).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');
const git = (...a) => { try { return execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' }).trim(); } catch { return ''; } };
const last = (text, re) => { let m, out = null; const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); while ((m = g.exec(text))) out = m; return out; };

// ---- markdown table helper: rows of the first table after a heading that starts with `heading`
function table(md, heading) {
  const i = md.split('\n').findIndex((l) => l.startsWith('#') && l.replace(/^#+\s*/, '').startsWith(heading));
  if (i < 0) return [];
  const lines = md.split('\n').slice(i + 1);
  const start = lines.findIndex((l) => l.trim().startsWith('|'));
  if (start < 0) return [];
  const rows = [];
  for (const l of lines.slice(start)) { if (!l.trim().startsWith('|')) break; rows.push(l.trim().slice(1, -1).split('|').map((c) => c.trim())); }
  return rows.slice(2); // drop header + separator
}
const clean = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();

// ---- SPECIAL SOLDIER (web)
const ssSubjects = git('log', '--format=%s', '--', 'apps/special-soldier').split('\n');
const ssVersion = ssSubjects.map((s) => s.match(/\(v(\d+\.\d+(?:\.\d+)?)\)/)).find(Boolean)?.[1] ?? null;
const qa = read('apps/special-soldier/docs/QA_REPORT.md');
const e2e = last(qa, /E2E\s*\*{0,2}\s*(\d+)\s*\/\s*(\d+)/);
const regression = last(qa + '\n' + ssSubjects.join('\n'), /regression \((\d+)\/(\d+)\)/);

// ---- Unity pilot
const us = read('docs/game-dev/UNITY_SETUP.md');
const edit = last(us, /EditMode\s*\*{0,2}\s*(\d+)\s*\/\s*(\d+)/);
const play = last(us, /PlayMode\s*\*{0,2}\s*(\d+)\s*\/\s*(\d+)/);
const unityVersion = JSON.parse(read('tools/dev-env/versions.json') || '{}').unity ?? null;
const cliDone = /unity command[^\n]*(왕복 테스트 (통과|성공)|round-trip passed)/i.test(us);

// ---- learning path (section 2: units, section 3: next tasks)
const lp = read('docs/game-dev/UNITY_LEARNING_PATH.md');
const courses = table(lp, '1. 공식 무료 코스').map((r) => ({ title: clean(r[1]), duration: clean(r[2]), practice: clean(r[3]), url: (r[1].match(/\((https?:[^)]+)\)/) || [])[1] ?? null }));
const units = table(lp, '2. 코드 읽기 순서').map((r) => ({ unit: clean(r[0]), files: clean(r[1]), learn: clean(r[2]) }));
const next = table(lp, '3. 다음 업데이트 과제').map((r) => ({ task: clean(r[1]), feature: clean(r[2]), resource: clean(r[3]) }));

// ---- free asset pipeline
const fas = read('docs/game-dev/FREE_ASSET_SOURCES.md');
const sources = [...fas.matchAll(/^\|\s*\[([^\]]+)\]\((https?:[^)]+)\)\s*\|\s*([^|]+)\|/gm)].map((m) => ({ name: m[1], url: m[2], license: clean(m[3]) }));
const seen = new Set(); const uniqueSources = sources.filter((s) => !s.url.includes('github.com') && !seen.has(s.name) && seen.add(s.name));
// GitHub table columns: repo | stars | license | last push | verdict
const openSource = table(fas, 'GitHub 오픈소스').map((r) => ({ repo: clean(r[0]), url: (r[0].match(/\((https?:[^)]+)\)/) || [])[1] ?? null, stars: Number(clean(r[1]).replace(/,/g, '')) || null, license: clean(r[2]), verdict: clean(r[4]) }));

// ---- media that the portal may show (relative to the repo root; portal copies them)
const shots = existsSync(join(ROOT, 'docs/game-dev/screenshots'))
  ? readdirSync(join(ROOT, 'docs/game-dev/screenshots')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).map((f) => `docs/game-dev/screenshots/${f}`) : [];
const webgl = 'apps/unity-studio/Builds/WebGL';

// ---- dev log (game work only)
const log = git('log', '-n', '40', '--date=short', '--format=%h%x09%ad%x09%s', '--', 'apps/special-soldier', 'apps/unity-studio', 'apps/game-lab', 'docs/game-dev', 'tools/dev-env', 'tools/game-lab')
  .split('\n').filter(Boolean).map((l) => { const [hash, date, subject] = l.split('\t'); const area = (subject.match(/^\w+\(([^)]+)\)/) || [])[1] ?? 'general'; return { hash, date, area, subject }; });

// ---- Genre Game Lab: sub-sections created by tools/game-lab/new-game.mjs (apps/game-lab/*/game.json)
const labDir = join(ROOT, 'apps', 'game-lab');
const labGames = existsSync(labDir) ? readdirSync(labDir).filter((d) => existsSync(join(labDir, d, 'game.json'))).map((d) => {
  const g = JSON.parse(read(`apps/game-lab/${d}/game.json`));
  const testFiles = existsSync(join(labDir, d, 'tests')) ? readdirSync(join(labDir, d, 'tests')).filter((f) => f.endsWith('.test.mjs')) : [];
  const testCount = testFiles.reduce((n, f) => n + (read(`apps/game-lab/${d}/tests/${f}`).match(/^test\(/gm) || []).length, 0);
  const shot = `docs/game-dev/screenshots/game-lab-${d}.png`;
  return { slug: g.id, name: g.name, genre: g.genre, status: g.status, engine: g.engine, summary: g.summary, created: g.created, learnedFrom: g.learnedFrom || [],
    portal: g.portal || null, tests: testCount, path: `apps/game-lab/${d}`, screenshot: existsSync(join(ROOT, shot)) ? shot : null };
}).sort((a, b) => a.created.localeCompare(b.created)) : [];
const catalog = read('docs/game-dev/genres/OPEN_SOURCE_CATALOG.md');
const catalogEntries = (catalog.match(/^\|[^|\n]+\|\s*https:\/\/github\.com\//gm) || []).length;

const feed = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: { repo: 'nyuwave1-pixel/robot-platform', branch: git('rev-parse', '--abbrev-ref', 'HEAD'), commit: git('rev-parse', '--short', 'HEAD') },
  section: {
    id: 'game-dev-lab',
    title: 'GAME DEV LAB',
    subtitle: '무료 에셋·오픈소스로 웹 게임과 Unity를 함께 개발하는 과정',
    honesty: '모든 수치는 저장소의 테스트 보고서·문서·Git 기록에서 자동으로 읽은 값입니다.',
  },
  projects: [
    {
      slug: 'special-soldier', name: 'SPECIAL SOLDIER', engine: 'Three.js (web)', version: ssVersion,
      tests: { e2e: e2e ? { passed: +e2e[1], total: +e2e[2] } : null, lastRegression: regression ? { passed: +regression[1], total: +regression[2] } : null },
      playable: { web: 'https://special-soldier.vercel.app', portal: 'https://www.airobotphysical.com/games/play/special-soldier/', rpMessage: 'game_result' },
      docs: ['apps/special-soldier/README.md', 'apps/special-soldier/docs/GAME_DESIGN.md'],
    },
    {
      slug: 'unity-island-slice', name: 'SPECIAL SOLDIER — Unity Island Slice', engine: `Unity ${unityVersion ?? ''} (URP)`.trim(), status: 'pilot',
      tests: { editMode: edit ? { passed: +edit[1], total: +edit[2] } : null, playMode: play ? { passed: +play[1], total: +play[2] } : null },
      playable: { windows: 'apps/unity-studio/Builds/Slice/IslandSlice.exe (local build, not committed)', webgl: existsSync(join(ROOT, webgl, 'index.html')) ? `${webgl}/index.html` : null },
      screenshots: shots,
      docs: ['apps/unity-studio/README.md', 'docs/game-dev/UNITY_SETUP.md'],
    },
  ],
  pipeline: {
    steps: ['무료 에셋 조사·라이선스 확인(CC0 우선)', 'Blender 5.3 변환(GLB)', '웹 게임·Unity 양쪽 적용', '자동 테스트(E2E·EditMode·PlayMode)', '라이선스 대장 기록'],
    sources: uniqueSources,
    openSource,
    claudeUnityLiveControl: cliDone ? 'done' : 'pending',
  },
  learning: { courses, units, next },
  genreLab: {
    title: '장르 게임 랩',
    about: '오픈소스 게임을 장르별로 조사·학습하고, 생성기(tools/game-lab/new-game.mjs)로 하부 섹션을 만들어 개발합니다.',
    catalog: catalog ? { path: 'docs/game-dev/genres/OPEN_SOURCE_CATALOG.md', githubEntries: catalogEntries } : null,
    subsections: labGames,
  },
  devlog: log,
};

const out = join(ROOT, 'docs/game-dev/bitpark/feed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(feed, null, 2) + '\n');
console.log(`[feed] ${relative(ROOT, out)}: ${feed.projects.length} projects, ${units.length} learning units, ${courses.length} courses, ${uniqueSources.length} asset sources, ${openSource.length} GitHub projects, ${log.length} log entries, ${labGames.length} genre-lab games`);
console.log(`[feed] special-soldier v${ssVersion} e2e ${e2e ? e2e[1] + '/' + e2e[2] : '-'} | unity edit ${edit ? edit[1] + '/' + edit[2] : '-'} play ${play ? play[1] + '/' + play[2] : '-'} | live control ${feed.pipeline.claudeUnityLiveControl}`);

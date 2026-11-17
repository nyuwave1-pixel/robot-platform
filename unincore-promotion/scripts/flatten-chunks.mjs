// Cloudflare's static asset server loops (307 to itself) on file paths with ( ) [ ] when a browser
// requests them percent-encoded — and Next.js names route chunks after folders like "(site)" and
// "[slug]". After `next build`, this renames those chunk files to safe names and rewrites every
// reference (HTML, RSC .txt payloads and JS) to the new path. Each chunk name carries a content hash,
// so a reference is found by its unique file name.
// Usage: node scripts/flatten-chunks.mjs   (run after next build, before build-images)
import { readdir, readFile, writeFile, rename, mkdir, rmdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "out");
const BAD = /[()[\]]/;
const safe = (s) => s.replace(/[()]/g, "_").replace(/\[/g, "_").replace(/\]/g, "_");

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

// 1. Rename the chunk files.
const moves = []; // [oldRel, newRel] relative to out/, with forward slashes
for await (const f of walk(path.join(out, "_next"))) {
  const rel = path.relative(out, f).split(path.sep).join("/");
  if (!BAD.test(rel)) continue;
  const next = safe(rel);
  await mkdir(path.dirname(path.join(out, next)), { recursive: true });
  await rename(f, path.join(out, next));
  moves.push([rel, next]);
}

// Remove the now-empty old folders, deepest first.
for (const d of [...new Set(moves.map(([from]) => path.posix.dirname(from)))].sort((a, b) => b.length - a.length)) {
  for (let cur = d; BAD.test(cur); cur = path.posix.dirname(cur)) await rmdir(path.join(out, cur)).catch(() => {});
}

// 2. Rewrite references: any path ending in the chunk's unique file name, raw or percent-encoded.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rules = moves.map(([from, to]) => {
  const base = path.posix.basename(from);
  const dir = path.posix.dirname(from).replace(/^_next\//, "");
  const variants = [dir, dir.replace(/\[/g, "%5B").replace(/\]/g, "%5D"), encodeURI(dir), dir.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\[/g, "%5B").replace(/\]/g, "%5D")];
  const re = new RegExp(`(?:${[...new Set(variants)].map(esc).join("|")})/${esc(base)}`, "g");
  return [re, path.posix.dirname(to).replace(/^_next\//, "") + "/" + base];
});
let files = 0;
for await (const f of walk(out)) {
  if (!/\.(html|txt|js|json|css)$/.test(f) || f.includes(`${path.sep}_img${path.sep}`)) continue;
  const src = await readFile(f, "utf8");
  let txt = src;
  for (const [re, to] of rules) txt = txt.replace(re, to);
  if (txt !== src) {
    await writeFile(f, txt);
    files++;
  }
}
// 3. Nothing may still point at an old name.
for await (const f of walk(out)) {
  if (!/\.(html|txt|js|json)$/.test(f) || f.includes(`${path.sep}_img${path.sep}`)) continue;
  const txt = await readFile(f, "utf8");
  for (const [from] of moves) {
    const base = path.posix.basename(from);
    const re = new RegExp(`static/chunks/[^"'\\s]*?(?:\\(|%28|\\[|%5B)[^"'\\s]*?/${esc(base)}`);
    if (re.test(txt)) throw new Error(`flatten-chunks: ${path.relative(out, f)} still references ${from}`);
  }
}
console.log(`flatten-chunks: ${moves.length} chunk files renamed, ${files} files updated`);

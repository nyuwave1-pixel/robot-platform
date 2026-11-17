// Resizes every photo in public/ into out/_img/<path>-<width>.webp for the static export
// (see src/lib/imageLoader.ts). Never enlarges: a width above the original keeps the original size.
// Usage (after `next build`): node scripts/build-images.mjs
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { default: config } = await import(path.join(root, "next.config.mjs"));
const widths = [...new Set([...config.images.deviceSizes, ...config.images.imageSizes])].sort((a, b) => a - b);
const pub = path.join(root, "public");
const out = path.join(root, "out", "_img");

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(webp|jpe?g|png|avif)$/i.test(e.name)) yield p;
  }
}

let n = 0;
const jobs = [];
for await (const file of walk(pub)) {
  const rel = path.relative(pub, file).replace(/\.[a-z0-9]+$/i, "");
  for (const w of widths) {
    const dest = path.join(out, `${rel}-${w}.webp`);
    jobs.push(async () => {
      try {
        await stat(dest);
        return;
      } catch {}
      await mkdir(path.dirname(dest), { recursive: true });
      await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: 75 }).toFile(dest);
      n++;
    });
  }
}
const pool = Array.from({ length: 8 }, async () => {
  while (jobs.length) await jobs.shift()();
});
await Promise.all(pool);
console.log(`build-images: ${n} files written, ${widths.length} widths`);

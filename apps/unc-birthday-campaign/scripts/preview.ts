/** Quick preview: tsx scripts/preview.ts <campaign> <lang> <sizeId...> → .cache/preview/*.png */
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { renderBanner } from "../src/campaigns";
import { allAssetPaths, inlineAssets, nodeEnv, warmAssets } from "../src/export/node-env";
import { ONLINE, PRINT, sizeById } from "../src/templates/sizes";
import type { CampaignId, Lang } from "../src/rendering/types";

const [campaign, lang, ...args] = process.argv.slice(2);
const ids = args[0] === "online" ? ONLINE.map((s) => s.id) : args[0] === "print" ? PRINT.map((s) => s.id) : args;
const out = path.resolve(".cache/preview"); fs.mkdirSync(out, { recursive: true });
await warmAssets(allAssetPaths());
const env = nodeEnv();
for (const id of ids) {
  const size = sizeById(id)!;
  const t0 = Date.now();
  const { svg: raw, report } = await renderBanner({ campaign: campaign as CampaignId, lang: lang as Lang, size, guides: process.env.GUIDES === "1" }, env);
  const svg = await inlineAssets(raw);
  if (process.env.SAVE_SVG) fs.writeFileSync(path.join(out, `${campaign}_${lang}_${id}.svg`), svg);
  const fitTo = size.kind === "print" ? { mode: "width" as const, value: 1400 } : { mode: "original" as const };
  const png = new Resvg(svg, { fitTo, background: "#080706" }).render().asPng();
  const file = path.join(out, `${campaign}_${lang}_${id}.png`);
  fs.writeFileSync(file, png);
  const iss = report.issues.map((i) => `${i.level}:${i.code}`).join(", ");
  console.log(`${id} ${report.archetype} ${Date.now() - t0}ms svg=${(svg.length / 1e6).toFixed(1)}MB ${iss || "ok"}`);
  if (process.env.VERBOSE) console.log(JSON.stringify(report.issues, null, 1));
}

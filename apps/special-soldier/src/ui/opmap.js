// Operation map for the mission briefing: the part of the island the mission uses, the insertion point and every
// objective position, numbered in order (any-order tasks as 1A / 1B). Drawn from the HUD's terrain image, so it
// always matches the real island (src/world/terrain.js) — nothing is painted by hand.
import { G } from '../core/ctx.js';
import { SIZE } from '../world/world.js';

/** Where each objective happens, in mission order. Objectives without a fixed place (e.g. "repel the counter-attack") are skipped. */
export function objectivePoints(m) {
  const pts = [], at = (o) => { try { const p = o.type === 'reach' && o.x !== undefined ? o : o.marker ? o.marker() : o.at ? o.at() : o.x !== undefined ? o : null; return p && Number.isFinite(p.x) && Number.isFinite(p.z) ? p : null; } catch (e) { return null; } };
  let n = 0;
  for (const o of m.objectives) {
    const add = (p, label, any) => { const near = pts.find((q) => Math.hypot(q.x - p.x, q.z - p.z) < 12); if (near) { near.label += '·' + label; near.any = near.any && any; } else pts.push({ x: p.x, z: p.z, label, any }); }; // same place: one marker
    if (o.type === 'any') { n++; o.parts.forEach((q, k) => { const p = at(q); if (p) add(p, n + 'AB'[k], true); }); continue; }
    n++; const p = at(o); if (p) add(p, String(n), false);
  }
  return pts;
}
/** Numbers shown next to each objective line, matching the map ("1", "2A/2B" …). */
export function objectiveLabels(m) { let n = 0; return m.objectives.map((o) => { n++; return o.type === 'any' ? `${n}A/${n}B` : String(n); }); }

export function drawOpMap(canvas, m) {
  const img = G.hud && G.hud.mapImg; if (!img || !canvas) return false;
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, S = img.width;
  const sp = m.spawn(), pts = objectivePoints(m), all = [{ x: sp.x, z: sp.z }, ...pts];
  let x0 = Math.min(...all.map((p) => p.x)), x1 = Math.max(...all.map((p) => p.x)), z0 = Math.min(...all.map((p) => p.z)), z1 = Math.max(...all.map((p) => p.z));
  const pad = 55; x0 -= pad; x1 += pad; z0 -= pad; z1 += pad;
  // keep the canvas aspect, at least 260 m across
  let w = Math.max(260, x1 - x0), h = Math.max(260 * H / W, z1 - z0); if (w / h < W / H) w = h * W / H; else h = w * H / W;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; x0 = cx - w / 2; z0 = cz - h / 2;
  const toPx = (x, z) => [((x - x0) / w) * W, ((z - z0) / h) * H], src = (v) => ((v + SIZE / 2) / SIZE) * S;
  g.imageSmoothingEnabled = true; g.drawImage(img, src(x0), src(z0), (w / SIZE) * S, (h / SIZE) * S, 0, 0, W, H);
  g.fillStyle = 'rgba(5,8,6,.25)'; g.fillRect(0, 0, W, H);
  // 50 m grid
  g.strokeStyle = 'rgba(207,214,212,.09)'; g.lineWidth = 1;
  for (let x = Math.ceil(x0 / 50) * 50; x < x0 + w; x += 50) { const [px] = toPx(x, 0); g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); }
  for (let z = Math.ceil(z0 / 50) * 50; z < z0 + h; z += 50) { const [, pz] = toPx(0, z); g.beginPath(); g.moveTo(0, pz); g.lineTo(W, pz); g.stroke(); }
  // route: insertion → objectives in order (dashed)
  g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,210,58,.55)'; g.lineWidth = 2; g.beginPath(); let [lx, lz] = toPx(sp.x, sp.z); g.moveTo(lx, lz);
  for (const p of pts) { if (p.any) continue; const [px, pz] = toPx(p.x, p.z); g.lineTo(px, pz); } g.stroke(); g.setLineDash([]);
  // insertion point
  const [sx, sz] = toPx(sp.x, sp.z); g.fillStyle = '#4fd0ff'; g.beginPath(); g.moveTo(sx, sz - 9); g.lineTo(sx + 8, sz + 7); g.lineTo(sx - 8, sz + 7); g.closePath(); g.fill();
  g.font = '600 11px Bahnschrift, Arial Narrow, sans-serif'; g.fillText('INSERTION', sx + 11, sz + 4);
  // objectives
  for (const p of pts) {
    const [px, pz] = toPx(p.x, p.z); g.save(); g.translate(px, pz); g.rotate(Math.PI / 4); g.fillStyle = p.any ? '#ff9a3a' : '#ffd23a'; g.fillRect(-7, -7, 14, 14); g.restore();
    g.font = '700 12px Bahnschrift, Arial Narrow, sans-serif'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(p.label, px + 11, pz - 6); g.fillStyle = '#f1f1ec'; g.fillText(p.label, px + 11, pz - 6);
  }
  // scale bar + north
  const [a] = toPx(x0 + 10, 0), [b] = toPx(x0 + 110, 0); g.strokeStyle = '#cfd6d4'; g.lineWidth = 2; g.beginPath(); g.moveTo(a, H - 14); g.lineTo(b, H - 14); g.stroke();
  g.fillStyle = '#cfd6d4'; g.font = '600 10px Bahnschrift, Arial Narrow, sans-serif'; g.fillText('100 m', a, H - 20); g.fillText('N ▲', W - 34, 16);
  return true;
}

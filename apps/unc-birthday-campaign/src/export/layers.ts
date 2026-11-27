/** Split a rendered SVG into the raster "art" and the vector overlay (type, logo, QR). Shared by CLI and browser PDF export. */
export const VECTOR_LAYER = /<g data-layer="text">([\s\S]*?)<\/g>\n/;
export const LOGO = /<path data-el="logo" transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)" fill="([^"]+)" d="([^"]+)"\/>/g;
export const QR = /<g data-el="qr"><rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="[\d.]+" fill="([^"]+)"\/><path d="([^"]*)" fill="([^"]+)"\/><\/g>/g;
export const PATH = /<path data-el="([^"]+)" fill="([^"]+)"(?: opacity="([\d.]+)")? d="([^"]*)"\/>/g;

/** Split a rendered print SVG into the raster art SVG and the vector overlay. */
export function splitLayers(svg: string) {
  const text = VECTOR_LAYER.exec(svg)?.[1] ?? "";
  const logos = [...svg.matchAll(LOGO)];
  const qrs = [...svg.matchAll(QR)];
  let art = svg.replace(VECTOR_LAYER, '<g data-layer="text"></g>\n');
  for (const m of logos) art = art.replace(m[0], "");
  for (const m of qrs) art = art.replace(m[0], "");
  return { art, text: [...text.matchAll(PATH)], logos, qrs };
}


/**
 * next/image loader for the static export on Cloudflare Pages. There is no image server, so every
 * local photo is resized ahead of time by scripts/build-images.mjs into /_img/<path>-<width>.webp
 * (the widths are the deviceSizes + imageSizes in next.config.mjs). Remote URLs and SVGs pass through.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:") || /\.svg$/i.test(src)) return src;
  return `/_img${src.replace(/\.[a-z0-9]+$/i, "")}-${width}.webp`;
}

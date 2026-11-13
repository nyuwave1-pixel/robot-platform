/** 순수 함수 이미지 처리 유틸 (브라우저·Node 공용, DOM 의존 없음). */

const SRGB_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_LUT[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
const fLab = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

export interface LabImage {
  width: number;
  height: number;
  L: Float32Array;
  a: Float32Array;
  b: Float32Array;
}

/** sRGB(D65) → CIELAB */
export function toLab(data: Uint8ClampedArray, width: number, height: number): LabImage {
  const n = width * height;
  const L = new Float32Array(n);
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const r = SRGB_LUT[data[p]];
    const g = SRGB_LUT[data[p + 1]];
    const bl = SRGB_LUT[data[p + 2]];
    const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * bl) / 0.95047;
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * bl;
    const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * bl) / 1.08883;
    const fx = fLab(x);
    const fy = fLab(y);
    const fz = fLab(z);
    L[i] = 116 * fy - 16;
    a[i] = 500 * (fx - fy);
    b[i] = 200 * (fy - fz);
  }
  return { width, height, L, a, b };
}

const fLabInv = (t: number) => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
const gammaEnc = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return v < 0 ? 0 : v > 1 ? 255 : v * 255;
};

/** CIELAB → sRGB 를 out[p..p+2] 에 기록 */
export function labToRgb(L: number, a: number, b: number, out: Uint8ClampedArray, p: number): void {
  const fy = (L + 16) / 116;
  const x = fLabInv(fy + a / 500) * 0.95047;
  const y = fLabInv(fy);
  const z = fLabInv(fy - b / 200) * 1.08883;
  out[p] = gammaEnc(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
  out[p + 1] = gammaEnc(-0.969266 * x + 1.8760108 * y + 0.041556 * z);
  out[p + 2] = gammaEnc(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
}

function gaussKernel(sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(2 * r + 1);
  let s = 0;
  for (let i = -r; i <= r; i++) {
    k[i + r] = Math.exp((-i * i) / (2 * sigma * sigma));
    s += k[i + r];
  }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  return k;
}

function blurDirect(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const k = gaussKernel(sigma);
  const r = (k.length - 1) / 2;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) {
        let xx = x + i;
        if (xx < 0) xx = 0;
        else if (xx >= w) xx = w - 1;
        s += src[row + xx] * k[i + r];
      }
      tmp[row + x] = s;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let i = -r; i <= r; i++) {
        let yy = y + i;
        if (yy < 0) yy = 0;
        else if (yy >= h) yy = h - 1;
        s += tmp[yy * w + x] * k[i + r];
      }
      out[y * w + x] = s;
    }
  }
  return out;
}

/** 가우시안 블러. 큰 σ 는 축소 → 블러 → 확대로 근사해 속도를 확보한다. */
export function blur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  if (sigma < 5) return blurDirect(src, w, h, sigma);
  const f = sigma >= 12 ? 4 : 2;
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const small = new Float32Array(sw * sh);
  const cnt = new Float32Array(sw * sh);
  for (let y = 0; y < h; y++) {
    const sy = (y / f) | 0;
    for (let x = 0; x < w; x++) {
      const si = sy * sw + ((x / f) | 0);
      small[si] += src[y * w + x];
      cnt[si]++;
    }
  }
  for (let i = 0; i < small.length; i++) small[i] /= cnt[i] || 1;
  const sb = blurDirect(small, sw, sh, Math.max(0.6, Math.sqrt(Math.max(0.01, (sigma * sigma) / (f * f) - 0.25))));
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) / f - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) / f - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = fx - x0;
      out[y * w + x] =
        (sb[y0 * sw + x0] * (1 - tx) + sb[y0 * sw + x1] * tx) * (1 - ty) +
        (sb[y1 * sw + x0] * (1 - tx) + sb[y1 * sw + x1] * tx) * ty;
    }
  }
  return out;
}

/** 마스크 가중 블러: mask=0 인 픽셀은 평균에서 제외한다 (눈·머리카락이 저주파 기준선에 섞이지 않게). */
export function maskedBlur(src: Float32Array, mask: Uint8Array, w: number, h: number, sigma: number): Float32Array {
  const n = w * h;
  const num = new Float32Array(n);
  const den = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (mask[i]) {
      num[i] = src[i];
      den[i] = 1;
    }
  }
  const bn = blur(num, w, h, sigma);
  const bd = blur(den, w, h, sigma);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = bd[i] > 0.05 ? bn[i] / bd[i] : src[i];
  return out;
}

/** 폴리곤 스캔라인 채우기. pts = [x0,y0,x1,y1,…] */
export function fillPolygon(mask: Uint8Array, w: number, h: number, pts: number[], value: number): void {
  const n = pts.length / 2;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minY = Math.min(minY, pts[2 * i + 1]);
    maxY = Math.max(maxY, pts[2 * i + 1]);
  }
  const y0 = Math.max(0, Math.ceil(minY));
  const y1 = Math.min(h - 1, Math.floor(maxY));
  const xs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    xs.length = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const yi = pts[2 * i + 1];
      const yj = pts[2 * j + 1];
      if (yi <= y !== yj <= y) {
        xs.push(pts[2 * i] + ((y - yi) / (yj - yi)) * (pts[2 * j] - pts[2 * i]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k]));
      const xb = Math.min(w - 1, Math.floor(xs[k + 1]));
      for (let x = xa; x <= xb; x++) mask[y * w + x] = value;
    }
  }
}

/** 폴리곤을 중심 방향으로 축소(factor<1) 또는 확대 */
export function scalePolygon(pts: number[], factor: number): number[] {
  const n = pts.length / 2;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    cx += pts[2 * i];
    cy += pts[2 * i + 1];
  }
  cx /= n;
  cy /= n;
  const out = new Array<number>(pts.length);
  for (let i = 0; i < n; i++) {
    out[2 * i] = cx + (pts[2 * i] - cx) * factor;
    out[2 * i + 1] = cy + (pts[2 * i + 1] - cy) * factor;
  }
  return out;
}

/** 이진 마스크 팽창 (반경 r px, 분리형 박스 근사) */
export function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r < 1) return mask.slice();
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let run = 0;
    const row = y * w;
    for (let x = 0; x < w + r; x++) {
      if (x < w && mask[row + x]) run = 2 * r + 1;
      const xo = x - r;
      if (xo >= 0 && xo < w && run > 0) tmp[row + xo] = 1;
      if (run > 0) run--;
    }
  }
  for (let x = 0; x < w; x++) {
    let run = 0;
    for (let y = 0; y < h + r; y++) {
      if (y < h && tmp[y * w + x]) run = 2 * r + 1;
      const yo = y - r;
      if (yo >= 0 && yo < h && run > 0) out[yo * w + x] = 1;
      if (run > 0) run--;
    }
  }
  return out;
}

export function median(values: Float32Array | number[], count = values.length): number {
  if (count === 0) return NaN;
  const arr = Float32Array.from(values as ArrayLike<number>).subarray(0, count);
  arr.sort();
  return arr[count >> 1];
}

export function percentile(values: Float32Array, count: number, p: number): number {
  if (count === 0) return NaN;
  const arr = values.slice(0, count);
  arr.sort();
  return arr[Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))))];
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

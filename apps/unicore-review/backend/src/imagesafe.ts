// 업로드 이미지 검증·정리 — 외부 라이브러리 없이 바이트 구조만 다룬다.
//  1) 매직 넘버로 실제 형식 확인 (확장자·MIME 위장 차단)
//  2) 구조를 끝까지 따라가며 해상도 확인 (깨진 파일·다른 형식을 이어 붙인 파일 차단)
//  3) 위치정보가 들어갈 수 있는 메타데이터(EXIF·XMP·IPTC·주석)를 제거한 새 바이트 생성
export type ImageMime = "image/jpeg" | "image/png" | "image/webp";
export type SafeImage = { mime: ImageMime; ext: "jpg" | "png" | "webp"; width: number; height: number; bytes: Uint8Array; stripped: number };

export class ImageError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}
const bad = (code: string, message: string): never => { throw new ImageError(code, message); };

export function sniffImage(b: Uint8Array): ImageMime | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u24le = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// ---- JPEG: 세그먼트 단위로 읽어 APP1(EXIF·XMP)·APP13(IPTC)·COM 등을 버린다. APP0(JFIF)·APP2(ICC 색 프로파일)·APP14(Adobe 색 변환)는 유지 ----
function cleanJpeg(b: Uint8Array) {
  const keep: Uint8Array[] = [b.subarray(0, 2)];
  let o = 2, width = 0, height = 0, stripped = 0, sawScan = false;
  while (o + 4 <= b.length) {
    if (b[o] !== 0xff) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
    let m = b[o + 1];
    while (m === 0xff && o + 2 < b.length) { o++; m = b[o + 1]; } // 채움 바이트
    if (m === 0xd9) break;
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { keep.push(b.subarray(o, o + 2)); o += 2; continue; }
    const len = u16(b, o + 2);
    if (len < 2 || o + 2 + len > b.length) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
    const seg = b.subarray(o, o + 2 + len);
    const isSof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
    if (isSof) { height = u16(b, o + 5); width = u16(b, o + 7); }
    const isApp = m >= 0xe0 && m <= 0xef;
    if (m === 0xfe || (isApp && m !== 0xe0 && m !== 0xe2 && m !== 0xee)) stripped += seg.length;
    else keep.push(seg);
    o += 2 + len;
    if (m === 0xda) { // 압축 데이터 시작 — 여기부터 끝(EOI)까지는 그대로
      sawScan = true;
      let end = b.length;
      for (let i = b.length - 2; i >= o; i--) if (b[i] === 0xff && b[i + 1] === 0xd9) { end = i + 2; break; }
      if (end < b.length) stripped += b.length - end; // EOI 뒤에 붙은 데이터는 버림
      keep.push(b.subarray(o, end));
      break;
    }
  }
  if (!sawScan || !width || !height) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
  return { bytes: concat(keep), width, height, stripped };
}

// ---- PNG: 청크 단위로 읽어 eXIf·tEXt·iTXt·zTXt·tIME 를 버린다. IEND 뒤 데이터도 버린다 ----
const PNG_DROP = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);
function cleanPng(b: Uint8Array) {
  const keep: Uint8Array[] = [b.subarray(0, 8)];
  let o = 8, width = 0, height = 0, stripped = 0, ended = false, first = true;
  while (o + 12 <= b.length) {
    const len = u32(b, o);
    const type = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]);
    if (len > 0x7fffffff || o + 12 + len > b.length) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
    if (first) {
      if (type !== "IHDR" || len !== 13) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
      width = u32(b, o + 8); height = u32(b, o + 12); first = false;
    }
    const chunk = b.subarray(o, o + 12 + len);
    if (PNG_DROP.has(type)) stripped += chunk.length; else keep.push(chunk);
    o += 12 + len;
    if (type === "IEND") { ended = true; break; }
  }
  if (!ended || !width || !height) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
  if (o < b.length) stripped += b.length - o;
  return { bytes: concat(keep), width, height, stripped };
}

// ---- WebP(RIFF): EXIF·XMP 청크를 버리고 VP8X 플래그와 RIFF 길이를 다시 맞춘다 ----
function cleanWebp(b: Uint8Array) {
  const riffLen = u32le(b, 4);
  const end = Math.min(b.length, 8 + riffLen + (riffLen & 1));
  const chunks: Uint8Array[] = [];
  let o = 12, width = 0, height = 0, stripped = 0;
  while (o + 8 <= end) {
    const type = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
    const len = u32le(b, o + 4);
    const total = 8 + len + (len & 1);
    if (o + 8 + len > b.length) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
    const d = o + 8;
    if (type === "VP8X" && len >= 10) { width = u24le(b, d + 4) + 1; height = u24le(b, d + 7) + 1; }
    else if (type === "VP8 " && len >= 10 && !width) {
      if (b[d + 3] !== 0x9d || b[d + 4] !== 0x01 || b[d + 5] !== 0x2a) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
      width = (b[d + 6] | (b[d + 7] << 8)) & 0x3fff; height = (b[d + 8] | (b[d + 9] << 8)) & 0x3fff;
    } else if (type === "VP8L" && len >= 5 && !width) {
      if (b[d] !== 0x2f) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
      const v = u32le(b, d + 1);
      width = (v & 0x3fff) + 1; height = ((v >>> 14) & 0x3fff) + 1;
    }
    if (type === "EXIF" || type === "XMP ") stripped += Math.min(total, b.length - o);
    else {
      let c = b.slice(o, Math.min(o + total, b.length));
      if (c.length < total) c = concat([c, new Uint8Array(total - c.length)]); // 홀수 길이 패딩 보정
      if (type === "VP8X") c[8] = c[8] & ~0x0c;  // EXIF(0x08)·XMP(0x04) 플래그 해제
      chunks.push(c);
    }
    o += total;
  }
  if (!width || !height || !chunks.length) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
  if (end < b.length) stripped += b.length - end;
  const body = concat(chunks);
  const head = new Uint8Array(12);
  head.set([0x52, 0x49, 0x46, 0x46], 0);
  const n = body.length + 4;
  head[4] = n & 255; head[5] = (n >>> 8) & 255; head[6] = (n >>> 16) & 255; head[7] = (n >>> 24) & 255;
  head.set([0x57, 0x45, 0x42, 0x50], 8);
  return { bytes: concat([head, body]), width, height, stripped };
}

/** 검증 + 메타데이터 제거. 문제가 있으면 ImageError */
export function sanitizeImage(input: Uint8Array, limits: { maxBytes: number; maxPixels: number; minPixels?: number }): SafeImage {
  if (!input.length) bad("EMPTY", "이미지 파일이 비어 있습니다.");
  if (input.length > limits.maxBytes) bad("TOO_LARGE", `이미지 용량이 너무 큽니다. (최대 ${Math.floor(limits.maxBytes / 1024 / 1024 * 10) / 10}MB)`);
  const mime = sniffImage(input);
  if (!mime) bad("BAD_TYPE", "JPG, PNG, WEBP 이미지만 올릴 수 있습니다.");
  const r = mime === "image/jpeg" ? cleanJpeg(input) : mime === "image/png" ? cleanPng(input) : cleanWebp(input);
  const min = limits.minPixels ?? 120;
  if (r.width < min || r.height < min) bad("TOO_SMALL", "이미지가 너무 작습니다. 더 큰 사진을 올려 주세요.");
  if (r.width > limits.maxPixels || r.height > limits.maxPixels) bad("TOO_BIG_DIMENSION", `이미지 해상도가 너무 큽니다. (한 변 최대 ${limits.maxPixels}px)`);
  // 정리 후 다시 형식을 확인 (정리 과정이 다른 형식을 만들어 내지 않았는지)
  if (sniffImage(r.bytes) !== mime) bad("CORRUPT", "이미지 파일이 손상되었습니다.");
  return { mime: mime!, ext: mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp", width: r.width, height: r.height, bytes: r.bytes, stripped: r.stripped };
}

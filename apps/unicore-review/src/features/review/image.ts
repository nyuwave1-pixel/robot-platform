/**
 * 업로드 전 사진 정리 (브라우저에서 수행)
 *  - 긴 변 1600px 로 자동 리사이징 → 모바일 데이터 절약·업로드 속도 개선
 *  - 캔버스로 다시 그려 JPEG 로 저장 → 촬영 위치(GPS) 등 EXIF 메타데이터가 파일에서 빠진다 (서버에서도 한 번 더 제거)
 *  - 촬영 방향(회전) 정보는 그리기 전에 반영
 */
export const ACCEPT = "image/jpeg,image/png,image/webp";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1600;
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

export type Prepared = { blob: Blob; width: number; height: number; previewUrl: string; name: string };

export class ImagePrepError extends Error {}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch { /* 아래 <img> 방식으로 재시도 */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("decode")); img.src = url; });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) { URL.revokeObjectURL(url); throw e; }
}
const toBlob = (c: HTMLCanvasElement, q: number) => new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", q));

export async function prepareImage(file: File, maxBytes: number): Promise<Prepared> {
  // 일부 기기는 type 을 비워서 주므로 확장자로도 확인
  const byExt = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!(ALLOWED.includes(file.type) || (!file.type && byExt))) throw new ImagePrepError("JPG, PNG, WEBP 형식의 사진만 올릴 수 있습니다.");
  if (file.size > MAX_SOURCE_BYTES) throw new ImagePrepError("사진 용량이 너무 큽니다. 30MB 이하의 사진을 선택해 주세요.");
  let d;
  try { d = await decode(file); } catch { throw new ImagePrepError("사진을 열 수 없습니다. 다른 사진을 선택해 주세요."); }
  try {
    if (d.width < 200 || d.height < 200) throw new ImagePrepError("사진이 너무 작습니다. 더 큰 사진을 선택해 주세요.");
    const scale = Math.min(1, MAX_EDGE / Math.max(d.width, d.height));
    const w = Math.max(1, Math.round(d.width * scale)), h = Math.max(1, Math.round(d.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImagePrepError("이 브라우저에서는 사진을 처리할 수 없습니다.");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // 투명 PNG 대비
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(d.source, 0, 0, w, h);
    let blob: Blob | null = null;
    for (const q of [0.86, 0.76, 0.64, 0.5]) { blob = await toBlob(canvas, q); if (blob && blob.size <= maxBytes) break; }
    if (!blob) throw new ImagePrepError("사진을 처리하지 못했습니다. 다른 사진을 선택해 주세요.");
    if (blob.size > maxBytes) throw new ImagePrepError("사진 용량이 너무 큽니다. 다른 사진을 선택해 주세요.");
    return { blob, width: w, height: h, previewUrl: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } finally { d.close(); }
}

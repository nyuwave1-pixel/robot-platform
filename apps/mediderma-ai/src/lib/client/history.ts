"use client";
import type { AnalysisResult } from "../analysis/types";

/**
 * 피부 변화 기록 — 사용자가 동의한 경우에만 기기 내 IndexedDB 에 저장한다 (서버 전송 없음).
 * 저장 항목: 분석 결과 JSON, 축소된 정규화 얼굴 사진(JPEG), 랜드마크(정렬용).
 */
export interface HistoryEntry {
  id: string;
  anonId: string;
  savedAt: number;
  result: AnalysisResult;
  /** 정규화 크롭 JPEG */
  image: Blob;
  width: number;
  height: number;
  landmarks: number[];
}

const DB = "mediderma";
const STORE = "history";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const r = fn(t.objectStore(STORE));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export const addHistory = (e: HistoryEntry) => tx("readwrite", (s) => s.put(e));
export const deleteHistory = (id: string) => tx("readwrite", (s) => s.delete(id));
export const clearHistory = () => tx("readwrite", (s) => s.clear());

/** 보관 기간이 지난 기록을 지우고 남은 기록을 최신순으로 돌려준다 */
export async function listHistory(retentionDays: number): Promise<HistoryEntry[]> {
  const all = await tx<HistoryEntry[]>("readonly", (s) => s.getAll());
  const cutoff = Date.now() - retentionDays * 86400_000;
  const keep: HistoryEntry[] = [];
  for (const e of all) {
    if (e.savedAt < cutoff) await deleteHistory(e.id);
    else keep.push(e);
  }
  return keep.sort((a, b) => b.savedAt - a.savedAt);
}

export function rgbaToJpeg(rgba: Uint8ClampedArray, width: number, height: number, maxSide = 720, quality = 0.85): Promise<{ blob: Blob; scale: number }> {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
  const k = Math.min(1, maxSide / Math.max(width, height));
  const o = document.createElement("canvas");
  o.width = Math.round(width * k);
  o.height = Math.round(height * k);
  const ctx = o.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(c, 0, 0, o.width, o.height);
  return new Promise((resolve, reject) => o.toBlob((b) => (b ? resolve({ blob: b, scale: k }) : reject(new Error("encode_failed"))), "image/jpeg", quality));
}

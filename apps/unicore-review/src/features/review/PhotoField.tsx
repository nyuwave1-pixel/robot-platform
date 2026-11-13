"use client";
import { useEffect, useRef, useState } from "react";
import { ACCEPT, ImagePrepError, prepareImage, type Prepared } from "./image";
import { ApiError, deleteUpload, uploadPhoto, type Uploaded } from "./api";
import s from "./review.module.css";

export type PhotoState = {
  status: "empty" | "processing" | "uploading" | "done" | "error";
  previewUrl?: string; progress: number; uploaded?: Uploaded; error?: string;
};
export const emptyPhoto: PhotoState = { status: "empty", progress: 0 };

type Props = {
  kind: "BEFORE" | "AFTER"; label: string; state: PhotoState; maxBytes: number; invalid?: boolean;
  onChange: (next: PhotoState) => void; onZoom: (url: string) => void;
};

/** 사용 전/후 사진 1장: 촬영·사진첩 선택 → 자동 리사이징·위치정보 제거 → 업로드(진행률) → 미리보기·교체·삭제·재시도 */
export default function PhotoField({ kind, label, state, maxBytes, invalid, onChange, onZoom }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);
  const prepared = useRef<Prepared | null>(null);
  const abort = useRef<(() => void) | null>(null);
  const latest = useRef(state);
  latest.current = state;
  const [menu, setMenu] = useState(false);

  useEffect(() => () => { abort.current?.(); }, []);

  const send = async (p: Prepared) => {
    onChange({ status: "uploading", previewUrl: p.previewUrl, progress: 0 });
    const up = uploadPhoto(kind, p.blob, p.name, (pct) => { if (latest.current.status === "uploading") onChange({ status: "uploading", previewUrl: p.previewUrl, progress: pct }); });
    abort.current = up.abort;
    try {
      const uploaded = await up.promise;
      onChange({ status: "done", previewUrl: p.previewUrl, progress: 100, uploaded });
    } catch (e) {
      if (e instanceof ApiError && e.code === "ABORTED") return;
      onChange({ status: "error", previewUrl: p.previewUrl, progress: 0, error: e instanceof Error ? e.message : "사진을 올리지 못했습니다." });
    } finally { abort.current = null; }
  };

  const pick = async (file: File | undefined) => {
    setMenu(false);
    if (!file) return;
    const prev = latest.current;
    abort.current?.();
    onChange({ status: "processing", progress: 0, previewUrl: prev.previewUrl });
    try {
      const p = await prepareImage(file, maxBytes);
      if (prev.uploaded) void deleteUpload(prev.uploaded);            // 교체: 이전 업로드 정리
      if (prepared.current && prepared.current.previewUrl !== p.previewUrl) URL.revokeObjectURL(prepared.current.previewUrl);
      prepared.current = p;
      await send(p);
    } catch (e) {
      onChange({ ...prev, status: prev.uploaded ? "done" : "error", error: e instanceof ImagePrepError ? e.message : "사진을 처리하지 못했습니다. 다른 사진을 선택해 주세요.", progress: prev.uploaded ? 100 : 0 });
    }
  };
  const remove = () => {
    abort.current?.();
    if (state.uploaded) void deleteUpload(state.uploaded);
    if (prepared.current) { URL.revokeObjectURL(prepared.current.previewUrl); prepared.current = null; }
    onChange(emptyPhoto);
  };
  const retry = () => { if (prepared.current) void send(prepared.current); else album.current?.click(); };

  const busy = state.status === "processing" || state.status === "uploading";
  const id = `photo-${kind.toLowerCase()}`;
  return (
    <div className={`${s.photo} ${invalid ? s.photoInvalid : ""}`} data-status={state.status} id={id}>
      <div className={s.photoHead}><b>{kind}</b><span>{label}</span></div>
      <div className={s.photoBox}>
        {state.previewUrl ? (
          <button type="button" className={s.photoPreview} onClick={() => state.previewUrl && onZoom(state.previewUrl)} aria-label={`${label} 크게 보기`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.previewUrl} alt={`${label} 미리보기`} />
          </button>
        ) : (
          <button type="button" className={s.photoEmpty} onClick={() => setMenu(true)} aria-haspopup="true" aria-expanded={menu}>
            <span className={s.photoPlus} aria-hidden="true" />
            <span>{label}<br />올리기</span>
          </button>
        )}
        {busy && (
          <div className={s.photoBusy} role="status" aria-live="polite">
            <div className={s.photoBar}><i style={{ width: `${state.status === "processing" ? 8 : state.progress}%` }} /></div>
            <span>{state.status === "processing" ? "사진 정리 중…" : `업로드 중 ${state.progress}%`}</span>
          </div>
        )}
        {state.status === "done" && <span className={s.photoOk} aria-hidden="true">✓</span>}
      </div>
      {state.error && <p className={s.fieldError} role="alert">{state.error}</p>}
      <div className={s.photoActions}>
        {state.status === "error" && state.previewUrl && <button type="button" className={s.miniBtnGold} onClick={retry}>다시 시도</button>}
        {(state.status === "done" || (state.status === "error" && state.previewUrl)) && <button type="button" className={s.miniBtn} onClick={() => setMenu(true)}>사진 교체</button>}
        {state.previewUrl && !busy && <button type="button" className={s.miniBtn} onClick={remove}>삭제</button>}
        {busy && <button type="button" className={s.miniBtn} onClick={remove}>취소</button>}
      </div>
      {menu && (
        <div className={s.sheetWrap} role="dialog" aria-modal="true" aria-label={`${label} 올리기`} onClick={() => setMenu(false)}>
          <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={s.sheetTitle}>{label}</p>
            <button type="button" className={s.sheetBtn} onClick={() => camera.current?.click()}>카메라로 촬영하기</button>
            <button type="button" className={s.sheetBtn} onClick={() => album.current?.click()}>사진첩에서 선택하기</button>
            <button type="button" className={s.sheetCancel} onClick={() => setMenu(false)}>닫기</button>
            <p className={s.sheetNote}>JPG · PNG · WEBP · 사진은 자동으로 알맞은 크기로 줄이고 촬영 위치 정보를 지운 뒤 올립니다.</p>
          </div>
        </div>
      )}
      <input ref={camera} type="file" accept={ACCEPT} capture="user" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={album} type="file" accept={ACCEPT} hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

/** 사용 전/후 좌우 비교 슬라이더 (터치·마우스·키보드) */
export function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => { const r = box.current?.getBoundingClientRect(); if (r) setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))); };
  return (
    <div className={s.compare} ref={box}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") move(e.clientX); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="사용 후 사진" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="사용 전 사진" draggable={false} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className={s.compareTagL}>BEFORE</span><span className={s.compareTagR}>AFTER</span>
      <div className={s.compareBar} style={{ left: `${pos}%` }}>
        <input type="range" min={0} max={100} value={Math.round(pos)} onChange={(e) => setPos(Number(e.target.value))} aria-label="사용 전·후 비교 위치" />
        <i aria-hidden="true" />
      </div>
    </div>
  );
}

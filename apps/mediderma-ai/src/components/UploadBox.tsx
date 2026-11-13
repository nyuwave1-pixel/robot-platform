"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

export function validateImageFile(f: File): "unsupportedType" | "tooLarge" | null {
  const extOk = /\.(jpe?g|png|webp)$/i.test(f.name);
  if (!TYPES.includes(f.type) && !(f.type === "" && extOk)) return "unsupportedType";
  if (f.size > MAX_BYTES) return "tooLarge";
  return null;
}

export default function UploadBox({ onFile, compact = false, testId = "upload" }: { onFile: (f: File) => void; compact?: boolean; testId?: string }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const nativeCamRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const accept = useCallback(
    (f: File | undefined | null) => {
      if (!f) return;
      const err = validateImageFile(f);
      if (err) {
        setError(t.errors[err]);
        return;
      }
      setError(null);
      onFile(f);
    },
    [onFile, t],
  );

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCamOpen(false);
  }, []);

  const startCam = useCallback(
    async (mode: "user" | "environment") => {
      setError(null);
      try {
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        streamRef.current = stream;
        setFacing(mode);
        setCamOpen(true);
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        });
      } catch {
        // 권한 거부·미지원: 기기 기본 카메라 앱(파일 입력 capture)으로 대체
        setCamOpen(false);
        if (nativeCamRef.current && /Android|iPhone|iPad/i.test(navigator.userAgent)) nativeCamRef.current.click();
        else setError(t.errors.cameraDenied);
      }
    },
    [t],
  );

  useEffect(() => () => streamRef.current?.getTracks().forEach((tr) => tr.stop()), []);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob(
      (b) => {
        if (b) accept(new File([b], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stopCam();
      },
      "image/jpeg",
      0.95,
    );
  };

  return (
    <div data-testid={testId}>
      {camOpen ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-black">
          <div className="relative mx-auto aspect-[3/4] max-h-[70vh] w-full max-w-md">
            <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[68%] w-[62%] rounded-[50%] border-2 border-scan/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <p className="absolute inset-x-0 top-3 text-center text-xs text-white/90">{t.capture.faceGuide}</p>
          </div>
          <div className="flex items-center justify-center gap-3 p-3">
            <button onClick={() => startCam(facing === "user" ? "environment" : "user")} className="rounded-full border border-line px-4 py-2 text-xs text-silver">{t.capture.switchCamera}</button>
            <button onClick={shoot} className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black">{t.capture.shoot}</button>
            <button onClick={stopCam} className="rounded-full border border-line px-4 py-2 text-xs text-silver">{t.capture.closeCamera}</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-2xl border border-dashed p-5 text-center transition ${drag ? "border-scan bg-scan/10" : "border-silver/30 bg-white/[0.03]"} ${compact ? "" : "sm:p-8"}`}
        >
          <p className="text-sm text-silver">{t.landing.uploadHint}</p>
          <p className="mt-1 text-[11px] text-silver/60">{t.landing.uploadFormats}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={() => inputRef.current?.click()} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-scan2">{t.landing.pickFile}</button>
            <button onClick={() => startCam("user")} className="rounded-full border border-silver/40 px-5 py-2.5 text-sm text-white transition hover:border-scan hover:text-scan2">{t.landing.useCamera}</button>
          </div>
        </div>
      )}
      <input ref={inputRef} data-testid={`${testId}-input`} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={nativeCamRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} />
      {error && <p role="alert" className="mt-2 text-center text-sm text-rose-300">{error}</p>}
    </div>
  );
}

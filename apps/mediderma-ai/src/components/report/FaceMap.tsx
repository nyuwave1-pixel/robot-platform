"use client";
import { useEffect, useRef } from "react";
import { FACE_ZONES } from "@/lib/analysis/zones";
import type { MetricKey, VisualData } from "@/lib/analysis/types";
import { renderOverlay } from "@/lib/client/overlay";

/** 2D 얼굴 맵: 사용자 사진 위에 영역·히트맵을 그리고, 클릭/터치로 영역을 선택한다 */
export default function FaceMap({ visual, heatmap, selected, showZones, onSelect, label }: {
  visual: VisualData; heatmap: MetricKey | null; selected: number | null; showZones: boolean; onSelect: (zoneIndex: number | null) => void; label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderOverlay(visual, { heatmap, selected, showZones }, ref.current);
  }, [visual, heatmap, selected, showZones]);
  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * visual.width);
    const y = Math.floor(((e.clientY - r.top) / r.height) * visual.height);
    const z = visual.zoneMap[y * visual.width + x];
    onSelect(z ? z - 1 : null);
  };
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      data-testid="face-map"
      data-zones={FACE_ZONES.length}
      onPointerUp={pick}
      className="block h-auto w-full cursor-pointer touch-manipulation rounded-xl"
    />
  );
}

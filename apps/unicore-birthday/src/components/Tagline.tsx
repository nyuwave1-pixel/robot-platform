import { copy } from "@/data/copy";

/** 사이트 전면 반복 문구 — "시간을 되돌려 … 내 피부의 첫 번째 생일" */
export default function Tagline({ light = false, align = "left" }: { light?: boolean; align?: "left" | "center" }) {
  return (
    <p className={`tagline ${light ? "tagline-light" : ""}`} style={{ textAlign: align, justifyContent: align === "center" ? "center" : "flex-start" }}>
      <i aria-hidden="true" />
      <span>{copy.s01.ko1.text} <b>{copy.s01.ko2.text}</b></span>
    </p>
  );
}

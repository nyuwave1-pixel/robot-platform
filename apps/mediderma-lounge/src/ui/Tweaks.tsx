/** ?debug 전용 트윅 패널: config.json 의 모든 수치를 슬라이더로 바꿔 보며 플레이한다 (메모리에만 적용). */
import { useState } from "react";
import { CONFIG, setTune, tune, tuneOverrides, type TuneKey } from "../data/config";

export const DEBUG = typeof location !== "undefined" && new URLSearchParams(location.search).has("debug");

export function Tweaks() {
  const [open, setOpen] = useState(false);
  const [, bump] = useState(0);
  if (!DEBUG) return null;
  const changed = Object.keys(tuneOverrides()).length;
  return (
    <div className="absolute left-2 top-16 z-[70] text-ink">
      <button className="rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-cream shadow" onClick={() => setOpen(!open)}>TWEAK{changed ? ` (${changed})` : ""}</button>
      {open && (
        <div className="mt-1 max-h-[70vh] w-72 overflow-y-auto rounded-2xl bg-white/95 p-3 shadow-xl">
          {Object.entries(CONFIG).map(([g, knobs]) => (
            <div key={g} className="mb-2">
              <p className="text-[12px] font-black uppercase tracking-wider text-pink-deep">{g}</p>
              {Object.entries(knobs).map(([k, kn]) => {
                const key = `${g}.${k}` as TuneKey;
                const v = tune(key);
                return (
                  <label key={k} className="mt-1 block" title={kn.note}>
                    <span className="flex justify-between text-[12px]"><span className={v !== kn.value ? "font-bold text-pink-deep" : ""}>{k}</span><span>{v}</span></span>
                    <input type="range" className="w-full" min={kn.min} max={kn.max} step={kn.step} value={v}
                      onChange={(e) => { setTune(key, Number(e.target.value)); bump((n) => n + 1); }}
                      onDoubleClick={() => { setTune(key, null); bump((n) => n + 1); }} />
                  </label>
                );
              })}
            </div>
          ))}
          <p className="text-[12px] text-ink/50">더블클릭 = 기본값. 값은 저장되지 않으며, 확정하려면 src/data/config.json 을 수정한다.</p>
        </div>
      )}
    </div>
  );
}

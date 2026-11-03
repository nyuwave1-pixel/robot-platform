"use client";
import { useEffect, useState } from "react";
import { audio, type SoundState } from "@/features/audio/audio";

/** 우상단 사운드 토글. 자동재생이 차단된 동안에는 'SOUND ON' 안내로 확장됩니다. */
export default function SoundToggle() {
  const [state, setState] = useState<SoundState>("unknown");
  useEffect(() => audio.subscribe(setState), []);
  const on = state === "on";
  const blocked = state === "blocked";
  return (
    <button
      type="button"
      className={`sound-toggle ${on ? "on" : ""} ${blocked ? "blocked" : ""}`}
      onClick={() => audio.toggle()}
      aria-pressed={on}
      aria-label={on ? "사운드 끄기" : "사운드 켜기"}
    >
      <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="sound-label">{on ? "SOUND ON" : blocked ? "TAP FOR SOUND" : "SOUND OFF"}</span>
    </button>
  );
}

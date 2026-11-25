import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { useGame } from "./store/game";
import { useUI } from "./store/ui";
import { addProgress, applyProduct, beginRoutine, careFx, openCare, selectZone } from "./store/care";
import { lieRig } from "./three/RealCharacter";
import { input } from "./store/ui";
import { audioState, initAudio } from "./audio/sound";
import { initPlatform } from "./platform";

initAudio();
initPlatform();

// QA 용 디버그 핸들: 주소에 ?debug 가 있을 때만 노출
if (new URLSearchParams(location.search).has("debug")) (window as unknown as Record<string, unknown>).__mdl = { useGame, useUI, addProgress, input, audioState, care: { openCare, beginRoutine, applyProduct, selectZone, careFx, lieRig } };

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

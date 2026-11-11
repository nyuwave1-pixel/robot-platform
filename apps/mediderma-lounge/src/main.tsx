import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { useGame } from "./store/game";
import { useUI } from "./store/ui";
import { addProgress } from "./store/care";
import { input } from "./store/ui";

// QA 용 디버그 핸들: 주소에 ?debug 가 있을 때만 노출
if (new URLSearchParams(location.search).has("debug")) (window as unknown as Record<string, unknown>).__mdl = { useGame, useUI, addProgress, input };

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CONFIG, mergeConfig, type AppConfig } from "../appConfig";
import type { AnalysisResult, SurveyAnswers, VisualData, ZoneResult } from "../analysis/types";
import type { CarePlan } from "../care/recommend";
import { endSession, getSession, touchSession } from "./session";
import { setTelemetryContext, track } from "./telemetry";
import { useI18n } from "../i18n";

export interface CurrentAnalysis {
  result: AnalysisResult;
  /** 품질 미달이면 null */
  visual: VisualData | null;
  survey: SurveyAnswers | null;
  plan: CarePlan | null;
  neck: ZoneResult | null;
}

interface AppState {
  config: AppConfig;
  sessionId: string;
  /** 랜딩에서 고른 파일을 분석 화면으로 넘길 때 사용 (메모리) */
  pendingFile: File | null;
  setPendingFile: (f: File | null) => void;
  analysis: CurrentAnalysis | null;
  setAnalysis: (a: CurrentAnalysis | null) => void;
  /** 사진·결과를 메모리에서 지우고 세션을 끝낸다 */
  wipe: () => void;
  expiredNotice: boolean;
  dismissExpired: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [sessionId, setSessionId] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analysis, setAnalysisState] = useState<CurrentAnalysis | null>(null);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const ttl = useRef(DEFAULT_CONFIG.retention.sessionMinutes);
  const visited = useRef(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c) {
          const merged = mergeConfig(c);
          ttl.current = merged.retention.sessionMinutes;
          setConfig(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const { session } = getSession(ttl.current);
    setSessionId(session.id);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setTelemetryContext(sessionId, locale);
    if (!visited.current) {
      visited.current = true;
      track("visit");
    }
  }, [sessionId, locale]);

  const wipe = useCallback(() => {
    setAnalysisState(null);
    setPendingFile(null);
    endSession();
    const { session } = getSession(ttl.current);
    setSessionId(session.id);
  }, []);

  // 비회원 세션 만료: 마지막 활동 후 TTL 이 지나면 사진·결과를 메모리에서 삭제
  useEffect(() => {
    const onActivity = () => touchSession();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    const iv = setInterval(() => {
      const { session, expired } = getSession(ttl.current);
      if (expired) {
        setAnalysisState((cur) => {
          if (cur) setExpiredNotice(true);
          return null;
        });
        setPendingFile(null);
        setSessionId(session.id);
      }
    }, 15_000);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      clearInterval(iv);
    };
  }, []);

  const setAnalysis = useCallback((a: CurrentAnalysis | null) => {
    touchSession();
    setAnalysisState(a);
  }, []);
  const dismissExpired = useCallback(() => setExpiredNotice(false), []);

  const value = useMemo(
    () => ({ config, sessionId, pendingFile, setPendingFile, analysis, setAnalysis, wipe, expiredNotice, dismissExpired }),
    [config, sessionId, pendingFile, analysis, setAnalysis, wipe, expiredNotice, dismissExpired],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppProvider missing");
  return v;
}

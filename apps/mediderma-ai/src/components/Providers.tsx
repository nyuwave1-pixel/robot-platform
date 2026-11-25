"use client";
import { LocaleProvider } from "@/lib/i18n";
import { AppProvider } from "@/lib/client/store";
import { LazyMotion } from "framer-motion";

// 애니메이션 엔진은 첫 화면을 그린 뒤 비동기로 불러온다 (그 전까지는 초기 스타일 그대로 보인다)
const loadFeatures = () => import("./motionFeatures").then((m) => m.default);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppProvider>
        <LazyMotion features={loadFeatures} strict>
          {children}
        </LazyMotion>
      </AppProvider>
    </LocaleProvider>
  );
}

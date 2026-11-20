import "server-only";
import { mergeConfig, type AppConfig } from "@/lib/appConfig";
import { getStore } from "./store";

const KEY = "app_config";

/**
 * 환경변수로 Gemini 해설을 켠다. 영구 저장소(DATABASE_URL)가 없는 서버리스 배포에서는
 * 관리자 화면의 설정이 인스턴스 메모리에만 남아 유지되지 않으므로, 운영자가 환경변수로 직접 켤 수 있어야 한다.
 * 두 값 모두 운영자가 명시적으로 "1" 로 넣어야 하며, 유료 등급 확인은 생략되지 않는다.
 */
function withEnv(c: AppConfig): AppConfig {
  const on = (v?: string) => v === "1" || v === "true";
  if (!on(process.env.GEMINI_ENABLED) && !on(process.env.GEMINI_PAID_TIER_CONFIRMED)) return c;
  return {
    ...c,
    aiInsight: {
      ...c.aiInsight,
      enabled: c.aiInsight.enabled || on(process.env.GEMINI_ENABLED),
      paidTierConfirmed: c.aiInsight.paidTierConfirmed || on(process.env.GEMINI_PAID_TIER_CONFIRMED),
    },
  };
}
let cache: { at: number; value: AppConfig } | null = null;

export async function loadConfig(force = false): Promise<AppConfig> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.value;
  const store = await getStore();
  const value = withEnv(mergeConfig(await store.getKV(KEY)));
  cache = { at: Date.now(), value: withEnv(value) };
  return cache.value;
}
export async function saveConfig(input: unknown): Promise<AppConfig> {
  const value = mergeConfig(input);
  const store = await getStore();
  await store.setKV(KEY, value);
  const hist = ((await store.getKV("config_history")) as { ts: string; calibration: string; provider: string }[] | null) ?? [];
  hist.push({ ts: new Date().toISOString(), calibration: value.calibration.version, provider: value.provider.id });
  await store.setKV("config_history", hist.slice(-50));
  cache = { at: Date.now(), value: withEnv(value) };
  return cache.value;
}

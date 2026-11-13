import "server-only";
import { mergeConfig, type AppConfig } from "@/lib/appConfig";
import { getStore } from "./store";

const KEY = "app_config";
let cache: { at: number; value: AppConfig } | null = null;

export async function loadConfig(force = false): Promise<AppConfig> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.value;
  const store = await getStore();
  const value = mergeConfig(await store.getKV(KEY));
  cache = { at: Date.now(), value };
  return value;
}
export async function saveConfig(input: unknown): Promise<AppConfig> {
  const value = mergeConfig(input);
  const store = await getStore();
  await store.setKV(KEY, value);
  const hist = ((await store.getKV("config_history")) as { ts: string; calibration: string; provider: string }[] | null) ?? [];
  hist.push({ ts: new Date().toISOString(), calibration: value.calibration.version, provider: value.provider.id });
  await store.setKV("config_history", hist.slice(-50));
  cache = { at: Date.now(), value };
  return value;
}

/**
 * 게임 밸런스 수치의 단일 출처. 코드에 숫자를 직접 쓰지 않고 config.json 의 값을 읽는다.
 * 각 항목은 { value, min, max, step, note } — ?debug 의 트윅 패널이 같은 파일을 읽어 슬라이더를 만든다.
 * 패널에서 바꾼 값은 메모리에만 적용되고(새로고침하면 사라짐) 저장 데이터에는 영향을 주지 않는다.
 */
import raw from "./config.json";

export interface Knob { value: number; min: number; max: number; step: number; note: string }
export const CONFIG = raw as Record<string, Record<string, Knob>>;
export type TuneKey = { [G in keyof typeof raw]: `${G & string}.${keyof (typeof raw)[G] & string}` }[keyof typeof raw];

const overrides = new Map<string, number>();
export function tune(key: TuneKey): number {
  const o = overrides.get(key);
  if (o !== undefined) return o;
  const [g, k] = key.split(".");
  return CONFIG[g][k].value;
}
export function setTune(key: TuneKey, v: number | null) {
  if (v === null) overrides.delete(key);
  else overrides.set(key, v);
}
export const tuneOverrides = () => Object.fromEntries(overrides);

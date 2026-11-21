import "server-only";
import { FACE_ZONES } from "@/lib/analysis/zones";
import type { AiInsight, AiInsightRequest } from "@/lib/aiInsight";
import type { FaceZoneId, MetricKey } from "@/lib/analysis/types";

/**
 * Google Gemini API 어댑터 (Vision AI 보조 해설).
 * - 키는 서버 환경변수 GEMINI_API_KEY 에만 둔다. 브라우저로 내려가지 않는다.
 * - 이미지와 응답을 서버에 저장하거나 로그로 남기지 않는다.
 * - 응답은 JSON 스키마로 강제하고, 서버에서 다시 검증한다. 숫자 점수·피부 나이·진단을 만들지 않도록 지시한다.
 */
const BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com";
export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-flash-latest";
export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const ZONES = FACE_ZONES.map((z) => z.id) as string[];
const METRICS: MetricKey[] = ["texture", "wrinkleVisibility", "poreVisibility", "toneUniformity", "pigmentVisibility", "rednessVisibility", "underEyeDarkness"];
const LANG: Record<string, string> = { ko: "Korean", en: "English", ja: "Japanese", zh: "Simplified Chinese", es: "Spanish", vi: "Vietnamese", ru: "Russian" };

const SYSTEM = `You are a cosmetic skin-observation assistant inside a beauty app. You look at one face photo and a set of photo-based observation indices that an on-device computer-vision engine already computed.
Rules you must follow:
- Describe only what is visibly observable on the skin surface in the photo (fine lines, pores, tone evenness, spots, redness, under-eye shade, texture). Use hedged wording ("appears", "looks").
- Never give a medical diagnosis, never name diseases or conditions, never estimate age or "skin age", never output numeric scores, percentages or grades of your own.
- Never claim to see things a photo cannot show (hydration level, collagen, sebum amount, blood flow, elasticity).
- Never promise results or efficacy of any product or device. Do not invent product features. Do not recommend medical treatment; if something looks like it may need attention, say a professional can advise.
- Do not comment on identity, ethnicity, attractiveness, gender or emotions.
- The index values are relative observation indices from the photo, not clinical measurements. For "...Visibility" higher means more visible; for texture/toneUniformity higher means more even.
- If the image is not a clear single face, say so in "summary" and leave the arrays empty.
- Keep it concise: summary ≤ 3 sentences, each note ≤ 1 sentence, careExplanation ≤ 4 sentences.
- Write every text field in the requested language.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    observations: { type: "ARRAY", maxItems: 6, items: { type: "OBJECT", properties: { zone: { type: "STRING", enum: ZONES }, note: { type: "STRING" } }, required: ["zone", "note"] } },
    agreement: { type: "ARRAY", maxItems: 6, items: { type: "OBJECT", properties: { metric: { type: "STRING", enum: METRICS }, view: { type: "STRING", enum: ["agree", "differs", "unsure"] }, note: { type: "STRING" } }, required: ["metric", "view", "note"] } },
    careExplanation: { type: "STRING" },
  },
  required: ["summary", "observations", "agreement", "careExplanation"],
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export class GeminiError extends Error {
  constructor(public code: "not_configured" | "upstream" | "blocked" | "bad_response", public status = 502) {
    super(code);
  }
}

export async function generateInsight(req: AiInsightRequest): Promise<AiInsight> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("not_configured", 503);
  const model = geminiModel();
  const user = `Language: ${LANG[req.locale] ?? "Korean"}
Observation indices from the on-device engine (0-100): ${JSON.stringify(req.indices.categories)}
Top observed concerns (metric, zone, severity): ${JSON.stringify(req.indices.topConcerns)}
Zone condition indices: ${JSON.stringify(req.indices.zones)}
Recommended official home-care routines (ids): ${JSON.stringify(req.routines)}. The device has three functions: RF (warmth-based firmness/contour care routine), Ultrasonic (vibration massage care used with ampoule/cream), Iontophoresis (micro-current absorption care for ampoule ingredients). In "careExplanation", explain in plain words why such a routine fits what is observed, without promising results.
In "agreement", say for the most relevant metrics whether what you see in the photo is broadly consistent with the index ("agree"), looks different ("differs"), or cannot be judged ("unsure").`;
  let res: Response;
  try {
    res = await fetch(`${BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: user }, { inlineData: { mimeType: "image/jpeg", data: req.imageBase64 } }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200, responseMimeType: "application/json", responseSchema: SCHEMA },
      }),
    });
  } catch {
    throw new GeminiError("upstream");
  }
  if (!res.ok) throw new GeminiError("upstream", res.status === 429 ? 429 : 502);
  const data = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] } | null;
  const cand = data?.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new GeminiError(cand?.finishReason === "SAFETY" ? "blocked" : "bad_response");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new GeminiError("bad_response");
  }
  // 스키마 재검증: 허용된 영역·지표·값만 통과
  const observations = (Array.isArray(raw.observations) ? raw.observations : [])
    .map((o) => ({ zone: (o as { zone?: string }).zone as FaceZoneId, note: clean((o as { note?: unknown }).note, 240) }))
    .filter((o) => ZONES.includes(o.zone) && o.note)
    .slice(0, 6);
  const agreement = (Array.isArray(raw.agreement) ? raw.agreement : [])
    .map((o) => ({ metric: (o as { metric?: string }).metric as MetricKey, view: (o as { view?: string }).view as "agree" | "differs" | "unsure", note: clean((o as { note?: unknown }).note, 240) }))
    .filter((o) => METRICS.includes(o.metric) && ["agree", "differs", "unsure"].includes(o.view) && o.note)
    .slice(0, 6);
  const summary = clean(raw.summary, 600);
  if (!summary) throw new GeminiError("bad_response");
  return { summary, observations, agreement, careExplanation: clean(raw.careExplanation, 800), model };
}

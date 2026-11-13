import { reviewEvent } from "@/data/reviewEvent";

export type ConsentDoc = { type: "PRIVACY_COLLECT" | "EVENT_PROCESSING" | "GIFT_SHIPPING" | "MARKETING_USE"; required: boolean; title: string; purpose: string; items: string; retention: string; refusal: string };
export type EventConfig = {
  eventName: string; phase: "OPEN" | "UPCOMING" | "ENDED" | "CLOSED"; startDate: string | null; endDate: string | null;
  minChars: number; maxChars: number; titleMaxChars: number; requireImages: boolean; requireOrderNumber: boolean; requireAddress: boolean;
  maxImageBytes: number; maxImagePixels: number; winnerCount: number;
  rewards: { participation: { productName: string; quantity: number }; winner: { productName: string; quantity: number }; winnersAlsoGetParticipation: boolean };
  skinTypes: string[]; usagePeriods: string[]; consentVersion: string; consents: ConsentDoc[];
};
export type Uploaded = { uploadId: number; token: string; width: number; height: number; size: number };
export type SubmitResult = { applicationNumber: string; name: string; submittedAt: string; rewards: { participation: { productName: string; quantity: number }; winner: { productName: string; quantity: number }; winnerCount: number } };
export type LookupResult = {
  applicationNumber: string; name: string; submittedAt: string; reviewStatus: string; reviewStatusLabel: string; statusReason: string; canRevise: boolean;
  review: { title: string; content: string; rating: number; ratingExperience: number | null } | null;
  photos: { before: boolean; after: boolean }; isWinner: boolean;
  rewards: { type: string; typeLabel: string; productName: string; quantity: number; status: string; statusLabel: string; carrier: string | null; trackingNumber: string | null }[];
};

export class ApiError extends Error {
  code: string; status: number; fields?: Record<string, string>;
  constructor(message: string, code = "ERROR", status = 0, fields?: Record<string, string>) { super(message); this.code = code; this.status = status; this.fields = fields; }
}
const NETWORK = "네트워크 연결이 원활하지 않습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.";

async function call<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(reviewEvent.apiBase + "/public" + path, {
      method, mode: "cors", credentials: "omit", cache: "no-store",
      headers: { ...(method === "GET" ? {} : { "x-br-csrf": "1" }), ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch { throw new ApiError(NETWORK, "NETWORK"); }
  let json: { ok?: boolean; data?: T; error?: { code: string; message: string; fields?: Record<string, string> } } | null = null;
  try { json = await res.json(); } catch { /* 본문 없음 */ }
  if (!res.ok || !json?.ok) throw new ApiError(json?.error?.message || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", json?.error?.code || "ERROR", res.status, json?.error?.fields);
  return json.data as T;
}

export const getConfig = () => call<EventConfig>("GET", "/config");
export const submitReview = (payload: unknown) => call<SubmitResult>("POST", "/submit", payload);
export const lookupReview = (applicationNumber: string, phone: string) => call<LookupResult>("POST", "/lookup", { applicationNumber, phone });
export const reviseReview = (payload: unknown) => call<{ applicationNumber: string; reviewStatusLabel: string }>("POST", "/revise", payload);
export const deleteUpload = (u: Uploaded) => call<{ deleted: boolean }>("DELETE", `/uploads/${u.uploadId}`, undefined, { "x-br-upload-token": u.token }).catch(() => ({ deleted: false }));

/** 사진 1장 업로드 — 진행률 표시와 취소를 위해 XMLHttpRequest 사용 */
export function uploadPhoto(type: "BEFORE" | "AFTER", blob: Blob, filename: string, onProgress: (pct: number) => void): { promise: Promise<Uploaded>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<Uploaded>((resolve, reject) => {
    xhr.open("POST", `${reviewEvent.apiBase}/public/uploads?type=${type}`);
    xhr.setRequestHeader("x-br-csrf", "1");
    xhr.setRequestHeader("content-type", blob.type || "image/jpeg");
    xhr.setRequestHeader("x-br-filename", encodeURIComponent(filename.slice(0, 80)));
    xhr.timeout = 90_000;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    xhr.onload = () => {
      let j: { ok?: boolean; data?: Uploaded; error?: { code: string; message: string } } | null = null;
      try { j = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && j?.ok && j.data) { onProgress(100); resolve(j.data); }
      else reject(new ApiError(j?.error?.message || "사진을 올리지 못했습니다. 다시 시도해 주세요.", j?.error?.code || "UPLOAD", xhr.status));
    };
    xhr.onerror = () => reject(new ApiError(NETWORK, "NETWORK"));
    xhr.ontimeout = () => reject(new ApiError("업로드 시간이 초과되었습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.", "TIMEOUT"));
    xhr.onabort = () => reject(new ApiError("업로드를 취소했습니다.", "ABORTED"));
    xhr.send(blob);
  });
  return { promise, abort: () => xhr.abort() };
}

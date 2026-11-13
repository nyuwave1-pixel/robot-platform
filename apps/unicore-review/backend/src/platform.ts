// 실행 환경(운영: Supabase Edge Function / 시험: Node) 차이를 감추는 얇은 층. 시작할 때 한 번 setPlatform 으로 주입한다.
export type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };
export type DbPool = Queryable & { connect: () => Promise<Queryable & { release: () => void }> };
export type ImageStore = {
  put(key: string, data: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  del(key: string): Promise<void>;
};
export type Platform = { env: (name: string) => string; pool: DbPool; storage: ImageStore; secret: Uint8Array };
let P: Platform | null = null;
export function setPlatform(p: Platform) { P = p; }
export function platform(): Platform { if (!P) throw new Error("platform not initialised"); return P; }

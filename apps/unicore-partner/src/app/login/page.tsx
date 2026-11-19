"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const MSG: Record<string, string> = {
  "Invalid login credentials": "이메일 또는 비밀번호가 맞지 않습니다.",
  "Email not confirmed": "메일함에서 인증 링크를 먼저 눌러 주세요.",
  "User already registered": "이미 가입된 이메일입니다. 로그인해 주세요.",
};

function LoginForm() {
  const router = useRouter();
  const qs = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(qs.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(qs.get("error") ? { kind: "error", text: "인증 링크가 만료되었거나 올바르지 않습니다." } : null);

  useEffect(() => {
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => data.session && router.replace("/studio"));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 8) return setMsg({ kind: "error", text: "비밀번호는 8자 이상이어야 합니다." });
    setBusy(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        router.replace("/studio");
      } else {
        const { data, error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        if (data.session) router.replace("/studio");
        else setMsg({ kind: "info", text: "인증 메일을 보냈어요. 메일의 링크를 누르면 스튜디오로 이동합니다." });
      }
    } catch (err) {
      const m = (err as Error).message;
      setMsg({ kind: "error", text: MSG[m] ?? "잠시 후 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 text-white">
      <div className="w-full max-w-sm">
        <p className="text-center text-[11px] tracking-[0.4em] text-gold/80">UNI&CORE PARTNER</p>
        <h1 className="mt-3 text-center text-2xl font-semibold">{mode === "signin" ? "사업자 로그인" : "사업자 가입"}</h1>
        <div className="mt-6 grid grid-cols-2 rounded-full bg-panel p-1 text-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-full py-2 ${mode === m ? "bg-white text-black" : "text-muted"}`} data-testid={`tab-${m}`}>
              {m === "signin" ? "로그인" : "가입"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-3" data-testid="login-form">
          <label className="block">
            <span className="text-xs text-muted">이메일</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-accent" data-testid="login-email" />
          </label>
          <label className="block">
            <span className="text-xs text-muted">비밀번호 (8자 이상)</span>
            <input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-panel px-4 py-3 outline-none focus:border-accent" data-testid="login-password" />
          </label>
          {msg && (
            <p role={msg.kind === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm ${msg.kind === "error" ? "bg-rose-500/10 text-rose-200" : "bg-emerald-500/10 text-emerald-200"}`} data-testid="login-msg">
              {msg.text}
            </p>
          )}
          <button disabled={busy} className="w-full rounded-full bg-gradient-to-r from-gold to-gold2 py-3.5 font-semibold text-onyx disabled:opacity-60" data-testid="login-submit">
            {busy ? "잠시만요…" : mode === "signin" ? "로그인" : "가입하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

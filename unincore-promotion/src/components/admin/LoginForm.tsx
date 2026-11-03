"use client";

import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
        });
        setBusy(false);
        if (res.ok) window.location.href = next;
        else setError(((await res.json().catch(() => ({}))) as { error?: string }).error || "Sign in failed.");
      }}
    >
      <label className="block">
        <span className="admin-label">Username</span>
        <input name="username" className="admin-input" autoComplete="username" required placeholder="admin or editor" />
      </label>
      <label className="block">
        <span className="admin-label">Password</span>
        <input name="password" type="password" className="admin-input" autoComplete="current-password" required />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

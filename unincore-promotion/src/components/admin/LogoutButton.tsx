"use client";

export function LogoutButton() {
  return (
    <button
      className="text-sm text-ink-mute hover:text-ink"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
    >
      Sign out
    </button>
  );
}

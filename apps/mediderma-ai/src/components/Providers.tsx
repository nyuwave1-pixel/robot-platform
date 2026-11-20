"use client";
import { LocaleProvider } from "@/lib/i18n";
import { AppProvider } from "@/lib/client/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppProvider>{children}</AppProvider>
    </LocaleProvider>
  );
}

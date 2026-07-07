import { KOFI_URL } from "@/lib/monetization";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 mt-20">
      <div className="container mx-auto px-4 py-8 text-center text-gray-400">
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#FF5E5B] hover:bg-[#ff4744] text-white font-semibold px-5 py-2.5 rounded-full transition mb-6"
        >
          ☕ Ko-fi로 후원하기
        </a>
        <p>© 2024 로봇플랫폼 개발. Zero Budget Edition.</p>
        <p className="text-sm mt-2">무료로 만드는 최고 품질의 플랫폼</p>
      </div>
    </footer>
  );
}

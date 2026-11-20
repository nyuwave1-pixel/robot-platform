import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-onyx px-6 text-center text-[#f5f1e8]" data-testid="not-found">
      <p className="text-[11px] tracking-[0.4em] text-gold/80">UNI&CORE PARTNER</p>
      <h1 className="mt-4 font-serif text-4xl font-light">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-[#a7a294]">주소가 바뀌었거나 아직 공개 승인 전인 페이지일 수 있어요.</p>
      <Link href="/partner" className="mt-8 rounded-full border border-gold/40 px-6 py-3 text-sm text-gold2">처음으로</Link>
    </main>
  );
}

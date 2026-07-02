import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          🤖 로봇플랫폼
        </Link>
        <ul className="flex gap-6 text-gray-300">
          <li>
            <Link href="/" className="hover:text-white">
              홈
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-white">
              소개
            </Link>
          </li>
          <li>
            <Link href="/docs" className="hover:text-white">
              문서
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

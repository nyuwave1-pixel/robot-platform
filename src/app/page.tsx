import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import CTA from '@/components/CTA';

export default function Home() {
  return (
    <main className="bg-robot-dark text-robot-text">
      <Hero />
      <Features />
      <Stats />
      <CTA />
      
      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center text-slate-400 font-lexend">
            <p>© 2026 로봇 AI 플랫폼. 모든 권리 보유.</p>
            <div className="mt-4 flex justify-center gap-6">
              <a href="#" className="hover:text-robot-gold transition">About</a>
              <a href="#" className="hover:text-robot-gold transition">Privacy</a>
              <a href="#" className="hover:text-robot-gold transition">Terms</a>
              <a href="#" className="hover:text-robot-gold transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

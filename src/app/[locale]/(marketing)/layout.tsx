import { Footer } from '@/components/Footer';
import { MarketingNavbar } from '@/components/MarketingNavbar';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-[#7B2CBF] selection:text-white flex flex-col relative overflow-hidden transition-colors">
      <MarketingNavbar />
      <div className="relative z-10 flex flex-col min-h-screen pt-20">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

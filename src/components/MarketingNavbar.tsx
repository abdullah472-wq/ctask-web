import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function MarketingNavbar() {
  return (
    <nav className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md fixed top-0 w-full z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <Image 
            src="/icon.png"
            alt="Ctask Icon"
            width={72}
            height={72}
            className="h-14 w-14 sm:h-16 sm:w-16 object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ctask
          </span>
        </Link>
        <Link
          href="/auth"
          className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 transition-all font-medium flex items-center gap-2 text-xs sm:text-sm"
        >
          Login / Register <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}

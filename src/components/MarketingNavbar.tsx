import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function MarketingNavbar() {
  return (
    <nav className="bg-white/80 dark:bg-dark-card/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md fixed top-0 w-full z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/icon.png"
            alt="Ctask Icon"
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
            priority
          />
          <span className="text-3xl font-bold text-[#5A189A] dark:text-[#00F2FE]">
            Ctask
          </span>
        </Link>
        <Link
          href="/auth"
          className="px-6 py-2.5 rounded-full text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-[#00F2FE] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-700 transition-all font-medium flex items-center gap-2"
        >
          Login / Register <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}

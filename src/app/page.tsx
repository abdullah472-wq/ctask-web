import Link from 'next/link';
import { ArrowRight, CheckCircle2, DollarSign, ShieldCheck } from 'lucide-react';
import { TopEarners } from '@/components/TopEarners';
import { Footer } from '@/components/Footer';
import { HeroBackground } from '@/components/HeroBackground';

export default function Home() {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-brand-cyan/30 flex flex-col relative overflow-hidden">
      <HeroBackground />
      
      {/* Wrapper to ensure content sits above background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="border-b border-white/5 backdrop-blur-md fixed top-0 w-full z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-emerald flex items-center justify-center font-bold text-dark-bg">
                C
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-emerald">
                Ctask
              </span>
            </div>
            <Link
              href="/auth"
              className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium flex items-center gap-2 hover:border-brand-cyan/50"
            >
              Login / Register <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="pt-32 pb-16 px-6 flex-1">
          <div className="max-w-7xl mx-auto text-center space-y-8 mt-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 text-brand-cyan text-sm font-medium border border-brand-cyan/20 mb-4 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
              </span>
              The #1 Micro-Task Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
              Complete Simple Tasks & <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-emerald">
                Earn Real Money
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users earning daily by completing simple micro-tasks. 
              Fast approvals, instant payouts, and zero hidden fees.
            </p>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Link
                href="/auth"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold text-lg hover:shadow-[0_0_30px_-5px_#00F2FE] transition-all hover:scale-105"
              >
                Start Earning Now
              </Link>
            </div>

            <TopEarners />

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-24 text-left mb-24">
              <div className="p-6 rounded-2xl bg-dark-card border border-white/5 hover:border-brand-cyan/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Simple Tasks</h3>
                <p className="text-slate-400">Complete easy tasks from any device. No special skills required. Just your time and effort.</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-dark-card border border-white/5 hover:border-brand-emerald/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Fast Payouts</h3>
                <p className="text-slate-400">Withdraw your earnings instantly to your preferred wallet once you reach the minimum threshold.</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-dark-card border border-white/5 hover:border-purple-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure Platform</h3>
                <p className="text-slate-400">We verify all task providers to ensure you get paid for your hard work safely and securely.</p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

import Link from 'next/link';
import { CheckCircle2, DollarSign, ShieldCheck } from 'lucide-react';
import { TopEarners } from '@/components/TopEarners';
import { Testimonials } from '@/components/ui/Testimonials';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 flex-1">
        <div className="max-w-7xl mx-auto text-center space-y-8 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-bold border border-purple-200 mb-4 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
            </span>
            The #1 Micro-Task Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight transition-colors">
            Complete Simple Tasks & <br className="hidden md:block" />
            <span className="text-purple-500 drop-shadow-sm">
              Earn Real Money
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors">
            Join thousands of users earning daily by completing simple micro-tasks. 
            Fast approvals, instant payouts, and zero hidden fees.
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <Link
              href="/auth"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] hover:from-[#7B2CBF] hover:to-[#5A189A] text-white font-bold text-lg hover:shadow-[0_0_30px_-5px_#7B2CBF] transition-all hover:scale-105"
            >
              Start Earning Now
            </Link>
          </div>

          <TopEarners />

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-24 text-left mb-24">
            <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-accent/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Simple Tasks</h3>
              <p className="text-slate-600 dark:text-slate-400">Complete easy tasks from any device. No special skills required. Just your time and effort.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Fast Payouts</h3>
              <p className="text-slate-600 dark:text-slate-400">Withdraw your earnings instantly to your preferred wallet once you reach the minimum threshold.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Secure Platform</h3>
              <p className="text-slate-600 dark:text-slate-400">We verify all task providers to ensure you get paid for your hard work safely and securely.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Testimonials />
    </>
  );
}

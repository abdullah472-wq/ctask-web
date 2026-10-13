import Link from 'next/link';
import { MessageCircle, Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full text-slate-200">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Customer Support
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
          Contact & Support
        </h1>
        <p className="text-base text-slate-300 mt-2">
          Need help with your account, deposits, or task reviews? Our support team is here to assist you.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        {/* Support Channel */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">WhatsApp Support</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Fastest response time. Our dedicated agents are available everyday from 10:00 AM to 10:00 PM.
            </p>
          </div>
          <a 
            href="https://wa.me/8801581818368" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold transition-all shadow-lg active:scale-95 w-full"
          >
            Message on WhatsApp
          </a>
        </div>

        {/* Email Channel */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Support Tickets</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Create and track a support ticket directly from your worker or advertiser dashboard.
            </p>
          </div>
          <Link 
            href="/dashboard/support" 
            className="inline-block px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] hover:shadow-[0_0_25px_rgba(157,78,221,0.5)] text-white font-bold transition-all shadow-lg active:scale-95 w-full"
          >
            Open Dashboard Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}

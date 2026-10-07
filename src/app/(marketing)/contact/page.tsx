import Link from 'next/link';
import { MessageCircle, Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary mt-8">
        Contact & Support
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Need help with your account, deposits, or task reviews? Our support team is here to assist you.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mt-12 mb-12">
          {/* Support Channel */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">WhatsApp Support</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Fastest response time. We are available everyday from 10:00 AM to 10:00 PM.
            </p>
            <a 
              href="https://wa.me/8801581818368" 
              className="inline-block px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors w-full"
            >
              Message on WhatsApp
            </a>
          </div>

          {/* Email Channel */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Support Tickets</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Create a support ticket directly from your dashboard.
            </p>
            <Link 
              href="/dashboard/support" 
              className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors w-full"
            >
              Open a Ticket
            </Link>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Office Address</h2>
        <p>
          Ctask HQ<br/>
          Dhaka, Bangladesh
        </p>
      </div>
    </div>
  );
}

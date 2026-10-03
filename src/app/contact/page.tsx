import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-emerald font-medium mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-emerald">
          Contact Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-12">We are here to help you 24/7. Get in touch with our support team.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
            <h3 className="text-2xl font-bold mb-8">Get In Touch</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-cyan/10 text-brand-cyan rounded-xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">WhatsApp Support</h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">Fastest response time.</p>
                  <a href="https://wa.me/+8801312200043" target="_blank" rel="noopener noreferrer" className="text-brand-emerald font-bold hover:underline">
                    +880 131 220 0043
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Email Us</h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">For business inquiries & appeals.</p>
                  <a href="mailto:support@ctask.com" className="text-brand-cyan font-bold hover:underline">
                    support@ctask.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Business Hours</h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Saturday - Thursday<br/>
                    9:00 AM - 10:00 PM (BST)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
            <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Name</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input type="email" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors h-32 resize-none" placeholder="How can we help?"></textarea>
              </div>
              <button type="button" className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity">
                Submit Message
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

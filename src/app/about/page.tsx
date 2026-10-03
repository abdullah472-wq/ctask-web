import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-emerald font-medium mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-emerald">
          About Ctask
        </h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          <p>
            Welcome to Ctask, the leading micro-task and gig economy platform built specifically for the emerging market in Bangladesh. 
            Our mission is simple: to bridge the gap between businesses needing quick, reliable online actions and individuals looking to earn honest money online.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Our Mission</h2>
          <p>
            We believe that earning opportunities should be accessible to everyone, regardless of their location or technical background. By democratizing the gig economy, we empower students, freelancers, and everyday internet users to monetize their time safely.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Why Choose Us?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Transparency:</strong> No hidden fees. What you earn is what you get.</li>
            <li><strong>Security:</strong> State-of-the-art IP tracking and strict KYC verification ensure a fraud-free environment.</li>
            <li><strong>Speed:</strong> Fast approvals and rapid withdrawals directly to bKash and Nagad.</li>
            <li><strong>Opportunity:</strong> Everyone has the chance to become an Advertiser and grow their own business.</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}

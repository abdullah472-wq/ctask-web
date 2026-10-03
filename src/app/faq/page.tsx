'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is the minimum withdrawal amount?",
      answer: "The minimum withdrawal amount is 100 ৳. Once you reach this threshold, you can request a withdrawal via bKash or Nagad."
    },
    {
      question: "How long does it take to get paid?",
      answer: "Withdrawals are manually reviewed and processed by our admins. You can typically expect to receive your money within 12 to 24 hours of your request."
    },
    {
      question: "Why do I need to verify my identity (KYC)?",
      answer: "KYC (Know Your Customer) is required to withdraw funds. This ensures that a real person is completing the tasks, which helps us maintain a secure, fraud-free environment for our Advertisers."
    },
    {
      question: "How do I upgrade to Premium?",
      answer: "You can upgrade to Premium from your Dashboard by navigating to the 'Upgrade to Premium' section. Premium users get access to higher-paying tasks and priority support."
    },
    {
      question: "How can I post my own tasks?",
      answer: "Any user can become an advertiser. Simply go to 'Deposit (Advertiser)' in your dashboard, load funds, and then navigate to 'Post Task' to create your campaign."
    },
    {
      question: "Why was my task proof rejected?",
      answer: "Proofs are usually rejected if they do not follow the specific instructions set by the Advertiser, if the screenshot is cropped/manipulated, or if it's a recycled image from a previous task."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-emerald font-medium mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-emerald">
          Frequently Asked Questions
        </h1>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl overflow-hidden transition-colors ${openIndex === index ? 'bg-white dark:bg-dark-card border-brand-cyan/30 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-bold text-lg pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-brand-cyan shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

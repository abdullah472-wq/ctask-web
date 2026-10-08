'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I withdraw my earnings?",
      answer: "Once you reach the minimum withdrawal threshold of 50 ৳, go to the Withdrawals page from your Dashboard. Select your preferred method (bKash or Nagad), enter your personal number, and submit. Payments are processed within 12-24 hours."
    },
    {
      question: "Why was my task proof rejected?",
      answer: "Task proofs are usually rejected if the screenshot does not match the advertiser's instructions (e.g., missing subscribe button, wrong video length). Always read the instructions carefully before submitting."
    },
    {
      question: "What is Premium?",
      answer: "Premium is a paid subscription that unlocks higher-paying tasks, faster withdrawal processing, and priority support. It costs 500 ৳ for a lifetime upgrade."
    },
    {
      question: "How long does KYC verification take?",
      answer: "Our admins manually review KYC submissions. It usually takes between 2 to 6 hours during working days. Make sure your NID is clear and legible to avoid rejection."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary mt-8">
        Frequently Asked Questions
      </h1>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border rounded-2xl overflow-hidden transition-colors ${openIndex === index ? 'bg-white dark:bg-dark-card border-brand-accent/30 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-bold text-lg pr-4">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-brand-accent shrink-0" />
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
  );
}

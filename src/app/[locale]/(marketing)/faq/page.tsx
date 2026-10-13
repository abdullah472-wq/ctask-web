'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
      question: "How long does KYC verification take?",
      answer: "Our admins manually review KYC submissions. It usually takes between 2 to 6 hours during working days. Make sure your NID is clear and legible to avoid rejection."
    },
    {
      question: "How do I create and post tasks as an advertiser?",
      answer: "Deposit funds using bKash, Nagad, or Rocket into your advertiser wallet, then go to 'Create Task' in your dashboard. Specify your requirements, proof format, and total budget to start receiving real human submissions immediately."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full text-slate-200">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Help & Knowledgebase
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-slate-300 mt-2">
          Find fast answers to common questions about earning, withdrawals, and task creation.
        </p>
      </div>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen 
                  ? 'bg-slate-900/80 border-purple-500/50 shadow-[0_0_25px_rgba(123,44,191,0.15)]' 
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
              >
                <span className="font-bold text-base sm:text-lg text-white pr-4 group-hover:text-purple-300 transition-colors">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-purple-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-purple-300' : ''
                  }`} 
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-slate-800/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

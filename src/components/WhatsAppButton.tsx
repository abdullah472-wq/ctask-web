'use client';

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/+8801312200043"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Contact Support on WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
      {/* Tooltip */}
      <span className="absolute right-full mr-4 bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm font-bold py-2 px-4 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-200 dark:border-slate-800 pointer-events-none">
        Live Support
      </span>
    </Link>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        
        {/* Brand Info */}
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
            <Image 
              src="/icon.png"
              alt="Ctask Icon"
              width={80}
              height={80}
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
            />
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Ctask</span>
          </Link>
          <p className="mt-4 text-sm text-slate-400 max-w-sm leading-relaxed">
            The leading micro-task and gig economy platform in Bangladesh. Complete tasks, earn money, and advertise your own projects with ease.
          </p>
        </div>

        {/* Links: About */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">About</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><Link href="/about" className="hover:text-purple-400 transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-purple-400 transition-colors">Contact / Support</Link></li>
            <li><span className="text-slate-500">Careers (Coming Soon)</span></li>
          </ul>
        </div>

        {/* Links: Legal */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms and Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refund" className="hover:text-purple-400 transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Links: Help */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Help</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><Link href="/faq" className="hover:text-purple-400 transition-colors">FAQ</Link></li>
            <li><Link href="/auth" className="hover:text-purple-400 transition-colors">Getting Started</Link></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="mt-14 pt-8 border-t border-slate-800/80 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        
        {/* Copyright & Powered By */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm text-slate-400 order-2 sm:order-1">
          <p>&copy; {currentYear} Ctask Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by{' '}
            <a 
              href="https://codbot.pro.bd/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-slate-200 hover:text-[#9D4EDD] transition-colors duration-300"
            >
              Codbot
            </a>
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4 text-slate-400 order-1 sm:order-2">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="GitHub">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/icon.png"
                  alt="Ctask Icon"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  Ctask
                </span>
              </Link>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              The leading micro-task and gig economy platform in Bangladesh. Complete tasks, earn money, and advertise your own projects with ease.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">About</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Contact / Support</Link></li>
              <li><Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Careers (Coming Soon)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Terms and Conditions</Link></li>
              <li><Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Help</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/faq" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">FAQ</Link></li>
              <li><Link href="/auth" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Getting Started</Link></li>
              <li><Link href="/dashboard/upgrade" className="text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors">Premium Plans</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {currentYear} Ctask Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="opacity-50 hover:opacity-100 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-all cursor-pointer">
              <FaFacebook className="w-5 h-5" />
            </a>
            <a href="#" className="opacity-50 hover:opacity-100 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-all cursor-pointer">
              <FaInstagram className="w-5 h-5" />
            </a>
            <a href="#" className="opacity-50 hover:opacity-100 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-all cursor-pointer">
              <FaYoutube className="w-5 h-5" />
            </a>
            <a href="#" className="opacity-50 hover:opacity-100 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-all cursor-pointer">
              <FaLinkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

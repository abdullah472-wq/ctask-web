'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface SidebarProps {
  title: string;
  links: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[];
}

export function Sidebar({ title, links }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-64 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col hidden md:flex transition-colors">
      <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-emerald flex items-center justify-center font-bold text-white dark:text-dark-bg mr-3 shadow-sm">
          C
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-emerald">
          {title}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive 
                  ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5 text-yellow-500" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-brand-cyan" />
                Dark Mode
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

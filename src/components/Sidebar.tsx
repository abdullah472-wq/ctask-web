'use client';

import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import DefaultLink from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  title: string;
  links: {
    label: string;
    href: string;
    icon: LucideIcon;
    badgeCount?: number;
  }[];
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  LinkComponent?: any;
  currentPath?: string;
}

export function Sidebar({ title, links, isOpen, setIsOpen, LinkComponent = DefaultLink, currentPath }: SidebarProps) {
  const fallbackPathname = usePathname();
  const pathname = currentPath ?? fallbackPathname;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center">
            <Image 
              src="/icon.png"
              alt="Ctask Icon"
              width={64}
              height={64}
              className="h-16 w-16 object-contain mr-3"
            />
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary">
              {title}
            </span>
          </div>
          {/* Mobile Close Button */}
          <button 
            className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            onClick={() => setIsOpen?.(false)}
          >
            ✕
          </button>
        </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <LinkComponent
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-4 py-2 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-500/15 dark:text-indigo-400' 
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-5 h-5" />
                {link.label}
              </div>
              {link.badgeCount !== undefined && link.badgeCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {link.badgeCount > 99 ? '99+' : link.badgeCount}
                </span>
              )}
            </LinkComponent>
          );
        })}
      </nav>

    </aside>
    </>
  );
}

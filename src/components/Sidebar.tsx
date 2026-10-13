'use client';

import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import DefaultLink from 'next/link';
import { usePathname } from 'next/navigation';
import { SocialAndCredit } from './SocialAndCredit';

interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
  section?: string;
  isSpecial?: boolean;
}

interface SidebarProps {
  title: string;
  links: SidebarLink[];
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  LinkComponent?: any;
  currentPath?: string;
  showSocialMenu?: boolean;
}

export function Sidebar({ 
  title, 
  links, 
  isOpen, 
  setIsOpen, 
  LinkComponent = DefaultLink, 
  currentPath,
  showSocialMenu = true 
}: SidebarProps) {
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
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
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

      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map((link, idx) => {
          const isActive = pathname === link.href;
          const showSectionHeader = Boolean(link.section && (idx === 0 || links[idx - 1].section !== link.section));

          return (
            <div key={link.href} className="space-y-1">
              {showSectionHeader && (
                <div className={`px-3 ${idx === 0 ? 'pb-1' : 'pt-4 pb-1'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {link.section}
                  </p>
                </div>
              )}
              <LinkComponent
                href={link.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white font-semibold shadow-md shadow-purple-900/25' 
                    : link.isSpecial
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <link.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : link.isSpecial ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{link.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {link.isSpecial && !isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-white tracking-wide">
                      PRO
                    </span>
                  )}
                  {link.badgeCount !== undefined && link.badgeCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                      {link.badgeCount > 99 ? '99+' : link.badgeCount}
                    </span>
                  )}
                </div>
              </LinkComponent>
            </div>
          );
        })}

        {showSocialMenu && (
          <div className="pt-4 pb-2 mt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase text-center mb-1">
              Social Channels
            </p>
            <SocialAndCredit />
          </div>
        )}
      </nav>

    </aside>
    </>
  );
}

'use client';

import { Link, usePathname } from '@/i18n/routing';
import { LayoutDashboard, CheckSquare, Wallet, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('Dashboard');

  const navItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      label: 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      isActive: pathname.startsWith('/dashboard/tasks') || pathname.startsWith('/dashboard/task/'),
    },
    {
      label: 'Wallet',
      href: '/dashboard/wallet',
      icon: Wallet,
      isActive: pathname.startsWith('/dashboard/wallet'),
    },
    {
      label: 'Profile',
      href: '/dashboard/settings',
      icon: User,
      isActive: pathname.startsWith('/dashboard/settings'),
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 w-full flex items-center justify-around bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/90 dark:border-white/10 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden shadow-lg transition-colors"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              active
                ? 'text-[#7B2CBF] dark:text-[#a855f7] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            {active && (
              <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]" />
            )}
            <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
            <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

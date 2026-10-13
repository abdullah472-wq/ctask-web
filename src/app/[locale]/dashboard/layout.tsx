'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from '@/i18n/routing';
import { supabase } from '@/utils/supabase';
import { Sidebar } from '@/components/Sidebar';
import { LogoLoader } from '@/components/ui/LogoLoader';
import {
  Activity,
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Settings,
  LogOut,
  Loader2,
  ShieldCheck,
  Crown,
  Bell,
  Check,
  Trophy,
  Menu,
  Users,
  User,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle,
  ListTodo,
  Briefcase,
  ClipboardCheck,
  CreditCard,
  LifeBuoy
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { BottomNav } from '@/components/BottomNav';
import { UserAvatar } from '@/components/UserAvatar';
import { NotificationBell } from '@/components/NotificationBell';
import { useTranslations, useLocale } from 'next-intl';

interface Profile {
  id: string;
  full_name: string;
  wallet_balance: number;
  role: string;
  plan_type?: string;
  verification_status?: string;
  kyc_status?: string;
  is_blocked?: boolean;
  avatar_id?: string;
  avatar_url?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    let cleanup: (() => void) | undefined;

    checkAuth().then(fn => {
      if (fn) cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);

      if (data && !data.is_blocked) {
        // Set up realtime subscription to instantly update wallet balance in the header
        // Use a unique channel name to prevent React StrictMode duplicate subscription errors
        const channel = supabase
          .channel(`profile_updates_${session.user.id}_${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${session.user.id}`
            },
            (payload) => {
              setProfile(payload.new as Profile);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } catch (err) {
      console.error(err);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  // Handle Blocked State
  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-card border-2 border-red-500/50 rounded-3xl p-10 max-w-lg text-center shadow-2xl">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">অ্যাকাউন্ট ব্লকড</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।
            <br /><br />
            (Your account has been blocked. Contact support)
          </p>
          <button onClick={handleLogout} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors w-full flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    // 1. Overview
    { 
      label: t('workerDashboard'), 
      href: '/dashboard', 
      icon: LayoutDashboard,
      section: t('navOverview') || 'Overview',
    },
    { 
      label: t('leaderboard'), 
      href: '/dashboard/leaderboard', 
      icon: Trophy,
      section: t('navOverview') || 'Overview',
    },
    { 
      label: t('activityLog'), 
      href: '/dashboard/activity', 
      icon: Activity,
      section: t('navOverview') || 'Overview',
    },

    // 2. Task Center
    { 
      label: t('availableTasks'), 
      href: '/dashboard/tasks', 
      icon: Briefcase,
      section: t('navTasks') || 'Task Center',
    },
    { 
      label: t('mySubmissions'), 
      href: '/dashboard/submissions', 
      icon: ClipboardCheck,
      section: t('navTasks') || 'Task Center',
    },
    { 
      label: t('manageMyTasks') || (locale === 'bn' ? 'আমার কাজ পরিচালনা' : 'Manage My Tasks'), 
      href: '/dashboard/manage-tasks', 
      icon: ListTodo,
      section: t('navTasks') || 'Task Center',
    },

    // 3. Finance & Growth
    { 
      label: t('walletWithdraw'), 
      href: '/dashboard/wallet', 
      icon: Wallet,
      section: t('navFinance') || 'Finance & Growth',
    },
    { 
      label: t('depositAdvertise'), 
      href: '/dashboard/deposit', 
      icon: CreditCard,
      section: t('navFinance') || 'Finance & Growth',
    },
    { 
      label: t('referralsDownline'), 
      href: '/dashboard/referrals', 
      icon: Users,
      section: t('navFinance') || 'Finance & Growth',
    },

    // 4. Account & Support
    { 
      label: t('upgradeToPremium'), 
      href: '/dashboard/upgrade', 
      icon: Crown,
      isSpecial: true,
      section: t('navAccount') || 'Account & Support',
    },
    { 
      label: t('supportTickets'), 
      href: '/dashboard/support', 
      icon: LifeBuoy,
      section: t('navAccount') || 'Account & Support',
    },
    { 
      label: t('settings'), 
      href: '/dashboard/settings', 
      icon: Settings,
      section: t('navAccount') || 'Account & Support',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex transition-colors">
      <Sidebar
        title="Ctask"
        links={sidebarLinks}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        LinkComponent={Link}
        currentPath={pathname}
      />

      <div className="flex-1 flex flex-col min-h-screen max-w-full relative">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-dark-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg hidden md:block">{t('workerDashboard')}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">

            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-white/5 border border-brand-primary/30 text-brand-primary font-mono font-medium shadow-sm text-sm sm:text-base">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              {profile?.wallet_balance?.toFixed(2) || '0.00'} ৳
            </div>

            {/* Notification Bell */}
            {profile && <NotificationBell userId={profile.id} />}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:gap-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
              >
                <UserAvatar avatarUrl={profile?.avatar_url} avatarId={profile?.avatar_id} fallbackName={profile?.full_name} className="w-10 h-10 shadow-sm rounded-full" />
                <div className="hidden sm:block text-left mr-2">
                  <p className="text-sm font-bold flex items-center gap-1">
                    {profile?.full_name}
                    {profile?.plan_type === 'premium' && <Crown className="w-3 h-3 text-yellow-500" />}
                  </p>
                  <p className={`text-xs font-medium capitalize flex items-center gap-1 mt-0.5 ${profile?.kyc_status === 'verified' ? 'text-green-600 dark:text-green-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {profile?.kyc_status === 'verified' ? (
                      <><CheckCircle className="w-3 h-3" /> {t('verified')}</>
                    ) : (
                      profile?.kyc_status || t('unverified')
                    )}
                  </p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 flex flex-col">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 mb-1">
                      <p className="text-sm font-bold truncate flex items-center gap-1">
                        {profile?.full_name || 'Worker'}
                        {profile?.plan_type === 'premium' && <Crown className="w-3 h-3 text-yellow-500" />}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{profile?.kyc_status === 'verified' ? t('verified') : t('unverified')}</p>
                    </div>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <User className="w-4 h-4 text-slate-500" />
                      {t('profile')}
                    </Link>
                    <Link href="/dashboard/wallet" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Wallet className="w-4 h-4 text-slate-500" />
                      {t('walletWithdraw')}
                    </Link>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button
                      onClick={() => router.replace(pathname, { locale: locale === 'en' ? 'bn' : 'en' })}
                      className="flex items-center gap-3 p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors w-full text-left"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-slate-500">🌐</span>
                      {locale === 'en' ? 'Switch to Bengali (BN)' : 'Switch to English (EN)'}
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-3 p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors w-full text-left"
                    >
                      {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      {mounted && theme === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')}
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {profile?.role === 'admin' && (
              <Link href="/admin" className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent dark:border-slate-800 shadow-sm">
                {t('adminPanel')}
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

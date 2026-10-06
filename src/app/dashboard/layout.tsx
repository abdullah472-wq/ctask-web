'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { LogoLoader } from '@/components/ui/LogoLoader';
import { 
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
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { UserAvatar } from '@/components/UserAvatar';

interface Profile {
  id: string;
  full_name: string;
  wallet_balance: number;
  role: string;
  plan_type?: string;
  verification_status?: string;
  is_blocked?: boolean;
  avatar_id?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
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
        fetchNotifications(session.user.id);
        
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

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
  };

  const handleMarkAsRead = async (notifId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
      
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
      
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (title?: string) => {
    const lowerTitle = title?.toLowerCase() || '';
    if (lowerTitle.includes('warning') || lowerTitle.includes('alert') || lowerTitle.includes('rejected')) {
      return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    }
    if (lowerTitle.includes('success') || lowerTitle.includes('approved')) {
      return <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    if (lowerTitle.includes('wallet') || lowerTitle.includes('earn') || lowerTitle.includes('reward')) {
      return <Wallet className="w-4 h-4 text-brand-accent dark:text-[#00F2FE]" />;
    }
    return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };
  
  const getNotificationIconBg = (title?: string) => {
    const lowerTitle = title?.toLowerCase() || '';
    if (lowerTitle.includes('warning') || lowerTitle.includes('alert') || lowerTitle.includes('rejected')) return 'bg-orange-100 dark:bg-orange-900/30';
    if (lowerTitle.includes('success') || lowerTitle.includes('approved')) return 'bg-indigo-100 dark:bg-indigo-900/30';
    if (lowerTitle.includes('wallet') || lowerTitle.includes('earn') || lowerTitle.includes('reward')) return 'bg-brand-accent/10 dark:bg-brand-accent/20';
    return 'bg-blue-100 dark:bg-blue-900/30';
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
            <br/><br/>
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
    { label: 'Worker Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Available Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'My Submissions', href: '/dashboard/submissions', icon: CheckSquare },
    { label: 'Referrals & Downline', href: '/dashboard/referrals', icon: Users },
    { label: 'Wallet & Withdraw', href: '/dashboard/wallet', icon: Wallet },
    { label: 'Deposit & Advertise', href: '/dashboard/deposit', icon: Wallet },
    { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },

    { label: 'Upgrade to Premium', href: '/dashboard/upgrade', icon: Crown },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex transition-colors">
      <Sidebar 
        title="Ctask" 
        links={sidebarLinks} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
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
            <h1 className="font-bold text-lg hidden md:block">Worker Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-white/5 border border-brand-primary/30 text-brand-primary font-mono font-medium shadow-sm text-sm sm:text-base">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              {profile?.wallet_balance?.toFixed(2) || '0.00'} ৳
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-dark-card"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0f172a]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-all">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                            className={`p-4 flex gap-3 transition-colors ${!notif.is_read ? 'cursor-pointer' : ''} border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${
                              notif.is_read 
                                ? 'bg-transparent' 
                                : 'bg-slate-50 dark:bg-slate-800/50 relative'
                            }`}
                          >
                            {!notif.is_read && (
                              <div className="absolute top-1/2 -translate-y-1/2 left-2 w-1.5 h-1.5 rounded-full bg-[#00F2FE]" />
                            )}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ml-1 ${getNotificationIconBg(notif.title)}`}>
                              {getNotificationIcon(notif.title)}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className={`font-semibold text-sm truncate ${notif.is_read ? 'text-slate-600 dark:text-slate-400 font-medium' : 'text-slate-900 dark:text-slate-100'}`}>
                                {notif.title}
                              </h4>
                              <p className={`text-xs mt-0.5 line-clamp-2 ${notif.is_read ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                {notif.message}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-start">
                              <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium mt-0.5">{getRelativeTime(notif.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:gap-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
              >
                <UserAvatar avatarId={profile?.avatar_id} className="w-10 h-10 shadow-sm" />
                <div className="hidden sm:block text-left mr-2">
                  <p className="text-sm font-bold flex items-center gap-1">
                    {profile?.full_name}
                    {profile?.plan_type === 'premium' && <Crown className="w-3 h-3 text-yellow-500" />}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {profile?.verification_status === 'verified' ? '✅ Verified' : 'Unverified'}
                  </p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 flex flex-col">
                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <User className="w-4 h-4 text-slate-500" />
                      Edit Profile
                    </Link>
                    <Link href="/dashboard/wallet" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Wallet className="w-4 h-4 text-slate-500" />
                      My Wallet
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-3 p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors w-full text-left"
                    >
                      {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      {mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {profile?.role === 'admin' && (
              <Link href="/admin" className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent dark:border-slate-800 shadow-sm">
                Admin Panel
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-8" onClick={() => showNotifications && setShowNotifications(false)}>
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

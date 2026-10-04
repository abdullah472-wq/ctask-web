'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Sidebar } from '@/components/Sidebar';
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
  User
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    checkAuth();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
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
    { label: 'Available Tasks', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Submissions', href: '/dashboard/submissions', icon: CheckSquare },
    { label: 'Referrals & Downline', href: '/dashboard/referrals', icon: Users },
    { label: 'Wallet & Withdraw', href: '/dashboard/wallet', icon: Wallet },
    { label: 'Deposit (Advertiser)', href: '/dashboard/deposit', icon: Wallet },
    { label: 'Post Task', href: '/dashboard/create-task', icon: CheckSquare },
    { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { label: 'Verify Identity', href: '/dashboard/verify', icon: ShieldCheck },
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
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-white/5 border border-brand-emerald/30 text-brand-emerald font-mono font-medium shadow-sm text-sm sm:text-base">
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
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                    <h3 className="font-bold">Notifications</h3>
                    <span className="text-xs font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded-full">{unreadCount} New</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No notifications yet.</div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 transition-colors ${notif.is_read ? 'opacity-70' : 'bg-brand-cyan/5'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{notif.title}</h4>
                              {!notif.is_read && (
                                <button 
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="text-brand-cyan hover:text-brand-emerald transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(notif.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
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
                    <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
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
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {profile?.role === 'admin' && (
              <Link href="/admin" className="hidden sm:block text-sm font-medium hover:text-brand-cyan transition-colors bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent dark:border-slate-800 shadow-sm">
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

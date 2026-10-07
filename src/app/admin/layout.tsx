'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Sidebar } from '@/components/Sidebar';
import { 
  BarChart3, 
  PlusCircle, 
  CheckCircle, 
  ListTodo, 
  Landmark,
  LogOut, 
  Loader2,
  ShieldAlert,
  CreditCard,
  Users,
  Menu,
  Settings,
  History,
  MessageSquare,
  LifeBuoy
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    kyc: 0,
    withdrawals: 0,
    proofs: 0,
    tasks: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || data?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }
      
      // Fetch badge counts
      const [kycRes, withdrawalsRes, proofsRes, tasksRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('task_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setCounts({
        kyc: kycRes.count || 0,
        withdrawals: withdrawalsRes.count || 0,
        proofs: proofsRes.count || 0,
        tasks: tasksRes.count || 0,
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  const sidebarLinks = [
    { label: 'Overview', href: '/admin', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Manage Tasks', href: '/admin/manage-tasks', icon: ListTodo },
    { label: 'Pending Tasks', href: '/admin/pending-tasks', icon: ListTodo, badgeCount: counts.tasks },
    { label: 'Create Task', href: '/admin/create-task', icon: PlusCircle },
    { label: 'Review Proofs', href: '/admin/review', icon: CheckCircle, badgeCount: counts.proofs },
    { label: 'Review History', href: '/admin/review-history', icon: History },
    { label: 'KYC Reviews', href: '/admin/kyc-review', icon: ShieldAlert, badgeCount: counts.kyc },
    { label: 'Deposits', href: '/admin/deposits', icon: Landmark },
    { label: 'Withdrawals', href: '/admin/withdrawals', icon: Landmark, badgeCount: counts.withdrawals },
    { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { label: 'Manage Reviews', href: '/admin/manage-reviews', icon: MessageSquare },
    { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy },
    { label: 'Activity Logs', href: '/admin/activity-logs', icon: ListTodo },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex transition-colors">
      <Sidebar 
        title="Ctask" 
        links={sidebarLinks} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen max-w-full">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-dark-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg text-brand-accent hidden md:block">Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 transition-colors bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent dark:border-slate-800 shadow-sm">
              Exit to Dashboard
            </Link>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

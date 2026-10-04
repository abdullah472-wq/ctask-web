'use client';

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
  Menu
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        alert('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }
      
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
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  const sidebarLinks = [
    { label: 'Overview', href: '/admin', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Create Task', href: '/admin/create-task', icon: PlusCircle },
    { label: 'Review Proofs', href: '/admin/review', icon: CheckCircle },
    { label: 'Manage Tasks', href: '/admin/manage-tasks', icon: ListTodo },
    { label: 'KYC Reviews', href: '/admin/kyc-review', icon: ShieldAlert },
    { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { label: 'Deposits', href: '/admin/deposits', icon: Landmark },
    { label: 'Withdrawals', href: '/admin/withdrawals', icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex transition-colors">
      <Sidebar 
        title="Ctask Admin" 
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
            <h1 className="font-bold text-lg text-brand-cyan hidden md:block">Admin Panel</h1>
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

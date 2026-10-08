'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Users, FileCheck, CircleDollarSign, Loader2, Download, Landmark, ListTodo, ShieldAlert, Ticket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingProofs: 0,
    totalPaid: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTasks: 0,
    activeTasks: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    pendingTickets: 0,
  });
  
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [
      usersRes,
      proofsRes,
      profilesRes,
      depositsRes,
      withdrawalsTotalRes,
      tasksPendingRes,
      tasksActiveRes,
      kycRes,
      withdrawalsPendingRes,
      withdrawalsPendingAmountRes,
      ticketsRes,
      recentUsersRes
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('task_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('total_earned'),
      supabase.from('deposits').select('amount').eq('status', 'approved'),
      supabase.from('withdrawals').select('amount').eq('status', 'paid'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
      supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('withdrawals').select('amount').eq('status', 'pending'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    let totalPaid = 0;
    if (profilesRes.data) {
      totalPaid = profilesRes.data.reduce((acc, curr) => acc + Number(curr.total_earned || 0), 0);
    }
    
    let totalDeposits = 0;
    if (depositsRes.data) {
      totalDeposits = depositsRes.data.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }

    let totalWithdrawals = 0;
    if (withdrawalsTotalRes.data) {
      totalWithdrawals = withdrawalsTotalRes.data.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }
    
    let pendingWithdrawalAmount = 0;
    if (withdrawalsPendingAmountRes.data) {
      pendingWithdrawalAmount = withdrawalsPendingAmountRes.data.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }

    setStats({
      totalUsers: usersRes.count || 0,
      pendingProofs: proofsRes.count || 0,
      totalPaid: totalPaid,
      totalDeposits: totalDeposits,
      totalWithdrawals: totalWithdrawals,
      pendingTasks: tasksPendingRes.count || 0,
      activeTasks: tasksActiveRes.count || 0,
      pendingKyc: kycRes.count || 0,
      pendingWithdrawals: withdrawalsPendingRes.count || 0,
      pendingWithdrawalsAmount: pendingWithdrawalAmount,
      pendingTickets: ticketsRes.count || 0,
    });
    
    if (recentUsersRes.data) {
      setRecentUsers(recentUsersRes.data);
    }
    
    setLoading(false);
  };

  const handleAdminReportDownload = async () => {
    const element = document.getElementById('admin-stats-container');
    if (!element) return;
    
    document.body.classList.add('printing');
    
    try {
      toast.loading('Generating System Report...', { id: 'pdf-toast' });
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) document.documentElement.classList.remove('dark');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      if (isDark) document.documentElement.classList.add('dark');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(22);
      pdf.setTextColor('#5A189A');
      pdf.text('Ctask Global System Report', 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor('#64748b');
      pdf.text(`Generated at: ${new Date().toLocaleString()}`, 15, 28);

      pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight);
      
      const safeDate = new Date().toISOString().split('T')[0];
      pdf.save(`Ctask_Admin_System_Report_${safeDate}.pdf`);
      toast.success('System Report Downloaded!', { id: 'pdf-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    } finally {
      document.body.classList.remove('printing');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-xl">
          <p className="text-slate-300 font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-slate-400">Welcome to the Ctask administration panel.</p>
        </div>
        <button 
          onClick={handleAdminReportDownload} 
          className="print-hide flex items-center gap-2 bg-brand-accent hover:bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
        >
          <Download className="w-5 h-5" /> Download System Report
        </button>
      </div>

      <div id="admin-stats-container">
        {/* Top Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-accent/30 transition-colors">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Users className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Users</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{stats.totalUsers}</p>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-primary/30 transition-colors">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                <CircleDollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Worker Earnings</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{stats.totalPaid.toFixed(2)} ৳</p>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Landmark className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Deposits</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{stats.totalDeposits.toFixed(2)} ৳</p>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Landmark className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Withdrawals</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{stats.totalWithdrawals.toFixed(2)} ৳</p>
          </div>
        </div>

        {/* Pending Action Counts */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ListTodo className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300">Active Tasks</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{stats.activeTasks}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><FileCheck className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300">Pending Proofs</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{stats.pendingProofs}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ShieldAlert className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300">Pending KYC</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{stats.pendingKyc}</span>
          </div>

          <Link href="/admin/withdrawals" className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer block">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><CircleDollarSign className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-brand-accent transition-colors">Pending W/D</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{stats.pendingWithdrawals}</span>
          </Link>

          <Link href="/admin/tickets" className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer block">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><Ticket className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-brand-accent transition-colors">Open Tickets</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{stats.pendingTickets}</span>
          </Link>
        </div>

        {/* Charts and Tables Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Registrations Table */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200 flex items-center justify-between">
              Recent Registrations
              <Link href="/admin/users" className="text-sm font-medium text-brand-accent hover:underline">View All</Link>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Name</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {user.full_name || 'Unknown User'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No recent users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart: Financials */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Financial Overview</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Payouts vs Pending', payouts: stats.totalWithdrawals, pending: stats.pendingWithdrawalsAmount }]} barSize={80}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="payouts" name="Total Payouts (৳)" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" name="Pending Withdrawals (৳)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print-hide { display: none !important; }
        }
        .printing .print-hide { display: none !important; }
      `}</style>
    </>
  );
}

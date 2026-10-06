'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Users, FileCheck, CircleDollarSign, Loader2, Download, Landmark, ListTodo, ShieldAlert } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Mock Data for Admin Charts
const tasksCompletedData = [
  { name: 'Mon', completed: 12, rejected: 2 },
  { name: 'Tue', completed: 19, rejected: 5 },
  { name: 'Wed', completed: 15, rejected: 3 },
  { name: 'Thu', completed: 25, rejected: 1 },
  { name: 'Fri', completed: 22, rejected: 4 },
  { name: 'Sat', completed: 30, rejected: 2 },
  { name: 'Sun', completed: 28, rejected: 0 },
];

const financialData = [
  { name: 'Payouts vs Pending', payouts: 450, pending: 120 }
];

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingProofs: 0,
    totalPaid: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTasks: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
  });

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
      tasksRes,
      kycRes,
      withdrawalsPendingRes
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('task_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('total_earned'),
      supabase.from('deposits').select('amount').eq('status', 'approved'),
      supabase.from('withdrawals').select('amount').eq('status', 'approved'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
      supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending')
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

    setStats({
      totalUsers: usersRes.count || 0,
      pendingProofs: proofsRes.count || 0,
      totalPaid: totalPaid,
      totalDeposits: totalDeposits,
      totalWithdrawals: totalWithdrawals,
      pendingTasks: tasksRes.count || 0,
      pendingKyc: kycRes.count || 0,
      pendingWithdrawals: withdrawalsPendingRes.count || 0,
    });
    setLoading(false);
  };

  const handleAdminReportDownload = async () => {
    const element = document.getElementById('admin-stats-container');
    if (!element) return;
    
    // Add print class for styles
    document.body.classList.add('printing');
    
    try {
      toast.loading('Generating System Report...', { id: 'pdf-toast' });
      // Remove dark mode temporarily to ensure clean light theme print
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
      
      // Inject Custom Header text
      pdf.setFontSize(22);
      pdf.setTextColor('#5A189A');
      pdf.text('Ctask Global System Report', 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor('#64748b');
      pdf.text(`Generated at: ${new Date().toLocaleString()}`, 15, 28);

      // Add Image after header (shifted down)
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

  // Custom Tooltip for Recharts to match the dark theme
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><FileCheck className="w-5 h-5"/></div>
              <span className="font-medium text-slate-600 dark:text-slate-300">Pending Proofs</span>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">{stats.pendingProofs}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ListTodo className="w-5 h-5"/></div>
              <span className="font-medium text-slate-600 dark:text-slate-300">Pending Tasks</span>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">{stats.pendingTasks}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ShieldAlert className="w-5 h-5"/></div>
              <span className="font-medium text-slate-600 dark:text-slate-300">Pending KYC</span>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">{stats.pendingKyc}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><CircleDollarSign className="w-5 h-5"/></div>
              <span className="font-medium text-slate-600 dark:text-slate-300">Pending Withdrawals</span>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">{stats.pendingWithdrawals}</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Line Chart: Tasks Completed */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Task Statistics (Last 7 Days)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tasksCompletedData}>
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Completed Tasks" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rejected" 
                    name="Rejected Tasks" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Financials */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Financial Overview</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} barSize={80}>
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

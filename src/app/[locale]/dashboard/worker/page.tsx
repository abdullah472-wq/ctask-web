'use client';

import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  Banknote, 
  CheckSquare, 
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Clock,
  Loader2
} from 'lucide-react';
import { supabase } from '@/utils/supabase';

export default function WorkerStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [taskStats, setTaskStats] = useState({
    totalStarted: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [successRate, setSuccessRate] = useState(0);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const fetchWorkerData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const uid = session.user.id;

      // 1. Fetch real task submissions for logged in user
      const { data: submissions } = await supabase
        .from('task_submissions')
        .select('status, created_at')
        .eq('user_id', uid);

      const approvedCount = submissions?.filter(s => s.status === 'approved').length || 0;
      const rejectedCount = submissions?.filter(s => s.status === 'rejected').length || 0;
      const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;
      const totalStarted = submissions?.length || 0;

      // Calculate dynamic success rate based strictly on reviewed tasks
      const totalRated = approvedCount + rejectedCount;
      const calculatedRate = totalRated > 0 ? Math.round((approvedCount / totalRated) * 100) : 0;

      setTaskStats({
        totalStarted,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      });
      setSuccessRate(calculatedRate);

      // 2. Fetch Profile Balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance, total_earned')
        .eq('id', uid)
        .maybeSingle();

      if (profile) {
        setBalance(Number(profile.wallet_balance || 0));
        setTotalEarned(Number(profile.total_earned || 0));
      }

      // 3. Fetch Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', uid)
        .eq('status', 'paid');

      if (withdrawals) {
        const sumWithdrawn = withdrawals.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        setTotalWithdrawn(sumWithdrawn);
      }

      // 4. Fetch Recent Activity Transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(6);

      if (transactions) {
        const feed = transactions.map(tx => ({
          id: tx.id,
          type: tx.type === 'withdrawal' ? 'withdrawal' : (tx.status === 'paid' || tx.status === 'approved' ? 'approved' : tx.status === 'rejected' ? 'rejected' : 'pending'),
          title: tx.type === 'withdrawal' ? 'Withdrawal Processed' : tx.type === 'deposit' ? 'Wallet Deposit' : 'Task Earnings',
          amount: tx.type === 'withdrawal' ? `-৳ ${Number(tx.amount).toFixed(2)}` : `+৳ ${Number(tx.amount).toFixed(2)}`,
          reason: tx.description || '',
          time: new Date(tx.created_at).toLocaleDateString()
        }));
        setActivityFeed(feed);
      }

    } catch (err) {
      console.error('Error fetching worker stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const approvedCount = taskStats.approved;
  const rejectedCount = taskStats.rejected;
  const totalRated = approvedCount + rejectedCount;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Worker Statistics</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your dynamic performance and reviewed tasks.</p>
      </div>

      {/* 1. Top Summary Cards (2-column on mobile, 4-column on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-8">
        {/* Financial Card 1: Available Balance */}
        <div className="bg-gradient-to-br from-[#5A189A] to-[#7B2CBF] text-white shadow-md rounded-2xl p-4 sm:p-5 border-none h-full flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-1">Available Balance</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">৳ {balance.toFixed(2)}</h3>
          </div>
        </div>

        {/* Financial Card 2: Total Earned */}
        <div className="bg-gradient-to-br from-[#5A189A] to-[#7B2CBF] text-white shadow-md rounded-2xl p-4 sm:p-5 border-none h-full flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/20 text-white text-[10px] sm:text-xs font-bold border border-white/30 whitespace-nowrap">
              Active
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-1">Total Earned</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">৳ {totalEarned.toFixed(2)}</h3>
          </div>
        </div>

        {/* Metric Card 1: Tasks Completed */}
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 h-full flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-[#5A189A] dark:text-[#7B2CBF] shrink-0">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Tasks Completed</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{taskStats.approved}</h3>
          </div>
        </div>

        {/* Metric Card 2: Dynamic Success Rate */}
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 h-full flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">Success Rate</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{successRate}%</h3>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Task Statistics Section */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Task Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Started</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{taskStats.totalStarted}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending Review</p>
                <p className="text-xl font-bold text-amber-500">{taskStats.pending}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-center">
                <p className="text-sm font-medium text-green-600/70 dark:text-green-500/70 mb-1">Approved</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-500">{taskStats.approved}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center">
                <p className="text-sm font-medium text-red-600/70 dark:text-red-500/70 mb-1">Rejected</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-500">{taskStats.rejected}</p>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown Section */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Earnings Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 text-center border-r border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalEarned.toFixed(2)}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Withdrawn</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalWithdrawn.toFixed(2)}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Dynamic Performance Widget */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Performance</h3>
            
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Circular Progress with Purple Gradient */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="workerPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5A189A" />
                      <stop offset="100%" stopColor="#7B2CBF" />
                    </linearGradient>
                  </defs>
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="url(#workerPurpleGradient)" 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 45}`} 
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - successRate / 100)}`} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{successRate}%</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Approval Rate</span>
                </div>
              </div>

              {/* Reviewed Tasks Breakdown */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                  <span className="block text-lg font-bold text-green-600 dark:text-green-400">{approvedCount}</span>
                  <span className="text-[11px] font-medium text-green-700/80 dark:text-green-400/80">Approved</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <span className="block text-lg font-bold text-red-600 dark:text-red-400">{rejectedCount}</span>
                  <span className="text-[11px] font-medium text-red-700/80 dark:text-red-400/80">Rejected</span>
                </div>
              </div>
              {totalRated === 0 && (
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  No reviewed submissions yet (pending tasks excluded)
                </p>
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
            
            <div className="space-y-4">
              {activityFeed.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No recent activity found.</p>
              ) : (
                activityFeed.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center shrink-0 shadow-sm">
                        {activity.type === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {activity.type === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                        {activity.type === 'withdrawal' && <ArrowUpRight className="w-4 h-4 text-[#5A189A]" />}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{activity.title}</p>
                        <p className="text-[10px] text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-xs ${
                      activity.amount?.startsWith('-') ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {activity.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

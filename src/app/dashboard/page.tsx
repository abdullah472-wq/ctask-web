'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, CheckCircle, Gift, Wallet, Banknote, CheckSquare, TrendingUp, XCircle, ArrowUpRight, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Mock Data
const MOCK_DATA = {
  balance: 450.50,
  totalEarned: 1250.00,
  tasksCompleted: 145,
  successRate: 92,
  taskStats: {
    totalStarted: 160,
    pending: 10,
    approved: 145,
    rejected: 5
  },
  earningStats: {
    totalEarned: 1250,
    thisMonth: 350,
    thisWeek: 120,
    totalWithdrawn: 800
  },
  performance: {
    approvalRate: 92,
    avgCompletionTime: '15 mins'
  },
  activityFeed: [
    { id: 1, type: 'approved', title: 'Task Approved', amount: '+৳ 15.00', reason: '', time: '2 hours ago' },
    { id: 2, type: 'withdrawal', title: 'Withdrawal Processed', amount: '-৳ 200.00', reason: '', time: '1 day ago' },
    { id: 3, type: 'rejected', title: 'Task Rejected', amount: '', reason: 'Invalid proof screenshot', time: '2 days ago' },
    { id: 4, type: 'approved', title: 'Task Approved', amount: '+৳ 5.50', reason: '', time: '2 days ago' },
  ]
};

export default function WorkerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      await fetchProfile(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
      
    if (data) setUserProfile(data);
  };

  const handleClaimBonus = async () => {
    if (!userId) return;
    setClaiming(true);
    try {
      const { error } = await supabase.rpc('claim_daily_bonus', { user_uuid: userId });
      if (error) throw error;
      
      toast.success('🎉 You successfully claimed your 1.00 ৳ daily bonus!');
      setHideBanner(true);
      fetchProfile(userId); // Refresh profile state in background
    } catch (err: any) {
      toast.error(err.message || 'Error claiming bonus.');
    } finally {
      setClaiming(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasClaimedToday = userProfile?.last_check_in_date === todayStr;
  const shouldShowBanner = !hasClaimedToday && !hideBanner;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('stats-container');
    if (!element) return;
    
    // Add print class for styles
    document.body.classList.add('printing');
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
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
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ctask_Earnings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Downloaded!', { id: 'pdf-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    } finally {
      document.body.classList.remove('printing');
    }
  };
  
  const getAccountAge = (createdAt: string | undefined) => {
    if (!createdAt) return '0 days';
    const start = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Header and Download Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Worker'} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5A189A] dark:text-[#7B2CBF]" />
            Active for {getAccountAge(userProfile?.created_at)}
          </p>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="print-hide flex items-center gap-2 bg-[#5A189A] hover:bg-[#5A189A]/90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
        >
          <Download className="w-5 h-5" /> Download Report
        </button>
      </div>

      {/* Daily Bonus Card (Moved to Top) */}
      {shouldShowBanner && (
        <div className="print-hide mb-8 bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -z-0 -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Daily Check-in Bonus</h2>
              <p className="text-white/80 text-sm font-medium">
                Current Streak: <span className="font-bold text-yellow-300">{userProfile?.current_streak || 0} 🔥</span>
              </p>
            </div>
          </div>

          <button 
            onClick={handleClaimBonus}
            disabled={hasClaimedToday || claiming}
            className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 z-10 ${hasClaimedToday ? 'bg-white/20 text-white/70 cursor-not-allowed border border-white/10 backdrop-blur-md' : 'bg-white text-[#5A189A] hover:scale-105 hover:shadow-xl'}`}
          >
            {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : hasClaimedToday ? <CheckCircle className="w-5 h-5" /> : null}
            {hasClaimedToday ? 'Already Claimed' : 'Claim 1.00 ৳'}
          </button>
        </div>
      )}

      <div id="stats-container" className="mb-12">
        {/* 1. Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Balance</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {MOCK_DATA.balance.toFixed(2)}</h3>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#5A189A]/10 flex items-center justify-center text-[#5A189A]">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Earned</p>
              <h3 className="text-2xl font-bold text-[#5A189A]">৳ {MOCK_DATA.totalEarned.toFixed(2)}</h3>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_DATA.tasksCompleted}</h3>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Success Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_DATA.successRate}%</h3>
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
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{MOCK_DATA.taskStats.totalStarted}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending</p>
                  <p className="text-xl font-bold text-amber-500">{MOCK_DATA.taskStats.pending}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-center">
                  <p className="text-sm font-medium text-green-600/70 dark:text-green-500/70 mb-1">Approved</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-500">{MOCK_DATA.taskStats.approved}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center">
                  <p className="text-sm font-medium text-red-600/70 dark:text-red-500/70 mb-1">Rejected</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-500">{MOCK_DATA.taskStats.rejected}</p>
                </div>
              </div>
            </div>

            {/* Earnings Statistics Section */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Earnings Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Earned</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {MOCK_DATA.earningStats.totalEarned}</p>
                </div>
                <div className="p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">This Month</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {MOCK_DATA.earningStats.thisMonth}</p>
                </div>
                <div className="p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">This Week</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {MOCK_DATA.earningStats.thisWeek}</p>
                </div>
                <div className="p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Withdrawn</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {MOCK_DATA.earningStats.totalWithdrawn}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Performance Widget */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Performance</h3>
              
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#5A189A" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - MOCK_DATA.performance.approvalRate / 100)}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{MOCK_DATA.performance.approvalRate}%</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Approval Rate</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Avg. Time</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{MOCK_DATA.performance.avgCompletionTime}</span>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {MOCK_DATA.activityFeed.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-4">
                    {index !== MOCK_DATA.activityFeed.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-[-1.5rem] w-px bg-slate-200 dark:bg-slate-800"></div>
                    )}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center shrink-0">
                      {activity.type === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {activity.type === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                      {activity.type === 'withdrawal' && <ArrowUpRight className="w-5 h-5 text-[#5A189A]" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{activity.title}</p>
                        {activity.amount && (
                          <span className={`font-bold text-sm ${activity.type === 'approved' ? 'text-green-600 dark:text-green-500' : 'text-slate-900 dark:text-white'}`}>
                            {activity.amount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.time}</p>
                      {activity.reason && (
                        <p className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-900/10 p-2 rounded-md border border-red-100 dark:border-red-900/30">
                          Reason: {activity.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

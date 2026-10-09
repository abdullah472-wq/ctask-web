'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, Gift, Wallet, Banknote, CheckSquare, TrendingUp, XCircle, ArrowUpRight, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function WorkerDashboardPage() {
  const t = useTranslations('Dashboard');
  const tw = useTranslations('WorkerDashboard');
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);
  
  // Dynamic Stats
  const [taskStats, setTaskStats] = useState({
    totalStarted: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      
      const sessionName = session.user.user_metadata?.full_name;
      
      await fetchProfile(session.user.id, sessionName);
      await fetchStats(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (uid: string, fallbackName?: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
      
    if (data) {
      if (!data.full_name && fallbackName) {
        data.full_name = fallbackName;
      }
      setUserProfile(data);
    }
  };

  const fetchStats = async (uid: string) => {
    // Fetch Task Submissions for stats
    const { data: submissions } = await supabase
      .from('task_submissions')
      .select('status')
      .eq('user_id', uid);
      
    // Fetch Recent Activity (Transactions)
    const { data: recentActivity } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch Withdrawals
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', uid)
      .eq('status', 'paid');

    let totalStarted = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    
    let feed: any[] = [];

    if (submissions) {
      totalStarted = submissions.length;
      submissions.forEach(sub => {
        if (sub.status === 'pending') pending++;
        if (sub.status === 'approved') approved++;
        if (sub.status === 'rejected') rejected++;
      });
    }

    if (recentActivity) {
      feed = recentActivity.map(tx => {
        let title = tx.type;
        if (tx.type === 'withdrawal') title = 'Withdrawal Request';
        if (tx.type === 'deposit') title = 'Wallet Deposit';
        if (tx.type === 'task') title = 'Task Earnings';
        
        return {
          id: tx.id,
          type: tx.status === 'paid' || tx.status === 'approved' ? 'approved' : tx.status === 'rejected' ? 'rejected' : 'pending',
          title: title,
          amount: tx.type === 'withdrawal' ? `-৳ ${Number(tx.amount).toFixed(2)}` : `+৳ ${Number(tx.amount).toFixed(2)}`,
          reason: tx.description || '',
          time: new Date(tx.created_at).toLocaleDateString()
        };
      });
    }

    let withdrawn = 0;
    if (withdrawals) {
      withdrawals.forEach(w => {
        withdrawn += Number(w.amount);
      });
    }

    setTaskStats({ totalStarted, pending, approved, rejected });
    setTotalWithdrawn(withdrawn);
    setActivityFeed(feed);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    const { data: chartSubmissions } = await supabase
      .from('task_submissions')
      .select('submitted_at, tasks:task_id(reward_amount)')
      .eq('user_id', uid)
      .eq('status', 'approved')
      .gte('submitted_at', dateStr);

    const { data: chartTransactions } = await supabase
      .from('transactions')
      .select('created_at, amount, type')
      .eq('user_id', uid)
      .gte('created_at', dateStr);

    const dailyData: Record<string, { earn: number; withdraw: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[formatted] = { earn: 0, withdraw: 0 };
    }

    if (chartSubmissions) {
      chartSubmissions.forEach((sub: any) => {
        const d = new Date(sub.submitted_at);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[formatted]) {
          dailyData[formatted].earn += Number(sub.tasks?.reward_amount || 0);
        }
      });
    }

    if (chartTransactions) {
      chartTransactions.forEach((tx: any) => {
        const d = new Date(tx.created_at);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[formatted] && tx.type === 'withdrawal') {
          dailyData[formatted].withdraw += Number(tx.amount || 0);
        }
      });
    }

    setChartData(Object.keys(dailyData).map(date => ({
      date,
      [tw('earnings') || 'Earnings']: dailyData[date].earn,
      [tw('withdrawals') || 'Withdrawals']: dailyData[date].withdraw
    })));

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
    
    document.body.classList.add('printing');
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
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

  const successRate = taskStats.totalStarted > 0 ? Math.round((taskStats.approved / taskStats.totalStarted) * 100) : 0;
  const balance = userProfile?.wallet_balance || 0;
  const totalEarned = userProfile?.total_earned || 0;

  return (
    <>
      {/* Header and Download Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tw('welcomeBack', { name: userProfile?.full_name?.split(' ')[0] || tw('worker') })}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5A189A] dark:text-[#7B2CBF]" />
            {tw('activeFor', { time: getAccountAge(userProfile?.created_at) })}
          </p>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="print-hide flex items-center gap-2 bg-[#5A189A] hover:bg-[#5A189A]/90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
        >
          <Download className="w-5 h-5" /> {tw('downloadReport')}
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
              <h2 className="text-xl font-bold text-white mb-1">{tw('dailyCheckInBonus')}</h2>
              <p className="text-white/80 text-sm font-medium">
                {tw('currentStreak')} <span className="font-bold text-yellow-300">{userProfile?.current_streak || 0} 🔥</span>
              </p>
            </div>
          </div>

          <button 
            onClick={handleClaimBonus}
            disabled={hasClaimedToday || claiming}
            className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 z-10 ${hasClaimedToday ? 'bg-white/20 text-white/70 cursor-not-allowed border border-white/10 backdrop-blur-md' : 'bg-white text-[#5A189A] hover:scale-105 hover:shadow-xl'}`}
          >
            {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : hasClaimedToday ? <CheckCircle className="w-5 h-5" /> : null}
            {hasClaimedToday ? tw('alreadyClaimed') : tw('claimBonus')}
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tw('availableBalance')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {balance.toFixed(2)}</h3>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#5A189A]/10 flex items-center justify-center text-[#5A189A]">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('totalEarned')}</p>
              <h3 className="text-2xl font-bold text-[#5A189A]">৳ {totalEarned.toFixed(2)}</h3>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tw('tasksCompleted')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{taskStats.approved}</h3>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tw('successRate')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{successRate}%</h3>
            </div>
          </div>
        </div>

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Task Statistics Section */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{tw('taskStatistics')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{tw('totalStarted')}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{taskStats.totalStarted}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{tw('pending')}</p>
                  <p className="text-xl font-bold text-amber-500">{taskStats.pending}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-center">
                  <p className="text-sm font-medium text-green-600/70 dark:text-green-500/70 mb-1">{tw('approved')}</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-500">{taskStats.approved}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center">
                  <p className="text-sm font-medium text-red-600/70 dark:text-red-500/70 mb-1">{tw('rejected')}</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-500">{taskStats.rejected}</p>
                </div>
              </div>
            </div>

            {/* Earnings Statistics Section */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{tw('earningsBreakdown')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 text-center border-r border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('totalEarned')}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {totalEarned.toFixed(2)}</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{tw('totalWithdrawn')}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {totalWithdrawn.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-6 h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWithdraw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={(value) => `৳${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey={tw('earnings') || 'Earnings'} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarn)" />
                    <Area type="monotone" dataKey={tw('withdrawals') || 'Withdrawals'} stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorWithdraw)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>


            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Performance Widget */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{tw('performance')}</h3>
              
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#5A189A" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - successRate / 100)}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{successRate}%</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tw('approvalRate')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{tw('recentActivity')}</h3>
              <div className="space-y-6 max-h-[220px] overflow-y-auto scrollbar-thin pr-2">
                {activityFeed.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center">{tw('noRecentActivity')}</p>
                ) : (
                  activityFeed.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-4">
                      {index !== activityFeed.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-[-1.5rem] w-px bg-slate-200 dark:bg-slate-800"></div>
                      )}
                      <div className="relative z-10 w-8 h-8 rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center shrink-0">
                        {activity.type === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {activity.type === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                        {activity.type === 'pending' && <Clock className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{activity.title}</p>
                          {activity.amount && (
                            <span className={`font-bold text-sm ${activity.type === 'approved' ? 'text-green-600 dark:text-green-500' : 'text-slate-900 dark:text-white'}`}>
                              {activity.amount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.time}</p>
                        {activity.reason && (
                          <p className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-900/10 p-2 rounded-md border border-red-100 dark:border-red-900/30">
                            {tw('reason')} {activity.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link href={`/${locale}/dashboard/activity`} className="text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors">
                  {tw('viewAllHistory') || 'View All History / সম্পূর্ণ ইতিহাস দেখুন'}
                </Link>
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

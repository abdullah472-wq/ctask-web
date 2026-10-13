'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, Gift, Wallet, Banknote, CheckSquare, TrendingUp, XCircle, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { syncDailyStreak, claimDailyBonusAction } from '@/app/actions/streak';

/**
 * Returns today's date formatted as YYYY-MM-DD in Bangladesh Time (Asia/Dhaka).
 */
const getDhakaTodayDateString = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

/**
 * Safely parses any date value (ISO, UTC, timestamp or date string)
 * and normalizes it to YYYY-MM-DD in Bangladesh Time (Asia/Dhaka).
 */
const formatToDhakaDate = (val?: string | Date | null): string => {
  if (!val) return '';
  try {
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      return val.trim();
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return typeof val === 'string' ? val.split('T')[0] : '';
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return typeof val === 'string' ? val.split('T')[0] : '';
  }
};

export default function WorkerDashboardPage() {
  const t = useTranslations('Dashboard');
  const tw = useTranslations('WorkerDashboard');
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  
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
      
      // Auto-Sync login streak in background using Bangladesh Time
      try {
        await syncDailyStreak(session.user.id);
      } catch (err) {
        console.warn('Auto-sync streak warning:', err);
      }

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
      // Ensure current_streak is dynamically bound and never stuck at 0
      const activeStreak = Math.max(1, Number(data.current_streak ?? data.check_in_streak ?? 1));
      data.current_streak = activeStreak;
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
      .limit(10);

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
          time: new Date(tx.created_at).toLocaleDateString('en-US')
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
      const res = await claimDailyBonusAction(userId);
      if (!res.success) {
        throw new Error(res.error || 'Error claiming bonus.');
      }
      
      toast.success('🎉 You successfully claimed your 1.00 ৳ daily bonus!');
      
      const todayDhaka = getDhakaTodayDateString();
      setUserProfile((prev: any) => ({
        ...prev,
        wallet_balance: res.balance ?? ((prev?.wallet_balance || 0) + 1.00),
        total_earned: (prev?.total_earned || 0) + 1.00,
        current_streak: res.currentStreak ?? ((prev?.current_streak || 0) + 1),
        check_in_streak: res.currentStreak ?? ((prev?.check_in_streak || 0) + 1),
        last_check_in_date: res.lastCheckInDate ?? todayDhaka,
        last_checkin_date: res.lastCheckInDate ?? todayDhaka,
      }));
    } catch (err: any) {
      toast.error(err.message || 'Error claiming bonus.');
    } finally {
      setClaiming(false);
    }
  };

  const todayDhaka = getDhakaTodayDateString();
  const rawLastCheckIn = userProfile?.last_checkin_date || userProfile?.last_check_in_date || userProfile?.last_check_in;
  const lastCheckInFormatted = formatToDhakaDate(rawLastCheckIn);
  const hasClaimedToday = Boolean(lastCheckInFormatted && lastCheckInFormatted === todayDhaka);
  const currentStreakCount = Math.max(1, Number(userProfile?.current_streak ?? userProfile?.check_in_streak ?? 1));

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up was blocked. Please allow pop-ups for this site.');
      return;
    }

    const reportDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'long',
      timeStyle: 'medium',
    }).format(new Date());

    const userName = userProfile?.full_name || 'Worker';
    const streakStr = `${currentStreakCount} Day${currentStreakCount !== 1 ? 's' : ''}`;
    const balanceNum = Number(userProfile?.wallet_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const earnedNum = Number(userProfile?.total_earned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const withdrawnNum = Number(totalWithdrawn || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const completedNum = Number(taskStats.approved || 0).toLocaleString('en-US');
    const startedNum = Number(taskStats.totalStarted || 0).toLocaleString('en-US');
    const pendingNum = Number(taskStats.pending || 0).toLocaleString('en-US');
    const rejectedNum = Number(taskStats.rejected || 0).toLocaleString('en-US');
    const approvedCount = Number(taskStats.approved || 0);
    const rejectedCount = Number(taskStats.rejected || 0);
    const totalRated = approvedCount + rejectedCount;
    const successRate = totalRated > 0 ? Math.round((approvedCount / totalRated) * 100) : 0;
    const successRateStr = `${successRate}%`;

    const txRows = activityFeed.length > 0 ? activityFeed.map((item: any) => `
      <tr>
        <td>${item.time || 'N/A'}</td>
        <td style="font-weight: 600;">${item.title || 'Transaction'}</td>
        <td>${item.reason ? `<span style="color: #64748b;">${item.reason}</span>` : '—'}</td>
        <td>
          <span class="badge badge-${item.type || 'pending'}">
            ${item.type ? (item.type.charAt(0).toUpperCase() + item.type.slice(1)) : 'Completed'}
          </span>
        </td>
        <td style="font-weight: 700; text-align: right; ${item.amount?.startsWith('-') ? 'color: #dc2626;' : 'color: #16a34a;'}">
          ${item.amount || '৳ 0.00'}
        </td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No recent transactions recorded.</td>
      </tr>
    `;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ctask Worker Statement - ${userName}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #5A189A;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #5A189A;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .report-meta {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .user-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .user-info h2 {
      margin: 0;
      font-size: 16px;
      color: #0f172a;
    }
    .user-info p {
      margin: 3px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .badge-pill {
      background: #ede9fe;
      color: #5b21b6;
      padding: 5px 14px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 12px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #fafafc;
    }
    .summary-box .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .summary-box .value {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .summary-box .value.highlight {
      color: #5A189A;
    }
    .summary-box .value.success {
      color: #16a34a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 9px 12px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
    }
    td {
      padding: 9px 12px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      font-size: 12px;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef3c7; color: #b45309; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">Ctask</h1>
      <p class="brand-sub">Microtask & Freelancing Platform</p>
    </div>
    <div class="report-meta">
      <div><strong>Document:</strong> Worker Account & Earnings Statement</div>
      <div><strong>Date:</strong> ${reportDate}</div>
      <div><strong>Timezone:</strong> Bangladesh Standard Time (BST)</div>
    </div>
  </div>

  <div class="user-card">
    <div class="user-info">
      <h2>${userName}</h2>
      <p>Account Status: Active Worker &bull; Active for ${getAccountAge(userProfile?.created_at)}</p>
    </div>
    <div>
      <span class="badge-pill">Daily Streak: ${streakStr} 🔥</span>
    </div>
  </div>

  <div class="section-title">Account Summary</div>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Available Balance</div>
      <div class="value highlight">৳ ${balanceNum}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Earned</div>
      <div class="value success">৳ ${earnedNum}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Withdrawn</div>
      <div class="value">৳ ${withdrawnNum}</div>
    </div>
    <div class="summary-box">
      <div class="label">Daily Login Streak</div>
      <div class="value highlight">${streakStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Tasks Completed</div>
      <div class="value">${completedNum}</div>
    </div>
    <div class="summary-box">
      <div class="label">Success Rate</div>
      <div class="value success">${successRateStr}</div>
    </div>
  </div>

  <div class="section-title">Task Performance Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Total Started</th>
        <th>Approved</th>
        <th>Pending Review</th>
        <th>Rejected</th>
        <th>Approval Rate</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: 700;">${startedNum}</td>
        <td style="color: #16a34a; font-weight: 700;">${completedNum}</td>
        <td style="color: #d97706; font-weight: 700;">${pendingNum}</td>
        <td style="color: #dc2626; font-weight: 700;">${rejectedNum}</td>
        <td style="font-weight: 700;">${successRateStr}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Recent Transactions & Activity</div>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Date</th>
        <th style="width: 25%;">Activity Type</th>
        <th style="width: 30%;">Details / Reason</th>
        <th style="width: 12%;">Status</th>
        <th style="width: 15%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${txRows}
    </tbody>
  </table>

  <div class="footer">
    This is an official computer-generated statement from Ctask. All currency amounts are in Bangladeshi Taka (BDT ৳).
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {}
    }, 500);
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

  const approvedCount = Number(taskStats.approved || 0);
  const rejectedCount = Number(taskStats.rejected || 0);
  const totalRated = approvedCount + rejectedCount;
  const successRate = totalRated > 0 ? Math.round((approvedCount / totalRated) * 100) : 0;
  const balance = userProfile?.wallet_balance || 0;
  const totalEarned = userProfile?.total_earned || 0;

  return (
    <>
      {/* Header and Download Button */}
      {/* Header and Download Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">{tw('welcomeBack', { name: userProfile?.full_name?.split(' ')[0] || tw('worker') })}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5A189A] dark:text-[#7B2CBF]" />
            {tw('activeFor', { time: getAccountAge(userProfile?.created_at) })}
          </p>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="print-hide w-full sm:w-auto justify-center flex items-center gap-2 bg-[#5A189A] hover:bg-[#5A189A]/90 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md active:scale-95"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" /> {tw('downloadReport')}
        </button>
      </div>

      {/* Daily Bonus Card (Hidden completely once claimed today) */}
      {!hasClaimedToday && (
        <div className="print-hide mb-6 sm:mb-8 bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xl relative overflow-hidden border border-purple-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -z-0 -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center gap-3.5 sm:gap-4 z-10 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <Gift className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white mb-0.5 sm:mb-1">{tw('dailyCheckInBonus')}</h2>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                {tw('currentStreak')} <span className="font-bold text-yellow-300">{currentStreakCount} 🔥</span>
              </p>
            </div>
          </div>

          <button 
            onClick={handleClaimBonus}
            disabled={claiming}
            className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg flex items-center gap-2 z-10 bg-white text-[#5A189A] hover:scale-105 hover:shadow-xl active:scale-95"
          >
            {claiming && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            {tw('claimBonus')}
          </button>
        </div>
      )}

      <div id="stats-container" className="mb-12">
        {/* 1. Top Summary Cards (2-column on mobile, 4-column on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-8">
          {/* Financial Card 1: Available Balance */}
          <div className="bg-gradient-to-br from-[#5A189A] to-[#7B2CBF] text-white shadow-md rounded-2xl p-4 sm:p-5 border-none h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <Link 
                href={`/${locale}/dashboard/wallet`}
                className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-[11px] sm:text-xs font-bold text-white transition-all active:scale-95 whitespace-nowrap"
              >
                {t('walletWithdraw') || 'Withdraw'} &rarr;
              </Link>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-1">{tw('availableBalance')}</p>
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
              <p className="text-xs sm:text-sm font-medium text-white/80 line-clamp-1">{t('totalEarned')}</p>
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
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{tw('tasksCompleted')}</p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{taskStats.approved}</h3>
            </div>
          </div>

          {/* Metric Card 2: Success Rate */}
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 h-full flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{tw('successRate')}</p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{successRate}%</h3>
            </div>
          </div>
        </div>

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Task Statistics Section (Compact 2x2 grid on mobile) */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{tw('taskStatistics')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{tw('totalStarted')}</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{taskStats.totalStarted}</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/30 text-center">
                  <p className="text-xs sm:text-sm font-medium text-amber-700/80 dark:text-amber-400/80 mb-1">{tw('pending')}</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{taskStats.pending}</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-100/80 dark:border-green-900/30 text-center">
                  <p className="text-xs sm:text-sm font-medium text-green-700/80 dark:text-green-400/80 mb-1">{tw('approved')}</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{taskStats.approved}</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-100/80 dark:border-red-900/30 text-center">
                  <p className="text-xs sm:text-sm font-medium text-red-700/80 dark:text-red-400/80 mb-1">{tw('rejected')}</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{taskStats.rejected}</p>
                </div>
              </div>
            </div>

            {/* Earnings Statistics Section */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{tw('earningsBreakdown')}</h3>
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
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{tw('performance')}</h3>
              
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="performancePurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#5A189A" />
                        <stop offset="100%" stopColor="#7B2CBF" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="url(#performancePurpleGradient)" 
                      strokeWidth="8" 
                      strokeDasharray={`${2 * Math.PI * 45}`} 
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - successRate / 100)}`} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{successRate}%</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{tw('approvalRate')}</span>
                  </div>
                </div>

                {/* Submissions Breakdown */}
                <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <span className="block text-lg font-bold text-green-600 dark:text-green-400">{approvedCount}</span>
                    <span className="text-[11px] font-medium text-green-700/80 dark:text-green-400/80">{tw('approved')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                    <span className="block text-lg font-bold text-red-600 dark:text-red-400">{rejectedCount}</span>
                    <span className="text-[11px] font-medium text-red-700/80 dark:text-red-400/80">{tw('rejected')}</span>
                  </div>
                </div>
                {totalRated === 0 && (
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    No reviewed submissions yet (pending tasks are excluded)
                  </p>
                )}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{tw('recentActivity')}</h3>
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

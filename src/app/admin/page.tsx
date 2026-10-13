'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Users, FileCheck, CircleDollarSign, Loader2, Download, Landmark, ListTodo, ShieldAlert, Ticket, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Link from 'next/link';

const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num || 0);

const GENDER_COLORS: Record<string, string> = {
  Male: '#3b82f6',
  Female: '#ec4899',
  Other: '#94a3b8',
};

const COUNTRY_COLORS = [
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#ec4899',
  '#64748b',
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
    activeTasks: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    pendingTickets: 0,
  });
  
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [chartView, setChartView] = useState<'gender' | 'country'>('gender');
  const [genderData, setGenderData] = useState<Array<{ name: string; value: number }>>([]);
  const [countryData, setCountryData] = useState<Array<{ name: string; value: number }>>([]);

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
      recentUsersRes,
      demographicsRes
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
      supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('gender, country')
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

    if (demographicsRes.data) {
      const gCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
      const cCounts: Record<string, number> = {};
      const countryMap: Record<string, string> = {
        bd: 'Bangladesh',
        bangladesh: 'Bangladesh',
        us: 'USA',
        usa: 'USA',
        'united states': 'USA',
        uk: 'United Kingdom',
        gb: 'United Kingdom',
        in: 'India',
        india: 'India',
        pk: 'Pakistan',
        pakistan: 'Pakistan',
        ae: 'UAE',
        uae: 'UAE',
        it: 'Italy',
        italy: 'Italy',
        au: 'Australia',
        australia: 'Australia',
        cn: 'China',
        china: 'China',
        ng: 'Nigeria',
        nigeria: 'Nigeria',
        es: 'Spain',
        spain: 'Spain',
        kr: 'South Korea'
      };

      demographicsRes.data.forEach((p: any) => {
        const rawG = (p.gender || '').trim().toLowerCase();
        if (rawG === 'male') gCounts.Male += 1;
        else if (rawG === 'female') gCounts.Female += 1;
        else if (rawG === 'other') gCounts.Other += 1;
        else gCounts.Other += 1;

        const rawC = (p.country || '').trim();
        const stdC = countryMap[rawC.toLowerCase()] || (rawC ? rawC.charAt(0).toUpperCase() + rawC.slice(1) : 'Others');
        cCounts[stdC] = (cCounts[stdC] || 0) + 1;
      });

      const formattedGender = Object.entries(gCounts)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({ name, value }));

      const sortedCountries = Object.entries(cCounts).sort((a, b) => b[1] - a[1]);
      const top4 = sortedCountries.slice(0, 4);
      const remaining = sortedCountries.slice(4).reduce((sum, [, c]) => sum + c, 0);
      const formattedCountry = top4.map(([name, value]) => ({ name, value }));
      if (remaining > 0) {
        formattedCountry.push({ name: 'Others', value: remaining });
      }

      setGenderData(formattedGender);
      setCountryData(formattedCountry);
    }
    
    setLoading(false);
  };

  const handleAdminReportDownload = () => {
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

    const totalUsersStr = formatNumber(stats.totalUsers);
    const workerEarningsStr = formatCurrency(stats.totalPaid);
    const totalDepositsStr = formatCurrency(stats.totalDeposits);
    const totalWithdrawalsStr = formatCurrency(stats.totalWithdrawals);
    const pendingWithdrawalsCount = formatNumber(stats.pendingWithdrawals);
    const pendingWithdrawalsAmt = formatCurrency(stats.pendingWithdrawalsAmount);

    const activeTasksStr = formatNumber(stats.activeTasks);
    const pendingTasksStr = formatNumber(stats.pendingTasks);
    const pendingProofsStr = formatNumber(stats.pendingProofs);
    const pendingKycStr = formatNumber(stats.pendingKyc);
    const pendingTicketsStr = formatNumber(stats.pendingTickets);

    const userRows = recentUsers.length > 0 ? recentUsers.map((u: any) => `
      <tr>
        <td style="font-family: monospace; font-size: 11px; color: #64748b;">${u.id?.slice(0, 8) || 'N/A'}...</td>
        <td style="font-weight: 600;">${u.full_name || 'Registered User'}</td>
        <td>${u.created_at ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(new Date(u.created_at)) : 'N/A'}</td>
        <td><span class="badge badge-active">Active</span></td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">No recent registrations found.</td>
      </tr>
    `;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ctask System Administration & Financial Report</title>
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
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 24px 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
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
    .summary-box .value.amber {
      color: #d97706;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
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
    .badge-active { background: #dcfce7; color: #15803d; }
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
      <p class="brand-sub">Platform Administration & System Intelligence</p>
    </div>
    <div class="report-meta">
      <div><strong>Document:</strong> Executive Financial & Activity Report</div>
      <div><strong>Generated:</strong> ${reportDate}</div>
      <div><strong>Timezone:</strong> Bangladesh Standard Time (BST)</div>
    </div>
  </div>

  <div class="section-title">Financial Summary</div>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Total Registered Users</div>
      <div class="value highlight">${totalUsersStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Worker Total Earnings</div>
      <div class="value success">৳ ${workerEarningsStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Deposits Approved</div>
      <div class="value highlight">৳ ${totalDepositsStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Paid Withdrawals</div>
      <div class="value">৳ ${totalWithdrawalsStr}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Financial Metric</th>
        <th>Volume / Count</th>
        <th>Total Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: 600;">Total User Deposits</td>
        <td>Completed Records</td>
        <td style="font-weight: 700; color: #5A189A;">৳ ${totalDepositsStr}</td>
        <td><span class="badge badge-active">Settled</span></td>
      </tr>
      <tr>
        <td style="font-weight: 600;">Disbursed Worker Payouts</td>
        <td>Paid Withdrawals</td>
        <td style="font-weight: 700; color: #16a34a;">৳ ${totalWithdrawalsStr}</td>
        <td><span class="badge badge-active">Paid</span></td>
      </tr>
      <tr>
        <td style="font-weight: 600;">Pending Withdrawal Requests</td>
        <td>${pendingWithdrawalsCount} Requests</td>
        <td style="font-weight: 700; color: #d97706;">৳ ${pendingWithdrawalsAmt}</td>
        <td><span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px;">Pending Approval</span></td>
      </tr>
      <tr>
        <td style="font-weight: 600;">Worker Accumulated Earnings</td>
        <td>Across All Accounts</td>
        <td style="font-weight: 700;">৳ ${workerEarningsStr}</td>
        <td><span class="badge badge-active">Accounted</span></td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Platform Activity & Moderation Pipeline</div>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Active Tasks</div>
      <div class="value success">${activeTasksStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Pending Tasks Review</div>
      <div class="value amber">${pendingTasksStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Pending Task Proofs</div>
      <div class="value amber">${pendingProofsStr}</div>
    </div>
    <div class="summary-box">
      <div class="label">Pending KYC Verifications</div>
      <div class="value amber">${pendingKycStr}</div>
    </div>
  </div>

  <div class="section-title">Recent User Registrations</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">User Reference ID</th>
        <th style="width: 35%;">Full Name</th>
        <th style="width: 25%;">Registered On</th>
        <th style="width: 15%;">Account State</th>
      </tr>
    </thead>
    <tbody>
      ${userRows}
    </tbody>
  </table>

  <div class="footer">
    Confidential &bull; Ctask Administration System Report &bull; All monetary figures are standardized in BDT (৳)
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

  const activeDemographicsData = chartView === 'gender' ? genderData : countryData;

  const DemographicsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = activeDemographicsData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-xl shadow-2xl text-white">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="w-3 h-3 rounded-full inline-block" 
              style={{ backgroundColor: data.payload.fill || data.color }} 
            />
            <span className="font-semibold text-sm text-slate-200">{data.name}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-white">{data.value} users</span>
            <span className="text-xs text-slate-400 font-medium">({percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print-hide">
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

      <div id="admin-stats-container" className="print:bg-white print:p-8">
        {/* Print-Specific Header */}
        <div className="hidden print:flex print-show flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-brand-accent tracking-tighter">Ctask</h1>
            <p className="text-lg font-semibold text-slate-800 mt-1">Global System Report</p>
          </div>
          <div className="text-right mt-4 sm:mt-0">
            <p className="text-sm font-medium text-slate-500">Generated Date & Time</p>
            <p className="text-base font-bold text-slate-800">{new Date().toLocaleString('en-US')}</p>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-accent/30 transition-colors break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Users className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Users</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{formatNumber(stats.totalUsers)}</p>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-primary/30 transition-colors break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                <CircleDollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Worker Earnings</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalPaid)} ৳</p>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Landmark className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Deposits</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalDeposits)} ৳</p>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-rose-500/30 transition-colors break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Landmark className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Withdrawals</h3>
            </div>
            <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalWithdrawals)} ৳</p>
          </div>
        </div>

        {/* Pending Action Counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 print:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ListTodo className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300">Active Tasks</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{formatNumber(stats.activeTasks)}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><FileCheck className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300">Pending Proofs</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{formatNumber(stats.pendingProofs)}</span>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><ShieldAlert className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300">Pending KYC</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{formatNumber(stats.pendingKyc)}</span>
          </div>

          <Link href="/admin/withdrawals" className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer block break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><CircleDollarSign className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-brand-accent transition-colors">Pending W/D</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{formatNumber(stats.pendingWithdrawals)}</span>
          </Link>

          <Link href="/admin/tickets" className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer block break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><Ticket className="w-5 h-5"/></div>
                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-brand-accent transition-colors">Open Tickets</span>
              </div>
            </div>
            <span className="font-bold text-2xl text-slate-900 dark:text-white">{formatNumber(stats.pendingTickets)}</span>
          </Link>
        </div>

        {/* Charts and Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart: Financials */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm break-inside-avoid print:hidden print-hide flex flex-col justify-between">
            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Financial Overview</h3>
            <div className="w-full flex justify-center" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Payouts vs Pending', payouts: stats.totalWithdrawals, pending: stats.pendingWithdrawalsAmount }]} barSize={80}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="payouts" name="Total Payouts (৳)" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" name="Pending Withdrawals (৳)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Demographics Pie Chart */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm break-inside-avoid print:shadow-none print:border-slate-300 print:bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent">
                  <PieIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">User Demographics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Distribution by {chartView === 'gender' ? 'gender identity' : 'country of residence'}
                  </p>
                </div>
              </div>
              <div className="print-hide">
                <select
                  value={chartView}
                  onChange={(e) => setChartView(e.target.value as 'gender' | 'country')}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-accent/30 cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <option value="gender">View by Gender</option>
                  <option value="country">View by Country</option>
                </select>
              </div>
            </div>

            <div className="w-full flex justify-center items-center" style={{ height: '300px' }}>
              {activeDemographicsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<DemographicsTooltip />} />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} 
                    />
                    <Pie
                      data={activeDemographicsData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={700}
                    >
                      {activeDemographicsData.map((entry, index) => {
                        const fill = chartView === 'gender'
                          ? (GENDER_COLORS[entry.name] || '#94a3b8')
                          : COUNTRY_COLORS[index % COUNTRY_COLORS.length];
                        return <Cell key={`cell-${index}`} fill={fill} stroke="transparent" />;
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">
                  No demographic data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Registrations Table */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden break-inside-avoid print:w-full print:shadow-none print:border-slate-300 print:bg-white mb-6">
          <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200 flex items-center justify-between">
            Recent Registrations
            <Link href="/admin/users" className="text-sm font-medium text-brand-accent hover:underline print-hide">View All</Link>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 print:divide-slate-200">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {user.full_name || 'Unknown User'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('en-US')}
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
      </div>

      <style jsx global>{`
        @media print {
          .print-hide { display: none !important; }
          .print-show { display: flex !important; }
        }
        .printing .print-hide { display: none !important; }
        .printing .print-show { display: flex !important; }
        .print-show { display: none; }
      `}</style>
    </>
  );
}

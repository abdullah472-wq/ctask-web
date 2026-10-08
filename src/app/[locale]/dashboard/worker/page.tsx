'use client';

import React from 'react';
import { 
  Wallet, 
  Banknote, 
  CheckSquare, 
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Clock,
  Award
} from 'lucide-react';

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
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Worker Statistics</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your performance and earnings.</p>
      </div>

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
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending Review</p>
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
                {/* SVG Circular Progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                    stroke="#5A189A" 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - MOCK_DATA.performance.approvalRate / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
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
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Avg. Completion Time</span>
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
                  {/* Timeline connector */}
                  {index !== MOCK_DATA.activityFeed.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-[-1.5rem] w-px bg-slate-200 dark:bg-slate-800"></div>
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10 w-8 h-8 rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center shrink-0">
                    {activity.type === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {activity.type === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                    {activity.type === 'withdrawal' && <ArrowUpRight className="w-5 h-5 text-[#5A189A]" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{activity.title}</p>
                      {activity.amount && (
                        <span className={`font-bold text-sm ${
                          activity.type === 'approved' ? 'text-green-600 dark:text-green-500' : 'text-slate-900 dark:text-white'
                        }`}>
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
  );
}

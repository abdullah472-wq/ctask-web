'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function Home() {
  const [userRoleTab, setUserRoleTab] = useState<'earners' | 'creators'>('earners');
  const [leaders, setLeaders] = useState<any[]>([
    { rank: 1, name: 'Arshad I***', amount: 24524 },
    { rank: 2, name: 'Sadia S***', amount: 18658 },
    { rank: 3, name: 'Farhana M***', amount: 15354 },
    { rank: 4, name: 'Nusrat J***', amount: 11192 },
    { rank: 5, name: 'Isabella R***', amount: 9458 },
  ]);

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, []);

  const fetchGlobalLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_global_leaderboard');
      if (!error && data && data.length >= 3) {
        const masked = data.slice(0, 5).map((l: any, idx: number) => {
          const parts = (l.name || l.full_name || 'User').trim().split(' ');
          const first = parts[0] || 'User';
          const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
          const maskedName = lastInitial ? `${first} ${lastInitial}***` : `${first}***`;
          return {
            rank: idx + 1,
            name: maskedName,
            amount: l.total_earned || l.earnings || l.amount || 0,
          };
        });
        setLeaders(masked);
      }
    } catch {
      // Fallback data retained
    }
  };

  const rank1 = leaders.find((l) => l.rank === 1) || leaders[0];
  const rank2 = leaders.find((l) => l.rank === 2) || leaders[1];
  const rank3 = leaders.find((l) => l.rank === 3) || leaders[2];
  const rank4 = leaders.find((l) => l.rank === 4) || leaders[3];
  const rank5 = leaders.find((l) => l.rank === 5) || leaders[4];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-[#7B2CBF] selection:text-white relative overflow-hidden">
      
      {/* 1. HERO SECTION WITH AMBIENT GLOW */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Ambient Gradient Mesh Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] h-[350px] sm:h-[450px] bg-gradient-to-tr from-[#7B2CBF]/30 via-indigo-600/20 to-pink-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 backdrop-blur-md text-xs sm:text-sm font-medium text-purple-300 mb-6 shadow-[0_0_20px_rgba(123,44,191,0.25)] animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          The #1 Micro-Tasking Platform in Bangladesh
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] max-w-4xl">
          Turn Your Spare Time Into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-purple-400 via-[#9D4EDD] to-indigo-400 bg-clip-text text-transparent">
            Instant Daily Income
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Complete simple online tasks, review apps, and watch short videos. Receive guaranteed payments directly to your mobile wallet within minutes.
        </p>

        {/* Dual Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Primary: Workers */}
          <Link
            href="/auth"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] hover:shadow-[0_0_35px_rgba(157,78,221,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg"
          >
            <span>Start Earning Now</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          {/* Secondary: Creators */}
          <Link
            href="/dashboard/manage-tasks"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-slate-200 border border-slate-700/80 bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 hover:border-purple-500/50 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
          >
            Create a Task
          </Link>
        </div>

        {/* Trust & Performance Counter Bar */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">৳ 2,50,000+</span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Total Paid Out</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">50,000+</span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Tasks Completed</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">15,000+</span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Active Workers</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 flex items-center gap-1">
                ⚡ Instant
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">bKash / Nagad Payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "HOW IT WORKS" 3-STEP WALKTHROUGH */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">How Platform Works</h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Simple, streamlined, and transparent for both micro-workers and campaign creators.
          </p>

          {/* Toggle Tab */}
          <div className="inline-flex mt-8 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setUserRoleTab('earners')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                userRoleTab === 'earners'
                  ? 'bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              For Earners
            </button>
            <button
              type="button"
              onClick={() => setUserRoleTab('creators')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                userRoleTab === 'creators'
                  ? 'bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              For Advertisers / Creators
            </button>
          </div>
        </div>

        {/* Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userRoleTab === 'earners' ? (
            <>
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 relative group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-lg text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Choose a Task</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Browse hundreds of daily tasks including social media engagements, surveys, website signups, or app reviews.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 relative group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-lg text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Submit Proof</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Follow simple instructions, complete the action, and upload a quick screenshot or required text verification.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 relative group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-lg text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Get Paid Instantly</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Once verified, balance is credited instantly. Request withdrawal directly to your personal bKash, Nagad, or Rocket account.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 relative group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Post Your Campaign</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Define your exact target: YouTube subscribers, Facebook comments, Play Store reviews, or app testing feedback.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 relative group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Receive Real Traffic</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Thousands of verified organic Bangladeshi users execute your requirements within minutes of launch.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 relative group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-lg text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Review & Approve</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Inspect submitted proofs through your intuitive dashboard. Pay only for authentic and valid submissions.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. LIVE TASKS SHOWCASE (INTERACTIVE PREVIEW) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Marketplace
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Featured Earning Opportunities</h2>
          </div>
          <Link
            href="/dashboard/tasks"
            className="mt-4 md:mt-0 text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 group"
          >
            Explore all 120+ active tasks
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Watch & Subscribe YouTube Video',
              category: 'Video Streaming',
              reward: '৳ 5.00',
              time: '2 mins',
              badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
            },
            {
              title: 'Android App Install & Review',
              category: 'App Promotion',
              reward: '৳ 15.00',
              time: '5 mins',
              badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            },
            {
              title: 'Facebook Page Follow & Share',
              category: 'Social Media',
              reward: '৳ 3.50',
              time: '1 min',
              badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            },
            {
              title: 'Complete 3-Minute Opinion Survey',
              category: 'Research & Survey',
              reward: '৳ 12.00',
              time: '3 mins',
              badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            },
          ].map((task, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${task.badgeColor}`}>
                    {task.category}
                  </span>
                  <span className="text-xs text-slate-500">{task.time}</span>
                </div>
                <h4 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-purple-300 transition-colors">
                  {task.title}
                </h4>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Reward</span>
                  <span className="text-lg font-bold text-emerald-400">{task.reward}</span>
                </div>
                <Link
                  href="/auth"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 border border-purple-500/40 text-purple-300 group-hover:bg-[#7B2CBF] group-hover:text-white transition-all duration-200"
                >
                  Earn Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SUPPORTED PAYMENT METHODS (TRUST BADGES) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Safe, Instant & Guaranteed Withdrawals Across Bangladesh
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {[
            { name: 'bKash', color: 'hover:border-pink-500 hover:text-pink-400' },
            { name: 'Nagad', color: 'hover:border-orange-500 hover:text-orange-400' },
            { name: 'Rocket', color: 'hover:border-purple-500 hover:text-purple-400' },
            { name: 'Upay', color: 'hover:border-blue-500 hover:text-blue-400' },
            { name: 'Bank Transfer', color: 'hover:border-emerald-500 hover:text-emerald-400' },
          ].map((gateway, i) => (
            <div
              key={i}
              className={`px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 font-bold text-sm tracking-wide transition-all duration-300 cursor-default select-none shadow-sm ${gateway.color}`}
            >
              {gateway.name}
            </div>
          ))}
        </div>
      </section>

      {/* 5. DAILY STREAK & BONUS FEATURE SPOTLIGHT */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Gamified Rewards</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-white">Earn Extra With Platform Perks</h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Consistency pays off. Complete daily milestones and unlock special tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Daily Streak */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-md">
            <div className="text-3xl mb-4">🔥</div>
            <h3 className="text-xl font-bold text-white mb-2">Daily Check-in Streak</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Log in and complete at least one task every day to double your streak bonus and claim weekly prize chests.
            </p>
            <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
              Up to +20% Bonus Pay
            </div>
          </div>

          {/* Lucky Spin Wheel */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 shadow-md">
            <div className="text-3xl mb-4">🎡</div>
            <h3 className="text-xl font-bold text-white mb-2">Lucky Spin Wheel</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Get free spin tokens with every 5 completed tasks. Win cash prizes, platform balance, and withdrawal multipliers.
            </p>
            <div className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg inline-block">
              Daily Guaranteed Gifts
            </div>
          </div>

          {/* VIP Privileges */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 shadow-md">
            <div className="text-3xl mb-4">👑</div>
            <h3 className="text-xl font-bold text-white mb-2">VIP Task Privileges</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Maintain a high quality approval rating to get priority access to premium high-paying campaigns (৳ 50 – ৳ 200+).
            </p>
            <div className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg inline-block">
              Exclusive High-Value Pools
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. LEADERBOARD SECTION (FIXED: Dark Glassmorphism)
      ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

          {/* Top Badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs sm:text-sm font-semibold shadow-sm">
              🏆 Top Earners This Month
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-center text-white mb-10">
            Our Global Leaderboard
          </h2>

          {/* Podium Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
            
            {/* Rank 2 (Silver) */}
            <div className="order-2 md:order-1 rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-md p-6 text-center hover:border-slate-500 transition-all">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/40 flex items-center justify-center text-2xl">
                🥈
              </div>
              <h3 className="font-bold text-slate-200 text-lg">{rank2?.name || 'Sadia S***'}</h3>
              <p className="text-xl font-extrabold text-slate-300 mt-2">{Number(rank2?.amount || 18658).toLocaleString()} ৳</p>
              <span className="text-xs text-slate-400 font-medium">Rank #2</span>
            </div>

            {/* Rank 1 (Gold - Center & Elevated) */}
            <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-500/15 via-slate-900/70 to-slate-900 p-8 text-center shadow-[0_0_35px_rgba(245,158,11,0.2)] hover:border-amber-400 transition-all transform md:-translate-y-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
                👑
              </div>
              <h3 className="font-extrabold text-white text-xl">{rank1?.name || 'Arshad I***'}</h3>
              <p className="text-3xl font-black text-amber-400 mt-2">{Number(rank1?.amount || 24524).toLocaleString()} ৳</p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                1st Champion
              </span>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="order-3 rounded-2xl border border-amber-900/50 bg-slate-800/40 backdrop-blur-md p-6 text-center hover:border-amber-700/60 transition-all">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-900/30 flex items-center justify-center text-2xl">
                🥉
              </div>
              <h3 className="font-bold text-slate-200 text-lg">{rank3?.name || 'Farhana M***'}</h3>
              <p className="text-xl font-extrabold text-amber-300 mt-2">{Number(rank3?.amount || 15354).toLocaleString()} ৳</p>
              <span className="text-xs text-slate-400 font-medium">Rank #3</span>
            </div>
          </div>

          {/* Runners Up (4th & 5th) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-purple-400">#4</span>
                <span className="font-medium text-slate-200">{rank4?.name || 'Nusrat J***'}</span>
              </div>
              <span className="font-bold text-purple-300">{Number(rank4?.amount || 11192).toLocaleString()} ৳</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-purple-400">#5</span>
                <span className="font-medium text-slate-200">{rank5?.name || 'Isabella R***'}</span>
              </div>
              <span className="font-bold text-purple-300">{Number(rank5?.amount || 9458).toLocaleString()} ৳</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. TESTIMONIALS SECTION (FIXED: Dark & Seamless)
      ======================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Loved by Thousands of Users
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            See what our workers and advertisers have to say about their experience on the Ctask platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Review 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col justify-between hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 shadow-md">
            <div>
              <div className="flex text-amber-400 text-sm gap-1 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;I have been using Ctask for 2 months now. Earning money is super easy and the withdrawal system is very fast!&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold flex items-center justify-center">
                A
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-white">Ahmed Hasan</h4>
                <p className="text-xs text-slate-400">Regular Worker</p>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col justify-between hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 shadow-md">
            <div>
              <div className="flex text-amber-400 text-sm gap-1 mb-4">
                {'★'.repeat(4)}
                <span className="text-slate-600">★</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;Great platform for freelancers. The premium tasks pay really well compared to other micro-job sites.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center">
                S
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-white">Sarah Rahman</h4>
                <p className="text-xs text-slate-400">Advertiser / Creator</p>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col justify-between hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 shadow-md">
            <div>
              <div className="flex text-amber-400 text-sm gap-1 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;The best micro-tasking site in Bangladesh! Highly recommended for students wanting to earn pocket money.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center">
                K
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-white">Kazi Tanvir</h4>
                <p className="text-xs text-slate-400">Student Earner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. HIGH-CONVERSION CTA BANNER
      ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 to-slate-900/80 backdrop-blur-2xl p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B2CBF]/20 blur-[130px] rounded-full pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Turn Your Free Time into Income?
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of active earners across Bangladesh today. Zero registration fees, instant activation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-white bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] hover:shadow-[0_0_30px_rgba(157,78,221,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Create Free Account
            </Link>
            <Link
              href="/faq"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-slate-300 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:text-white transition-all duration-300"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

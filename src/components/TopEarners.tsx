'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';

export function TopEarners() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, total_earned')
      .order('total_earned', { ascending: false })
      .limit(5);

    if (data) {
      setLeaders(data);
    }
    setLoading(false);
  };

  const maskName = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return name; 
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName} ${lastName.charAt(0)}***`;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (leaders.length === 0) return null;

  return (
    <div className="mt-20 max-w-4xl mx-auto bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold mb-4">
          <Trophy className="w-4 h-4" /> Top Earners This Month
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Global Leaderboard</h2>
      </div>

      <div className="flex flex-row gap-2 md:gap-4 justify-center items-end">
        {/* Top 3 Podium */}
        {leaders.slice(0, 3).map((leader, i) => {
          // Re-order for visual podium: 2nd, 1st, 3rd
          const visualOrder = [1, 0, 2];
          const rank = visualOrder.indexOf(i) !== -1 ? visualOrder[i] : i;
          const actualLeader = leaders[rank];
          if (!actualLeader) return null;

          const isFirst = rank === 0;
          const isSecond = rank === 1;
          const isThird = rank === 2;

          return (
            <div key={actualLeader.id} className={`flex flex-col items-center p-2 md:p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border ${isFirst ? 'border-yellow-500/30 h-48 md:h-64' : isSecond ? 'border-slate-300/30 h-40 md:h-56' : 'border-amber-700/30 h-36 md:h-48'} w-1/3 transition-transform hover:-translate-y-1 md:hover:-translate-y-2`}>
              <div className="mb-2 md:mb-4">
                {isFirst && <Trophy className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />}
                {isSecond && <Medal className="w-6 h-6 md:w-10 md:h-10 text-slate-300" />}
                {isThird && <Award className="w-6 h-6 md:w-10 md:h-10 text-amber-600" />}
              </div>
              <div className="text-xs md:text-lg font-bold text-slate-900 dark:text-white text-center line-clamp-1 w-full px-1 mb-1">{maskName(actualLeader.full_name)}</div>
              <div className={`font-mono font-black ${isFirst ? 'text-sm md:text-2xl text-yellow-500' : isSecond ? 'text-xs md:text-xl text-slate-300' : 'text-xs md:text-xl text-amber-600'} mt-auto`}>
                {Number(actualLeader.total_earned).toLocaleString()} ৳
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 4th and 5th */}
      {leaders.length > 3 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leaders.slice(3, 5).map((leader, i) => (
            <div key={leader.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-500 dark:text-slate-400">#{i + 4}</span>
                <span className="font-bold text-slate-900 dark:text-white">{maskName(leader.full_name)}</span>
              </div>
              <div className="font-mono font-bold text-brand-primary">
                {Number(leader.total_earned).toLocaleString()} ৳
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

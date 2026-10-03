'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Trophy, Medal, Award, Star } from 'lucide-react';

interface Leader {
  id: string;
  full_name: string;
  total_earned: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, total_earned')
      .order('total_earned', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLeaders(data);
    }
    setLoading(false);
  };

  const maskName = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return name; // If only one name, don't mask
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName} ${lastName.charAt(0)}***`;
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] text-yellow-500'; // Gold
      case 1:
        return 'bg-gradient-to-r from-slate-300/20 to-slate-400/20 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.1)] text-slate-300'; // Silver
      case 2:
        return 'bg-gradient-to-r from-amber-700/20 to-amber-800/20 border-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.1)] text-amber-600 dark:text-amber-500'; // Bronze
      default:
        return 'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-7 h-7 text-slate-300" />;
      case 2:
        return <Award className="w-7 h-7 text-amber-600 dark:text-amber-500" />;
      default:
        return <div className="w-7 h-7 flex items-center justify-center font-bold">{index + 1}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-brand-cyan/10 text-brand-cyan rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Top Earners Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          The top 50 workers on Ctask based on all-time earnings. Complete more tasks to climb the ranks!
        </p>
      </div>

      <div className="space-y-4">
        {leaders.map((leader, index) => {
          const isMe = leader.id === currentUserId;
          const rankStyle = getRankStyle(index);

          return (
            <div 
              key={leader.id} 
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-transform hover:-translate-y-1 ${rankStyle} ${isMe ? 'ring-2 ring-brand-cyan ring-offset-2 ring-offset-slate-50 dark:ring-offset-dark-bg' : ''}`}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 flex justify-center items-center">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${index < 3 ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
                    {leader.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${index < 3 ? '' : 'text-slate-900 dark:text-white'} flex items-center gap-2`}>
                      {maskName(leader.full_name)}
                      {isMe && <span className="text-xs bg-brand-cyan text-dark-bg px-2 py-0.5 rounded-full uppercase tracking-wider font-black">You</span>}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Total Earned</p>
                <div className={`text-2xl font-black font-mono ${index < 3 ? '' : 'text-brand-emerald'}`}>
                  {Number(leader.total_earned).toLocaleString()} ৳
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

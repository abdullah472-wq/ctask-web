'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Trophy, Medal, Award, Filter } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';

interface Leader {
  id: string;
  full_name: string;
  avatar_id?: string;
  gender?: string;
  country?: string;
  total_earned: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [countries, setCountries] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [timeframeFilter, setTimeframeFilter] = useState('All Time');

  useEffect(() => {
    fetchLeaderboard();
  }, [genderFilter, countryFilter, timeframeFilter]);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data } = await supabase.from('profiles').select('country').not('country', 'is', null);
    if (data) {
      const uniqueCountries = Array.from(new Set(data.map(d => d.country)));
      setCountries(uniqueCountries.filter(Boolean));
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }

    try {
      if (timeframeFilter === 'This Month') {
        // Use RPC function
        const { data, error } = await supabase.rpc('get_monthly_leaderboard', {
          p_gender: genderFilter,
          p_country: countryFilter
        });
        if (!error && data) {
          setLeaders(data);
        }
      } else {
        // All Time
        let query = supabase
          .from('profiles')
          .select('id, full_name, avatar_id, gender, country, total_earned')
          .order('total_earned', { ascending: false })
          .limit(50);
          
        if (genderFilter !== 'All') query = query.eq('gender', genderFilter);
        if (countryFilter !== 'All') query = query.eq('country', countryFilter);
        
        const { data, error } = await query;
        if (!error && data) {
          setLeaders(data);
        }
      }
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const maskName = (name: string) => {
    if (!name) return 'Anonymous';
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
        return 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm';
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
        return <div className="w-7 h-7 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">{index + 1}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Top Earners Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          The top 50 workers on Ctask based on earnings. Complete more tasks to climb the ranks!
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 font-bold mr-2">
          <Filter className="w-5 h-5" /> Filters:
        </div>
        
        <select 
          value={timeframeFilter} 
          onChange={(e) => setTimeframeFilter(e.target.value)}
          className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
        >
          <option value="All Time">All Time</option>
          <option value="This Month">This Month</option>
        </select>
        
        <select 
          value={genderFilter} 
          onChange={(e) => setGenderFilter(e.target.value)}
          className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
        >
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        
        <select 
          value={countryFilter} 
          onChange={(e) => setCountryFilter(e.target.value)}
          className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
        >
          <option value="All">All Countries</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {leaders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No workers found for the selected filters.
            </div>
          ) : (
            leaders.map((leader, index) => {
              const isMe = leader.id === currentUserId;
              const rankStyle = getRankStyle(index);

              return (
                <div 
                  key={leader.id} 
                  className={`w-full box-border flex items-center justify-between gap-2 p-4 rounded-2xl border-2 transition-transform hover:-translate-y-1 ${rankStyle} ${isMe ? 'ring-2 ring-brand-accent ring-offset-2 ring-offset-slate-50 dark:ring-offset-dark-bg' : ''}`}
                >
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <div className="w-8 sm:w-12 flex-shrink-0 flex justify-center items-center">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg shadow-inner overflow-hidden ${index < 3 ? 'bg-white/20 dark:bg-black/20' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
                        {leader.avatar_id ? (
                          <UserAvatar avatarId={leader.avatar_id} className="w-full h-full" />
                        ) : (
                          leader.full_name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-bold text-base sm:text-lg ${index < 3 ? '' : 'text-slate-800 dark:text-slate-100'} flex flex-wrap items-center gap-2 min-w-0`}>
                          <span className="truncate">{maskName(leader.full_name)}</span>
                          {isMe && <span className="flex-shrink-0 text-xs bg-brand-accent text-dark-bg px-2 py-0.5 rounded-full uppercase tracking-wider font-black">You</span>}
                        </h3>
                        <div className={`text-xs flex items-center gap-2 mt-0.5 ${index < 3 ? 'opacity-80' : 'text-slate-500'}`}>
                          {leader.country && <span>📍 {leader.country}</span>}
                          {leader.gender && <span>• {leader.gender}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className={`text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 ${index < 3 ? 'opacity-80' : 'text-slate-500 dark:text-slate-400'}`}>
                      {timeframeFilter === 'This Month' ? 'Earned this Month' : 'Total Earned'}
                    </p>
                    <div className={`text-base sm:text-2xl font-black font-mono ${index < 3 ? '' : 'text-slate-800 dark:text-slate-100'}`}>
                      {Number(leader.total_earned).toLocaleString()} ৳
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

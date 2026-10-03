'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, CheckCircle, Gift, Filter, ArrowDownUp, Crown } from 'lucide-react';
import { TaskCard } from '@/components/TaskCard';
import { SubmitProofModal } from '@/components/SubmitProofModal';

interface Task {
  id: string;
  title: string;
  description: string;
  task_url: string;
  reward_amount: number;
  total_slots: number;
  completed_slots: number;
  proof_instruction: string;
  category: string;
  is_premium?: boolean;
  created_at?: string;
}

const CATEGORIES = ['All', 'YouTube', 'Facebook', 'TikTok', 'Sign Up', 'App Download', 'Others'];

export default function DashboardTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [claiming, setClaiming] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'reward_desc', 'reward_asc'
  const [premiumOnly, setPremiumOnly] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      await fetchProfile(session.user.id);
      await fetchTasks();
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

  const fetchTasks = async () => {
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true);
      
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      const availableTasks = tasksData.filter(t => t.completed_slots < t.total_slots);
      setTasks(availableTasks);
    }
  };

  const handleClaimBonus = async () => {
    if (!userId) return;
    setClaiming(true);
    try {
      const { error } = await supabase.rpc('claim_daily_bonus', { user_uuid: userId });
      if (error) throw error;
      
      alert('🎉 You successfully claimed your 1.00 ৳ daily bonus!');
      await fetchProfile(userId); // Refresh profile state to disable button
    } catch (err: any) {
      alert(err.message || 'Error claiming bonus.');
    } finally {
      setClaiming(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasClaimedToday = userProfile?.last_check_in_date === todayStr;

  // Filter & Sort Logic
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Filter by Category
    if (categoryFilter !== 'All') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // 2. Filter Premium Only
    if (premiumOnly) {
      result = result.filter(t => t.is_premium === true);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'reward_desc') {
        return b.reward_amount - a.reward_amount;
      } else if (sortBy === 'reward_asc') {
        return a.reward_amount - b.reward_amount;
      } else {
        // newest (default)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
    });

    return result;
  }, [tasks, categoryFilter, sortBy, premiumOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Daily Bonus Card */}
      <div className="mb-10 bg-gradient-to-r from-brand-cyan/20 to-brand-emerald/20 border border-brand-cyan/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-emerald flex items-center justify-center text-dark-bg shadow-md">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Check-in Bonus</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Current Streak: <span className="font-bold text-brand-emerald">{userProfile?.check_in_streak || 0} 🔥</span>
            </p>
          </div>
        </div>

        <button 
          onClick={handleClaimBonus}
          disabled={hasClaimedToday || claiming}
          className={`px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 z-10 ${hasClaimedToday ? 'bg-slate-300 dark:bg-white/10 text-slate-500 cursor-not-allowed border border-transparent' : 'bg-white dark:bg-dark-card text-brand-cyan hover:scale-105 border border-brand-cyan/30 hover:border-brand-cyan'}`}
        >
          {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : hasClaimedToday ? <CheckCircle className="w-5 h-5" /> : null}
          {hasClaimedToday ? 'Already Claimed' : 'Claim 1.00 ৳'}
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Available Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">Complete tasks below to earn money to your wallet.</p>
        </div>

        {/* Filter Controls (Right Side) */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-800">
            <ArrowDownUp className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="reward_desc">Reward: High to Low</option>
              <option value="reward_asc">Reward: Low to High</option>
            </select>
          </div>

          {/* Premium Toggle */}
          <label className="flex items-center gap-2 px-3 cursor-pointer group">
            <div className={`w-8 h-4 rounded-full transition-colors relative ${premiumOnly ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${premiumOnly ? 'translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              <Crown className={`w-3.5 h-3.5 ${premiumOnly ? 'text-yellow-500' : 'text-slate-400'}`} /> Premium Only
            </span>
          </label>
        </div>
      </div>

      {/* Categories Scrollable Pills */}
      <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex items-center justify-center p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan shrink-0">
          <Filter className="w-5 h-5" />
        </div>
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-5 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors shrink-0 ${
              categoryFilter === category 
                ? 'bg-slate-900 text-white dark:bg-brand-cyan dark:text-dark-bg' 
                : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-cyan/50 hover:text-brand-cyan'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 bg-white dark:bg-dark-card/50 rounded-3xl border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-emerald" />
            <p>No tasks found matching your filters.</p>
          </div>
        ) : (
          filteredAndSortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onSelect={setSelectedTask} 
              userPlan={userProfile?.plan_type || 'basic'}
            />
          ))
        )}
      </div>

      {selectedTask && userId && (
        <SubmitProofModal
          task={selectedTask}
          userId={userId}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            setSelectedTask(null);
            fetchTasks(); // refresh data
          }}
        />
      )}
    </>
  );
}

'use client';

import { Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  userPlan?: string;
}

export function TaskCard({ task, onSelect, userPlan = 'basic' }: TaskCardProps) {
  const router = useRouter();

  const handleSelect = () => {
    if (task.is_premium && userPlan !== 'premium') {
      alert("👑 Upgrade to Premium to view and complete this high-paid task!");
      router.push('/dashboard/upgrade');
      return;
    }
    onSelect(task);
  };

  return (
    <div className={`relative bg-white dark:bg-dark-card rounded-2xl p-6 border transition-all flex flex-col group ${task.is_premium ? 'border-yellow-500/50 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-brand-cyan/30 hover:-translate-y-1'}`}>
      
      {task.is_premium && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 border border-yellow-300/30">
          <Crown className="w-3 h-3" /> Premium
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="px-3 py-1 rounded-full bg-brand-emerald/10 text-brand-emerald text-sm font-bold border border-brand-emerald/20">
          {Number(task.reward_amount).toFixed(2)} ৳
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
          {task.completed_slots} / {task.total_slots} Slots
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-2 line-clamp-1 text-slate-900 dark:text-white">{task.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 flex-grow">{task.description}</p>
      
      <button
        onClick={handleSelect}
        className={`w-full py-2.5 rounded-xl border font-medium transition-all ${task.is_premium && userPlan !== 'premium' ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-600 dark:text-yellow-500' : 'bg-slate-100 dark:bg-white/5 hover:bg-brand-cyan/10 dark:hover:bg-brand-cyan/20 border-transparent dark:border-white/10 hover:border-brand-cyan/50 text-slate-700 dark:text-white group-hover:text-brand-cyan'}`}
      >
        {task.is_premium && userPlan !== 'premium' ? 'Unlock Premium Task' : 'View Details & Submit'}
      </button>
    </div>
  );
}

'use client';

import { Crown, Users, Clock, Camera, Link2, ArrowRight, Folder, Flame } from 'lucide-react';
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
  category_id?: string;
  subcategory_id?: string;
  category?: { name: string };
  subcategory?: { name: string };
  is_premium?: boolean;
  expires_at?: string;
}

interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
  onLockedClick?: () => void;
  userPlan?: string;
}

export function TaskCard({ task, onSelect, onLockedClick, userPlan = 'basic' }: TaskCardProps) {
  const router = useRouter();

  const percentFull = task.total_slots > 0 ? (task.completed_slots / task.total_slots) : 0;
  const isCompleted = percentFull >= 1;
  
  let status = 'Available';
  let statusColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';

  if (isCompleted) {
    status = 'Completed';
    statusColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  } else if (percentFull >= 0.9) {
    status = 'Almost Full';
    statusColor = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  }

  const isLocked = task.is_premium && userPlan !== 'premium';
  const isDisabled = isCompleted;

  let tierClasses = 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800'; // Tier 1
  if (task.reward_amount >= 50) {
    tierClasses = 'bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-[#0f172a] border-2 border-amber-400 dark:border-amber-500 shadow-[0_4px_20px_rgba(251,191,36,0.15)]';
  } else if (task.reward_amount >= 10) {
    tierClasses = 'bg-purple-50/50 dark:bg-[#5A189A]/10 border-2 border-[#5A189A]/40 dark:border-[#7B2CBF]/40 shadow-[0_4px_15px_rgba(90,24,154,0.05)]';
  }

  const interactionClasses = task.is_premium 
    ? 'hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1 active:scale-95' 
    : 'hover:border-[#00F2FE]/50 hover:shadow-md hover:-translate-y-1 active:scale-95';

  const handleClick = () => {
    if (isDisabled) return;
    
    if (isLocked) {
      if (onLockedClick) onLockedClick();
      return;
    }
    
    // Route directly to task details page per specifications
    router.push(`/dashboard/task/${task.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative rounded-2xl p-5 transition-all duration-200 flex flex-col group cursor-pointer
        ${isDisabled 
          ? 'opacity-60 grayscale-[50%] cursor-not-allowed border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]' 
          : `${tierClasses} ${interactionClasses}`}
      `}
    >
      
      {task.is_premium && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 border border-yellow-300/30">
          <Crown className="w-3 h-3" /> Premium
        </div>
      )}

      {/* Top Row: Status Badge & Category */}
      <div className="flex justify-between items-center mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${statusColor}`}>
          {status}
        </span>
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
          <Folder className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{task.category?.name || 'Task'}</span>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-[17px] leading-snug font-bold mb-4 line-clamp-2 text-slate-900 dark:text-white min-h-[44px]">
        {task.title}
        {task.reward_amount >= 50 && (
          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700/50 whitespace-nowrap ml-2 align-middle -mt-1">
            <Flame className="w-3 h-3" /> High Paying
          </span>
        )}
      </h3>
      
      {/* Reward - Visually Prominent */}
      <div className="mb-5 flex items-baseline gap-1">
        <span className="text-3xl font-black text-purple-700 dark:text-[#00F2FE] tracking-tight">{Number(task.reward_amount).toFixed(2)}</span>
        <span className="text-sm font-bold text-purple-700/70 dark:text-[#00F2FE]/70 uppercase tracking-widest">BDT</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Slots</span>
            <span className="font-medium text-xs">{task.completed_slots} / {task.total_slots}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Time</span>
            <span className="font-medium text-xs">
              {task.expires_at 
                ? new Date(task.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) 
                : 'No Expiry'}
            </span>
          </div>
        </div>
      </div>

      {/* Proof Requirement */}
      <div className="flex items-center gap-3 mb-5 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-4">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Proof:</span>
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
          <Camera className="w-3 h-3 text-brand-accent" />
          <span>Screenshot</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
          <Link2 className="w-3 h-3 text-brand-primary" />
          <span>Link</span>
        </div>
      </div>
      
      {/* CTA Button */}
      {!isDisabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
            ${isLocked 
              ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' 
              : 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-[#00F2FE]/10 dark:hover:bg-[#00F2FE]/20 dark:text-[#00F2FE] group-hover:bg-purple-700 dark:group-hover:bg-[#00F2FE] group-hover:text-white dark:group-hover:text-dark-bg'}
          `}
        >
          {isLocked ? 'Unlock Premium' : 'Start Task'}
          {!isLocked && <ArrowRight className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

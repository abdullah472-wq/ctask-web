import { Crown, Lock, X } from 'lucide-react';
import Link from 'next/link';

interface PremiumLockModalProps {
  onClose: () => void;
}

export function PremiumLockModal({ onClose }: PremiumLockModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card border border-yellow-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20 relative">
          <Lock className="w-8 h-8 text-dark-bg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
          <Crown className="w-10 h-10 text-dark-bg relative z-10" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-4">
          Task Locked
        </h2>
        
        <p className="text-center text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Upgrade to Premium to view and complete this high-paid task!
        </p>
        
        <div className="flex flex-col gap-3">
          <Link 
            href="/dashboard/upgrade"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg font-bold text-center hover:opacity-90 transition-opacity shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" /> Upgrade to Premium
          </Link>
          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

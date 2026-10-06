'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, History, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewHistoryItem {
  id: string;
  status: string;
  submitted_at: string;
  tasks: {
    title: string;
    reward_amount: number;
  };
  profiles: {
    full_name: string;
  };
}

export default function AdminReviewHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select(`
          id, 
          status, 
          submitted_at, 
          tasks:task_id(title, reward_amount), 
          profiles(full_name)
        `)
        .neq('status', 'pending')
        .order('submitted_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setHistory(data as any[]);
    } catch (error: any) {
      console.error('Error fetching review history:', error);
      toast.error('Failed to load review history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#00F2FE] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-[#00F2FE]" /> Review History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Latest 100 approved or rejected task submissions.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Worker Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Task Title</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Reward</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Reviewed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No review history found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      {item.profiles?.full_name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.tasks?.title}>
                      {item.tasks?.title || 'Unknown Task'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {item.tasks?.reward_amount ? `${Number(item.tasks.reward_amount).toFixed(2)} ৳` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                          <CheckCircle className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-500 dark:text-slate-400">
                      {formatDate(item.submitted_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

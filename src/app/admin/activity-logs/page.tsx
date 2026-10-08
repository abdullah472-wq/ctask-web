'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const [
      { data: txData },
      { data: subData }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          status,
          description,
          created_at,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('task_submissions')
        .select(`
          id,
          status,
          submitted_at,
          tasks:task_id (title, reward_amount),
          profiles (full_name)
        `)
        .order('submitted_at', { ascending: false })
        .limit(100)
    ]);

    let combinedLogs: any[] = [];

    if (txData) {
      combinedLogs = [...combinedLogs, ...txData.map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        description: tx.description || (tx.type === 'withdrawal' ? 'Withdrawal Request' : tx.type === 'deposit' ? 'Wallet Deposit' : tx.type === 'premium_subscription' ? 'Premium Upgrade' : 'Transaction'),
        type: tx.type,
        amount: Number(tx.amount || 0),
        status: tx.status,
        user_name: tx.profiles?.full_name || 'Unknown'
      }))];
    }

    if (subData) {
      combinedLogs = [...combinedLogs, ...subData.map((sub: any) => ({
        id: sub.id,
        created_at: sub.submitted_at,
        description: `Task: ${sub.tasks?.title || 'Unknown'}`,
        type: 'task',
        amount: Number(sub.tasks?.reward_amount || 0),
        status: sub.status,
        user_name: sub.profiles?.full_name || 'Unknown'
      }))];
    }

    combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setLogs(combinedLogs.slice(0, 100));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-brand-accent">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Logs</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and monitor admin actions across the platform.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Activity Type</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-white">{log.user_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.description}</span>
                      <span className="text-xs text-slate-500 capitalize">{log.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">
                    <span className={log.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                      {log.type === 'withdrawal' ? '-' : '+'}৳ {Number(log.amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${log.status === 'paid' || log.status === 'completed' || log.status === 'approved'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : log.status === 'rejected' || log.status === 'failed'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

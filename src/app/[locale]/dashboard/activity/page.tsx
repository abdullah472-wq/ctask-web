'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export default function WorkerActivityLogPage() {
  const t = useTranslations('ActivityLogPage');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [
      { data: txData },
      { data: subData }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id),
      supabase
        .from('task_submissions')
        .select('id, status, submitted_at, admin_feedback, tasks:task_id (title, reward_amount)')
        .eq('user_id', session.user.id)
    ]);

    let combinedLogs: any[] = [];

    if (txData) {
      combinedLogs = [...combinedLogs, ...txData.map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        description: tx.description || (tx.type === 'withdrawal' ? 'withdrawalRequest' : 'walletDeposit'),
        type: tx.type,
        amount: Number(tx.amount || 0),
        status: tx.status
      }))];
    }

    if (subData) {
      combinedLogs = [...combinedLogs, ...subData.map((sub: any) => ({
        id: sub.id,
        created_at: sub.submitted_at,
        description: sub.tasks?.title ? `taskTitle|${sub.tasks.title}|${sub.admin_feedback || ''}` : 'unknown',
        type: 'task',
        amount: Number(sub.tasks?.reward_amount || 0),
        status: sub.status
      }))];
    }

    // Sort by newest first
    combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setLogs(combinedLogs);
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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-brand-accent">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">{t('date')}</th>
                <th className="px-6 py-4 font-medium">{t('description')}</th>
                <th className="px-6 py-4 font-medium">{t('type')}</th>
                <th className="px-6 py-4 font-medium">{t('amount')}</th>
                <th className="px-6 py-4 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                    {(() => {
                      if (!log.description) return '-';
                      if (log.description === 'withdrawalRequest') return t('withdrawalRequest');
                      if (log.description === 'walletDeposit') return t('walletDeposit');
                      if (log.description === 'unknown') return t('unknown');
                      if (log.description.startsWith('taskTitle|')) {
                        const parts = log.description.split('|');
                        return `${t('task')}: ${parts[1]}${parts[2] ? ' - ' + parts[2] : ''}`;
                      }
                      return log.description;
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {log.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                    <span className={log.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                      {log.type === 'withdrawal' ? '-' : '+'}৳ {Number(log.amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                      log.status === 'paid' || log.status === 'completed' || log.status === 'approved'
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
                    {t('noActivity')}
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

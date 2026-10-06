'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  details: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select(`
        id,
        action,
        details,
        created_at,
        admin_id,
        profiles (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Error fetching logs: ' + error.message);
    } else {
      setLogs(data as any);
    }
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
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-white">{log.profiles?.full_name || 'Unknown Admin'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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

'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  Loader2, 
  Activity, 
  FileText, 
  DollarSign, 
  Settings, 
  User, 
  Sparkles, 
  Search, 
  Calendar,
  Clock,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ActivityLogItem {
  id: string;
  user_id: string;
  action_type: 'task' | 'payment' | 'profile' | 'settings' | 'system' | string;
  description: string;
  role: 'worker' | 'creator' | 'admin' | 'system' | string;
  created_at: string;
}

export default function WorkerActivityLogPage() {
  const t = useTranslations('ActivityLogPage');
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchLogs();

    // Setup Supabase Realtime for instant updates
    let channel: any;
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel(`worker-activity-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const newLog = payload.new as ActivityLogItem;
            setLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)]);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch primary activity logs for this user
      const { data: activityData, error: actError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(150);

      if (!actError && activityData) {
        setLogs(activityData);
      } else if (actError) {
        console.warn('activity_logs query notice:', actError.message);
      }
    } catch (err: any) {
      console.error('fetchLogs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActionTypeConfig = (type: string) => {
    switch (type) {
      case 'task':
        return {
          icon: FileText,
          emoji: '📝',
          label: 'Task',
          bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
          accent: 'text-purple-600 dark:text-purple-400',
        };
      case 'payment':
        return {
          icon: DollarSign,
          emoji: '💰',
          label: 'Payment',
          bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
          accent: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'profile':
        return {
          icon: User,
          emoji: '👤',
          label: 'Profile',
          bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
          accent: 'text-blue-600 dark:text-blue-400',
        };
      case 'settings':
        return {
          icon: Settings,
          emoji: '⚙️',
          label: 'Settings',
          bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
          accent: 'text-indigo-600 dark:text-indigo-400',
        };
      case 'system':
        return {
          icon: Sparkles,
          emoji: '🤖',
          label: 'System',
          bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
          accent: 'text-amber-600 dark:text-amber-400',
        };
      default:
        return {
          icon: Activity,
          emoji: '📌',
          label: type || 'General',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          accent: 'text-slate-600 dark:text-slate-400',
        };
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesType = selectedType === 'all' || log.action_type === selectedType;
      const matchesSearch =
        searchQuery === '' ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [logs, selectedType, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-9 h-9 text-purple-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your activity history...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('title') || 'Comprehensive Activity Log'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('subtitle') || 'Real-time record of all your task submissions, payouts, and platform events.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Activities', emoji: '⚡' },
            { id: 'task', label: 'Tasks', emoji: '📝' },
            { id: 'payment', label: 'Payments', emoji: '💰' },
            { id: 'profile', label: 'Profile', emoji: '👤' },
            { id: 'system', label: 'System', emoji: '🤖' },
          ].map((tab) => {
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25 ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
          />
        </div>
      </div>

      {/* Activity Logs Table Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-[#1e293b]/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Event</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">{t('description') || 'Description'}</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Role</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">{t('date') || 'Timestamp'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.map((log) => {
                const config = getActionTypeConfig(log.action_type);
                const IconComponent = config.icon;
                const dateObj = new Date(log.created_at);
                const dateStr = dateObj.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const timeStr = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Event Type Badge with Icon */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.bg}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 capitalize">
                            {config.emoji} {config.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                        {log.description}
                      </p>
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.role || 'worker'}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{dateStr}</span>
                        <span className="text-[11px] text-slate-400">{timeStr}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Activity className="w-6 h-6 opacity-60" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? 'No matching activity logs' : t('noActivity') || 'No activities recorded yet'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery
                          ? 'Try clearing your search query or switching category filters.'
                          : 'Your task submissions, deposit approvals, and platform events will appear here in real-time.'}
                      </p>
                    </div>
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

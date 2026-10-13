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
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogItem {
  id: string;
  user_id: string | null;
  action_type: 'task' | 'payment' | 'profile' | 'settings' | 'system' | string;
  description: string;
  role: 'admin' | 'worker' | 'creator' | 'system' | string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchLogs();

    // Subscribe to Supabase Realtime for instant admin live feed
    const channel = supabase
      .channel('admin-activity-logs-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        async (payload) => {
          const newRow = payload.new as ActivityLogItem;
          let userName = 'Unknown';
          let userEmail = '';

          if (newRow.user_id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', newRow.user_id)
              .maybeSingle();
            if (prof) {
              userName = prof.full_name || 'Anonymous';
              userEmail = prof.email || '';
            }
          }

          const enhancedLog: ActivityLogItem = {
            ...newRow,
            user_name: userName,
            user_email: userEmail,
          };

          setLogs((prev) => [enhancedLog, ...prev.filter((l) => l.id !== newRow.id)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch from activity_logs
      const { data: rawLogs, error: logErr } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (logErr) {
        console.warn('activity_logs fetch notice:', logErr.message);
        setLogs([]);
        return;
      }

      if (!rawLogs || rawLogs.length === 0) {
        setLogs([]);
        return;
      }

      // 2. Extract unique user IDs and batch-fetch profile names
      const userIds = Array.from(new Set(rawLogs.map((l) => l.user_id).filter(Boolean)));
      const profileMap: Record<string, { full_name?: string; email?: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          profiles.forEach((p) => {
            profileMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      // 3. Map logs with user profile data
      const enriched: ActivityLogItem[] = rawLogs.map((item) => ({
        ...item,
        user_name: item.user_id && profileMap[item.user_id] ? (profileMap[item.user_id].full_name || 'Unnamed User') : (item.role === 'system' ? 'System Engine' : 'Platform User'),
        user_email: item.user_id && profileMap[item.user_id] ? profileMap[item.user_id].email : undefined,
      }));

      setLogs(enriched);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'creator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'system':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Filter & Search Logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesRole = selectedRole === 'all' || log.role === selectedRole;
      const matchesType = selectedType === 'all' || log.action_type === selectedType;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        log.description.toLowerCase().includes(q) ||
        (log.user_name && log.user_name.toLowerCase().includes(q)) ||
        (log.user_email && log.user_email.toLowerCase().includes(q)) ||
        log.action_type.toLowerCase().includes(q);

      return matchesRole && matchesType && matchesSearch;
    });
  }, [logs, selectedRole, selectedType, searchQuery]);

  // Metric counts
  const stats = useMemo(() => {
    return {
      total: logs.length,
      task: logs.filter((l) => l.action_type === 'task').length,
      payment: logs.filter((l) => l.action_type === 'payment').length,
      admin: logs.filter((l) => l.role === 'admin' || l.role === 'system').length,
    };
  }, [logs]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-9 h-9 text-purple-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading comprehensive activity audit stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Global Activity Logs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live audit stream of all platform operations: task approvals, payouts, settings, and automated actions.
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
            <span>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Events</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Task Events</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.task}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Financial & Payout</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.payment}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Admin & System</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.admin}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Action Type Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Types', emoji: '⚡' },
              { id: 'task', label: 'Tasks', emoji: '📝' },
              { id: 'payment', label: 'Payments', emoji: '💰' },
              { id: 'settings', label: 'Settings', emoji: '⚙️' },
              { id: 'profile', label: 'Profiles', emoji: '👤' },
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
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role Filters + Search */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin Only</option>
              <option value="creator">Creator Only</option>
              <option value="worker">Worker Only</option>
              <option value="system">System Only</option>
            </select>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, description..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Event</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">User / Actor</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Action Description</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Role</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.map((log) => {
                const config = getActionTypeConfig(log.action_type);
                const IconComponent = config.icon;
                const dateObj = new Date(log.created_at);
                const dateStr = format(dateObj, 'MMM dd, yyyy');
                const timeStr = format(dateObj, 'hh:mm:ss a');

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Event Type */}
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

                    {/* User / Actor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {log.user_name || 'Platform User'}
                        </span>
                        {log.user_email && (
                          <span className="text-xs text-slate-400 truncate max-w-[180px]">
                            {log.user_email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                        {log.description}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${getRoleBadge(log.role)}`}>
                        {log.role || 'system'}
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Activity className="w-6 h-6 opacity-60" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? 'No matching activity records' : 'No activity logs found'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery
                          ? 'Try clearing your search query or reset your filters.'
                          : 'Platform activities, administrative approvals, and background tasks will appear here in real time.'}
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

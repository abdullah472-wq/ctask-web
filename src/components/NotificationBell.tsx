'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet, 
  Landmark, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type?: 'withdrawal' | 'task' | 'kyc' | 'system' | string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId?: string;
  className?: string;
}

export function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  let tDashboard: any = null;
  try {
    tDashboard = useTranslations('Dashboard');
  } catch {
    // Fallback if rendered outside Next-Intl provider
    tDashboard = null;
  }

  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync userId from prop or session
  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      });
    }
  }, [userId]);

  // Fetch notifications and subscribe to realtime changes
  useEffect(() => {
    if (!currentUserId) return;

    fetchNotifications(currentUserId);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Subscribe to INSERT events on public.notifications filtered by user_id
    const channelName = `realtime_notifications_${currentUserId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });

          // Display toast notification when new realtime payload arrives
          showRealtimeToast(newNotif);
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchNotifications = async (uid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);

    if (error) {
      console.error('Error updating notification is_read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
      if (currentUserId) fetchNotifications(currentUserId);
    } else {
      toast.success(tDashboard ? tDashboard('markAllAsRead') : 'Marked all as read', {
        id: 'mark-all-notifications-read',
      });
    }
  };

  const showRealtimeToast = (notif: Notification) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-in fade-in zoom-in-95' : 'animate-out fade-out zoom-out-95'
          } max-w-sm w-full bg-white dark:bg-[#0f172a] shadow-2xl rounded-2xl pointer-events-auto flex p-3.5 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer`}
          onClick={() => {
            handleMarkAsRead(notif.id);
            toast.dismiss(t.id);
            setShowDropdown(true);
          }}
        >
          <div className="flex items-start gap-3 w-full">
            <div className={`p-2 rounded-xl shrink-0 ${getNotificationBg(notif.type, notif.title)}`}>
              {getNotificationIcon(notif.type, notif.title)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {notif.title}
                </h4>
                <span className="text-[10px] text-slate-400 shrink-0">Just now</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                {notif.message}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ),
      { duration: 5500, position: 'bottom-right' }
    );
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type?: string, title?: string) => {
    const normalizedType = type?.toLowerCase() || '';
    const normalizedTitle = title?.toLowerCase() || '';

    if (normalizedType === 'withdrawal') {
      if (normalizedTitle.includes('rejected') || normalizedTitle.includes('failed')) {
        return <Landmark className="w-4 h-4 text-red-500" />;
      }
      return <Landmark className="w-4 h-4 text-emerald-500" />;
    }

    if (normalizedType === 'task') {
      if (normalizedTitle.includes('rejected')) {
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      }
      return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
    }

    if (normalizedType === 'kyc') {
      if (normalizedTitle.includes('rejected')) {
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      }
      return <ShieldCheck className="w-4 h-4 text-violet-500" />;
    }

    // Fallbacks based on title keywords
    if (normalizedTitle.includes('warning') || normalizedTitle.includes('rejected') || normalizedTitle.includes('alert')) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    if (normalizedTitle.includes('success') || normalizedTitle.includes('approved')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (normalizedTitle.includes('wallet') || normalizedTitle.includes('earn') || normalizedTitle.includes('reward') || normalizedTitle.includes('payout')) {
      return <Wallet className="w-4 h-4 text-cyan-500" />;
    }

    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  const getNotificationBg = (type?: string, title?: string) => {
    const normalizedType = type?.toLowerCase() || '';
    const normalizedTitle = title?.toLowerCase() || '';

    if (normalizedType === 'withdrawal') {
      if (normalizedTitle.includes('rejected')) return 'bg-red-50 dark:bg-red-950/40 text-red-500';
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500';
    }

    if (normalizedType === 'task') {
      if (normalizedTitle.includes('rejected')) return 'bg-orange-50 dark:bg-orange-950/40 text-orange-500';
      return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500';
    }

    if (normalizedType === 'kyc') {
      if (normalizedTitle.includes('rejected')) return 'bg-rose-50 dark:bg-rose-950/40 text-rose-500';
      return 'bg-violet-50 dark:bg-violet-950/40 text-violet-500';
    }

    if (normalizedTitle.includes('rejected') || normalizedTitle.includes('warning')) {
      return 'bg-orange-50 dark:bg-orange-950/40 text-orange-500';
    }
    if (normalizedTitle.includes('approved') || normalizedTitle.includes('success')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500';
    }

    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-500';
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button with Unread Badge Counter */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />

        {unreadCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-card shadow-sm animate-pulse"
            title={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0b1120]/70 backdrop-blur-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {tDashboard ? tDashboard('notifications') : 'Notifications'}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
                  {unreadCount} {tDashboard ? tDashboard('new') : 'New'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-brand-primary dark:text-[#00F2FE] hover:underline cursor-pointer transition-colors"
              >
                {tDashboard ? tDashboard('markAllAsRead') : 'Mark all as read'}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 flex gap-1 bg-white dark:bg-[#0f172a]">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'unread'
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    We will notify you on withdrawals, task approvals, and KYC updates.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) {
                      handleMarkAsRead(notif.id);
                    }
                  }}
                  className={`p-3.5 sm:p-4 flex gap-3 transition-colors cursor-pointer group relative ${
                    !notif.is_read
                      ? 'bg-cyan-50/40 dark:bg-[#00F2FE]/5 hover:bg-cyan-50/70 dark:hover:bg-[#00F2FE]/10'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Glowing unread indicator dot */}
                  {!notif.is_read && (
                    <span 
                      className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-[#00F2FE] ring-4 ring-[#00F2FE]/20" 
                      title="Unread"
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${getNotificationBg(
                      notif.type,
                      notif.title
                    )}`}
                  >
                    {getNotificationIcon(notif.type, notif.title)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <h4
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          !notif.is_read
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                        {getRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {/* Quick action: mark read button on hover */}
                  {!notif.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="self-center p-1.5 rounded-lg text-slate-400 hover:text-brand-primary dark:hover:text-[#00F2FE] hover:bg-white dark:hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-all shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50 dark:bg-[#0b1120] border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00F2FE]" />
              Real-time updates enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

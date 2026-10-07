'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Bell, AlertTriangle, CheckCircle, Wallet } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
  };

  const handleMarkAsRead = async (notifId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
      
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
      
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const toggleDropdown = () => {
    const nextState = !showDropdown;
    setShowDropdown(nextState);
    if (nextState) {
      handleMarkAllAsRead(); // Auto mark as read when opened as requested
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('warning') || lowerTitle.includes('alert') || lowerTitle.includes('rejected')) {
      return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    }
    if (lowerTitle.includes('success') || lowerTitle.includes('approved')) {
      return <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    if (lowerTitle.includes('wallet') || lowerTitle.includes('earn') || lowerTitle.includes('reward')) {
      return <Wallet className="w-4 h-4 text-brand-accent dark:text-[#00F2FE]" />;
    }
    return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  const getNotificationIconBg = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('warning') || lowerTitle.includes('alert') || lowerTitle.includes('rejected')) return 'bg-orange-100 dark:bg-orange-900/30';
    if (lowerTitle.includes('success') || lowerTitle.includes('approved')) return 'bg-indigo-100 dark:bg-indigo-900/30';
    if (lowerTitle.includes('wallet') || lowerTitle.includes('earn') || lowerTitle.includes('reward')) return 'bg-brand-accent/10 dark:bg-brand-accent/20';
    return 'bg-blue-100 dark:bg-blue-900/30';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-dark-card"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-all">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 flex gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer ${!notif.is_read ? 'bg-blue-50/50 dark:bg-brand-primary/5' : ''}`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${getNotificationIconBg(notif.title)}`}>
                      {getNotificationIcon(notif.title)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-semibold ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                          {getRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

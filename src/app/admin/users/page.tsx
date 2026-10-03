'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, ShieldBan, ShieldAlert, Send, Search, Users } from 'lucide-react';

export default function UsersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Notification Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleBlockStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));
    } catch (err: any) {
      alert('Error updating block status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setActionLoading('notice');
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedUserId,
          title: noticeTitle,
          message: noticeMessage
        });
        
      if (error) throw error;
      alert('Notice sent successfully!');
      setNoticeModalOpen(false);
      setNoticeTitle('');
      setNoticeMessage('');
    } catch (err: any) {
      alert('Error sending notice: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage all registered users on Ctask.</p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">User Name</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Wallet Balance</th>
                <th className="px-6 py-4 font-medium">Referrer</th>
                <th className="px-6 py-4 font-medium">Plan Type</th>
                <th className="px-6 py-4 font-medium">KYC Status</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold">
                    {user.full_name}
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">ID: {user.id.substring(0,8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-brand-emerald">{Number(user.wallet_balance).toFixed(2)} ৳</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.referred_by ? user.referred_by.substring(0,8) + '...' : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold capitalize border ${user.plan_type === 'premium' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                      {user.plan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold capitalize border ${user.verification_status === 'verified' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' : user.verification_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                      {user.verification_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${user.is_blocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20'}`}>
                      {user.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setNoticeModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 transition-colors"
                        title="Send Notice"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleBlockStatus(user.id, user.is_blocked)}
                        disabled={actionLoading === user.id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${user.is_blocked ? 'bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'}`}
                        title={user.is_blocked ? "Unblock User" : "Block User"}
                      >
                        {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : user.is_blocked ? <ShieldAlert className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Send Notice to User</h2>
            <form onSubmit={handleSendNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notice Title</label>
                <input 
                  type="text" 
                  required
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                  placeholder="e.g. Warning: Invalid Proofs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                <textarea 
                  required
                  value={noticeMessage}
                  onChange={e => setNoticeMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors h-32 resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading === 'notice'}
                  className="flex-[2] py-3 rounded-xl bg-brand-cyan text-dark-bg font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                >
                  {actionLoading === 'notice' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Send Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

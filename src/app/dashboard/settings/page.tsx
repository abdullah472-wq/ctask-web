'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  Wallet, 
  Bell, 
  ShieldAlert, 
  UserCircle,
  Save,
  Loader2,
  Key,
  LogOut,
  Trash2,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ClientSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('payment');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile Data
  const [profile, setProfile] = useState<any>({
    bkash_number: '',
    nagad_number: '',
    bank_details: '',
    preferred_withdrawal: 'bKash',
    task_notifications: true,
    earnings_notifications: true,
    withdrawal_notifications: true,
    system_notifications: true,
    account_status: 'Active'
  });

  // Password State
  const [savingPassword, setSavingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setProfile((prev: any) => ({ ...prev, ...data }));
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bkash_number: profile.bkash_number,
          nagad_number: profile.nagad_number,
          bank_details: profile.bank_details,
          preferred_withdrawal: profile.preferred_withdrawal,
          task_notifications: profile.task_notifications,
          earnings_notifications: profile.earnings_notifications,
          withdrawal_notifications: profile.withdrawal_notifications,
          system_notifications: profile.system_notifications
        })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success('Settings updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      setSavingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setProfile((prev: any) => ({ ...prev, [name]: val }));
  };

  const tabs = [
    { id: 'payment', label: 'Payment & Withdrawal', icon: <Wallet className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'account', label: 'Account', icon: <UserCircle className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00F2FE]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-[#00F2FE]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8">
            
            {/* Payment & Withdrawal Tab */}
            {activeTab === 'payment' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Methods</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">bKash Number</label>
                    <input 
                      type="text" name="bkash_number" value={profile.bkash_number || ''} onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      placeholder="e.g. 017XXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nagad Number</label>
                    <input 
                      type="text" name="nagad_number" value={profile.nagad_number || ''} onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      placeholder="e.g. 018XXXXXXX"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Account Details (Optional)</label>
                  <textarea 
                    name="bank_details" value={profile.bank_details || ''} onChange={handleChange} rows={3}
                    className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                    placeholder="Bank Name, Branch, Account Number, Routing Number..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preferred Withdrawal Method</label>
                  <select 
                    name="preferred_withdrawal" value={profile.preferred_withdrawal || 'bKash'} onChange={handleChange}
                    className="w-full md:w-1/2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-70">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Payment Details
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="task_notifications" checked={profile.task_notifications} onChange={handleChange} className="sr-only" />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profile.task_notifications ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.task_notifications ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Approvals & Rejections</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="earnings_notifications" checked={profile.earnings_notifications} onChange={handleChange} className="sr-only" />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profile.earnings_notifications ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.earnings_notifications ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Earnings Alerts</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="withdrawal_notifications" checked={profile.withdrawal_notifications} onChange={handleChange} className="sr-only" />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profile.withdrawal_notifications ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.withdrawal_notifications ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Withdrawal Status Updates</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="system_notifications" checked={profile.system_notifications} onChange={handleChange} className="sr-only" />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${profile.system_notifications ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.system_notifications ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Announcements</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-800">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-70">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Preferences
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                {/* Change Password */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#00F2FE]" /> Change Password
                  </h2>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <input 
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                        placeholder="New Password"
                      />
                    </div>
                    <div>
                      <input 
                        type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                        placeholder="Confirm New Password"
                      />
                    </div>
                    <button 
                      type="submit" disabled={savingPassword || !password || !confirmPassword}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
                    </button>
                  </form>
                </div>

                {/* Login Sessions */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#00F2FE]" /> Active Sessions
                  </h2>
                  <div className="bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#00F2FE]/10 rounded-lg text-[#00F2FE]">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Current Session (Chrome on Windows)</p>
                        <p className="text-sm text-slate-500">Active right now • Dhaka, Bangladesh</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-full">Current</span>
                  </div>
                </div>

                {/* 2FA Coming Soon */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-slate-400" /> Two-Factor Authentication
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account.</p>
                  <button disabled className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium opacity-70 cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Account Status</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${profile.account_status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <span className="font-medium text-slate-900 dark:text-white">{profile.account_status || 'Active'}</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Device Management</h2>
                  <p className="text-sm text-slate-500 mb-4">Log out from all other devices if you notice suspicious activity.</p>
                  <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium transition-colors">
                    <LogOut className="w-4 h-4" /> Logout All Devices
                  </button>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-500 mb-4">Danger Zone</h2>
                  <p className="text-sm text-slate-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}

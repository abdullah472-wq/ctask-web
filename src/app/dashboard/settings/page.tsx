'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Save, Key, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [savingPassword, setSavingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

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

  return (
    <div className="max-w-3xl space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">App Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your application preferences and security.</p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-brand-emerald" /> Preferences
        </h2>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Theme Appearance</label>
          {mounted && (
            <div className="flex gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}
              >
                <Sun className="w-6 h-6" />
                <span className="font-semibold text-sm">Light</span>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}
              >
                <Moon className="w-6 h-6" />
                <span className="font-semibold text-sm">Dark</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}
              >
                <Monitor className="w-6 h-6" />
                <span className="font-semibold text-sm">System</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-cyan" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
            <input 
              type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" disabled={savingPassword || !password || !confirmPassword}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>

    </div>
  );
}

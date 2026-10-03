'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Save, Key, Image as ImageIcon } from 'lucide-react';
import { UserAvatar, AVATARS } from '@/components/UserAvatar';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarId, setAvatarId] = useState('avatar-1');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_id')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setFullName(data.full_name);
      if (data.avatar_id) setAvatarId(data.avatar_id);
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_id: avatarId })
      .eq('id', session.user.id);

    if (error) {
      alert('Error saving profile');
    } else {
      alert('Profile updated successfully!');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      setSavingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordError(error.message);
    } else {
      alert('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Update your profile information and security settings.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Form */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            Profile Information
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Choose Avatar
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setAvatarId(avatar.id)}
                    className={`relative rounded-xl overflow-hidden transition-all border-2 ${
                      avatarId === avatar.id 
                        ? 'border-brand-cyan shadow-[0_0_15px_-3px_#00F2FE] scale-110' 
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <UserAvatar avatarId={avatar.id} className="w-full aspect-square" />
                    {avatarId === avatar.id && (
                      <div className="absolute inset-0 bg-brand-cyan/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-6 h-6 bg-brand-cyan text-dark-bg rounded-full flex items-center justify-center font-bold shadow-md">✓</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
              />
            </div>
            
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </form>
        </div>

        {/* Security / Password Form */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-cyan" /> Security
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-6">
            {passwordError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {passwordError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit"
              disabled={savingPassword || !password || !confirmPassword}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

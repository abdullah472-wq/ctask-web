'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Crown, Zap, Send } from 'lucide-react';

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('plan_type, premium_valid_until, id')
      .eq('id', session.user.id)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  };

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .insert({
          user_id: profile.id,
          transaction_id: transactionId,
          amount: 250, // 250 ৳
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success('Upgrade request submitted! An admin will verify the transaction shortly.');
      setTransactionId('');
    } catch (err: any) {
      toast.error(err.message || 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  const isPremium = profile?.plan_type === 'premium';
  const validUntil = profile?.premium_valid_until ? new Date(profile.premium_valid_until).toLocaleDateString() : '';

  return (
    <div className="max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" /> Upgrade to Premium
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Unlock unlimited earning potential, access exclusive high-paying tasks, and bypass monthly limits.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Basic Plan */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col relative">
          {isPremium === false && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Current Plan
            </div>
          )}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Basic Plan</h2>
          <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
            Free <span className="text-lg font-normal text-slate-500">/ forever</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-brand-emerald/20 text-brand-emerald flex items-center justify-center text-xs">✓</div>
              Access to standard tasks
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">✕</div>
              <span className="opacity-80">Max 1000 ৳ earning limit per month</span>
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">✕</div>
              <span className="opacity-80">No access to Premium Tasks</span>
            </li>
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-b from-brand-cyan/20 to-brand-emerald/10 border-2 border-brand-cyan/50 dark:border-brand-cyan/30 rounded-3xl p-8 shadow-xl shadow-brand-cyan/10 flex flex-col relative">
          {isPremium && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" /> Active
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            Premium <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </h2>
          <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
            250 ৳ <span className="text-lg font-normal text-slate-600 dark:text-slate-400">/ 30 days</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-full bg-brand-cyan text-dark-bg flex items-center justify-center text-xs font-bold">✓</div>
              UNLIMITED Monthly Earnings
            </li>
            <li className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-full bg-brand-cyan text-dark-bg flex items-center justify-center text-xs font-bold">✓</div>
              Access to exclusive Premium Tasks
            </li>
            <li className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-full bg-brand-cyan text-dark-bg flex items-center justify-center text-xs font-bold">✓</div>
              Priority KYC Verification
            </li>
          </ul>

          {isPremium ? (
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl text-center border border-brand-cyan/20">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Your Premium is active!</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Valid until: {validUntil}</p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-black/30 p-5 rounded-xl border border-brand-cyan/30 mt-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">
                Send exactly <strong>250 ৳</strong> to bKash/Nagad Personal: <strong>017XXXXXXXX</strong> and enter the TrxID below.
              </p>
              <form onSubmit={handleUpgradeRequest} className="flex gap-2">
                <input 
                  type="text" 
                  required
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="Enter TrxID"
                  className="flex-1 bg-white dark:bg-dark-bg border border-slate-300 dark:border-slate-700 rounded-lg px-4 text-sm focus:outline-none focus:border-brand-cyan text-slate-900 dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

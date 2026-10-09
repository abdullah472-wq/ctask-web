'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Crown, Zap, Send, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function UpgradePage() {
  const t = useTranslations('UpgradePage');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    
    setUserId(session.user.id);

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
    if (!transactionId || !userId) {
      toast.error(t('missingIdError'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          amount: 250, // 250 ৳
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success(t('successMsg'));
      setTransactionId('');
    } catch (err: any) {
      toast.error(err.message || t('errorMsg'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  const isPremium = profile?.plan_type === 'premium';
  const validUntil = profile?.premium_valid_until ? new Date(profile.premium_valid_until).toLocaleDateString() : '';

  return (
    <div className="max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" /> {t('title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Basic Plan */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col relative">
          {isPremium === false && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{t('currentPlan')}</div>
          )}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('basicPlanTitle')}</h2>
          <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
            {t('freeForever')} <span className="text-lg font-normal text-slate-500">{t('forever')}</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs">✓</div>
              {t('basicFeature1')}
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">✕</div>
              <span className="opacity-80">{t('basicFeature2')}</span>
            </li>
            <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">✕</div>
              <span className="opacity-80">{t('basicFeature3')}</span>
            </li>
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-b from-brand-accent/20 to-brand-primary/10 border-2 border-brand-accent/50 dark:border-brand-accent/30 rounded-3xl p-8 shadow-xl shadow-brand-accent/10 flex flex-col relative">
          {isPremium && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-brand-primary to-brand-accent text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" /> {t('activePlan')}
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            {t('premiumPlanTitle')} <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </h2>
          <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">
            250 ৳ <span className="text-lg font-normal text-slate-600 dark:text-slate-400">{t('perMonth')}</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-full bg-brand-accent text-dark-bg flex items-center justify-center text-xs font-bold">✓</div>
              {t('premiumFeature1')}
            </li>
            <li className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-full bg-brand-accent text-dark-bg flex items-center justify-center text-xs font-bold">✓</div>
              {t('premiumFeature2')}
            </li>
            <li className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-full bg-brand-accent text-dark-bg flex items-center justify-center text-xs font-bold">✓</div>
              {t('premiumFeature3')}
            </li>
          </ul>

          {isPremium ? (
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl text-center border border-brand-accent/20">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('premiumActiveStatus')}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('validUntil')} {validUntil}</p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-black/30 p-5 rounded-xl border border-brand-accent/30 mt-4">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: t.raw('instructions') as string }} />
                <div className="mt-3 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="w-32 font-medium text-slate-800 dark:text-slate-200">Nagad Personal:</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('01312200043');
                        toast.success(t('nagadNumberCopied'));
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-accent/10 text-purple-800 dark:text-[#00F2FE] rounded-lg border border-brand-accent/30 hover:bg-brand-accent/20 transition-colors focus:outline-none"
                      title="Copy Nagad number"
                    >
                      <strong className="tracking-wider text-sm font-mono">01312200043</strong>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="w-32 font-medium text-slate-800 dark:text-slate-200">bKash Personal:</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('01581818368');
                        toast.success(t('bkashNumberCopied'));
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-accent/10 text-purple-800 dark:text-[#00F2FE] rounded-lg border border-brand-accent/30 hover:bg-brand-accent/20 transition-colors focus:outline-none"
                      title="Copy bKash number"
                    >
                      <strong className="tracking-wider text-sm font-mono">01581818368</strong>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <form onSubmit={handleUpgradeRequest} className="flex gap-2">
                <input 
                  type="text" 
                  required
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder={t('enterTrxId')}
                  className="flex-1 bg-white dark:bg-dark-bg border border-slate-300 dark:border-slate-700 rounded-lg px-4 text-sm focus:outline-none focus:border-brand-accent text-slate-900 dark:text-white"
                />
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
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

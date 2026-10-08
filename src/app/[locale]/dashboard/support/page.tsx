'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { toast } from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SupportPage() {
  const t = useTranslations('SupportPage');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error(t('errorNotLoggedIn'));
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error(t('errorRequiredFields'));
      return;
    }
    setLoading(true);
    
    const { error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          subject,
          message
        }
      ]);
      
    setLoading(false);
    
    if (error) {
      console.error(error);
      toast.error(t('errorFailedSubmit'));
    } else {
      toast.success(t('successSubmit'));
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('subtitle')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('subjectLabel')}
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white"
              disabled={loading}
              required
            >
              <option value="" disabled>{t('selectSubject')}</option>
              <option value="Issue with Withdrawal">{t('subjectWithdrawal')}</option>
              <option value="Issue with Deposit">{t('subjectDeposit')}</option>
              <option value="Task Approval Delay">{t('subjectTaskApproval')}</option>
              <option value="Account Verification / KYC">{t('subjectKyc')}</option>
              <option value="Report a Bug / Error">{t('subjectBug')}</option>
              <option value="Other">{t('subjectOther')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('messageLabel')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-slate-900 dark:text-white resize-none"
              disabled={loading}
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={loading || !subject || !message}
            className="w-full py-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? t('submittingBtn') : t('submitBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}

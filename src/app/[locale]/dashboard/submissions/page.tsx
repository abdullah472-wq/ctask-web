'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface Submission {
  id: string;
  status: string;
  proof_text: string;
  proof_image_url: string;
  submitted_at: string;
  tasks: {
    title: string;
    reward_amount: number;
  };
}

export default function SubmissionsPage() {
  const t = useTranslations('SubmissionsPage');
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('task_submissions')
      .select(`
        id,
        status,
        proof_text,
        proof_image_url,
        submitted_at,
        tasks:task_id (title, reward_amount)
      `)
      .eq('user_id', session.user.id)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      // @ts-ignore - Supabase join typing is complex
      setSubmissions(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-slate-400">{t('subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-900 dark:text-slate-100">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">{t('tableTask')}</th>
                <th className="px-6 py-4 font-medium">{t('tableReward')}</th>
                <th className="px-6 py-4 font-medium">{t('tableStatus')}</th>
                <th className="px-6 py-4 font-medium">{t('tableProofText')}</th>
                <th className="px-6 py-4 font-medium">{t('tableDate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t('noSubmissions')}
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{sub.tasks?.title}</td>
                    <td className="px-6 py-4 text-brand-primary font-bold">
                      {sub.tasks?.reward_amount?.toFixed(2)} ৳
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(sub.status)}`}>
                        {sub.status === 'approved' ? t('statusApproved') : 
                         sub.status === 'rejected' ? t('statusRejected') : 
                         t('statusPending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {sub.proof_text}
                      {sub.proof_image_url && (
                        <a href={sub.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline ml-2 inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> {t('image')}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

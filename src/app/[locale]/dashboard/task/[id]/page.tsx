'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Loader2, ArrowLeft, CheckCircle, Clock, Link as LinkIcon, Camera, Crown, Folder, Upload, Users, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface Task {
  id: string;
  title: string;
  description: string;
  task_url: string;
  reward_amount: number;
  total_slots: number;
  completed_slots: number;
  proof_instruction: string;
  title_bn?: string;
  description_bn?: string;
  proof_instruction_bn?: string;
  category?: { name: string };
  subcategory?: { name: string };
  is_premium?: boolean;
}

export default function TaskDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const t = useTranslations('TaskDetailsPage');
  const tCard = useTranslations('TaskCard');
  const locale = useLocale();


  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('basic');
  
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [existingSubmission, setExistingSubmission] = useState<{status: string} | null>(null);

  const displayTitle = task ? (locale === 'bn' && task.title_bn ? task.title_bn : task.title) : '';
  const displayDesc = task ? (locale === 'bn' && task.description_bn ? task.description_bn : task.description) : '';
  const displayProof = task ? (locale === 'bn' && task.proof_instruction_bn ? task.proof_instruction_bn : task.proof_instruction) : '';

  useEffect(() => {
    if (id) {
      init();
    }
  }, [id]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      await fetchProfile(session.user.id);
      await checkExistingSubmission(session.user.id, id);
    } else {
      router.push('/auth');
      return;
    }

    await fetchTask();
  };

  const checkExistingSubmission = async (uid: string, taskId: string) => {
    const { data } = await supabase
      .from('task_submissions')
      .select('status')
      .eq('user_id', uid)
      .eq('task_id', taskId)
      .maybeSingle();
      
    if (data) {
      setExistingSubmission(data);
    }
  };

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('plan_type').eq('id', uid).single();
    if (data) {
      setUserPlan(data.plan_type || 'basic');
      checkLimit(uid, data.plan_type || 'basic');
    } else {
      setCheckingLimit(false);
    }
  };

  const checkLimit = async (uid: string, plan: string) => {
    if (plan === 'premium') {
      setCheckingLimit(false);
      return;
    }
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('task_submissions')
      .select('status, tasks!inner(reward_amount)')
      .eq('user_id', uid)
      .eq('status', 'approved')
      .gte('submitted_at', startOfMonth.toISOString());

    if (!error && data) {
      let total = 0;
      data.forEach((sub: any) => {
        total += sub.tasks.reward_amount || 0;
      });
      if (total >= 1000) {
        setLimitReached(true);
      }
    }
    setCheckingLimit(false);
  };

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, category:task_categories(name), subcategory:task_subcategories(name)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTask(data);
    } catch (err) {
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (task?.task_url) {
      navigator.clipboard.writeText(task.task_url);
      toast.success(t('linkCopied'));
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !task) return;
    setSubmitting(true);

    try {
      const { data: existingCheck } = await supabase
        .from('task_submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('task_id', task.id)
        .maybeSingle();

      if (existingCheck) {
        toast.error(t('errorAlreadySubmitted'));
        setSubmitting(false);
        return;
      }

      let proofImageUrl = '';
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${userId}-${task.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('task-proofs')
          .upload(filePath, proofFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('task-proofs')
          .getPublicUrl(filePath);
          
        proofImageUrl = publicUrlData.publicUrl;
      }

      const { error: submitError } = await supabase
        .from('task_submissions')
        .insert({
          task_id: task.id,
          user_id: userId,
          proof_text: proofText,
          proof_image_url: proofImageUrl,
          status: 'pending'
        });

      if (submitError) throw submitError;

      toast.success(t('successMsg'));
      router.push('/dashboard/submissions');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || t('errorMsg'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingLimit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">{t('notFound')}</h1>
        <p className="text-slate-500 mb-8">{t('notFoundDesc')}</p>
        <Link href="/dashboard/tasks" className="px-6 py-3 rounded-xl bg-brand-accent/10 text-brand-accent font-bold hover:bg-brand-accent/20 transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> {t('backToTasks')}
        </Link>
      </div>
    );
  }

  const percentFull = task.total_slots > 0 ? (task.completed_slots / task.total_slots) : 0;
  const isCompleted = percentFull >= 1;
  const isLocked = task.is_premium && userPlan !== 'premium';

  let status = tCard('available');
  let statusColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';

  if (isCompleted) {
    status = tCard('completed');
    statusColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  } else if (percentFull >= 0.9) {
    status = tCard('almostFull');
    statusColor = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 mt-4">
      <Link href="/dashboard/tasks" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 dark:hover:text-brand-accent font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('backToTasks')}
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Task Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {task.is_premium && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400/20 to-transparent w-64 h-full blur-3xl -z-10" />
            )}
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${statusColor}`}>
                {status}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <Folder className="w-3.5 h-3.5" />
                <span>{task.category?.name || tCard('task')} {task.subcategory?.name && `> ${task.subcategory.name}`}</span>
              </div>
              {task.is_premium && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                  <Crown className="w-3.5 h-3.5" /> {tCard('premium')}
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
              {displayTitle}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('reward')}</span>
                <span className="text-2xl font-black text-purple-700 dark:text-[#00F2FE]">{task.reward_amount.toFixed(2)} ৳</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('slots')}</span>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-lg">{task.completed_slots}/{task.total_slots}</span>
                </div>
              </div>
            </div>

            <div className="w-full mb-8">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('taskLink')}</span>
                  <a href={task.task_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors font-medium truncate">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{task.task_url}</span>
                  </a>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 px-4 py-2 shrink-0 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" /> {t('copy')}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-primary" /> {t('instructions')}
              </h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap">
                {displayDesc}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-accent" /> {t('proofReqs')}
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 whitespace-pre-wrap">
                {displayProof}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Submit Proof Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm sticky top-28">
            <h2 className="text-xl font-bold mb-6">{t('submitWork')}</h2>
            
            {existingSubmission ? (
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-2xl text-center">
                <CheckCircle className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">{t('alreadySubmitted')}</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  {t('alreadySubmittedDesc')} <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{existingSubmission.status}</span>.
                </p>
                <Link href="/dashboard/submissions" className="block px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-bold w-full hover:opacity-90 transition-opacity">
                  {t('viewSubmissions')}
                </Link>
              </div>
            ) : isLocked ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-2xl text-center">
                <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-2">{t('premiumTask')}</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  {t('premiumDesc')}
                </p>
                <Link href="/dashboard/upgrade" className="block px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg font-bold w-full hover:opacity-90 transition-opacity">
                  {t('upgradeNow')}
                </Link>
              </div>
            ) : isCompleted ? (
              <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
                <CheckCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">{t('taskFull')}</h4>
                <p className="text-slate-500 text-sm">
                  {t('taskFullDesc')}
                </p>
              </div>
            ) : limitReached ? (
               <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center">
                <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-xl">!</span>
                </div>
                <h4 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('limitReached')}</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  {t('limitReachedDesc')}
                </p>
                <Link href="/dashboard/upgrade" className="block px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg font-bold w-full hover:opacity-90 transition-opacity">
                  {t('upgradeToPremium')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitProof} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('proofText')}</label>
                  <textarea
                    required
                    value={proofText}
                    onChange={e => setProofText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all h-32 resize-none"
                    placeholder={t('proofTextPlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('screenshotOptional')}</label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-brand-accent transition-colors bg-slate-50 dark:bg-white/5 group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setProofFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-brand-accent transition-colors" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {proofFile ? (
                        <span className="text-brand-primary flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4"/> {proofFile.name}</span>
                      ) : (
                        t('uploadPrompt')
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-brand-accent/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> {t('submitting')}
                    </>
                  ) : (
                    <>
                      {t('submitBtn')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

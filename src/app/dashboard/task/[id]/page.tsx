'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Loader2, ArrowLeft, CheckCircle, Clock, Link as LinkIcon, Camera, Crown, Folder, Upload, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  task_url: string;
  reward_amount: number;
  total_slots: number;
  completed_slots: number;
  proof_instruction: string;
  category?: { name: string };
  subcategory?: { name: string };
  is_premium?: boolean;
}

export default function TaskDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('basic');
  
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

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
    } else {
      router.push('/auth');
      return;
    }

    await fetchTask();
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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !task) return;
    setSubmitting(true);

    try {
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

      toast.success('Proof submitted successfully! Awaiting review.');
      router.push('/dashboard/submissions');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Error submitting proof');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingLimit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-brand-cyan animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Task Not Found</h1>
        <p className="text-slate-500 mb-8">This task may have been deleted or the link is invalid.</p>
        <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-brand-cyan/10 text-brand-cyan font-bold hover:bg-brand-cyan/20 transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const percentFull = task.total_slots > 0 ? (task.completed_slots / task.total_slots) : 0;
  const isCompleted = percentFull >= 1;
  const isLocked = task.is_premium && userPlan !== 'premium';

  let status = 'Available';
  let statusColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

  if (isCompleted) {
    status = 'Completed';
    statusColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  } else if (percentFull >= 0.9) {
    status = 'Almost Full';
    statusColor = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 mt-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-700 dark:hover:text-brand-cyan font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tasks
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
                <span>{task.category?.name || 'Task'} {task.subcategory?.name && `> ${task.subcategory.name}`}</span>
              </div>
              {task.is_premium && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                  <Crown className="w-3.5 h-3.5" /> Premium
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
              {task.title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/20 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reward</span>
                <span className="text-2xl font-black text-[#00F2FE]">{task.reward_amount.toFixed(2)} ৳</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slots</span>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-lg">{task.completed_slots}/{task.total_slots}</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex flex-col justify-center sm:col-span-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Link</span>
                <a href={task.task_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-brand-cyan transition-colors font-medium truncate">
                  <LinkIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{task.task_url}</span>
                </a>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-emerald" /> Task Instructions
              </h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-cyan" /> Proof Requirements
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 whitespace-pre-wrap">
                {task.proof_instruction}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Submit Proof Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm sticky top-28">
            <h2 className="text-xl font-bold mb-6">Submit Your Work</h2>
            
            {isLocked ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-2xl text-center">
                <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-2">Premium Task</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Upgrade to Premium to complete this high-paying task.
                </p>
                <Link href="/dashboard/upgrade" className="block px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg font-bold w-full hover:opacity-90 transition-opacity">
                  Upgrade Now
                </Link>
              </div>
            ) : isCompleted ? (
              <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
                <CheckCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">Task Full</h4>
                <p className="text-slate-500 text-sm">
                  This task has reached its maximum slots and is no longer available.
                </p>
              </div>
            ) : limitReached ? (
               <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center">
                <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-xl">!</span>
                </div>
                <h4 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Limit Reached</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  You have reached your 1000 ৳ limit on the Basic plan. Upgrade to unlock unlimited earnings!
                </p>
                <Link href="/dashboard/upgrade" className="block px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg font-bold w-full hover:opacity-90 transition-opacity">
                  Upgrade to Premium
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitProof} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Proof Text</label>
                  <textarea
                    required
                    value={proofText}
                    onChange={e => setProofText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all h-32 resize-none"
                    placeholder="Enter required text proof (e.g. username, email, ID)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Screenshot (Optional)</label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-brand-cyan transition-colors bg-slate-50 dark:bg-white/5 group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setProofFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-brand-cyan transition-colors" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {proofFile ? (
                        <span className="text-brand-emerald flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4"/> {proofFile.name}</span>
                      ) : (
                        "Click or drag image to upload"
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-brand-cyan/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Proof For Review
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

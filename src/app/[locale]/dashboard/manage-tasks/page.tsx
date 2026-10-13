'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  CheckCircle, XCircle, Clock, ExternalLink, Loader2, Plus, 
  ListTodo, Users, Award, Eye, AlertCircle, ArrowUpRight, Search, 
  ChevronRight, X, Image as ImageIcon, Check, Ban 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { approveTaskSubmission, rejectTaskSubmission } from '@/app/actions/approveTask';

interface TaskSubmission {
  id: string;
  status: string;
  proof_text?: string;
  proof_image_url?: string;
  submitted_at?: string;
  user_id: string;
  profiles?: {
    id: string;
    full_name?: string;
  };
}

interface CreatorTask {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  total_slots: number;
  completed_slots: number;
  proof_instruction: string;
  category?: { name: string };
  subcategory?: { name: string };
  status: string;
  is_active: boolean;
  created_at: string;
  task_submissions?: TaskSubmission[];
}

export default function CreatorManageTasksPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CreatorTask[]>([]);
  
  // Review Modal State
  const [selectedTask, setSelectedTask] = useState<CreatorTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<TaskSubmission[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Rejection Reason Prompt State
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Image Lightbox
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      await fetchCreatorTasks(session.user.id);
    }
    setLoading(false);
  };

  const fetchCreatorTasks = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:task_categories(name),
          subcategory:task_subcategories(name),
          task_submissions (
            id,
            status,
            proof_text,
            proof_image_url,
            submitted_at,
            user_id,
            profiles (id, full_name)
          )
        `)
        .eq('creator_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching creator tasks:', err);
      toast.error('Failed to load your tasks: ' + err.message);
    }
  };

  const openReviewModal = (task: CreatorTask) => {
    setSelectedTask(task);
    const pending = (task.task_submissions || []).filter(s => s.status === 'pending');
    setPendingSubmissions(pending);
    setIsModalOpen(true);
    setRejectingSubId(null);
    setRejectReason('');
  };

  const closeReviewModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setPendingSubmissions([]);
    setRejectingSubId(null);
    setRejectReason('');
  };

  const handleApprove = async (sub: TaskSubmission) => {
    if (!selectedTask || !userId) return;
    setActionLoadingId(sub.id);

    try {
      const res = await approveTaskSubmission(
        sub.id,
        selectedTask.id,
        sub.user_id,
        selectedTask.reward_amount,
        userId
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to approve submission');
      }

      toast.success('🎉 Proof approved! Worker has been credited.');

      // Update modal submissions list
      setPendingSubmissions(prev => prev.filter(s => s.id !== sub.id));

      // Update parent tasks state
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === selectedTask.id) {
          const updatedSubs = (t.task_submissions || []).map(s => 
            s.id === sub.id ? { ...s, status: 'approved' } : s
          );
          return {
            ...t,
            completed_slots: (t.completed_slots || 0) + 1,
            task_submissions: updatedSubs
          };
        }
        return t;
      }));
    } catch (err: any) {
      toast.error(err.message || 'Error approving submission');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (sub: TaskSubmission) => {
    if (!selectedTask || !userId) return;
    setActionLoadingId(sub.id);

    try {
      const res = await rejectTaskSubmission(
        sub.id,
        userId,
        rejectReason.trim() || undefined
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to reject submission');
      }

      toast.success('Submission rejected.');

      // Update modal submissions list
      setPendingSubmissions(prev => prev.filter(s => s.id !== sub.id));
      setRejectingSubId(null);
      setRejectReason('');

      // Update parent tasks state
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === selectedTask.id) {
          const updatedSubs = (t.task_submissions || []).map(s => 
            s.id === sub.id ? { ...s, status: 'rejected' } : s
          );
          return { ...t, task_submissions: updatedSubs };
        }
        return t;
      }));
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting submission');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics calculations
  const totalCreatedTasks = tasks.length;
  const totalCompletedSlots = tasks.reduce((acc, t) => acc + (t.completed_slots || 0), 0);
  const totalPendingReviews = tasks.reduce((acc, t) => {
    const pending = (t.task_submissions || []).filter(s => s.status === 'pending').length;
    return acc + pending;
  }, 0);
  const totalActiveSlots = tasks.reduce((acc, t) => acc + (t.total_slots || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-[#5A189A]" />
            {locale === 'bn' ? 'আমার তৈরি করা কাজসমূহ' : 'Manage My Posted Tasks'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {locale === 'bn' 
              ? 'আপনার পোস্ট করা কাজসমূহ পরিচালনা করুন এবং কর্মীদের জমা দেওয়া প্রুফ রিভিউ ও অনুমোদন করুন।'
              : 'Review submitted worker proofs, track slot completions, and manage your campaigns.'}
          </p>
        </div>
        <Link 
          href="/dashboard/deposit?tab=task"
          className="flex items-center gap-2 bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] hover:opacity-95 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md shrink-0"
        >
          <Plus className="w-5 h-5" /> {locale === 'bn' ? 'নতুন কাজ পোস্ট করুন' : 'Create New Task'}
        </Link>
      </div>

      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Total Posted Tasks</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalCreatedTasks}</h3>
          <p className="text-xs text-slate-400 mt-1">Campaigns created</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Completed Slots</p>
          <h3 className="text-3xl font-black text-green-600 dark:text-green-500 mt-1">{totalCompletedSlots} / {totalActiveSlots}</h3>
          <p className="text-xs text-slate-400 mt-1">Approved completions</p>
        </div>

        <div className={`border rounded-2xl p-6 shadow-sm transition-all ${totalPendingReviews > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800'}`}>
          <p className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400">Pending Proofs to Review</p>
          <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
            {totalPendingReviews}
            {totalPendingReviews > 0 && <span className="text-xs px-2 py-1 bg-amber-500 text-white rounded-full font-bold">Action Needed</span>}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Awaiting your approval</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Auto-Approve Protection</p>
          <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-5 h-5" /> 48 Hours
          </h3>
          <p className="text-xs text-slate-400 mt-1">Pending proofs auto-settle</p>
        </div>
      </div>

      {/* Tasks Table / Cards */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Task Campaigns</h2>
          <span className="text-xs font-semibold text-slate-500">{tasks.length} total tasks</span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <ListTodo className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No tasks created yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              You haven&apos;t posted any micro-tasks yet. Deposit funds and create a campaign to get subscribers, reviews, and sign-ups.
            </p>
            <Link 
              href="/dashboard/deposit?tab=task"
              className="inline-flex items-center gap-2 bg-[#5A189A] hover:bg-[#5A189A]/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Post Your First Task
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase font-bold">
                  <th className="py-4 px-6">Task Title & Category</th>
                  <th className="py-4 px-6">Reward (৳)</th>
                  <th className="py-4 px-6">Slot Progress</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Pending Proofs</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {tasks.map(task => {
                  const pendingCount = (task.task_submissions || []).filter(s => s.status === 'pending').length;
                  const percent = task.total_slots > 0 ? Math.min(100, Math.round((task.completed_slots / task.total_slots) * 100)) : 0;
                  const isCompleted = task.completed_slots >= task.total_slots;

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live & Active
                    </span>
                  );

                  if (task.status === 'pending') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Admin Approval
                      </span>
                    );
                  } else if (task.status === 'rejected') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <XCircle className="w-3.5 h-3.5" /> Rejected (Refunded)
                      </span>
                    );
                  } else if (isCompleted) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    );
                  }

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{task.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {task.category?.name || 'General'} {task.subcategory?.name && `> ${task.subcategory.name}`}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-bold text-purple-700 dark:text-purple-400">
                        ৳ {Number(task.reward_amount || 0).toFixed(2)}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-700 dark:text-slate-300">{task.completed_slots} / {task.total_slots}</span>
                          <span className="text-slate-400">{percent}%</span>
                        </div>
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#5A189A] to-green-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {statusBadge}
                      </td>

                      <td className="py-4 px-6">
                        {pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs">
                            <Clock className="w-3.5 h-3.5" /> {pendingCount} Pending
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0 Pending</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openReviewModal(task)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            pendingCount > 0 
                              ? 'bg-[#5A189A] hover:bg-[#5A189A]/90 text-white shadow-purple-500/20' 
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          {pendingCount > 0 ? `Review Proofs (${pendingCount})` : 'View Submissions'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Proofs Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Submissions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  Task: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTask.title}</span> (Reward: ৳ {Number(selectedTask.reward_amount).toFixed(2)})
                </p>
              </div>
              <button 
                onClick={closeReviewModal}
                className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proof Instructions Reference Box */}
            <div className="px-6 py-3 bg-purple-50/70 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-300">
              <span className="font-bold">Required Proof Instructions:</span> {selectedTask.proof_instruction}
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {pendingSubmissions.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">All Caught Up!</h4>
                  <p className="text-sm text-slate-500 mt-1">There are no pending proofs waiting for your review on this task.</p>
                </div>
              ) : (
                pendingSubmissions.map((sub, idx) => {
                  const workerName = sub.profiles?.full_name || 'Worker ' + sub.user_id.slice(0, 6);
                  const isRejectingThis = rejectingSubId === sub.id;

                  return (
                    <div 
                      key={sub.id} 
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/20 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center">
                            {workerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{workerName}</h4>
                            <p className="text-xs text-slate-400">
                              Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Recently'}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Pending Review
                        </span>
                      </div>

                      {/* Submitted Proof Text */}
                      {sub.proof_text && (
                        <div>
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Worker Answer / Text:
                          </label>
                          <div className="p-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {sub.proof_text}
                          </div>
                        </div>
                      )}

                      {/* Submitted Proof Screenshot */}
                      {sub.proof_image_url && (
                        <div>
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Screenshot Proof:
                          </label>
                          <div className="flex items-center gap-4">
                            <div 
                              onClick={() => setZoomImageUrl(sub.proof_image_url!)}
                              className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-100 dark:bg-slate-800 shrink-0"
                            >
                              <img 
                                src={sub.proof_image_url} 
                                alt="Proof Screenshot" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" /> Click to Zoom
                              </div>
                            </div>
                            <a 
                              href={sub.proof_image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#5A189A] dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Reject Reason Input (if opened) */}
                      {isRejectingThis && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl space-y-3">
                          <label className="text-xs font-bold text-red-600 dark:text-red-400 block">
                            Rejection Reason (Optional note for the worker):
                          </label>
                          <input 
                            type="text"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Screenshot does not show completed action"
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-card border border-red-200 dark:border-red-800 rounded-lg focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setRejectingSubId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReject(sub)}
                              disabled={actionLoadingId === sub.id}
                              className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              {actionLoadingId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Approval / Reject Buttons */}
                      {!isRejectingThis && (
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => {
                              setRejectingSubId(sub.id);
                              setRejectReason('');
                            }}
                            disabled={actionLoadingId === sub.id}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1.5"
                          >
                            <Ban className="w-4 h-4" /> Reject Proof
                          </button>

                          <button
                            onClick={() => handleApprove(sub)}
                            disabled={actionLoadingId === sub.id}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoadingId === sub.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Approve & Pay (৳ {Number(selectedTask.reward_amount).toFixed(2)})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center text-xs text-slate-500">
              <span>{pendingSubmissions.length} proofs awaiting review</span>
              <button 
                onClick={closeReviewModal}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold hover:opacity-80 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Screenshot Modal */}
      {zoomImageUrl && (
        <div 
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={zoomImageUrl} 
              alt="Zoomed Screenshot" 
              className="max-h-[85vh] w-auto object-contain mx-auto" 
            />
            <button 
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

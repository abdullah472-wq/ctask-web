'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Check, X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { approveTaskSubmission } from '@/app/actions/approveTask';

interface PendingSubmission {
  id: string;
  proof_text: string;
  proof_image_url: string;
  submitted_at: string;
  tasks: {
    id: string;
    title: string;
    reward_amount: number;
    proof_instruction: string;
  };
  profiles: {
    id: string;
    full_name: string;
  };
}

export default function ReviewProofsPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const { data, error } = await supabase
      .from('task_submissions')
      .select(`
        id,
        proof_text,
        proof_image_url,
        submitted_at,
        tasks:task_id (id, title, reward_amount, proof_instruction),
        profiles:user_id (id, full_name)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (!error && data) {
      // @ts-ignore
      setSubmissions(data);
    }
    setLoading(false);
  };

  const handleApprove = async (sub: PendingSubmission) => {
    setActionLoading(sub.id);
    try {
      const result = await approveTaskSubmission(
        sub.id,
        sub.tasks.id,
        sub.profiles.id,
        sub.tasks.reward_amount
      );
      if (!result.success) throw new Error(result.error);
      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    } catch (err: any) {
      alert('Error approving: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (subId: string) => {
    setActionLoading(subId);
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({ status: 'rejected' })
        .eq('id', subId);
      if (error) throw error;
      setSubmissions(prev => prev.filter(s => s.id !== subId));
    } catch (err: any) {
      alert('Error rejecting: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Review Proofs</h1>
        <p className="text-slate-400">Approve or reject pending task submissions.</p>
      </div>

      <div className="grid gap-6">
        {submissions.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl">
            <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pending proofs to review right now.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{sub.tasks?.title}</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-brand-emerald font-bold">{sub.tasks?.reward_amount?.toFixed(2)} ৳</span>
                    <span className="text-slate-500">Worker: {sub.profiles?.full_name}</span>
                    <span className="text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-black/30 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Instruction given:</p>
                  <p className="text-sm text-slate-300">{sub.tasks?.proof_instruction}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-brand-cyan mb-1 uppercase font-bold tracking-wider">Submitted Text Proof:</p>
                  <p className="text-sm text-white">{sub.proof_text}</p>
                </div>
              </div>

              <div className="lg:w-72 flex flex-col gap-4">
                {sub.proof_image_url ? (
                  <div className="aspect-video relative rounded-xl overflow-hidden bg-black/50 border border-slate-800 flex-shrink-0 group cursor-pointer" onClick={() => window.open(sub.proof_image_url, '_blank')}>
                    <Image src={sub.proof_image_url} alt="Proof" fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video relative rounded-xl bg-white/5 border border-slate-800 border-dashed flex items-center justify-center text-sm text-slate-500">
                    No image provided
                  </div>
                )}
                
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleReject(sub.id)}
                    disabled={actionLoading === sub.id}
                    className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading === sub.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleApprove(sub)}
                    disabled={actionLoading === sub.id}
                    className="flex-[2] py-2 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/20 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === sub.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Approve
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </>
  );
}

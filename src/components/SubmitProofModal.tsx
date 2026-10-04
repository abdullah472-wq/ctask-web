'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Loader2, Link as LinkIcon, FileText } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface Task {
  id: string;
  title: string;
  task_url: string;
  proof_instruction: string;
}

interface SubmitProofModalProps {
  task: Task;
  userId: string;
  userPlan?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitProofModal({ task, userId, userPlan = 'basic', onClose, onSuccess }: SubmitProofModalProps) {
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // Check earning limit for basic users
  useEffect(() => {
    checkLimit();
  }, []);

  const checkLimit = async () => {
    if (userPlan === 'premium') {
      setCheckingLimit(false);
      return;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('task_submissions')
      .select('status, tasks!inner(reward_amount)')
      .eq('user_id', userId)
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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let proofImageUrl = '';
      
      // Upload File if exists
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

      // Insert Submission
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

      alert('Proof submitted successfully! Awaiting review.');
      onSuccess();
    } catch (error: any) {
      console.error('Submission error:', error);
      alert(error.message || 'Error submitting proof');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-white/5">
          <h3 className="font-bold text-lg">Submit Task Proof</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          <div className="mb-6 p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
            <h4 className="font-bold text-brand-cyan mb-1">{task.title}</h4>
            <div className="flex items-center gap-2 text-sm mt-3">
              <LinkIcon className="w-4 h-4 text-slate-400" />
              <a href={task.task_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                {task.task_url}
              </a>
            </div>
          </div>
          
          <div className="mb-6">
            <h5 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Instructions
            </h5>
            <p className="text-sm text-slate-400 p-3 rounded-lg bg-black/30 border border-slate-800">
              {task.proof_instruction}
            </p>
          </div>

          {checkingLimit ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
            </div>
          ) : limitReached ? (
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-red-500 mb-2">Monthly Limit Reached</h4>
              <p className="text-slate-300 mb-4 text-sm">
                You have reached your 1000 ৳ earning limit for this month on the Basic plan. Upgrade to Premium to unlock unlimited earnings!
              </p>
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/dashboard/upgrade';
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark-bg font-bold w-full"
              >
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <form id="proofForm" onSubmit={handleSubmitProof} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proof Text</label>
                <textarea
                  required
                  value={proofText}
                  onChange={e => setProofText(e.target.value)}
                  className="w-full bg-white/5 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan transition-colors h-24 resize-none"
                  placeholder="Enter required text proof (username, email used, etc.)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Screenshot Proof (Optional)</label>
                <div className="relative border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-brand-cyan/50 transition-colors bg-white/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setProofFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-300">
                    {proofFile ? proofFile.name : "Click or drag image to upload"}
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-white/5 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="proofForm"
            disabled={submitting || checkingLimit || limitReached}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Proof
          </button>
        </div>
      </div>
    </div>
  );
}

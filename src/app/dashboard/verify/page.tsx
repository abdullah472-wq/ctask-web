'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, ShieldCheck, Upload, Image as ImageIcon } from 'lucide-react';

export default function VerifyIdentityPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('unverified');
  
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', session.user.id)
      .single();

    if (data) setStatus(data.verification_status);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidFile || !selfieFile) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const uid = session.user.id;
      
      // Upload NID
      const nidExt = nidFile.name.split('.').pop();
      const nidPath = `nid-${uid}.${nidExt}`;
      const { error: nidError } = await supabase.storage
        .from('kyc-docs')
        .upload(nidPath, nidFile, { upsert: true });
      if (nidError) throw nidError;

      // Upload Selfie
      const selfieExt = selfieFile.name.split('.').pop();
      const selfiePath = `selfie-${uid}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from('kyc-docs')
        .upload(selfiePath, selfieFile, { upsert: true });
      if (selfieError) throw selfieError;

      // Update Profile Status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'pending',
          nid_image_url: nidPath,
          selfie_image_url: selfiePath
        })
        .eq('id', uid);
      if (updateError) throw updateError;

      setStatus('pending');
      alert('Verification documents submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Error submitting documents');
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

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-brand-emerald" /> KYC Verification
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Verify your identity to unlock withdrawals and higher earning limits.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        
        {status === 'verified' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-brand-emerald/10 text-brand-emerald rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Verified</h2>
            <p className="text-slate-500 dark:text-slate-400">Your identity has been successfully verified. You have full access.</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verification Pending</h2>
            <p className="text-slate-500 dark:text-slate-400">We are reviewing your documents. This usually takes 1-2 business days.</p>
          </div>
        )}

        {status === 'unverified' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl text-sm mb-6">
              Please upload clear, legible images. Blurry documents will be rejected. 
              Required for all withdrawals above 100 ৳.
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">National ID (Front)</label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-brand-cyan/50 transition-colors bg-slate-50 dark:bg-white/5 h-48 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={e => setNidFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {nidFile ? nidFile.name : "Upload NID Image"}
                  </p>
                  <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Clear Selfie</label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-brand-cyan/50 transition-colors bg-slate-50 dark:bg-white/5 h-48 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={e => setSelfieFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {selfieFile ? selfieFile.name : "Upload Selfie Image"}
                  </p>
                  <p className="text-xs text-slate-500">Face must be clearly visible</p>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting || !nidFile || !selfieFile}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-8 shadow-lg shadow-brand-cyan/20"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Submit for Verification
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

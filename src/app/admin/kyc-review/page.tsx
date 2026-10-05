'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Check, X, ShieldAlert, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function KYCReviewPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, nid_image_url, selfie_image_url')
      .eq('verification_status', 'pending');

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const getImageUrl = (path: string) => {
    return supabase.storage.from('kyc-docs').getPublicUrl(path).data.publicUrl;
  };

  const handleApprove = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('id', profileId);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (err: any) {
      toast.error('Error approving KYC: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'unverified',
          nid_image_url: null,
          selfie_image_url: null
        })
        .eq('id', profileId);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (err: any) {
      toast.error('Error rejecting KYC: ' + err.message);
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
        <h1 className="text-2xl font-bold mb-2">KYC Verifications</h1>
        <p className="text-slate-500 dark:text-slate-400">Review pending identity verifications.</p>
      </div>

      <div className="grid gap-6">
        {profiles.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-emerald" />
            <p>No pending KYC requests to review right now.</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 shadow-sm">
              
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase font-bold">National ID</p>
                    <div 
                      className="aspect-video relative rounded-xl overflow-hidden bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-slate-800 cursor-pointer group"
                      onClick={() => window.open(getImageUrl(profile.nid_image_url), '_blank')}
                    >
                      <Image src={getImageUrl(profile.nid_image_url)} alt="NID" fill className="object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Selfie</p>
                    <div 
                      className="aspect-square sm:aspect-video relative rounded-xl overflow-hidden bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-slate-800 cursor-pointer group"
                      onClick={() => window.open(getImageUrl(profile.selfie_image_url), '_blank')}
                    >
                      <Image src={getImageUrl(profile.selfie_image_url)} alt="Selfie" fill className="object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-48 flex flex-col justify-end gap-2">
                <button
                  onClick={() => handleApprove(profile.id)}
                  disabled={actionLoading === profile.id}
                  className="w-full py-3 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/20 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === profile.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(profile.id)}
                  disabled={actionLoading === profile.id}
                  className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === profile.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                  Reject & Retake
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </>
  );
}

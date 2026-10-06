'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Check, X, ShieldAlert, ExternalLink } from 'lucide-react';
import { logAdminAction } from '@/utils/activityLogger';
import Image from 'next/image';

export default function KYCReviewPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, kyc_status, id_type, id_number, id_front_url, id_back_url')
      .eq('kyc_status', 'pending');

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return supabase.storage.from('kyc-docs').getPublicUrl(path).data.publicUrl;
  };

  const handleApprove = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: 'verified' })
        .eq('id', profileId);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (err: any) {
      toast.error('Error approving KYC: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (profileId: string) => {
    setSelectedProfileId(profileId);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'rejected',
          kyc_reject_reason: rejectionReason || 'Your submitted documents did not meet our requirements.',
          id_front_url: null,
          id_back_url: null
        })
        .eq('id', profileId);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setIsRejectModalOpen(false);
    } catch (err: any) {
      toast.error('Error rejecting KYC: ' + err.message);
    } finally {
      setActionLoading(null);
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
        <h1 className="text-2xl font-bold mb-2">KYC Verifications</h1>
        <p className="text-slate-500 dark:text-slate-400">Review pending identity verifications.</p>
      </div>

      <div className="grid gap-6">
        {profiles.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-primary" />
            <p>No pending KYC requests to review right now.</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 shadow-sm">
              
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h3>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Document Type</span>
                    <span className="text-sm font-semibold">{profile.id_type || 'NID'}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Document Number</span>
                    <span className="text-sm font-semibold">{profile.id_number || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Front Side</p>
                    <div 
                      className="aspect-video relative rounded-xl overflow-hidden bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-slate-800 cursor-pointer group"
                      onClick={() => profile.id_front_url && window.open(getImageUrl(profile.id_front_url), '_blank')}
                    >
                      {profile.id_front_url ? (
                        <Image src={getImageUrl(profile.id_front_url)} alt="Front" fill className="object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">No Image</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Back Side</p>
                    <div 
                      className="aspect-square sm:aspect-video relative rounded-xl overflow-hidden bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-slate-800 cursor-pointer group"
                      onClick={() => profile.id_back_url && window.open(getImageUrl(profile.id_back_url), '_blank')}
                    >
                      {profile.id_back_url ? (
                        <Image src={getImageUrl(profile.id_back_url)} alt="Back" fill className="object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">No Image</div>
                      )}
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
                  className="w-full py-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === profile.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Approve
                </button>
                <button
                  onClick={() => openRejectModal(profile.id)}
                  className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Reject & Retake
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reject KYC Submission</h2>
            <textarea
              className="w-full mt-3 p-3 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Enter specific reasons for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedProfileId && handleConfirmReject(selectedProfileId)}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2"
                disabled={actionLoading === selectedProfileId}
              >
                {actionLoading === selectedProfileId && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

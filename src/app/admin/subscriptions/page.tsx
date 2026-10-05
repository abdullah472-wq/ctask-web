'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Check, X, CreditCard } from 'lucide-react';

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('subscription_requests')
      .select(`
        id,
        transaction_id,
        amount,
        created_at,
        profiles:user_id (id, full_name, plan_type)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleApprove = async (req: any) => {
    setActionLoading(req.id);
    try {
      // Approve via RPC (as defined in our schema update)
      const { error } = await supabase.rpc('approve_subscription', {
        sub_req_id: req.id,
        user_uuid: req.profiles.id
      });
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success('Subscription approved! User is now premium.');
    } catch (err: any) {
      toast.error('Error approving: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId: string) => {
    setActionLoading(reqId);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .update({ status: 'rejected' })
        .eq('id', reqId);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err: any) {
      toast.error('Error rejecting: ' + err.message);
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
        <h1 className="text-2xl font-bold mb-2">Subscription Requests</h1>
        <p className="text-slate-500 dark:text-slate-400">Review and approve user payments for Premium upgrades.</p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Current Plan</th>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-cyan" />
                    No pending subscription requests.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-200">
                    <td className="px-6 py-4 font-bold">{req.profiles?.full_name}</td>
                    <td className="px-6 py-4 capitalize">{req.profiles?.plan_type}</td>
                    <td className="px-6 py-4 font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded inline-block mt-3">{req.transaction_id}</td>
                    <td className="px-6 py-4 font-bold text-brand-emerald">{req.amount} ৳</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={actionLoading === req.id}
                          className="px-4 py-2 rounded-lg bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Approve
                        </button>
                      </div>
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

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Check, X, CreditCard } from 'lucide-react';

export default function AdminDepositsPage() {
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        *,
        profiles:user_id (id, full_name, plan_type)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setDeposits(data);
    }
    setLoading(false);
  };

  const handleApprove = async (dep: any) => {
    setActionLoading(dep.id);
    try {
      const { error } = await supabase.rpc('approve_deposit', {
        deposit_id: dep.id,
        user_uuid: dep.profiles.id,
        amount: dep.amount
      });
      if (error) throw error;
      setDeposits(prev => prev.filter(d => d.id !== dep.id));
      alert(`Approved ${dep.amount} ৳ deposit for ${dep.profiles.full_name}.`);
    } catch (err: any) {
      alert('Error approving deposit: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (depId: string) => {
    setActionLoading(depId);
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ status: 'rejected' })
        .eq('id', depId);
      if (error) throw error;
      setDeposits(prev => prev.filter(d => d.id !== depId));
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
        <h1 className="text-2xl font-bold mb-2">Advertiser Deposits</h1>
        <p className="text-slate-500 dark:text-slate-400">Review and approve user deposit requests.</p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-cyan" />
                    No pending deposit requests.
                  </td>
                </tr>
              ) : (
                deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-200">
                    <td className="px-6 py-4 font-bold">{dep.profiles?.full_name}</td>
                    <td className="px-6 py-4">{dep.payment_method}</td>
                    <td className="px-6 py-4 font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded inline-block mt-3">{dep.transaction_id}</td>
                    <td className="px-6 py-4 font-bold text-brand-emerald">{Number(dep.amount).toFixed(2)} ৳</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(dep.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(dep.id)}
                          disabled={actionLoading === dep.id}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleApprove(dep)}
                          disabled={actionLoading === dep.id}
                          className="px-4 py-2 rounded-lg bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === dep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
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

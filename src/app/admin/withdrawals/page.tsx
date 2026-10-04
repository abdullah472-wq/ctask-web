'use client';

import { useEffect, useState } from 'react';
import { Landmark, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { approveWithdrawal, rejectWithdrawal } from '@/app/actions/withdrawals';
import toast from 'react-hot-toast';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_number: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load withdrawals');
    } else if (data) {
      setWithdrawals(data as any[]);
    }
    setLoading(false);
  };

  const handleMarkPaid = async (w: Withdrawal) => {
    setProcessingId(w.id);
    const res = await approveWithdrawal(w.id);
    if (res.success) {
      toast.success('Withdrawal marked as paid!');
      fetchWithdrawals();
    } else {
      toast.error(res.error || 'Failed to approve withdrawal');
    }
    setProcessingId(null);
  };

  const handleReject = async (w: Withdrawal) => {
    if (!confirm(`Are you sure you want to reject this withdrawal and refund ${w.amount} ৳ to ${w.profiles?.full_name}?`)) return;
    
    setProcessingId(w.id);
    const res = await rejectWithdrawal(w.id, w.user_id, w.amount);
    if (res.success) {
      toast.success('Withdrawal rejected and refunded!');
      fetchWithdrawals();
    } else {
      toast.error(res.error || 'Failed to reject withdrawal');
    }
    setProcessingId(null);
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
        <h1 className="text-2xl font-bold mb-2">Withdrawal Requests</h1>
        <p className="text-slate-400">Manage and pay out worker withdrawal requests.</p>
      </div>

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Account Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-100">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                    <td className="px-6 py-4 font-medium">{w.profiles?.full_name || 'Unknown User'}</td>
                    <td className="px-6 py-4 font-bold text-brand-emerald">{Number(w.amount).toFixed(2)} ৳</td>
                    <td className="px-6 py-4">{w.method}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{w.account_number}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                        w.status === 'paid' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' : 
                        w.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleMarkPaid(w)}
                            disabled={processingId === w.id}
                            className="px-4 py-2 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-bold transition-colors disabled:opacity-50"
                          >
                            {processingId === w.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Approve'}
                          </button>
                          <button 
                            onClick={() => handleReject(w)}
                            disabled={processingId === w.id}
                            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : w.status === 'paid' ? (
                        <span className="inline-flex items-center justify-end gap-1 text-slate-500 font-bold px-4 py-2 w-full">
                          <CheckCircle className="w-4 h-4" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1 text-red-500 font-bold px-4 py-2 w-full">
                          <XCircle className="w-4 h-4" /> Rejected
                        </span>
                      )}
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

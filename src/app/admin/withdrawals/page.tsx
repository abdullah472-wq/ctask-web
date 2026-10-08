'use client';

import { useEffect, useState } from 'react';
import { Landmark, CheckCircle, Loader2, XCircle, Search, Download } from 'lucide-react';
import { logAdminAction } from '@/utils/activityLogger';
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
  const [searchUserId, setSearchUserId] = useState('');
  const [searchAccount, setSearchAccount] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const downloadCSV = (filteredWithdrawals: any[]) => {
    const headers = ['User ID', 'Name', 'Amount', 'Method', 'Account Number', 'Status', 'Date'];
    const rows = filteredWithdrawals.map(w => [
      w.user_id,
      w.profiles?.full_name || 'Unknown',
      w.amount,
      w.method,
      w.account_number,
      w.status,
      new Date(w.created_at).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `withdrawals_summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Withdrawal Requests</h1>
        <p className="text-slate-400">Manage and pay out worker withdrawal requests.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchUserId}
              onChange={e => setSearchUserId(e.target.value)}
              placeholder="Search by User ID..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchAccount}
              onChange={e => setSearchAccount(e.target.value)}
              placeholder="Search by Account Number..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
        </div>
        <button
          onClick={() => downloadCSV(withdrawals.filter(w => (!searchUserId || w.user_id.toLowerCase().includes(searchUserId.toLowerCase())) && (!searchAccount || (w.account_number || '').toLowerCase().includes(searchAccount.toLowerCase()))))}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download CSV
        </button>
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
                    <td className="px-6 py-4 font-bold text-brand-primary">{Number(w.amount).toFixed(2)} ৳</td>
                    <td className="px-6 py-4">{w.method}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{w.account_number}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                        w.status === 'paid' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 
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
                            className="px-4 py-2 rounded-lg bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent font-bold transition-colors disabled:opacity-50"
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

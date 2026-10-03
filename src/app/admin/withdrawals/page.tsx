'use client';

import { useState } from 'react';
import { Landmark, CheckCircle } from 'lucide-react';

export default function WithdrawalsPage() {
  // Since there is no withdrawals table in the schema yet, we will mock the data.
  // In a real app, you would fetch from a 'withdrawals' table in Supabase.
  const [mockWithdrawals, setMockWithdrawals] = useState([
    { id: 1, user: 'John Doe', amount: 5.50, method: 'bKash', account: '01700000000', status: 'pending', date: '2026-10-03' },
    { id: 2, user: 'Jane Smith', amount: 10.00, method: 'Binance Pay', account: 'jane@example.com', status: 'pending', date: '2026-10-02' }
  ]);

  const handleMarkPaid = (id: number) => {
    setMockWithdrawals(prev => 
      prev.map(w => w.id === id ? { ...w, status: 'paid' } : w)
    );
    alert('Withdrawal marked as paid! (Mocked)');
    // In production:
    // 1. Update withdrawal status to 'paid' in DB
    // 2. Decrement the user's wallet_balance by the withdrawal amount in DB
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Withdrawal Requests</h1>
        <p className="text-slate-400">Manage and pay out worker withdrawal requests.</p>
      </div>

      <div className="bg-dark-card border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Account Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockWithdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{w.user}</td>
                  <td className="px-6 py-4 font-bold text-brand-emerald">${w.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">{w.method}</td>
                  <td className="px-6 py-4 font-mono text-slate-400">{w.account}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                      w.status === 'paid' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === 'pending' ? (
                      <button 
                        onClick={() => handleMarkPaid(w.id)}
                        className="px-4 py-2 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-bold transition-colors"
                      >
                        Mark as Paid
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-bold px-4 py-2">
                        <CheckCircle className="w-4 h-4" /> Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm flex items-center gap-3">
        <Landmark className="w-5 h-5 flex-shrink-0" />
        <p>Note: Currently showing mocked data. To make this fully functional, create a <code>withdrawals</code> table in Supabase.</p>
      </div>
    </>
  );
}

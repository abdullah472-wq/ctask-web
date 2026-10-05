'use client';
import { toast } from 'react-hot-toast';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DepositPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'bKash',
    transaction_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('deposits')
        .insert({
          user_id: session.user.id,
          amount: Number(formData.amount),
          payment_method: formData.payment_method,
          transaction_id: formData.transaction_id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Deposit request submitted! Please wait for admin approval.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Error submitting deposit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-brand-cyan/10 text-brand-cyan rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Deposit Funds</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Load your deposit balance to become an Advertiser and post your own tasks.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
          <strong>Instructions:</strong> Send the exact amount to our official numbers below. Then, enter the Transaction ID you received via SMS.
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>bKash Personal: <strong>01312200043</strong></li>
            <li>Nagad Personal: <strong>01312200043</strong></li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Deposit Amount (৳)</label>
              <input 
                type="number"
                min="50"
                step="1"
                name="amount"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                placeholder="Min 50 ৳"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
              >
                <option value="bKash" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">bKash</option>
                <option value="Nagad" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Nagad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transaction ID (TrxID)</label>
              <input 
                type="text"
                name="transaction_id"
                required
                value={formData.transaction_id}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors font-mono uppercase"
                placeholder="e.g. 9J4K2..."
              />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Submit Deposit Request
          </button>
        </form>
      </div>
    </div>
  );
}

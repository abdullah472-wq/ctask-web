'use client';
import { toast } from 'react-hot-toast';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, PlusCircle, AlertCircle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserCreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [depositBalance, setDepositBalance] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_url: '',
    reward_amount: '',
    total_slots: '',
    proof_instruction: '',
    category_id: '',
    subcategory_id: '',
    is_premium: false
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('task_categories').select('*').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.category_id) {
        setSubcategories([]);
        return;
      }
      const { data } = await supabase
        .from('task_subcategories')
        .select('*')
        .eq('category_id', formData.category_id)
        .order('name');
      if (data) setSubcategories(data);
    };
    fetchSubcategories();
  }, [formData.category_id]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data } = await supabase
        .from('profiles')
        .select('deposit_balance')
        .eq('id', session.user.id)
        .single();
      
      if (data) setDepositBalance(Number(data.deposit_balance));
    }
    setLoading(false);
  };

  const calculateCost = () => {
    const reward = Number(formData.reward_amount) || 0;
    const slots = Number(formData.total_slots) || 0;
    const subtotal = reward * slots;
    const commission = subtotal * 0.10; // 10% admin commission
    return { subtotal, commission, total: subtotal + commission };
  };

  const { total: totalCost } = calculateCost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    if (totalCost > depositBalance) {
      toast.error('Insufficient deposit balance. Please deposit more funds.');
      return;
    }

    setSubmitting(true);

    try {
      // Deduct balance first via atomic RPC
      const { error: deductError } = await supabase.rpc('deduct_deposit_for_task', {
        user_uuid: userId,
        total_cost: totalCost
      });

      if (deductError) throw deductError;

      // Insert Task
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: formData.title,
          description: formData.description,
          task_url: formData.task_url,
          reward_amount: Number(formData.reward_amount),
          total_slots: Number(formData.total_slots),
          completed_slots: 0,
          proof_instruction: formData.proof_instruction,
          category_id: formData.category_id,
          subcategory_id: formData.subcategory_id,
          is_premium: formData.is_premium,
          is_active: true,
          creator_id: userId
        });

      if (insertError) throw insertError;

      toast.success('Task created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Error creating task: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Post a New Task</h1>
          <p className="text-slate-500 dark:text-slate-400">Create tasks as an Advertiser for workers to complete.</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-brand-cyan/30 px-4 py-2 rounded-xl text-center shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Deposit Balance</p>
          <p className="text-xl font-mono font-black text-brand-cyan">{depositBalance.toFixed(2)} ৳</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            
            {/* Premium Checkbox */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
              <input 
                type="checkbox"
                id="is_premium"
                name="is_premium"
                checked={formData.is_premium}
                onChange={handleChange}
                className="w-5 h-5 accent-yellow-500 rounded border-slate-700"
              />
              <label htmlFor="is_premium" className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white">
                <Crown className="w-5 h-5 text-yellow-500" />
                Make this a Premium Task
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                >
                  <option value="" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                <select
                  name="subcategory_id"
                  value={formData.subcategory_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.category_id}
                  className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors disabled:opacity-50"
                >
                  <option value="" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Select Subcategory</option>
                  {subcategories.map(sc => (
                    <option key={sc.id} value={sc.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
              <input 
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                placeholder="e.g. Subscribe to YouTube Channel"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Description</label>
              <textarea 
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors h-24 resize-none"
                placeholder="Explain what the worker needs to do..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target URL</label>
              <input 
                type="url"
                name="task_url"
                required
                value={formData.task_url}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reward Amount per Slot (৳)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.50"
                  name="reward_amount"
                  required
                  value={formData.reward_amount}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                  placeholder="5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Slots</label>
                <input 
                  type="number"
                  min="1"
                  name="total_slots"
                  required
                  value={formData.total_slots}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proof Instructions</label>
              <textarea 
                name="proof_instruction"
                required
                value={formData.proof_instruction}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors h-24 resize-none"
                placeholder="What exactly should the worker submit as proof?"
              />
            </div>
          </div>

          {/* Cost Summary */}
          {totalCost > 0 && (
            <div className={`p-4 rounded-xl border ${totalCost > depositBalance ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
              <h3 className="font-bold mb-2">Cost Summary</h3>
              <div className="flex justify-between text-sm mb-1">
                <span>Task Cost ({formData.reward_amount} × {formData.total_slots}):</span>
                <span>{calculateCost().subtotal.toFixed(2)} ৳</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span>Admin Commission (10%):</span>
                <span>{calculateCost().commission.toFixed(2)} ৳</span>
              </div>
              <div className="flex justify-between font-bold border-t border-current pt-2">
                <span>Total Deduction:</span>
                <span>{totalCost.toFixed(2)} ৳</span>
              </div>
              
              {totalCost > depositBalance && (
                <div className="mt-3 flex items-start gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Insufficient deposit balance. Please deposit funds first.
                </div>
              )}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={submitting || totalCost > depositBalance || totalCost === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            Publish Task ({totalCost.toFixed(2)} ৳)
          </button>
        </form>
      </div>
    </div>
  );
}

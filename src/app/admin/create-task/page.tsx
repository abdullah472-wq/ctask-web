'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, PlusCircle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTaskPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_url: '',
    reward_amount: '',
    total_slots: '',
    proof_instruction: '',
    category_id: '',
    subcategory_id: '',
    is_premium: false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
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
        is_active: true
      });

    if (error) {
      alert('Error creating task: ' + error.message);
    } else {
      alert('Task created successfully!');
      router.push('/admin/manage-tasks');
    }
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create New Task</h1>
        <p className="text-slate-500 dark:text-slate-400">Launch a new task for workers to complete.</p>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reward Amount (৳)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
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
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            Publish Task
          </button>
        </form>
      </div>
    </div>
  );
}

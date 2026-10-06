'use client';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Plus, CreditCard, Copy, PlusCircle, AlertCircle, Crown, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DepositAndTaskPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'deposit' | 'task'>('deposit');
  const [loading, setLoading] = useState(true);
  
  // Deposit State
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositData, setDepositData] = useState({
    amount: '',
    payment_method: 'bKash',
    transaction_id: ''
  });

  // Task State
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [depositBalance, setDepositBalance] = useState(0);
  const [hasApprovedDeposit, setHasApprovedDeposit] = useState(false);

  const [taskData, setTaskData] = useState({
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
    fetchProfileAndStatus();
    fetchCategories();
  }, []);

  const fetchProfileAndStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('deposit_balance')
        .eq('id', session.user.id)
        .single();
      
      if (profile) setDepositBalance(Number(profile.deposit_balance));

      const { count } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'approved');

      setHasApprovedDeposit(Number(profile?.deposit_balance) > 0 || (count || 0) > 0);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('task_categories').select('*').order('name');
    if (data) setCategories(data);
  };

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!taskData.category_id) {
        setSubcategories([]);
        return;
      }
      const { data } = await supabase
        .from('task_subcategories')
        .select('*')
        .eq('category_id', taskData.category_id)
        .order('name');
      if (data) setSubcategories(data);
    };
    fetchSubcategories();
  }, [taskData.category_id]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSubmitting(true);

    try {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('deposits')
        .insert({
          user_id: userId,
          amount: Number(depositData.amount),
          payment_method: depositData.payment_method,
          transaction_id: depositData.transaction_id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Deposit request submitted! Please wait for admin approval.');
      setDepositData({ amount: '', payment_method: 'bKash', transaction_id: '' });
    } catch (err: any) {
      toast.error('Error submitting deposit: ' + err.message);
    } finally {
      setDepositSubmitting(false);
    }
  };

  const calculateCost = () => {
    const reward = Number(taskData.reward_amount) || 0;
    const slots = Number(taskData.total_slots) || 0;
    const subtotal = reward * slots;
    const commission = subtotal * 0.10; // 10% admin commission
    return { subtotal, commission, total: subtotal + commission };
  };

  const { total: totalCost } = calculateCost();

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    if (totalCost > depositBalance) {
      toast.error('Insufficient deposit balance. Please deposit more funds.');
      return;
    }

    setTaskSubmitting(true);

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
          title: taskData.title,
          description: taskData.description,
          task_url: taskData.task_url,
          reward_amount: Number(taskData.reward_amount),
          total_slots: Number(taskData.total_slots),
          completed_slots: 0,
          proof_instruction: taskData.proof_instruction,
          category_id: taskData.category_id,
          subcategory_id: taskData.subcategory_id,
          is_premium: taskData.is_premium,
          is_active: true,
          status: 'pending', // strict pending for admin approval
          creator_id: userId
        });

      if (insertError) {
        // Refund if insertion failed
        await supabase.rpc('add_deposit_balance', {
          user_uuid: userId,
          amount: totalCost
        });
        throw insertError;
      }

      toast.success('Task created successfully! It is now pending admin approval.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Error creating task: ' + err.message);
    } finally {
      setTaskSubmitting(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${activeTab === 'deposit' ? 'bg-white dark:bg-[#0f172a] text-brand-accent shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <CreditCard className="w-5 h-5" />
          Make Deposit
        </button>
        <button
          onClick={() => setActiveTab('task')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${activeTab === 'task' ? 'bg-white dark:bg-[#0f172a] text-brand-cyan shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <PlusCircle className="w-5 h-5" />
          Post Task
        </button>
      </div>

      {activeTab === 'deposit' && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-3">Deposit Funds</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Load your deposit balance to become an Advertiser and post your own tasks.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
            <strong>Instructions:</strong> Send the exact amount to our official numbers below. Then, enter the Transaction ID you received via SMS.
            <ul className="mt-3 space-y-2">
              <li className="flex items-center flex-wrap gap-2">
                <span className="w-32 font-medium">bKash Personal:</span>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('01581818368');
                    toast.success('bKash number copied!');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 dark:bg-blue-800/40 text-blue-900 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-700/50 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                >
                  <strong className="tracking-wider text-sm font-mono">01581818368</strong>
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </li>
              <li className="flex items-center flex-wrap gap-2">
                <span className="w-32 font-medium">Nagad Personal:</span>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('01312200043');
                    toast.success('Nagad number copied!');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 dark:bg-blue-800/40 text-blue-900 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-700/50 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                >
                  <strong className="tracking-wider text-sm font-mono">01312200043</strong>
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>

          <form onSubmit={handleDepositSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Deposit Amount (৳)</label>
                <input 
                  type="number"
                  min="50"
                  step="1"
                  required
                  value={depositData.amount}
                  onChange={e => setDepositData({...depositData, amount: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Min 50 ৳"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                <select
                  value={depositData.payment_method}
                  onChange={e => setDepositData({...depositData, payment_method: e.target.value})}
                  className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] transition-colors"
                >
                  <option value="bKash" className="bg-white dark:bg-[#0f172a]">bKash</option>
                  <option value="Nagad" className="bg-white dark:bg-[#0f172a]">Nagad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transaction ID (TrxID)</label>
                <input 
                  type="text"
                  required
                  value={depositData.transaction_id}
                  onChange={e => setDepositData({...depositData, transaction_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors font-mono uppercase"
                  placeholder="e.g. 9J4K2..."
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={depositSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
            >
              {depositSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Submit Deposit Request
            </button>
          </form>
        </div>
      )}

      {activeTab === 'task' && !hasApprovedDeposit && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Feature Locked</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            🔒 Please make an approved deposit first to unlock the ability to post tasks and become an advertiser.
          </p>
          <button 
            onClick={() => setActiveTab('deposit')}
            className="px-6 py-3 rounded-xl bg-brand-accent text-white font-bold hover:bg-brand-primary transition-colors"
          >
            Go to Deposit
          </button>
        </div>
      )}

      {activeTab === 'task' && hasApprovedDeposit && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Post a New Task</h1>
              <p className="text-slate-500 dark:text-slate-400">Create tasks as an Advertiser for workers to complete.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl text-center shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Deposit Balance</p>
              <p className="text-xl font-mono font-black text-brand-cyan">{depositBalance.toFixed(2)} ৳</p>
            </div>
          </div>

          <form onSubmit={handleTaskSubmit} className="space-y-6">
            <div className="space-y-4">
              
              {/* Premium Checkbox */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
                <input 
                  type="checkbox"
                  id="is_premium"
                  checked={taskData.is_premium}
                  onChange={e => setTaskData({...taskData, is_premium: e.target.checked})}
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
                    value={taskData.category_id}
                    onChange={e => setTaskData({...taskData, category_id: e.target.value})}
                    required
                    className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE]"
                  >
                    <option value="" className="bg-white dark:bg-[#0f172a]">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#0f172a]">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                  <select
                    value={taskData.subcategory_id}
                    onChange={e => setTaskData({...taskData, subcategory_id: e.target.value})}
                    required
                    disabled={!taskData.category_id}
                    className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] disabled:opacity-50"
                  >
                    <option value="" className="bg-white dark:bg-[#0f172a]">Select Subcategory</option>
                    {subcategories.map(sc => (
                      <option key={sc.id} value={sc.id} className="bg-white dark:bg-[#0f172a]">{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
                <input 
                  required
                  value={taskData.title}
                  onChange={e => setTaskData({...taskData, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan"
                  placeholder="e.g. Subscribe to YouTube Channel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Description</label>
                <textarea 
                  required
                  value={taskData.description}
                  onChange={e => setTaskData({...taskData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan h-24 resize-none"
                  placeholder="Explain what the worker needs to do..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target URL</label>
                <input 
                  type="url"
                  required
                  value={taskData.task_url}
                  onChange={e => setTaskData({...taskData, task_url: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reward per Slot (৳)</label>
                  <input 
                    type="number" step="0.01" min="0.50"
                    required
                    value={taskData.reward_amount}
                    onChange={e => setTaskData({...taskData, reward_amount: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan"
                    placeholder="5.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Slots</label>
                  <input 
                    type="number" min="1"
                    required
                    value={taskData.total_slots}
                    onChange={e => setTaskData({...taskData, total_slots: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proof Instructions</label>
                <textarea 
                  required
                  value={taskData.proof_instruction}
                  onChange={e => setTaskData({...taskData, proof_instruction: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan h-24 resize-none"
                  placeholder="What exactly should the worker submit as proof?"
                />
              </div>
            </div>

            {/* Cost Summary */}
            {totalCost > 0 && (
              <div className={`p-4 rounded-xl border ${totalCost > depositBalance ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                <h3 className="font-bold mb-2">Cost Summary</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span>Task Cost ({taskData.reward_amount} × {taskData.total_slots}):</span>
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
              disabled={taskSubmitting || totalCost > depositBalance || totalCost === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale shadow-lg"
            >
              {taskSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              Publish Task ({totalCost.toFixed(2)} ৳)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

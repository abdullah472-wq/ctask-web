'use client';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  Loader2, Plus, CreditCard, Copy, PlusCircle, AlertCircle, Crown, Lock,
  Image as ImageIcon, Upload, X, Link as LinkIcon, CheckCircle2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { submitDepositRequest } from '@/app/actions/deposits';
import { getSiteSettings } from '@/app/actions/siteSettings';
import { logActivity } from '@/utils/logger';

export default function DepositAndTaskPage() {
  const router = useRouter();
  const t = useTranslations('DepositPage');
  const [activeTab, setActiveTab] = useState<'deposit' | 'task'>('deposit');
  const [loading, setLoading] = useState(true);
  const [minDepositAmount, setMinDepositAmount] = useState(50);

  // Deposit State
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositData, setDepositData] = useState({
    amount: '',
    payment_method: 'bKash',
    transaction_id: ''
  });

  // Task State
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [depositBalance, setDepositBalance] = useState(0);
  const [hasApprovedDeposit, setHasApprovedDeposit] = useState(false);

  const [taskData, setTaskData] = useState({
    title: '',
    title_bn: '',
    description: '',
    description_bn: '',
    task_url: '',
    reward_amount: '',
    total_slots: '',
    proof_instruction: '',
    proof_instruction_bn: '',
    category_id: '',
    subcategory_id: '',
    is_premium: false,
    expires_at: '',
  });

  // Reference Image State
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>('');
  const [referenceImageUrlInput, setReferenceImageUrlInput] = useState<string>('');

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'task') {
        setActiveTab('task');
      }
    }
  }, []);

  useEffect(() => {
    fetchProfileAndStatus();
    fetchCategories();
    fetchMinDeposit();
  }, []);

  const fetchMinDeposit = async () => {
    try {
      const res = await getSiteSettings();
      if (res.success && res.data?.min_deposit_amount) {
        setMinDepositAmount(res.data.min_deposit_amount);
      }
    } catch {
      // Keep default 50
    }
  };

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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setReferenceImageFile(file);
      setReferenceImagePreview(URL.createObjectURL(file));
      setReferenceImageUrlInput('');
    }
  };

  const handleRemoveImage = () => {
    setReferenceImageFile(null);
    setReferenceImagePreview('');
    setReferenceImageUrlInput('');
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setReferenceImageUrlInput(url);
    if (url.trim()) {
      setReferenceImageFile(null);
      setReferenceImagePreview(url.trim());
    } else {
      setReferenceImagePreview('');
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSubmitting(true);

    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id || null;
      }
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id || null;
      }

      if (!currentUserId) {
        toast.error('You must be logged in to submit a deposit.');
        return;
      }

      const res = await submitDepositRequest({
        userId: currentUserId,
        amount: Number(depositData.amount),
        paymentMethod: depositData.payment_method,
        transactionId: depositData.transaction_id
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit deposit');
      }

      toast.success(t('depositSuccessMsg'));
      setDepositData({ amount: '', payment_method: 'bKash', transaction_id: '' });
      fetchProfileAndStatus();
    } catch (err: any) {
      toast.error(t('depositErrorMsg') + ' ' + err.message);
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
      toast.error(t('insufficientBalanceError'));
      return;
    }

    setTaskSubmitting(true);

    let finalReferenceImageUrl: string | null = referenceImageUrlInput.trim() || null;

    // 1. Upload reference image if file is selected
    if (referenceImageFile) {
      setUploadingImage(true);
      try {
        const fileExt = referenceImageFile.name.split('.').pop() || 'png';
        const filePath = `reference-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadErr } = await supabase.storage
          .from('task-proofs')
          .upload(filePath, referenceImageFile);

        if (uploadErr) {
          throw uploadErr;
        }

        const { data: publicUrlData } = supabase.storage
          .from('task-proofs')
          .getPublicUrl(filePath);

        finalReferenceImageUrl = publicUrlData.publicUrl;
      } catch (uploadErr: any) {
        console.error('Error uploading reference image:', uploadErr);
        toast.error('Failed to upload reference image: ' + (uploadErr.message || 'Storage error'));
        setTaskSubmitting(false);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      // 2. Deduct balance first via atomic RPC
      const { error: deductError } = await supabase.rpc('deduct_deposit_for_task', {
        user_uuid: userId,
        total_cost: totalCost
      });

      if (deductError) throw deductError;

      const selectedCategory = categories.find(c => c.id === taskData.category_id);

      const basePayload: Record<string, any> = {
        title: taskData.title,
        description: taskData.description,
        task_url: taskData.task_url || null,
        reward_amount: Number(taskData.reward_amount),
        total_slots: Number(taskData.total_slots),
        completed_slots: 0,
        proof_instruction: taskData.proof_instruction,
        category_id: taskData.category_id || null,
        category: selectedCategory?.name || 'Others',
        subcategory_id: taskData.subcategory_id || null,
        is_premium: taskData.is_premium,
        expires_at: taskData.expires_at ? new Date(taskData.expires_at).toISOString() : null,
        is_active: true,
        status: 'pending', // strict pending for admin approval
        creator_id: userId
      };

      const fullPayload: Record<string, any> = {
        ...basePayload,
        title_bn: taskData.title_bn || null,
        description_bn: taskData.description_bn || null,
        proof_instruction_bn: taskData.proof_instruction_bn || null,
        reference_image_url: finalReferenceImageUrl || null,
      };

      // 3. Attempt Insert with full bilingual & reference image payload
      let { error: insertError } = await supabase
        .from('tasks')
        .insert(fullPayload);

      // Gracefully retry with basePayload if DB missing columns in schema cache
      if (insertError && (
        insertError.message.includes('column') || 
        insertError.message.includes('schema cache') || 
        insertError.message.includes('description_bn') || 
        insertError.message.includes('title_bn') || 
        insertError.message.includes('proof_instruction_bn') ||
        insertError.message.includes('reference_image_url') ||
        (insertError as any).code === 'PGRST204'
      )) {
        console.warn('Tasks table missing columns in schema cache, retrying with base schema...', insertError.message);
        const fallbackResult = await supabase
          .from('tasks')
          .insert(basePayload);
        insertError = fallbackResult.error;
      }

      if (insertError) {
        // Refund if insertion failed
        await supabase.rpc('add_deposit_balance', {
          user_uuid: userId,
          amount: totalCost
        });
        throw insertError;
      }

      await logActivity({
        userId: userId || undefined,
        actionType: 'task',
        description: `Created a new task: ${taskData.title}`,
        role: 'creator',
      });

      toast.success(t('taskSuccessMsg'));
      router.push('/dashboard/manage-tasks');
    } catch (err: any) {
      toast.error(t('taskErrorMsg') + ' ' + err.message);
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
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-16">

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${activeTab === 'deposit' ? 'bg-white dark:bg-[#0f172a] text-brand-accent shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <CreditCard className="w-5 h-5" />
          {t('makeDepositTab')}
        </button>
        <button
          onClick={() => setActiveTab('task')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${activeTab === 'task' ? 'bg-white dark:bg-[#0f172a] text-brand-cyan shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <PlusCircle className="w-5 h-5" />
          {t('postTaskTab')}
        </button>
      </div>

      {activeTab === 'deposit' && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3 text-slate-900 dark:text-white">{t('depositFundsTitle')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              {t('depositFundsSubtitle')}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6 text-sm text-blue-800 dark:text-blue-300">
            <strong>{t('depositInstructions')}</strong> {t('depositInstructionsText')}
            <ul className="mt-3 space-y-2">
              <li className="flex items-center flex-wrap gap-2">
                <span className="w-32 font-medium">bKash Personal:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('01581818368');
                    toast.success(t('bkashNumberCopied'));
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
                    toast.success(t('nagadNumberCopied'));
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
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('depositAmountLabel')}</label>
                <input
                  type="number"
                  min={minDepositAmount}
                  step="1"
                  required
                  value={depositData.amount}
                  onChange={e => setDepositData({ ...depositData, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder={`${t('depositAmountPlaceholder')} (Min: ${minDepositAmount} ৳)`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('paymentMethodLabel')}</label>
                <select
                  value={depositData.payment_method}
                  onChange={e => setDepositData({ ...depositData, payment_method: e.target.value })}
                  className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-primary transition-colors"
                >
                  <option value="bKash" className="bg-white dark:bg-[#0f172a]">bKash</option>
                  <option value="Nagad" className="bg-white dark:bg-[#0f172a]">Nagad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('transactionIdLabel')}</label>
                <input
                  type="text"
                  required
                  value={depositData.transaction_id}
                  onChange={e => setDepositData({ ...depositData, transaction_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors font-mono uppercase"
                  placeholder={t('transactionIdPlaceholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={depositSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
            >
              {depositSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {t('submitDepositBtn')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'task' && !hasApprovedDeposit && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-14 shadow-sm text-center max-w-xl mx-auto">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{t('featureLockedTitle')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            {t('featureLockedDesc')}
          </p>
          <button
            onClick={() => setActiveTab('deposit')}
            className="px-6 py-3 rounded-xl bg-brand-accent text-white font-bold hover:bg-brand-primary transition-colors shadow-md"
          >
            {t('goToDepositBtn')}
          </button>
        </div>
      )}

      {activeTab === 'task' && hasApprovedDeposit && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('postTaskTitle')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
                {t('postTaskSubtitle')}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl text-center sm:text-right shadow-sm shrink-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-0.5">{t('depositBalanceBox')}</p>
              <p className="text-2xl font-mono font-black text-brand-primary dark:text-[#00F2FE]">{depositBalance.toFixed(2)} ৳</p>
            </div>
          </div>

          <form onSubmit={handleTaskSubmit} className="space-y-8">
            
            {/* Section 1: Premium & Categories */}
            <div className="space-y-4">
              {/* Premium Checkbox */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
                <input
                  type="checkbox"
                  id="is_premium"
                  checked={taskData.is_premium}
                  onChange={e => setTaskData({ ...taskData, is_premium: e.target.checked })}
                  className="w-5 h-5 accent-yellow-500 rounded border-slate-700"
                />
                <label htmlFor="is_premium" className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {t('makePremiumTask')}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('categoryLabel')}</label>
                  <select
                    value={taskData.category_id}
                    onChange={e => setTaskData({ ...taskData, category_id: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:border-brand-accent transition-colors"
                  >
                    <option value="" disabled hidden className="bg-white dark:bg-[#0f172a]">{t('selectCategory')}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-[#0f172a]">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('subcategoryLabel')}</label>
                  <select
                    value={taskData.subcategory_id}
                    onChange={e => setTaskData({ ...taskData, subcategory_id: e.target.value })}
                    required
                    disabled={!taskData.category_id}
                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
                  >
                    <option value="" disabled hidden className="bg-white dark:bg-[#0f172a]">{t('selectSubcategory')}</option>
                    {subcategories.map(sc => (
                      <option key={sc.id} value={sc.id} className="bg-white dark:bg-[#0f172a]">{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* Section 2: Task Title (English & Bengali) */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Task Title</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('taskTitleLabel')} (English)
                  </label>
                  <input
                    required
                    value={taskData.title}
                    onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder={t('taskTitlePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('taskTitleLabel')} (Bengali) <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    value={taskData.title_bn}
                    onChange={e => setTaskData({ ...taskData, title_bn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="উদাঃ ফেসবুকে লাইক এবং ফলো করা"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Task Instructions (English & Bengali) */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Task Instructions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('taskDescLabel')} (English)
                  </label>
                  <textarea
                    required
                    value={taskData.description}
                    onChange={e => setTaskData({ ...taskData, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                    placeholder={t('taskDescPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('taskDescLabel')} (Bengali) / কাজের নির্দেশনা <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={taskData.description_bn}
                    onChange={e => setTaskData({ ...taskData, description_bn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                    placeholder="কর্মীকে কী করতে হবে তা বাংলায় বিস্তারিত লিখুন..."
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Reference Image (NEW) */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-white/[0.02] space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <ImageIcon className="w-4 h-4 text-brand-accent" />
                  Reference Screenshot / নমুনা ছবি <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Attach an example image/screenshot so workers understand exactly what the task or proof should look like.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Option A: File Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload Screenshot File
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-accent dark:hover:border-brand-accent rounded-xl p-4 cursor-pointer transition-colors bg-white dark:bg-dark-card/60 group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-accent transition-colors mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
                      Click to browse or drop image
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Option B: Direct URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Or Paste Direct Image Link
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="url"
                      value={referenceImageUrlInput}
                      onChange={handleImageUrlChange}
                      placeholder="https://example.com/screenshot.png"
                      className="w-full bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Direct link from Imgur, PostImages, or any public image URL.
                  </p>
                </div>
              </div>

              {/* Live Preview Card */}
              {referenceImagePreview && (
                <div className="mt-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                      src={referenceImagePreview}
                      alt="Reference Preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toast.error('Unable to load preview from this URL');
                        setReferenceImagePreview('');
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reference Image Attached</span>
                      {referenceImageFile && (
                        <span className="text-slate-400 font-normal">({(referenceImageFile.size / 1024).toFixed(0)} KB)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 max-w-md">
                      {referenceImageFile ? referenceImageFile.name : referenceImageUrlInput}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}
            </div>

            {/* Section 5: Target URL & Expiry Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('targetUrlLabel')} <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={taskData.task_url}
                  onChange={e => setTaskData({ ...taskData, task_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder={t('targetUrlPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Expiry Date <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={taskData.expires_at}
                  onChange={e => setTaskData({ ...taskData, expires_at: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Section 6: Reward & Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('rewardPerSlotLabel')}</label>
                <input
                  type="number" 
                  step="0.01" 
                  min="0.50"
                  required
                  value={taskData.reward_amount}
                  onChange={e => setTaskData({ ...taskData, reward_amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('totalSlotsLabel')}</label>
                <input
                  type="number" 
                  min="1"
                  required
                  value={taskData.total_slots}
                  onChange={e => setTaskData({ ...taskData, total_slots: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Section 7: Proof Requirements */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Proof Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('proofInstructionsLabel')} (English)
                  </label>
                  <textarea
                    required
                    value={taskData.proof_instruction}
                    onChange={e => setTaskData({ ...taskData, proof_instruction: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                    placeholder={t('proofInstructionsPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('proofInstructionsLabel')} (Bengali) / প্রমাণের প্রয়োজনীয়তা <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={taskData.proof_instruction_bn}
                    onChange={e => setTaskData({ ...taskData, proof_instruction_bn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                    placeholder="প্রমাণ হিসেবে কর্মীকে কী জমা দিতে হবে তা বাংলায় লিখুন..."
                  />
                </div>
              </div>
            </div>

            {/* Cost Summary Box */}
            {totalCost > 0 && (
              <div className={`p-5 rounded-2xl border transition-colors ${totalCost > depositBalance ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                <h3 className="font-bold text-base mb-3">{t('costSummaryTitle')}</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>{t('taskCostLabel')} ({taskData.reward_amount || '0'} × {taskData.total_slots || '0'} slots):</span>
                    <span className="font-semibold">{calculateCost().subtotal.toFixed(2)} ৳</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('adminCommissionLabel')}:</span>
                    <span className="font-semibold">{calculateCost().commission.toFixed(2)} ৳</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-current/20 pt-2.5 mt-2">
                    <span>{t('totalDeductionLabel')}:</span>
                    <span>{totalCost.toFixed(2)} ৳</span>
                  </div>
                </div>

                {totalCost > depositBalance && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-between gap-3 text-xs font-bold text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{t('insufficientBalanceError')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('deposit')}
                      className="underline font-extrabold hover:opacity-80 shrink-0"
                    >
                      Deposit Now →
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={taskSubmitting || uploadingImage || totalCost > depositBalance || totalCost === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale shadow-lg shadow-brand-primary/20"
            >
              {taskSubmitting || uploadingImage ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{uploadingImage ? 'Uploading Reference Image...' : 'Submitting Campaign...'}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>{t('publishTaskBtn')} ({totalCost.toFixed(2)} ৳)</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

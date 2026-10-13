'use client';
import { toast } from 'react-hot-toast';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { logActivity } from '@/utils/logger';
import { Loader2, PlusCircle, Crown, Image as ImageIcon, Upload, X, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTaskPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalReferenceImageUrl: string | null = referenceImageUrlInput.trim() || null;

    // 1. Upload reference image file if provided
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
        setSubmitting(false);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    const selectedCategory = categories.find(c => c.id === formData.category_id);

    const basePayload: Record<string, any> = {
      title: formData.title,
      description: formData.description,
      task_url: formData.task_url || null,
      reward_amount: Number(formData.reward_amount),
      total_slots: Number(formData.total_slots),
      completed_slots: 0,
      proof_instruction: formData.proof_instruction,
      category_id: formData.category_id || null,
      category: selectedCategory?.name || 'Others',
      subcategory_id: formData.subcategory_id || null,
      is_premium: formData.is_premium,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: true,
      status: 'approved'
    };

    const fullPayload: Record<string, any> = {
      ...basePayload,
      title_bn: formData.title_bn || null,
      description_bn: formData.description_bn || null,
      proof_instruction_bn: formData.proof_instruction_bn || null,
      reference_image_url: finalReferenceImageUrl || null,
    };

    // Attempt insertion with bilingual columns and reference image first
    let { error } = await supabase
      .from('tasks')
      .insert(fullPayload);

    // If Supabase schema cache is missing bilingual or reference_image_url columns, gracefully retry with basePayload
    if (error && (
      error.message.includes('column') || 
      error.message.includes('schema cache') || 
      error.message.includes('description_bn') || 
      error.message.includes('title_bn') || 
      error.message.includes('proof_instruction_bn') ||
      error.message.includes('reference_image_url') ||
      (error as any).code === 'PGRST204'
    )) {
      console.warn('Tasks table missing columns in schema cache, retrying with base schema...', error.message);
      const fallbackResult = await supabase
        .from('tasks')
        .insert(basePayload);

      if (!fallbackResult.error) {
        await logActivity({
          actionType: 'task',
          description: `Created a new task: ${formData.title}`,
          role: 'admin',
        });
        toast.success('Task created! (Run schema-tasks-bilingual.sql in Supabase to save Bengali fields & reference image)');
        router.push('/admin/manage-tasks');
        setSubmitting(false);
        return;
      }
      error = fallbackResult.error;
    }

    if (error) {
      toast.error('Error creating task: ' + error.message);
    } else {
      await logActivity({
        actionType: 'task',
        description: `Created a new task: ${formData.title}`,
        role: 'admin',
      });
      toast.success('Task created successfully!');
      router.push('/admin/manage-tasks');
    }
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create New Task
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
          Launch a new task for workers with bilingual instructions and reference guides.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Premium & Category */}
          <div className="space-y-4">
            {/* Premium Checkbox */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
              <input 
                type="checkbox"
                id="is_premium"
                name="is_premium"
                checked={formData.is_premium}
                onChange={handleChange}
                className="w-5 h-5 accent-yellow-500 rounded border-slate-700"
              />
              <label htmlFor="is_premium" className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                <Crown className="w-5 h-5 text-yellow-500" />
                Make this a Premium Task
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="" disabled hidden className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                <select
                  name="subcategory_id"
                  value={formData.subcategory_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.category_id}
                  className="w-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
                >
                  <option value="" disabled hidden className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Select Subcategory</option>
                  {subcategories.map(sc => (
                    <option key={sc.id} value={sc.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800/80" />

          {/* Section 2: Task Titles */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Task Title</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title (English)</label>
                <input 
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="e.g. Subscribe to YouTube Channel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Task Title (Bengali) <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <input 
                  name="title_bn"
                  value={formData.title_bn}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="উদাঃ ইউটিউব চ্যানেল সাবস্ক্রাইব করুন"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Task Instructions */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Task Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Instructions (English)</label>
                <textarea 
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                  placeholder="Explain step-by-step what the worker needs to do..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Task Instructions (Bengali) / কাজের নির্দেশনা <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea 
                  name="description_bn"
                  value={formData.description_bn}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                  placeholder="কর্মীকে কী করতে হবে তা বিস্তারিত বাংলায় লিখুন..."
                />
              </div>
            </div>
          </div>

          {/* Section 4: Reference Image (NEW) */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-white/[0.02] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <ImageIcon className="w-4 h-4 text-brand-accent" />
                  Reference Screenshot / নমুনা ছবি <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Attach an example image/screenshot so workers understand exactly what the task or proof should look like.
                </p>
              </div>
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
                  Works with direct links from Imgur, PostImages, Discord, or any public image URL.
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

          {/* Section 5: Target URL & Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Target URL <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <input 
                type="url"
                name="task_url"
                value={formData.task_url}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="https://facebook.com/... or https://youtube.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Expiry Date <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <input 
                type="datetime-local"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Section 6: Reward & Total Slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Reward Amount (৳)</label>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                name="reward_amount"
                required
                value={formData.reward_amount}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="5.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Total Slots</label>
              <input 
                type="number"
                min="1"
                name="total_slots"
                required
                value={formData.total_slots}
                onChange={handleChange}
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proof Requirements (English)</label>
                <textarea 
                  name="proof_instruction"
                  required
                  value={formData.proof_instruction}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                  placeholder="What exactly should the worker submit as proof? (e.g. Profile link, screenshot of completed action)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Proof Requirements (Bengali) / প্রমাণের প্রয়োজনীয়তা <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea 
                  name="proof_instruction_bn"
                  value={formData.proof_instruction_bn}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-28 resize-y"
                  placeholder="প্রমাণ হিসেবে কর্মীকে কী জমা দিতে হবে তা বাংলায় লিখুন..."
                />
              </div>
            </div>
          </div>
          
          {/* Submit Action */}
          <button 
            type="submit"
            disabled={submitting || uploadingImage}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50"
          >
            {submitting || uploadingImage ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{uploadingImage ? 'Uploading Reference Image...' : 'Publishing Task...'}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>Publish Task</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

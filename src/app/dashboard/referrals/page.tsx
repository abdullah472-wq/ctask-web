'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Copy, Users, CheckCircle, Clock, Download, Info, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface DownlineUser {
  id: string;
  full_name: string;
  created_at: string;
  plan_type: string;
  verification_status: string;
}

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [downline, setDownline] = useState<DownlineUser[]>([]);
  const [showTerms, setShowTerms] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setUserId(session.user.id);

    // Fetch user's referral code and name
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, full_name')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setReferralCode(profile.referral_code || '');
      setUserName(profile.full_name || '');
    }

    // Fetch downline
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, created_at, plan_type, verification_status')
      .eq('referred_by', session.user.id)
      .order('created_at', { ascending: false });

    if (users) {
      setDownline(users);
    }
    
    // Check if user has already submitted a review
    const { data: existingReview } = await supabase
      .from('testimonials')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();
      
    if (existingReview) {
      setHasSubmittedReview(true);
    }

    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard!');
  };
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !reviewText.trim()) return;
    
    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          user_id: userId,
          user_name: userName,
          rating: reviewRating,
          review_text: reviewText,
          status: 'pending'
        });
        
      if (error) throw error;
      
      toast.success('Your review has been submitted for admin approval!');
      setHasSubmittedReview(true);
    } catch (error: any) {
      toast.error('Failed to submit review: ' + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  const promoAssets = [
    { title: 'LinkedIn / Facebook', dimensions: '1200px x 628px', aspectRatio: 'aspect-[1.91/1]' },
    { title: 'Instagram Portrait', dimensions: '1080px x 1350px', aspectRatio: 'aspect-[4/5]' },
    { title: 'Instagram Stories', dimensions: '1080px x 1920px', aspectRatio: 'aspect-[9/16]' },
    { title: 'Instagram Square', dimensions: '1080px x 1080px', aspectRatio: 'aspect-square' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-accent/20 to-brand-primary/20 border border-brand-accent/30 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Referral Program</h1>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Earn money on referrals who join Ctask. Get <span className="font-bold text-brand-primary">5%</span> of each purchase and <span className="font-bold text-brand-accent">5%</span> for each successfully completed job by your referrals.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={copyCode}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-brand-accent/20"
            >
              <Copy className="w-5 h-5" />
              Copy Invite Code
            </button>
            <button 
              onClick={() => setShowTerms(true)}
              className="px-6 py-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Info className="w-5 h-5" />
              About Program
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-500 uppercase mb-2">Your Invite Code</p>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-brand-accent uppercase tracking-wider">{referralCode || 'N/A'}</div>
            <button onClick={copyCode} className="p-2 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors" title="Copy Code">
              <Copy className="w-5 h-5 text-brand-accent" />
            </button>
          </div>
        </div>
      </div>

      {/* Submit Review Card */}
      <div className="bg-gradient-to-br from-[#5A189A]/10 to-[#7B2CBF]/5 border border-[#5A189A]/20 dark:border-[#7B2CBF]/30 rounded-3xl p-8 relative overflow-hidden">
        {!hasSubmittedReview ? (
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold mb-2 text-[#5A189A] dark:text-[#7B2CBF]">Love Ctask? Leave a Review!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Tell us about your experience. Your feedback helps us improve and appears on our homepage.</p>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                ))}
              </div>
              
              <textarea 
                required
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                className="w-full bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] focus:ring-1 focus:ring-[#5A189A] h-32 resize-none transition-colors"
                placeholder="Tell us about your experience..."
              />
              
              <button 
                type="submit"
                disabled={submittingReview}
                className="px-8 py-3 rounded-xl bg-[#5A189A] hover:bg-[#7B2CBF] text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
                Submit Review
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Thank you for your review!</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              We appreciate your feedback. Your review has been received and will be reviewed by our team.
            </p>
          </div>
        )}
      </div>

      {/* Promotional Assets Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Promotional Assets</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Download images you can attach to your post in social networks.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {promoAssets.map((asset, idx) => (
            <div key={idx} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm group">
              <div className={`w-full ${asset.aspectRatio} bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-4 relative overflow-hidden border border-slate-200 dark:border-slate-800/50 flex items-center justify-center`}>
                <span className="text-slate-400 font-medium">Placeholder</span>
              </div>
              <div className="px-2">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{asset.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{asset.dimensions}</p>
                <button className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-accent/10 dark:hover:bg-brand-accent/10 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-brand-accent transition-colors flex items-center justify-center gap-2 font-medium text-sm border border-transparent hover:border-brand-accent/30">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downline Table */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Users in your downline</h2>
          <div className="px-4 py-1.5 rounded-full bg-brand-accent/10 text-brand-accent font-bold text-sm">
            Total: {downline.length}
          </div>
        </div>
        
        {downline.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No referrals yet</h3>
            <p className="text-slate-500 dark:text-slate-400">Share your invite link to start building your downline and earning bonuses.</p>
            {referralCode && (
              <button 
                onClick={copyCode}
                className="mt-6 px-6 py-3 rounded-xl bg-brand-accent/10 text-brand-accent font-bold hover:bg-brand-accent/20 transition-colors"
              >
                Copy Invite Code
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 font-bold">User Name</th>
                  <th className="p-4 font-bold">Joined Date</th>
                  <th className="p-4 font-bold">Plan</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {downline.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {user.full_name}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        user.plan_type === 'premium' 
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-transparent dark:border-white/10'
                      }`}>
                        {user.plan_type || 'Basic'}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.verification_status === 'verified' ? (
                        <span className="flex items-center gap-1.5 text-brand-primary font-medium">
                          <CheckCircle className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <Clock className="w-4 h-4" /> Unverified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-3xl max-w-lg w-full p-8 relative border border-slate-200 dark:border-slate-800 shadow-2xl">
            <button 
              onClick={() => setShowTerms(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4">Program Terms</h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-300">
              <p>1. You will earn a 5% commission when a user you refer completes any task.</p>
              <p>2. You will also earn a 5% commission on any purchases or deposits made by your referrals.</p>
              <p>3. Self-referrals or creating multiple accounts to earn commissions is strictly prohibited and will result in a permanent ban.</p>
              <p>4. Commissions are automatically credited to your wallet balance instantly.</p>
            </div>
            <button 
              onClick={() => setShowTerms(false)}
              className="mt-8 w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
            >
              I Understand
            </button>
          </div>
        </div>
      )}


    </div>
  );
}

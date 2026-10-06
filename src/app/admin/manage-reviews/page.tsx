'use client';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, Star, Clock } from 'lucide-react';
import { logAdminAction } from '@/utils/activityLogger';

export default function ManageReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Client');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Review marked as ${newStatus}`);
    } catch (err: any) {
      toast.error('Error updating status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted successfully');
    } catch (err: any) {
      toast.error('Error deleting review: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('add');
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          user_name: userName,
          rating,
          review_text: reviewText,
          status: 'approved' // manually added reviews are auto-approved
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setReviews(prev => [data, ...prev]);
      toast.success('Review added successfully!');
      
      setModalOpen(false);
      setUserName('');
      setUserRole('Client');
      setRating(5);
      setReviewText('');
    } catch (err: any) {
      toast.error('Error adding review: ' + err.message);
    } finally {
      setActionLoading(null);
    }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Manage Reviews</h1>
          <p className="text-slate-500 dark:text-slate-400">Review and approve user testimonials for the homepage.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-brand-accent hover:opacity-90 text-dark-bg px-4 py-2 rounded-xl font-bold transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Review
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Reviewer</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Review</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-200">
                  <td className="px-6 py-4">
                    <div className="font-bold">{review.user_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-slate-600 dark:text-slate-400">
                      "{review.review_text}"
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {review.status === 'pending' && (
                      <span className="px-2 py-1 rounded text-xs font-bold border inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Clock className="w-3 h-3"/> Pending
                      </span>
                    )}
                    {review.status === 'approved' && (
                      <span className="px-2 py-1 rounded text-xs font-bold border inline-flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="w-3 h-3"/> Approved
                      </span>
                    )}
                    {review.status === 'rejected' && (
                      <span className="px-2 py-1 rounded text-xs font-bold border inline-flex items-center gap-1 bg-red-500/10 text-red-600 border-red-500/20">
                        <XCircle className="w-3 h-3"/> Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(review.id, 'approved')}
                            disabled={actionLoading === review.id}
                            className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors disabled:opacity-50"
                            title="Approve Review"
                          >
                            {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => updateStatus(review.id, 'rejected')}
                            disabled={actionLoading === review.id}
                            className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 transition-colors disabled:opacity-50"
                            title="Reject Review"
                          >
                            {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                      {review.status === 'rejected' && (
                        <button
                          onClick={() => updateStatus(review.id, 'approved')}
                          disabled={actionLoading === review.id}
                          className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors disabled:opacity-50"
                          title="Approve Review"
                        >
                          {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      )}
                      {review.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(review.id, 'rejected')}
                          disabled={actionLoading === review.id}
                          className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 transition-colors disabled:opacity-50"
                          title="Reject Review"
                        >
                          {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
                        title="Delete Review"
                      >
                        {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add New Review</h2>
            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reviewer Name</label>
                <input 
                  type="text" 
                  required
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role/Title (Optional)</label>
                  <input 
                    type="text" 
                    value={userRole}
                    onChange={e => setUserRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="e.g. Client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rating (1-5)</label>
                  <input 
                    type="number" 
                    min="1" max="5" required
                    value={rating}
                    onChange={e => setRating(parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Review Text</label>
                <textarea 
                  required
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-24 resize-none"
                  placeholder="Type the review content here..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading === 'add'}
                  className="flex-[2] py-3 rounded-xl bg-brand-accent text-dark-bg font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                >
                  {actionLoading === 'add' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Add Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

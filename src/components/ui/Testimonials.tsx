'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-indigo-500"
];

export function Testimonials() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6 flex justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
              <div className="h-4 bg-slate-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Loved by Thousands of Users</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            See what our workers and advertisers have to say about their experience on the Ctask platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <div key={review.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(review.rating || 5)].map((_, i) => (
                  <Star key={i} className="text-amber-400 fill-amber-400 h-4 w-4" />
                ))}
              </div>
              
              <p className="text-slate-700 leading-relaxed mb-6 flex-grow italic">
                "{review.review_text}"
              </p>
              
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${COLORS[idx % COLORS.length]}`}>
                  {review.user_name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{review.user_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{review.user_role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

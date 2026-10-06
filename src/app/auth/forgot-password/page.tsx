'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Link href="/auth" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent to-brand-primary flex items-center justify-center font-bold text-white dark:text-dark-bg text-xl mx-auto mb-4 shadow-[0_0_20px_-5px_#7B2CBF]">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Check your inbox</h3>
              <p className="text-slate-500 dark:text-slate-400">
                We've sent a password reset link to <strong>{email}</strong>. Please check your spam folder if you don't see it.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-brand-accent font-bold hover:underline mt-4 inline-block"
              >
                Try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

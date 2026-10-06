'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Mail, Lock, ArrowRight, Loader2, User, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferralCode(ref);
        setIsLogin(false); // Switch to sign up tab
      }
    }
  }, []);

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const fetchClientIP = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clientIp = await fetchClientIP();

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Update IP after login
        if (clientIp) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.from('profiles').update({ last_ip: clientIp }).eq('id', session.user.id);
          }
        }
        
        router.push('/dashboard');
      } else {
        // Signup logic & Anti-Fraud
        if (clientIp) {
          const { data: existingIp } = await supabase
            .from('profiles')
            .select('id')
            .eq('last_ip', clientIp)
            .maybeSingle();

          if (existingIp) {
            throw new Error('একাধিক অ্যাকাউন্ট খোলা নিষেধ! / Multiple accounts not allowed from this device');
          }
        }

        let referredById = null;
        if (referralCode) {
          const { data: refUser } = await supabase
            .from('profiles')
            .select('id, wallet_balance')
            .eq('referral_code', referralCode.toUpperCase())
            .single();
            
          if (refUser) {
            referredById = refUser.id;
            await supabase
              .from('profiles')
              .update({ wallet_balance: Number(refUser.wallet_balance) + 20 })
              .eq('id', refUser.id);
          } else {
            throw new Error('Invalid Referral Code');
          }
        }

        const newReferralCode = generateReferralCode();

        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              referral_code: newReferralCode,
              referred_by: referredById,
              last_ip: clientIp
            },
          },
        });
        if (signUpError) throw signUpError;
        
        if (data.session) {
          // IP is handled in trigger or default, but let's force update here just in case trigger doesn't map meta
          if (clientIp) {
            await supabase.from('profiles').update({ last_ip: clientIp }).eq('id', data.session.user.id);
          }
          router.push('/dashboard');
        } else {
          setError('Please check your email to verify your account.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Image 
              src="/branding.png"
              alt="Ctask Branding"
              width={400}
              height={256}
              className="h-64 w-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isLogin ? 'Sign in to continue earning' : 'Join Ctask and start earning today'}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                    placeholder="John Doe"
                  />
                </div>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                  placeholder="••••••••"
                />
              </div>
              {isLogin && (
                <div className="flex justify-end mt-2">
                  <Link href="/auth/forgot-password" className="text-sm text-brand-accent hover:text-brand-primary transition-colors font-medium">
                    Forgot Password?
                  </Link>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Referral Code (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Gift className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all uppercase"
                    placeholder="ENTER CODE"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Loader2 } from 'lucide-react';

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      // For PKCE flow
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/dashboard';
      const type = searchParams.get('type');

      let sessionToUse = null;

      try {
        if (code) {
          // Explicitly exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          sessionToUse = data.session;
        } else {
          // Fallback: check if session already exists (e.g. Implicit Flow via hash fragment)
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          sessionToUse = data.session;
        }

        if (sessionToUse) {
          // Detect password recovery via searchParams or implicitly
          if (type === 'recovery' || next === '/update-password' || next === '/auth/reset-password') {
            router.push('/update-password');
            return;
          }

          // Run anti-cheat IP tracking logic for OAuth callback/Standard login
          try {
            const res = await fetch('/api/auth/track', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToUse.access_token}`
              }
            });
            const { blocked } = await res.json();
            
            if (blocked) {
              await supabase.auth.signOut();
              setError('Registration blocked: Multiple accounts from the same network or device are not permitted.');
              return;
            }
          } catch (e) {
            console.error('Failed to run IP tracking', e);
          }

          // Auth success
          router.push(next !== '/dashboard' ? next : '/dashboard');
        } else {
          // If no session found right away, wait for onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              if (type === 'recovery' || next === '/update-password') {
                router.push('/update-password');
                return;
              }
              
              try {
                const res = await fetch('/api/auth/track', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  }
                });
                const { blocked } = await res.json();
                if (blocked) {
                  await supabase.auth.signOut();
                  setError('Registration blocked: Multiple accounts from the same network or device are not permitted.');
                  return;
                }
              } catch (e) {}
              router.push(next !== '/dashboard' ? next : '/dashboard');
            } else if (event === 'PASSWORD_RECOVERY') {
              router.push('/update-password');
            }
          });
          
          setTimeout(() => {
            if (!sessionToUse) {
              setError('Authentication failed or timed out. The link may have expired.');
            }
          }, 5000);
          
          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during authentication.');
      }
    };
    
    handleAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center max-w-md shadow-sm">
        <p className="font-bold mb-2">Authentication Error</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => router.push('/auth')}
          className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-brand-primary">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-medium text-slate-600 dark:text-slate-400">Verifying secure link...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin" />}>
        <CallbackLogic />
      </Suspense>
    </div>
  );
}

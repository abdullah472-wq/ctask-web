import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(error?.message || 'Google authentication error')}`
    );
  }

  return NextResponse.redirect(data.url);
}

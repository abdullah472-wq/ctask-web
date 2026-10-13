import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Retrieves the current authenticated user on the server side using Next.js cookies.
 * Returns null if the user is unauthenticated or if an error occurs.
 */
export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // 1. Try to find Supabase auth cookies
    let token = '';

    // Check for chunked cookies first (sb-*-auth-token.0, sb-*-auth-token.1)
    const chunkedCookies = allCookies
      .filter((c) => c.name.includes('-auth-token.') || c.name.includes('supabase-auth-token.'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (chunkedCookies.length > 0) {
      const combinedValue = chunkedCookies.map((c) => c.value).join('');
      try {
        const decoded = combinedValue.startsWith('base64-') 
          ? Buffer.from(combinedValue.replace('base64-', ''), 'base64').toString('utf-8')
          : combinedValue;
        const parsed = JSON.parse(decoded);
        token = Array.isArray(parsed) ? parsed[0] : (parsed.access_token || '');
      } catch {
        token = combinedValue;
      }
    }

    // If no chunked cookie, look for standard cookies
    if (!token) {
      for (const cookie of allCookies) {
        if (
          cookie.name.includes('-auth-token') || 
          cookie.name === 'sb-access-token' || 
          cookie.name === 'supabase-auth-token'
        ) {
          try {
            const raw = cookie.value.startsWith('base64-')
              ? Buffer.from(cookie.value.replace('base64-', ''), 'base64').toString('utf-8')
              : cookie.value;

            if (raw.startsWith('{') || raw.startsWith('[')) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed[0]) {
                token = parsed[0];
                break;
              } else if (parsed.access_token) {
                token = parsed.access_token;
                break;
              }
            } else {
              token = cookie.value;
              break;
            }
          } catch {
            token = cookie.value;
            break;
          }
        }
      }
    }

    if (!token) {
      return null;
    }

    // Verify token with Supabase Auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    return null;
  }
}

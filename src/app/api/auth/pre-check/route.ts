import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const clientIp = ip.split(',')[0].trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // We use the service key because we need to query user_ips without RLS restriction
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingIp } = await adminClient
      .from('user_ips')
      .select('id')
      .eq('ip_address', clientIp)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ exists: !!existingIp, ip: clientIp });
  } catch (err: any) {
    console.error('IP Pre-check Error:', err);
    return NextResponse.json({ exists: false, error: err.message, ip: '127.0.0.1' });
  }
}

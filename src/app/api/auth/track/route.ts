import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const clientIp = ip.split(',')[0].trim();
    const deviceInfo = request.headers.get('user-agent') || 'Unknown Device';

    // 1. Check if IP is used by another user
    const { data: existingIp } = await adminClient
      .from('user_ips')
      .select('user_id')
      .eq('ip_address', clientIp)
      .neq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    // 2. Is this a brand new user? (created in the last 2 minutes)
    const isNewUser = new Date(user.created_at).getTime() > Date.now() - 2 * 60 * 1000;

    // 3. Anti-Cheat: If new user and IP already used by someone else, block and delete
    if (existingIp && isNewUser) {
      await adminClient.auth.admin.deleteUser(user.id);
      return NextResponse.json({ blocked: true });
    }

    // 4. Log the IP for this session
    await adminClient.from('user_ips').insert({
      user_id: user.id,
      ip_address: clientIp,
      device_info: deviceInfo
    });

    // Update last_ip in profiles for consistency
    await adminClient.from('profiles').update({ last_ip: clientIp }).eq('id', user.id);

    return NextResponse.json({ blocked: false });
  } catch (err: any) {
    console.error('Track API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { supabase } from './supabase';

export async function logAdminAction(action: string, details: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('admin_activity_logs').insert({
      admin_id: session.user.id,
      action,
      details
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

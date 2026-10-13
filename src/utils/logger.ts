import { supabase } from './supabase';

export interface LogActivityParams {
  userId?: string | null;
  actionType: 'task' | 'payment' | 'profile' | 'settings' | 'security' | 'system' | string;
  description: string;
  role?: 'worker' | 'admin' | 'creator' | 'system' | string;
}

/**
 * Global Activity Logger
 * Logs actions across the platform into public.activity_logs.
 * Works seamlessly in both server-side (Server Actions, Route Handlers)
 * and client-side (React components) environments.
 */
export async function logActivity(params: LogActivityParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, actionType, description, role = 'worker' } = params;

    // Detect server vs client execution context
    if (typeof window === 'undefined') {
      // Server-side context: Use Supabase Service Role client for elevated permissions
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      const payload: Record<string, any> = {
        action_type: actionType,
        description,
        role: role || 'worker'
      };

      if (userId) {
        payload.user_id = userId;
      }

      const { error } = await supabaseAdmin
        .from('activity_logs')
        .insert(payload);

      if (error) {
        console.warn('logActivity server error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // Client-side browser context: Use standard supabase client
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        targetUserId = session?.user?.id || null;
      }

      const payload: Record<string, any> = {
        action_type: actionType,
        description,
        role: role || 'worker'
      };

      if (targetUserId) {
        payload.user_id = targetUserId;
      }

      const { error } = await supabase
        .from('activity_logs')
        .insert(payload);

      if (error) {
        console.warn('logActivity client error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    }
  } catch (err: any) {
    console.warn('logActivity exception caught:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Backward compatibility helper for legacy admin logging
 */
export async function logAdminAction(action: string, details: string) {
  return logActivity({
    actionType: 'admin',
    description: `${action}: ${details}`,
    role: 'admin'
  });
}

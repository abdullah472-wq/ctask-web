'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Cleans up expired 30-minute task reservations:
 * - Frees up abandoned in-progress slots for other workers.
 */
export async function cleanupExpiredSlots() {
  try {
    // 1. Try calling the PostgreSQL RPC function
    const { data, error } = await supabaseAdmin.rpc('cleanup_expired_task_slots');
    if (!error && typeof data === 'number') {
      return { success: true, cleanedCount: data };
    }

    // 2. Resilient fallback if RPC isn't in DB yet:
    // Delete in_progress rows where expires_at < now()
    const nowIso = new Date().toISOString();
    const { data: deletedRows, error: deleteErr } = await supabaseAdmin
      .from('task_submissions')
      .delete()
      .eq('status', 'in_progress')
      .lt('expires_at', nowIso)
      .select('id');

    if (deleteErr && deleteErr.code !== '42703') {
      console.warn('cleanup fallback notice:', deleteErr.message);
    }

    return { success: true, cleanedCount: deletedRows?.length || 0 };
  } catch (err: any) {
    console.error('cleanupExpiredSlots error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Starts a task and reserves a slot for 30 minutes:
 * - Checks slot capacity (completed_slots + active in_progress < total_slots).
 * - Creates an 'in_progress' record with a 30-minute expiration.
 */
export async function startTaskReservation(taskId: string, userId: string) {
  if (!taskId || !userId) {
    return { success: false, error: 'Missing taskId or userId' };
  }

  try {
    // 1. Check system maintenance mode & dynamic slot reservation duration
    const { data: siteSettings } = await supabaseAdmin
      .from('site_settings')
      .select('slot_reservation_minutes, maintenance_mode')
      .eq('id', 1)
      .maybeSingle();

    if (siteSettings?.maintenance_mode) {
      return {
        success: false,
        error: 'Platform is currently under maintenance. Task reservations are temporarily paused.',
      };
    }

    const reservationMinutes = Number(siteSettings?.slot_reservation_minutes) || 30;

    // 2. Clean up any expired slots across the platform
    await cleanupExpiredSlots();

    // 2. Fetch task details
    const { data: task, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .select('id, total_slots, completed_slots, status, is_active')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return { success: false, error: 'Task not found' };
    }

    if (!task.is_active || task.status !== 'approved') {
      return { success: false, error: 'This task is not currently active.' };
    }

    // 3. Check existing submission for this user
    const { data: existingSub } = await supabaseAdmin
      .from('task_submissions')
      .select('id, status, expires_at, started_at')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    const now = new Date();

    if (existingSub) {
      if (existingSub.status === 'in_progress') {
        const expiresAt = existingSub.expires_at ? new Date(existingSub.expires_at) : null;
        if (expiresAt && expiresAt > now) {
          // Already have an active reservation! Return it
          return {
            success: true,
            alreadyStarted: true,
            submissionId: existingSub.id,
            expiresAt: existingSub.expires_at,
            startedAt: existingSub.started_at,
          };
        } else {
          // Previous reservation expired, delete so user can re-reserve if slots available
          await supabaseAdmin.from('task_submissions').delete().eq('id', existingSub.id);
        }
      } else if (existingSub.status === 'pending' || existingSub.status === 'approved') {
        return { success: false, error: 'You have already submitted proof for this task.' };
      }
    }

    // 4. Count current active in-progress reservations by other workers
    const { data: activeReservations } = await supabaseAdmin
      .from('task_submissions')
      .select('id, expires_at')
      .eq('task_id', taskId)
      .eq('status', 'in_progress')
      .gt('expires_at', now.toISOString());

    const activeCount = activeReservations?.length || 0;
    const completedCount = Number(task.completed_slots || 0);
    const totalSlots = Number(task.total_slots || 0);

    if (completedCount + activeCount >= totalSlots) {
      return {
        success: false,
        error: 'All slots for this task are currently reserved or completed. Please check back later!',
      };
    }

    // 5. Reserve slot using dynamic duration from site_settings (default 30 mins)
    const expiresAt = new Date(now.getTime() + reservationMinutes * 60 * 1000);
    const insertPayload: Record<string, any> = {
      task_id: taskId,
      user_id: userId,
      status: 'in_progress',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    let { data: newSub, error: insertErr } = await supabaseAdmin
      .from('task_submissions')
      .insert(insertPayload)
      .select('id, expires_at, started_at')
      .single();

    // Fallback if started_at/expires_at columns do not exist yet in schema
    if (insertErr && (insertErr.message?.includes('column') || insertErr.code === '42703')) {
      const basicInsert = await supabaseAdmin
        .from('task_submissions')
        .insert({
          task_id: taskId,
          user_id: userId,
          status: 'in_progress',
        })
        .select('id')
        .single();

      if (basicInsert.error) throw basicInsert.error;
      newSub = {
        id: basicInsert.data.id,
        expires_at: expiresAt.toISOString(),
        started_at: now.toISOString(),
      };
      insertErr = null;
    }

    if (insertErr) throw insertErr;

    revalidatePath(`/dashboard/task/${taskId}`);
    revalidatePath('/dashboard/tasks');

    return {
      success: true,
      submissionId: newSub?.id,
      expiresAt: newSub?.expires_at || expiresAt.toISOString(),
      startedAt: newSub?.started_at || now.toISOString(),
    };
  } catch (err: any) {
    console.error('startTaskReservation error:', err);
    return { success: false, error: err.message };
  }
}

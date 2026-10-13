'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Approves a worker's task submission:
 * - Authorizes IF reviewer is an admin OR the task creator.
 * - Updates submission status to 'approved'.
 * - Increments completed_slots on the task.
 * - Credits worker's wallet_balance and total_earned.
 * - Credits 5% referral commission if applicable.
 */
export async function approveTaskSubmission(
  sub_id: string,
  t_id: string,
  w_id: string,
  reward: number,
  reviewer_id?: string
) {
  try {
    // 1. Fetch task details to check creator and current slots
    const { data: taskData, error: taskFetchError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, creator_id, completed_slots, total_slots, reward_amount')
      .eq('id', t_id)
      .single();

    if (taskFetchError || !taskData) {
      throw taskFetchError ?? new Error('Task not found');
    }

    // 2. Authorize reviewer IF reviewer_id is provided
    let reviewerRole: 'admin' | 'creator' = 'admin';
    if (reviewer_id && reviewer_id !== 'system') {
      const { data: reviewerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', reviewer_id)
        .single();

      const isAdmin = reviewerProfile?.role === 'admin';
      const isCreator = taskData.creator_id === reviewer_id;

      if (!isAdmin && !isCreator) {
        return {
          success: false,
          error: 'Unauthorized: You are not authorized to review proofs for this task.',
        };
      }
      reviewerRole = isAdmin ? 'admin' : 'creator';
    }

    // 3. Update submission status to 'approved'
    const { error: subError } = await supabaseAdmin
      .from('task_submissions')
      .update({ status: 'approved' })
      .eq('id', sub_id);

    if (subError) throw subError;

    // 4. Increment completed_slots on the task
    const nextCompleted = (taskData.completed_slots || 0) + 1;
    const { error: taskUpdateError } = await supabaseAdmin
      .from('tasks')
      .update({ completed_slots: nextCompleted })
      .eq('id', t_id);

    if (taskUpdateError) throw taskUpdateError;

    // 5. Update worker's wallet balance and total earned
    const { data: workerData, error: workerFetchError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance, total_earned, referred_by, full_name')
      .eq('id', w_id)
      .single();

    if (workerFetchError || !workerData) throw workerFetchError ?? new Error('Worker not found');

    const actualReward = Number(reward || taskData.reward_amount || 0);

    const { error: workerUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_balance: Number(workerData.wallet_balance || 0) + actualReward,
        total_earned: Number(workerData.total_earned || 0) + actualReward,
      })
      .eq('id', w_id);

    if (workerUpdateError) throw workerUpdateError;

    // 6. Referral Commission Logic (5%)
    if (workerData.referred_by) {
      const commission = actualReward * 0.05;

      const { data: referrerData, error: referrerFetchError } = await supabaseAdmin
        .from('profiles')
        .select('wallet_balance')
        .eq('id', workerData.referred_by)
        .single();

      if (!referrerFetchError && referrerData) {
        await supabaseAdmin
          .from('profiles')
          .update({ wallet_balance: Number(referrerData.wallet_balance || 0) + Number(commission) })
          .eq('id', workerData.referred_by);
      }
    }

    // 7. Comprehensive Activity Logging
    const workerName = workerData.full_name || 'Worker';
    await logActivity({
      userId: reviewer_id && reviewer_id !== 'system' ? reviewer_id : w_id,
      actionType: 'task',
      description: `Approved task proof for User ${workerName}`,
      role: reviewerRole,
    });

    if (taskData.total_slots && nextCompleted >= taskData.total_slots) {
      await logActivity({
        actionType: 'system',
        description: `Task "${taskData.title || t_id}" has reached full slots or expired`,
        role: 'system',
      });
    }

    // 8. Invalidate caches
    revalidatePath('/admin/review');
    revalidatePath('/dashboard/manage-tasks');
    revalidatePath('/dashboard/submissions');
    revalidatePath('/dashboard/tasks');
    revalidatePath('/dashboard/activity');
    revalidatePath('/admin/activity-logs');

    return { success: true };
  } catch (error: any) {
    console.error('approveTaskSubmission error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rejects a worker's task submission:
 * - Authorizes IF reviewer is an admin OR the task creator.
 * - Updates submission status to 'rejected'.
 */
export async function rejectTaskSubmission(
  sub_id: string,
  reviewer_id?: string,
  reason?: string
) {
  try {
    // 1. Fetch submission with task and worker details to verify authorization
    const { data: sub, error: subFetchErr } = await supabaseAdmin
      .from('task_submissions')
      .select('id, user_id, task_id, tasks:task_id(creator_id), profiles:user_id(full_name)')
      .eq('id', sub_id)
      .single();

    if (subFetchErr || !sub) throw subFetchErr ?? new Error('Submission not found');

    const creatorId = (sub.tasks as any)?.creator_id;

    // 2. Authorize reviewer IF reviewer_id is provided
    let reviewerRole: 'admin' | 'creator' = 'admin';
    if (reviewer_id && reviewer_id !== 'system') {
      const { data: reviewerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', reviewer_id)
        .single();

      const isAdmin = reviewerProfile?.role === 'admin';
      const isCreator = creatorId === reviewer_id;

      if (!isAdmin && !isCreator) {
        return {
          success: false,
          error: 'Unauthorized: You are not authorized to reject proofs for this task.',
        };
      }
      reviewerRole = isAdmin ? 'admin' : 'creator';
    }

    // 3. Update submission status to 'rejected'
    const updatePayload: Record<string, any> = { status: 'rejected' };
    if (reason) {
      // If proof_text or reject note can be logged
      updatePayload.reject_reason = reason;
    }

    let { error: updateErr } = await supabaseAdmin
      .from('task_submissions')
      .update(updatePayload)
      .eq('id', sub_id);

    // If reject_reason column doesn't exist, fallback to status only
    if (updateErr && (updateErr.message?.includes('column') || updateErr.code === '42703')) {
      const fallback = await supabaseAdmin
        .from('task_submissions')
        .update({ status: 'rejected' })
        .eq('id', sub_id);
      updateErr = fallback.error;
    }

    if (updateErr) throw updateErr;

    // 4. Log Rejection Activity
    const workerName = (sub.profiles as any)?.full_name || 'Worker';
    await logActivity({
      userId: reviewer_id && reviewer_id !== 'system' ? reviewer_id : sub.user_id,
      actionType: 'task',
      description: `Rejected task proof for User ${workerName}`,
      role: reviewerRole,
    });

    // 5. Invalidate caches
    revalidatePath('/admin/review');
    revalidatePath('/dashboard/manage-tasks');
    revalidatePath('/dashboard/submissions');
    revalidatePath('/dashboard/activity');
    revalidatePath('/admin/activity-logs');

    return { success: true };
  } catch (error: any) {
    console.error('rejectTaskSubmission error:', error);
    return { success: false, error: error.message };
  }
}

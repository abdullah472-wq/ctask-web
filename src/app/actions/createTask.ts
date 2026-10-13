'use server';

import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface CreateTaskInput {
  userId: string;
  totalCost: number;
  taskData: {
    title: string;
    title_bn?: string;
    description: string;
    description_bn?: string;
    task_url?: string;
    reward_amount: number;
    total_slots: number;
    proof_instruction: string;
    proof_instruction_bn?: string;
    category_id?: string;
    category?: string;
    subcategory_id?: string;
    is_premium?: boolean;
    expires_at?: string | null;
    reference_image_url?: string | null;
  };
}

export interface CreateTaskResult {
  success: boolean;
  taskId?: string;
  error?: string;
}

/**
 * Server Action to securely deduct deposit balance and create a worker/creator task.
 * Includes resilience against missing RPC functions or missing bilingual columns in Supabase.
 */
export async function createCreatorTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  const { userId, totalCost, taskData } = input;

  try {
    if (!userId) {
      return { success: false, error: 'User is not authenticated.' };
    }

    if (totalCost < 0) {
      return { success: false, error: 'Invalid total cost.' };
    }

    // 1. Verify user's deposit balance
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('deposit_balance')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return { success: false, error: 'Could not fetch user profile balance.' };
    }

    const currentBalance = Number(profile.deposit_balance || 0);
    if (currentBalance < totalCost) {
      return { 
        success: false, 
        error: `Insufficient deposit balance. Required: ${totalCost.toFixed(2)} ৳, Available: ${currentBalance.toFixed(2)} ৳` 
      };
    }

    // 2. Deduct balance: Try RPC first, fallback to direct update via service_role
    let deductedViaRpc = false;
    const { error: rpcErr } = await supabaseAdmin.rpc('deduct_deposit_for_task', {
      user_uuid: userId,
      total_cost: totalCost,
    });

    if (!rpcErr) {
      deductedViaRpc = true;
    } else {
      console.warn('deduct_deposit_for_task RPC missing, executing direct balance deduction:', rpcErr.message);
      const newBalance = Number((currentBalance - totalCost).toFixed(2));
      const { error: directDeductErr } = await supabaseAdmin
        .from('profiles')
        .update({ deposit_balance: newBalance })
        .eq('id', userId);

      if (directDeductErr) {
        return { success: false, error: 'Failed to deduct balance: ' + directDeductErr.message };
      }
    }

    // 3. Construct base and full task payloads
    const basePayload: Record<string, any> = {
      title: taskData.title,
      description: taskData.description,
      task_url: taskData.task_url || null,
      reward_amount: Number(taskData.reward_amount),
      total_slots: Number(taskData.total_slots),
      completed_slots: 0,
      proof_instruction: taskData.proof_instruction,
      category_id: taskData.category_id || null,
      category: taskData.category || 'Others',
      subcategory_id: taskData.subcategory_id || null,
      is_premium: Boolean(taskData.is_premium),
      expires_at: taskData.expires_at || null,
      is_active: true,
      status: 'pending',
      creator_id: userId,
    };

    const fullPayload: Record<string, any> = {
      ...basePayload,
      title_bn: taskData.title_bn || null,
      description_bn: taskData.description_bn || null,
      proof_instruction_bn: taskData.proof_instruction_bn || null,
      reference_image_url: taskData.reference_image_url || null,
    };

    // 4. Try inserting full payload
    let { data: insertedTask, error: insertErr } = await supabaseAdmin
      .from('tasks')
      .insert(fullPayload)
      .select('id')
      .single();

    // Gracefully fallback to base payload if columns are missing in DB schema cache
    if (insertErr && (
      insertErr.message.includes('column') ||
      insertErr.message.includes('schema cache') ||
      insertErr.message.includes('_bn') ||
      insertErr.message.includes('reference_image_url') ||
      (insertErr as any).code === 'PGRST204'
    )) {
      console.warn('Tasks table missing bilingual or reference columns in schema cache, retrying with base schema...', insertErr.message);
      const retry = await supabaseAdmin
        .from('tasks')
        .insert(basePayload)
        .select('id')
        .single();
      insertErr = retry.error;
      insertedTask = retry.data;
    }

    // 5. If task insertion failed, REFUND the deducted balance!
    if (insertErr) {
      console.error('Task insert failed, rolling back balance deduction:', insertErr);
      if (deductedViaRpc) {
        await supabaseAdmin.rpc('add_deposit_balance', {
          user_uuid: userId,
          amount: totalCost,
        });
      } else {
        await supabaseAdmin
          .from('profiles')
          .update({ deposit_balance: currentBalance })
          .eq('id', userId);
      }
      return { success: false, error: 'Error creating task: ' + insertErr.message };
    }

    // 6. Log creator activity
    await logActivity({
      userId,
      actionType: 'task',
      description: `Created a new task campaign: ${taskData.title}`,
      role: 'creator',
    });

    return { success: true, taskId: insertedTask?.id };
  } catch (err: any) {
    console.error('createCreatorTask error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while creating task.' };
  }
}

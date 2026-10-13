'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function approveWithdrawal(withdrawalId: string) {
  try {
    // 1. Fetch full withdrawal details first
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount, created_at')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) throw fetchError ?? new Error('Withdrawal not found');

    // 2. Update withdrawal status to 'paid'
    const { error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'paid' })
      .eq('id', withdrawalId);
      
    if (withdrawalError) throw withdrawalError;

    // 3a. Try syncing via reference_id (clean link if it exists)
    const { data: updatedRefs } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'paid' })
      .eq('reference_id', withdrawalId)
      .select('id');

    // 3b. Fallback: match by user_id + type + pending status (covers old rows without reference_id)
    if (!updatedRefs || updatedRefs.length === 0) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'paid' })
        .eq('user_id', withdrawal.user_id)
        .eq('type', 'withdrawal')
        .eq('status', 'pending');
    }

    // 4. Activity Logging
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', withdrawal.user_id)
      .single();
    const userName = profile?.full_name || 'Worker';

    await logActivity({
      userId: withdrawal.user_id,
      actionType: 'payment',
      description: `Approved withdrawal request of ৳ ${Number(withdrawal.amount).toFixed(2)} for User ${userName}`,
      role: 'admin',
    });

    // 5. Invalidate all affected caches
    revalidatePath('/admin/withdrawals');
    revalidatePath('/admin/activity-logs');
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard/wallet');
    revalidatePath('/dashboard/activity');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectWithdrawal(withdrawalId: string, userId: string, amount: number) {
  try {
    // 1. Fetch full withdrawal details first
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) throw fetchError ?? new Error('Withdrawal not found');

    // 2. Update withdrawal status to 'rejected'
    const { error: rejectError } = await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', withdrawalId);
      
    if (rejectError) throw rejectError;

    // 3a. Try syncing via reference_id (clean link if it exists)
    const { data: updatedRefs } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('reference_id', withdrawalId)
      .select('id');

    // 3b. Fallback: match by user_id + type + pending status
    if (!updatedRefs || updatedRefs.length === 0) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('user_id', withdrawal.user_id)
        .eq('type', 'withdrawal')
        .eq('status', 'pending');
    }

    // 4. Refund user's wallet_balance on rejection
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance, full_name')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;

    const { error: refundError } = await supabaseAdmin
      .from('profiles')
      .update({ wallet_balance: (userData.wallet_balance || 0) + amount })
      .eq('id', userId);
      
    if (refundError) throw refundError;

    // 5. Activity Logging
    const userName = userData.full_name || 'Worker';
    await logActivity({
      userId,
      actionType: 'payment',
      description: `Rejected withdrawal request for User ${userName}`,
      role: 'admin',
    });

    // 6. Invalidate all affected caches
    revalidatePath('/admin/withdrawals');
    revalidatePath('/admin/activity-logs');
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard/wallet');
    revalidatePath('/dashboard/activity');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function approveWithdrawal(withdrawalId: string) {
  try {
    // 1. Get withdrawal details first
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('user_id, amount, created_at')
      .eq('id', withdrawalId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Update withdrawal status to 'paid'
    const { error } = await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'paid' })
      .eq('id', withdrawalId);
      
    if (error) throw error;

    // 3. Sync the matching transaction record status via reference_id
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'paid' })
      .eq('reference_id', withdrawalId);
    
    // Invalidate caches to refresh data immediately
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/activity-logs');
    revalidatePath('/dashboard/wallet', 'layout'); // clear all wallet paths under any locale
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectWithdrawal(withdrawalId: string, userId: string, amount: number) {
  try {
    // 1. Update withdrawal status to 'rejected'
    const { error: rejectError } = await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', withdrawalId);
      
    if (rejectError) throw rejectError;

    // 2. Sync the matching transaction record status via reference_id
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('reference_id', withdrawalId);

    // 3. Refund user's wallet_balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;

    const { error: refundError } = await supabaseAdmin
      .from('profiles')
      .update({ wallet_balance: (userData.wallet_balance || 0) + amount })
      .eq('id', userId);
      
    if (refundError) throw refundError;

    // Invalidate caches to refresh data immediately
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/activity-logs');
    revalidatePath('/dashboard/wallet', 'layout');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function approveWithdrawal(withdrawalId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'paid' })
      .eq('id', withdrawalId);
      
    if (error) throw error;
    
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

    // 2. Refund user's wallet_balance
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

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

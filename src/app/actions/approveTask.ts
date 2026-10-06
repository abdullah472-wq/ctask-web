'use server';

import { createClient } from '@supabase/supabase-js';

// Since this is a server action requiring admin privileges to bypass RLS for multiple tables,
// we should use the service role key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function approveTaskSubmission(sub_id: string, t_id: string, w_id: string, reward: number) {
  try {
    // 1. Update submission status to 'approved'
    const { error: subError } = await supabaseAdmin
      .from('task_submissions')
      .update({ status: 'approved' })
      .eq('id', sub_id);
    if (subError) throw subError;

    // 2. Increment completed_slots on the task
    // We fetch the current slots first
    const { data: taskData, error: taskFetchError } = await supabaseAdmin
      .from('tasks')
      .select('completed_slots')
      .eq('id', t_id)
      .single();
    if (taskFetchError) throw taskFetchError;

    const { error: taskUpdateError } = await supabaseAdmin
      .from('tasks')
      .update({ completed_slots: (taskData.completed_slots || 0) + 1 })
      .eq('id', t_id);
    if (taskUpdateError) throw taskUpdateError;

    // 3. Update worker's wallet balance and total earned
    const { data: workerData, error: workerFetchError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance, total_earned, referred_by')
      .eq('id', w_id)
      .single();
    if (workerFetchError) throw workerFetchError;

    const { error: workerUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        wallet_balance: Number(workerData.wallet_balance || 0) + Number(reward),
        total_earned: Number(workerData.total_earned || 0) + Number(reward)
      })
      .eq('id', w_id);
    if (workerUpdateError) throw workerUpdateError;

    // 4. Referral Commission Logic (5%)
    if (workerData.referred_by) {
      const commission = reward * 0.05;

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

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

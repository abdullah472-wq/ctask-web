'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { SubmitDepositInput, DepositActionResult } from '@/types/deposits';
import { getSiteSettings } from '@/app/actions/siteSettings';
import { logActivity } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Server action to submit a deposit request securely using supabaseAdmin.
 * Bypasses client-side RLS restrictions, validates site settings and limits,
 * and guards against duplicate transaction submissions.
 */
export async function submitDepositRequest(
  input: SubmitDepositInput
): Promise<DepositActionResult> {
  try {
    const { userId, amount, paymentMethod, transactionId } = input;

    if (!userId) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Please enter a valid deposit amount.' };
    }

    const cleanMethod = (paymentMethod || '').trim();
    if (!cleanMethod) {
      return { success: false, error: 'Please select a valid payment method.' };
    }

    const cleanTxId = (transactionId || '').trim().toUpperCase();
    if (!cleanTxId || cleanTxId.length < 4) {
      return { success: false, error: 'Please provide a valid transaction ID.' };
    }

    // 1. Check user profile status
    let { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // If profile row is missing from public.profiles, verify against auth.users
    if (!profile) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authUser?.user) {
          // Auto-provision missing profile row
          const fallbackName = authUser.user.user_metadata?.full_name || 
                               authUser.user.user_metadata?.name || 
                               authUser.user.email?.split('@')[0] || 
                               'User';
          const { data: createdProfile } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: userId,
              full_name: fallbackName,
              deposit_balance: 0,
              wallet_balance: 0
            })
            .select('*')
            .maybeSingle();
            
          profile = createdProfile || { id: userId, is_blocked: false };
        }
      } catch (provisionErr) {
        console.warn('Auto-provisioning profile failed:', provisionErr);
      }
    }

    if (!profile) {
      return { success: false, error: 'User profile not found. Please log in again.' };
    }

    if (profile.is_blocked) {
      return { success: false, error: 'Your account is suspended. Deposits are not permitted.' };
    }

    // 2. Validate global site settings (maintenance mode and minimum deposit)
    const settingsRes = await getSiteSettings();
    if (settingsRes.success && settingsRes.data) {
      if (settingsRes.data.maintenance_mode) {
        return {
          success: false,
          error: 'Deposit services are temporarily disabled for scheduled maintenance. Please try again soon.'
        };
      }

      const minDeposit = Number(settingsRes.data.min_deposit_amount) || 50;
      if (numAmount < minDeposit) {
        return {
          success: false,
          error: `Minimum deposit amount is ${minDeposit} ৳.`
        };
      }
    }

    // 3. Prevent duplicate submissions for the same transaction ID
    const { data: existingTx } = await supabaseAdmin
      .from('deposits')
      .select('id, status, created_at')
      .eq('transaction_id', cleanTxId)
      .maybeSingle();

    if (existingTx) {
      if (existingTx.status === 'pending') {
        return {
          success: false,
          error: `Transaction ID "${cleanTxId}" has already been submitted and is pending verification.`
        };
      }
      if (existingTx.status === 'approved') {
        return {
          success: false,
          error: `Transaction ID "${cleanTxId}" has already been approved.`
        };
      }
    }

    // 4. Secure insert using service role admin client
    const { data: deposit, error: insertErr } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: userId,
        amount: numAmount,
        payment_method: cleanMethod,
        transaction_id: cleanTxId,
        status: 'pending'
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    // Log worker activity
    await logActivity({
      userId,
      actionType: 'payment',
      description: `Requested a deposit of ৳ ${numAmount.toFixed(2)} via ${cleanMethod} (TxID: ${cleanTxId})`,
      role: 'worker'
    });

    // 5. Invalidate relevant caches
    revalidatePath('/dashboard/deposit');
    revalidatePath('/dashboard/wallet');
    revalidatePath('/admin/deposits');
    revalidatePath('/admin/dashboard');

    return { success: true, data: deposit };
  } catch (err: any) {
    console.error('submitDepositRequest error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while submitting your deposit.' };
  }
}

/**
 * Server action for admin to approve a pending deposit.
 */
export async function approveDeposit(
  depositId: string,
  userUuid: string,
  amount: number
): Promise<DepositActionResult> {
  try {
    if (!depositId || !userUuid) {
      return { success: false, error: 'Deposit ID and User UUID are required.' };
    }

    // Attempt RPC first
    const { error: rpcErr } = await supabaseAdmin.rpc('approve_deposit', {
      deposit_id: depositId,
      user_uuid: userUuid,
      amount: Number(amount)
    });

    if (rpcErr) {
      // Fallback: direct atomic update via admin client
      const { error: updateErr } = await supabaseAdmin
        .from('deposits')
        .update({ status: 'approved' })
        .eq('id', depositId)
        .eq('status', 'pending');

      if (updateErr) throw updateErr;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('deposit_balance')
        .eq('id', userUuid)
        .single();

      const newBalance = Number(profile?.deposit_balance || 0) + Number(amount);
      await supabaseAdmin
        .from('profiles')
        .update({ deposit_balance: newBalance })
        .eq('id', userUuid);
    }

    // Fetch user details for admin activity log
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userUuid)
      .maybeSingle();

    await logActivity({
      userId: userUuid,
      actionType: 'payment',
      description: `Approved deposit of ৳ ${Number(amount).toFixed(2)} for User ${userProfile?.full_name || 'User'}`,
      role: 'admin'
    });

    revalidatePath('/admin/deposits');
    revalidatePath('/dashboard/deposit');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('approveDeposit error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server action for admin to reject a deposit request.
 */
export async function rejectDeposit(depositId: string): Promise<DepositActionResult> {
  try {
    if (!depositId) {
      return { success: false, error: 'Deposit ID is required.' };
    }

    const { data: dep } = await supabaseAdmin
      .from('deposits')
      .select('user_id, amount, profiles(full_name)')
      .eq('id', depositId)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('deposits')
      .update({ status: 'rejected' })
      .eq('id', depositId);

    if (error) throw error;

    await logActivity({
      userId: dep?.user_id,
      actionType: 'payment',
      description: `Rejected deposit request of ৳ ${Number(dep?.amount || 0).toFixed(2)} for User ${(dep as any)?.profiles?.full_name || 'User'}`,
      role: 'admin'
    });

    revalidatePath('/admin/deposits');
    revalidatePath('/dashboard/deposit');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('rejectDeposit error:', err);
    return { success: false, error: err.message };
  }
}

'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Returns today's date formatted as YYYY-MM-DD in Bangladesh Time (Asia/Dhaka).
 */
export async function getDhakaDateString(date = new Date()): Promise<string> {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns yesterday's date formatted as YYYY-MM-DD in Bangladesh Time (Asia/Dhaka).
 */
export async function getYesterdayDhakaDateString(): Promise<string> {
  const todayStr = await getDhakaDateString();
  const [year, month, day] = todayStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Auto-syncs daily login streak on dashboard load:
 * - Checks last_active_date and current_streak using Asia/Dhaka time.
 * - If last_active_date was yesterday, increments current_streak by 1 and updates last_active_date to today.
 * - If last_active_date was older than yesterday or 0, sets minimum 1 for today's active session.
 */
export async function syncDailyStreak(userId: string) {
  if (!userId) return { success: false, error: 'No user ID provided' };

  try {
    const todayStr = await getDhakaDateString();
    const yesterdayStr = await getYesterdayDhakaDateString();

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      return { success: false, error: fetchErr?.message || 'Profile not found' };
    }

    const lastActive = profile.last_active_date || profile.last_check_in_date || null;
    const existingStreak = Number(profile.current_streak ?? profile.check_in_streak ?? 0);

    let newStreak = existingStreak;
    let shouldUpdate = false;

    if (!lastActive) {
      // First active session or missing record: initialize to at least 1
      newStreak = 1;
      shouldUpdate = true;
    } else if (lastActive === todayStr) {
      // Already recorded today: ensure streak is never stuck at 0
      if (existingStreak === 0) {
        newStreak = 1;
        shouldUpdate = true;
      }
    } else if (lastActive === yesterdayStr) {
      // Was active yesterday: increment streak by 1
      newStreak = Math.max(1, existingStreak + 1);
      shouldUpdate = true;
    } else {
      // Missed one or more days: reset/initialize to 1
      newStreak = 1;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      // Update database - support both new and legacy columns
      const fullUpdate: Record<string, any> = {
        current_streak: newStreak,
        last_active_date: todayStr,
        check_in_streak: newStreak,
      };

      let { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update(fullUpdate)
        .eq('id', userId);

      if (updateErr && (updateErr.message?.includes('column') || updateErr.code === '42703')) {
        await supabaseAdmin
          .from('profiles')
          .update({ check_in_streak: newStreak })
          .eq('id', userId);
      }

      revalidatePath('/dashboard', 'page');
      revalidatePath('/[locale]/dashboard', 'page');
    }

    return {
      success: true,
      currentStreak: newStreak,
      lastActiveDate: todayStr,
      lastCheckInDate: profile.last_check_in_date || null,
    };
  } catch (err: any) {
    console.error('syncDailyStreak error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Handles claiming daily check-in bonus (1.00 ৳):
 * - Calls claim_daily_bonus RPC or updates profiles table directly.
 * - Increments streak, updates last_check_in_date to today (Asia/Dhaka).
 * - Credits 1.00 ৳ to wallet_balance.
 * - Revalidates dashboard cache.
 */
export async function claimDailyBonusAction(userId: string) {
  if (!userId) return { success: false, error: 'No user ID provided' };

  try {
    const todayStr = await getDhakaDateString();
    const yesterdayStr = await getYesterdayDhakaDateString();

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      return { success: false, error: fetchErr?.message || 'Profile not found' };
    }

    // Check if already claimed today
    if (profile.last_check_in_date === todayStr) {
      return { success: false, error: 'Daily bonus already claimed today.' };
    }

    // Try calling the RPC function first if it exists
    try {
      await supabaseAdmin.rpc('claim_daily_bonus', { user_uuid: userId });
    } catch (rpcErr) {
      console.warn('RPC claim_daily_bonus warning:', rpcErr);
    }

    // Calculate streak
    const existingStreak = Number(profile.current_streak ?? profile.check_in_streak ?? 0);
    const lastCheckIn = profile.last_check_in_date;
    const lastActive = profile.last_active_date;

    let newStreak = 1;
    if (lastCheckIn === yesterdayStr || lastActive === yesterdayStr) {
      newStreak = Math.max(1, existingStreak + 1);
    } else if (existingStreak > 0) {
      newStreak = existingStreak;
    }

    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = currentBalance + 1.00;
    const newTotalEarned = Number(profile.total_earned || 0) + 1.00;

    // Persist to profiles
    const fullUpdate: Record<string, any> = {
      wallet_balance: newBalance,
      total_earned: newTotalEarned,
      last_check_in_date: todayStr,
      last_active_date: todayStr,
      current_streak: newStreak,
      check_in_streak: newStreak,
    };

    let { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(fullUpdate)
      .eq('id', userId);

    if (updateErr && (updateErr.message?.includes('column') || updateErr.code === '42703')) {
      await supabaseAdmin
        .from('profiles')
        .update({
          wallet_balance: newBalance,
          total_earned: newTotalEarned,
          last_check_in_date: todayStr,
          check_in_streak: newStreak,
        })
        .eq('id', userId);
    }

    revalidatePath('/dashboard', 'page');
    revalidatePath('/[locale]/dashboard', 'page');

    return {
      success: true,
      currentStreak: newStreak,
      balance: newBalance,
      lastCheckInDate: todayStr,
    };
  } catch (err: any) {
    console.error('claimDailyBonusAction error:', err);
    return { success: false, error: err.message };
  }
}

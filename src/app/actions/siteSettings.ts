'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

import { SiteSettings, defaultSiteSettings } from '@/types/siteSettings';

/**
 * Fetch global site settings using service role client
 */
export async function getSiteSettings(): Promise<{ success: boolean; data: SiteSettings; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return { success: true, data: defaultSiteSettings };
    }

    // Merge with defaults so any un-migrated columns fallback cleanly
    const merged: SiteSettings = {
      ...defaultSiteSettings,
      ...data,
      slot_reservation_minutes: Number(data.slot_reservation_minutes) || defaultSiteSettings.slot_reservation_minutes,
      auto_approve_hours: Number(data.auto_approve_hours) || defaultSiteSettings.auto_approve_hours,
      min_deposit_amount: Number(data.min_deposit_amount) || defaultSiteSettings.min_deposit_amount,
      platform_commission: Number(data.platform_commission) || defaultSiteSettings.platform_commission,
      min_withdrawal: Number(data.min_withdrawal) || defaultSiteSettings.min_withdrawal,
      withdrawal_fee: Number(data.withdrawal_fee) || defaultSiteSettings.withdrawal_fee,
      daily_withdrawal_limit: Number(data.daily_withdrawal_limit) || defaultSiteSettings.daily_withdrawal_limit,
      min_task_reward: Number(data.min_task_reward) || defaultSiteSettings.min_task_reward,
      max_task_reward: Number(data.max_task_reward) || defaultSiteSettings.max_task_reward,
      task_expiry_days: Number(data.task_expiry_days) || defaultSiteSettings.task_expiry_days,
      max_tasks_per_client: Number(data.max_tasks_per_client) || defaultSiteSettings.max_tasks_per_client,
    };

    return { success: true, data: merged };
  } catch (err: any) {
    console.error('getSiteSettings error:', err);
    return { success: false, data: defaultSiteSettings, error: err.message };
  }
}

/**
 * Update global site settings
 */
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; error?: string; notice?: string }> {
  try {
    const payload = {
      ...settings,
      id: 1,
      updated_at: new Date().toISOString(),
    };

    // Clean undefined values
    Object.keys(payload).forEach((key) => {
      if ((payload as any)[key] === undefined) {
        delete (payload as any)[key];
      }
    });

    const strippedColumns: string[] = [];
    let success = false;
    let lastError: any = null;

    // Retry up to 25 times if specific new columns are not yet in the DB schema cache
    for (let attempt = 0; attempt < 25; attempt++) {
      const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert(payload, { onConflict: 'id' });

      if (!error) {
        success = true;
        break;
      }

      // Check if error is due to a missing column in the PostgREST schema cache
      const match = error.message?.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        const missingCol = match[1];
        strippedColumns.push(missingCol);
        delete (payload as any)[missingCol];
        console.warn(`Stripped un-migrated column '${missingCol}' from site_settings upsert`);
      } else if (error.code === '42703' || error.message?.includes('does not exist')) {
        // Fallback for raw postgres error
        break;
      } else {
        lastError = error;
        break;
      }
    }

    if (!success) {
      if (lastError) throw lastError;
      throw new Error('Failed to update site settings');
    }

    await logActivity({
      actionType: 'settings',
      description: 'Updated site settings (e.g. timers/commissions)',
      role: 'admin',
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/activity-logs');
    revalidatePath('/dashboard');

    if (strippedColumns.length > 0) {
      return {
        success: true,
        notice: `Saved available settings! Note: Columns (${strippedColumns.join(', ')}) are missing from your database. Run schema-site-settings.sql in Supabase SQL Editor to save them permanently.`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('updateSiteSettings error:', err);
    return { success: false, error: err.message };
  }
}

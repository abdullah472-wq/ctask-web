import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { approveTaskSubmission } from '@/app/actions/approveTask';
import { logActivity } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runAutoApproveAndCleanup(request: Request) {
  // 1. Authorization check
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('key') || url.searchParams.get('token');
  const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const providedSecret = headerSecret || querySecret;

  if (cronSecret && cronSecret !== providedSecret) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
  }

  const resultLog = {
    timestamp: new Date().toISOString(),
    cleanedSlotsCount: 0,
    autoApprovedCount: 0,
  };

  // 2. Cleanup expired 30-minute in-progress task slots
  try {
    const { data: cleanedCount, error: rpcCleanErr } = await supabaseAdmin.rpc('cleanup_expired_task_slots');
    if (!rpcCleanErr && typeof cleanedCount === 'number') {
      resultLog.cleanedSlotsCount = cleanedCount;
    } else {
      // Fallback in JS if RPC is not present
      const nowIso = new Date().toISOString();
      const { data: deletedRows } = await supabaseAdmin
        .from('task_submissions')
        .delete()
        .eq('status', 'in_progress')
        .lt('expires_at', nowIso)
        .select('id');
      resultLog.cleanedSlotsCount = deletedRows?.length || 0;
    }
  } catch (err: any) {
    console.warn('Cron slot cleanup notice:', err.message);
  }

  // 3. 48-Hour Auto-Approve of pending task submissions
  try {
    const { data: approvedCount, error: rpcAutoErr } = await supabaseAdmin.rpc('auto_approve_pending_submissions');
    if (!rpcAutoErr && typeof approvedCount === 'number') {
      resultLog.autoApprovedCount = approvedCount;
    } else {
      // Fallback in JS if RPC is not present:
      // Find submissions pending for longer than 48 hours
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: pendingSubs, error: fetchErr } = await supabaseAdmin
        .from('task_submissions')
        .select('id, task_id, user_id, tasks:task_id(reward_amount)')
        .eq('status', 'pending')
        .lt('submitted_at', fortyEightHoursAgo);

      if (!fetchErr && pendingSubs && pendingSubs.length > 0) {
        let approvedTotal = 0;
        for (const sub of pendingSubs) {
          const reward = Number((sub.tasks as any)?.reward_amount || 0);
          const res = await approveTaskSubmission(sub.id, sub.task_id, sub.user_id, reward, 'system');
          if (res.success) approvedTotal++;
        }
        resultLog.autoApprovedCount = approvedTotal;
      }
    }
  } catch (err: any) {
    console.error('Cron auto-approve error:', err);
    return NextResponse.json({ error: err.message, log: resultLog }, { status: 500 });
  }

  // 4. Log system activities for expired tasks or slot cleanups
  try {
    const nowIso = new Date().toISOString();
    const { data: expiredTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title')
      .eq('is_active', true)
      .lt('expires_at', nowIso);

    if (expiredTasks && expiredTasks.length > 0) {
      for (const t of expiredTasks) {
        await logActivity({
          actionType: 'system',
          description: `Task "${t.title}" has reached full slots or expired`,
          role: 'system',
        });
        await supabaseAdmin.from('tasks').update({ is_active: false }).eq('id', t.id);
      }
    }

    if (resultLog.cleanedSlotsCount > 0) {
      await logActivity({
        actionType: 'system',
        description: `Cleaned up ${resultLog.cleanedSlotsCount} expired task reservation slot(s)`,
        role: 'system',
      });
    }
  } catch (logErr: any) {
    console.warn('System activity logging notice:', logErr.message);
  }

  return NextResponse.json({
    success: true,
    message: 'Task slot cleanup and 48-hour auto-approval executed successfully.',
    ...resultLog,
  }, { status: 200 });
}

export async function GET(request: Request) {
  return runAutoApproveAndCleanup(request);
}

export async function POST(request: Request) {
  return runAutoApproveAndCleanup(request);
}

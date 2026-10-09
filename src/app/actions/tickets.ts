'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function resolveTicket(ticketId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'resolved' })
      .eq('id', ticketId);

    if (error) throw error;

    revalidatePath('/admin/tickets');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

'use client';
import { toast } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { logAdminAction } from '@/utils/activityLogger';
import { format } from 'date-fns';

export default function PendingTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles!tasks_creator_id_fkey (full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching tasks: ' + error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (task: any) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'approved' })
        .eq('id', task.id);

      if (error) throw error;

      toast.success('Task approved!');
      await logAdminAction('Approved Task Posting', `Approved task "${task.title}" by ${task.profiles?.full_name}`);
      
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err: any) {
      toast.error('Error approving task: ' + err.message);
    }
  };

  const handleReject = async (task: any) => {
    const confirmReject = window.confirm('Are you sure you want to reject this task? The deposit balance will be refunded.');
    if (!confirmReject) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'rejected' })
        .eq('id', task.id);

      if (error) throw error;

      // Refund the cost
      const totalCost = (Number(task.reward_amount) * Number(task.total_slots)) * 1.10; // includes 10% commission

      await supabase.rpc('add_deposit_balance', {
        user_uuid: task.creator_id,
        amount: totalCost
      });

      toast.success('Task rejected and deposit refunded.');
      await logAdminAction('Rejected Task Posting', `Rejected task "${task.title}" by ${task.profiles?.full_name} and refunded ${totalCost.toFixed(2)}৳`);

      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err: any) {
      toast.error('Error rejecting task: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-brand-accent">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">Review and approve newly posted tasks from advertisers.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Advertiser</th>
                <th className="px-6 py-4 font-semibold">Task Details</th>
                <th className="px-6 py-4 font-semibold">Reward/Slots</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{task.profiles?.full_name}</div>
                    <div className="text-xs text-slate-500">{task.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">{task.title}</div>
                    <a href={task.task_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent text-xs hover:underline">View Link</a>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-brand-accent font-bold">{task.reward_amount} ৳ <span className="text-slate-500 font-normal">/ slot</span></div>
                    <div className="text-xs text-slate-500 mt-1">Total: {task.total_slots} slots</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(task)}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(task)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No pending tasks to review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Trash2, Power, PowerOff } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  reward_amount: number;
  total_slots: number;
  completed_slots: number;
  is_active: boolean;
  created_at: string;
}

export default function ManageTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const toggleStatus = async (taskId: string, currentStatus: boolean) => {
    setActionLoading(taskId);
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: !currentStatus })
      .eq('id', taskId);

    if (error) {
      alert('Error updating task');
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_active: !currentStatus } : t));
    }
    setActionLoading(null);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This might fail if there are existing submissions linked to it.')) return;
    
    setActionLoading(taskId);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      alert('Cannot delete task (likely has linked submissions). Try pausing it instead.');
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Manage Tasks</h1>
        <p className="text-slate-400">View, pause, or delete existing tasks.</p>
      </div>

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Reward</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No tasks found. Create one first!
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{task.title}</td>
                    <td className="px-6 py-4 font-bold text-brand-emerald">${task.reward_amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {task.completed_slots} / {task.total_slots}
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-brand-cyan" 
                          style={{ width: `${Math.min(100, (task.completed_slots / task.total_slots) * 100)}%` }} 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${task.is_active ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {task.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(task.id, task.is_active)}
                          disabled={actionLoading === task.id}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
                          title={task.is_active ? 'Pause Task' : 'Activate Task'}
                        >
                          {task.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          disabled={actionLoading === task.id}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

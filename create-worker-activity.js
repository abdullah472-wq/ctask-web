const fs = require('fs');
const path = require('path');

// 1. Update locales
const enPath = 'src/locales/en.json';
const bnPath = 'src/locales/bn.json';

let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.Dashboard.activityLog) {
  enData.Dashboard.activityLog = "Activity Log";
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
}

let bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
if (!bnData.Dashboard.activityLog) {
  bnData.Dashboard.activityLog = "অ্যাক্টিভিটি লগ";
  fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2));
}

// 2. Update layout.tsx
const layoutPath = 'src/app/[locale]/dashboard/layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Ensure Activity icon is imported
if (!layoutContent.includes('Activity,')) {
  layoutContent = layoutContent.replace('import { ', 'import { Activity, ');
}

// Insert link near Wallet
const sidebarLinkSearch = "{ label: t('walletWithdraw'), href: '/dashboard/wallet', icon: Wallet },";
const sidebarLinkReplace = `{ label: t('walletWithdraw'), href: '/dashboard/wallet', icon: Wallet },
    { label: t('activityLog'), href: '/dashboard/activity', icon: Activity },`;
if (!layoutContent.includes("href: '/dashboard/activity'")) {
  layoutContent = layoutContent.replace(sidebarLinkSearch, sidebarLinkReplace);
  fs.writeFileSync(layoutPath, layoutContent);
}

// 3. Update dashboard page.tsx widget link
const dashboardPagePath = 'src/app/[locale]/dashboard/page.tsx';
let dashboardContent = fs.readFileSync(dashboardPagePath, 'utf8');
dashboardContent = dashboardContent.replace(
  /\/dashboard\/wallet\`/g,
  '/dashboard/activity`'
);
fs.writeFileSync(dashboardPagePath, dashboardContent);

// 4. Create new activity log page
const activityPageDir = 'src/app/[locale]/dashboard/activity';
if (!fs.existsSync(activityPageDir)) {
  fs.mkdirSync(activityPageDir, { recursive: true });
}

const activityPageContent = `'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkerActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load activity logs: ' + error.message);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-brand-accent">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
          <p className="text-slate-500 dark:text-slate-400">View all your recent platform activity and earnings history.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                    {log.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {log.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                    <span className={log.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                      {log.type === 'withdrawal' ? '-' : '+'}৳ {Number(log.amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`px-2.5 py-1 rounded-md text-xs font-semibold capitalize \${
                      log.status === 'paid' || log.status === 'completed' || log.status === 'approved'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : log.status === 'rejected' || log.status === 'failed'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }\`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No activity found.
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
`;

fs.writeFileSync(path.join(activityPageDir, 'page.tsx'), activityPageContent);
console.log('Script execution completed.');

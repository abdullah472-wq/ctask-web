const fs = require('fs');

function updateAdminLogs() {
  const path = 'src/app/admin/activity-logs/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Update interface and query
  if (!content.includes('from(\'transactions\')')) {
    content = content.replace(
      /interface ActivityLog \{[\s\S]*?\}/,
      `interface ActivityLog {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}`
    );

    content = content.replace(
      /\.from\('admin_activity_logs'\)[\s\S]*?\.limit\(100\);/,
      `.from('transactions')
      .select(\`
        id,
        user_id,
        type,
        amount,
        status,
        description,
        created_at,
        profiles (full_name)
      \`)
      .order('created_at', { ascending: false })
      .limit(100);`
    );

    content = content.replace(
      /<thead[\s\S]*?<\/thead>/,
      `<thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Activity Type</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>`
    );

    content = content.replace(
      /\{logs\.map\(log => \([\s\S]*?<\/tr>\n\s*\)\)}/,
      `{logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-white">{log.profiles?.full_name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 capitalize">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                    {log.type === 'withdrawal' ? '-' : '+'}৳ {Number(log.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`px-2.5 py-1 rounded-md text-xs font-semibold capitalize \${
                      log.status === 'paid' || log.status === 'approved' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : log.status === 'rejected'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }\`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Admin Logs updated');
}

updateAdminLogs();

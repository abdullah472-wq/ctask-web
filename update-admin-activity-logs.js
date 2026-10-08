const fs = require('fs');

const pagePath = 'src/app/admin/activity-logs/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Replace fetchLogs
const oldFetchLogs = /const fetchLogs = async \(\) => \{[\s\S]*?setLoading\(false\);\n  \};/;
const newFetchLogs = `const fetchLogs = async () => {
    const [
      { data: txData },
      { data: subData }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select(\`
          id,
          type,
          amount,
          status,
          description,
          created_at,
          profiles (full_name)
        \`)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('task_submissions')
        .select(\`
          id,
          status,
          submitted_at,
          tasks:task_id (title, reward_amount),
          profiles (full_name)
        \`)
        .order('submitted_at', { ascending: false })
        .limit(100)
    ]);

    let combinedLogs: any[] = [];

    if (txData) {
      combinedLogs = [...combinedLogs, ...txData.map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        description: tx.description || (tx.type === 'withdrawal' ? 'Withdrawal Request' : tx.type === 'deposit' ? 'Wallet Deposit' : tx.type === 'premium_subscription' ? 'Premium Upgrade' : 'Transaction'),
        type: tx.type,
        amount: Number(tx.amount || 0),
        status: tx.status,
        user_name: tx.profiles?.full_name || 'Unknown'
      }))];
    }

    if (subData) {
      combinedLogs = [...combinedLogs, ...subData.map((sub: any) => ({
        id: sub.id,
        created_at: sub.submitted_at,
        description: \`Task: \${sub.tasks?.title || 'Unknown'}\`,
        type: 'task',
        amount: Number(sub.tasks?.reward_amount || 0),
        status: sub.status,
        user_name: sub.profiles?.full_name || 'Unknown'
      }))];
    }

    combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setLogs(combinedLogs.slice(0, 100));
    setLoading(false);
  };`;

content = content.replace(oldFetchLogs, newFetchLogs);

// Replace User Name display
content = content.replace(
  "{log.profiles?.full_name || 'Unknown'}",
  "{log.user_name}"
);

// Replace Activity Type badge
const oldTypeBadge = /<td className="px-6 py-4">\s*<span className="px-2\.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900\/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800\/50 capitalize">\s*\{log\.type\}\s*<\/span>\s*<\/td>/;
const newTypeBadge = `<td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.description}</span>
                      <span className="text-xs text-slate-500 capitalize">{log.type.replace('_', ' ')}</span>
                    </div>
                  </td>`;

content = content.replace(oldTypeBadge, newTypeBadge);

// Replace amount calculation to use '+' / '-' properly depending on type (Earnings are positive for the worker, but for Admin maybe just display the amount as is? Wait, the user said "Show the transaction amount (color-coded if possible)". Withdrawal is out (-), Task is out (-), Deposit is in (+), Premium is in (+).
// Let's just use green for money coming into the system, red for money leaving the system.
// Wait, the worker dashboard treats withdrawal as red (-) and task/deposit as green (+).
// The user says "Show the transaction amount (color-coded if possible) and the current status".
// Let's match the worker format where task and deposit are positive (green) and withdrawal is negative (red).
const oldAmount = /<td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">\s*\{log\.type === 'withdrawal' \? '-' : '\+'\}৳ \{Number\(log\.amount \|\| 0\)\.toFixed\(2\)\}\s*<\/td>/;
const newAmount = `<td className="px-6 py-4 font-bold">
                    <span className={log.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                      {log.type === 'withdrawal' ? '-' : '+'}৳ {Number(log.amount || 0).toFixed(2)}
                    </span>
                  </td>`;

content = content.replace(oldAmount, newAmount);

fs.writeFileSync(pagePath, content);

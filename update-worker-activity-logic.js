const fs = require('fs');

let content = fs.readFileSync('src/app/[locale]/dashboard/activity/page.tsx', 'utf8');

const fetchLogsRegex = /const fetchLogs = async \(\) => \{[\s\S]*?setLoading\(false\);\n  \};/;

const newFetchLogs = `const fetchLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [
      { data: txData },
      { data: subData }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id),
      supabase
        .from('task_submissions')
        .select('id, status, submitted_at, admin_feedback, tasks:task_id (title, reward_amount)')
        .eq('worker_id', session.user.id)
    ]);

    let combinedLogs: any[] = [];

    if (txData) {
      combinedLogs = [...combinedLogs, ...txData.map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        description: tx.description || (tx.type === 'withdrawal' ? 'Withdrawal Request' : 'Wallet Deposit'),
        type: tx.type,
        amount: Number(tx.amount || 0),
        status: tx.status
      }))];
    }

    if (subData) {
      combinedLogs = [...combinedLogs, ...subData.map((sub: any) => ({
        id: sub.id,
        created_at: sub.submitted_at,
        description: \`Task: \${sub.tasks?.title || 'Unknown'}\${sub.admin_feedback ? ' - ' + sub.admin_feedback : ''}\`,
        type: 'task',
        amount: Number(sub.tasks?.reward_amount || 0),
        status: sub.status
      }))];
    }

    // Sort by newest first
    combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setLogs(combinedLogs);
    setLoading(false);
  };`;

content = content.replace(fetchLogsRegex, newFetchLogs);

const trRegex = /<td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">[\s\S]*?<\/td>/;

const newTr = `<td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                    <span className={log.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                      {log.type === 'withdrawal' ? '-' : '+'}৳ {Number(log.amount || 0).toFixed(2)}
                    </span>
                  </td>`;

content = content.replace(trRegex, newTr);

fs.writeFileSync('src/app/[locale]/dashboard/activity/page.tsx', content);

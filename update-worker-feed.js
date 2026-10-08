const fs = require('fs');

function updateWorkerFeed() {
  const path = 'src/app/[locale]/dashboard/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('from(\'transactions\')')) {
    content = content.replace(
      /\/\/ Fetch Task Submissions[\s\S]*?const \{ data: submissions \} = await supabase[\s\S]*?\.order\('created_at', \{ ascending: false \}\);/,
      `// Fetch Task Submissions for stats
    const { data: submissions } = await supabase
      .from('task_submissions')
      .select('status')
      .eq('worker_id', uid);
      
    // Fetch Recent Activity (Transactions)
    const { data: recentActivity } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);`
    );
    
    content = content.replace(
      /if \(submissions\) \{[\s\S]*?feed = submissions\.slice\(0, 5\)\.map\(sub => \(\{[\s\S]*?time: new Date\(sub\.created_at\)\.toLocaleDateString\(\)\n      \}\)\);\n    \}/,
      `if (submissions) {
      totalStarted = submissions.length;
      submissions.forEach(sub => {
        if (sub.status === 'pending') pending++;
        if (sub.status === 'approved') approved++;
        if (sub.status === 'rejected') rejected++;
      });
    }

    if (recentActivity) {
      feed = recentActivity.map(tx => {
        let title = tx.type;
        if (tx.type === 'withdrawal') title = 'Withdrawal Request';
        if (tx.type === 'deposit') title = 'Wallet Deposit';
        if (tx.type === 'task') title = 'Task Earnings';
        
        return {
          id: tx.id,
          type: tx.status === 'paid' || tx.status === 'approved' ? 'approved' : tx.status === 'rejected' ? 'rejected' : 'pending',
          title: title,
          amount: tx.type === 'withdrawal' ? \`-৳ \${Number(tx.amount).toFixed(2)}\` : \`+৳ \${Number(tx.amount).toFixed(2)}\`,
          reason: tx.description || '',
          time: new Date(tx.created_at).toLocaleDateString()
        };
      });
    }`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Worker Feed updated');
}

updateWorkerFeed();

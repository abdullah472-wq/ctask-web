const fs = require('fs');

function updateWithdrawals() {
  const path = 'src/app/admin/withdrawals/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Add search state and Download icon import
  if (!content.includes('searchAccount')) {
    content = content.replace(
      /import { Landmark, CheckCircle, Loader2, XCircle } from 'lucide-react';/,
      `import { Landmark, CheckCircle, Loader2, XCircle, Search, Download } from 'lucide-react';`
    );
    
    content = content.replace(
      /const \[processingId, setProcessingId\] = useState<string \| null>\(null\);/,
      `const [processingId, setProcessingId] = useState<string | null>(null);\n  const [searchUserId, setSearchUserId] = useState('');\n  const [searchAccount, setSearchAccount] = useState('');`
    );
  }

  // Add download function
  if (!content.includes('downloadCSV')) {
    content = content.replace(
      /const fetchWithdrawals = async \(\) => {/,
      `const downloadCSV = (filteredWithdrawals: any[]) => {
    const headers = ['User ID', 'Name', 'Amount', 'Method', 'Account Number', 'Status', 'Date'];
    const rows = filteredWithdrawals.map(w => [
      w.user_id,
      w.profiles?.full_name || 'Unknown',
      w.amount,
      w.method,
      w.account_number,
      w.status,
      new Date(w.created_at).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', \`withdrawals_summary_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchWithdrawals = async () => {`
    );
  }

  // Add filter UI
  if (!content.includes('Search by User ID')) {
    content = content.replace(
      /<div className="bg-white dark:bg-\[\#0f172a\] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">/,
      `<div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchUserId}
              onChange={e => setSearchUserId(e.target.value)}
              placeholder="Search by User ID..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchAccount}
              onChange={e => setSearchAccount(e.target.value)}
              placeholder="Search by Account Number..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
        </div>
        <button
          onClick={() => downloadCSV(withdrawals.filter(w => (!searchUserId || w.user_id.toLowerCase().includes(searchUserId.toLowerCase())) && (!searchAccount || (w.account_number || '').toLowerCase().includes(searchAccount.toLowerCase()))))}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download CSV
        </button>
      </div>
      
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">`
    );
  }

  // Update rendering mapping
  if (!content.includes('filteredWithdrawals')) {
    content = content.replace(
      /\{withdrawals\.length === 0 \? \([\s\S]*?No withdrawal requests yet\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*\([\s\S]*?withdrawals\.map\(\(w\) => \(/,
      `{(() => {
                const filteredWithdrawals = withdrawals.filter(w => {
                  const matchId = !searchUserId || w.user_id.toLowerCase().includes(searchUserId.toLowerCase());
                  const matchAcc = !searchAccount || (w.account_number || '').toLowerCase().includes(searchAccount.toLowerCase());
                  return matchId && matchAcc;
                });
                if (filteredWithdrawals.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-400" />
                        No withdrawal requests match your search.
                      </td>
                    </tr>
                  );
                }
                return filteredWithdrawals.map((w) => (`
    );

    content = content.replace(
      /\)\)\s*\)\}/,
      `));\n              })()}`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Withdrawals updated');
}

updateWithdrawals();

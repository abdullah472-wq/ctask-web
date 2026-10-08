const fs = require('fs');

function updateDeposits() {
  const path = 'src/app/admin/deposits/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Add search state if not there
  if (!content.includes('searchTxId')) {
    content = content.replace(
      /const \[actionLoading, setActionLoading\] = useState<string \| null>\(null\);/,
      `const [actionLoading, setActionLoading] = useState<string | null>(null);\n  const [searchTxId, setSearchTxId] = useState('');`
    );
  }

  // Add search bar
  if (!content.includes('Search by Transaction ID')) {
    content = content.replace(
      /<div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">/,
      `<div className="mb-5 relative max-w-md">\n        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />\n        <input\n          type="text"\n          value={searchTxId}\n          onChange={e => setSearchTxId(e.target.value)}\n          placeholder="Search by Transaction ID..."\n          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"\n        />\n      </div>\n\n      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">`
    );
  }

  // Add filter logic
  if (!content.includes('filteredDeposits')) {
    content = content.replace(
      /\{deposits\.length === 0 \? \([\s\S]*?No pending deposit requests\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*\([\s\S]*?deposits\.map\(\(dep\) => \(/,
      `{(() => {
                const filteredDeposits = deposits.filter(dep => !searchTxId || (dep.transaction_id || '').toLowerCase().includes(searchTxId.toLowerCase()));
                if (filteredDeposits.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-accent" />
                        No pending deposit requests matching your search.
                      </td>
                    </tr>
                  );
                }
                return filteredDeposits.map((dep) => (`
    );
    
    content = content.replace(
      /\)\)\s*\)\}/,
      `));\n              })()}`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Deposits updated');
}

updateDeposits();

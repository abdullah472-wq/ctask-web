const fs = require('fs');

function updateSubscriptions() {
  const path = 'src/app/admin/subscriptions/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Add search state and Search icon import
  if (!content.includes('searchTxId')) {
    content = content.replace(
      /import { Loader2, Check, X, CreditCard } from 'lucide-react';/,
      `import { Loader2, Check, X, CreditCard, Search } from 'lucide-react';`
    );
    
    content = content.replace(
      /const \[actionLoading, setActionLoading\] = useState<string \| null>\(null\);/,
      `const [actionLoading, setActionLoading] = useState<string | null>(null);\n  const [searchTxId, setSearchTxId] = useState('');\n  const [filterPlan, setFilterPlan] = useState('');`
    );
  }

  // Add filter UI
  if (!content.includes('Search by Transaction ID')) {
    content = content.replace(
      /<div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">/,
      `<div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTxId}
              onChange={e => setSearchTxId(e.target.value)}
              placeholder="Search by Transaction ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent"
          >
            <option value="">All Plan Types</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">`
    );
  }

  // Update rendering mapping
  if (!content.includes('filteredRequests')) {
    content = content.replace(
      /\{requests\.length === 0 \? \([\s\S]*?No pending subscription requests\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*\([\s\S]*?requests\.map\(\(req\) => \(/,
      `{(() => {
                const filteredRequests = requests.filter(req => {
                  const matchTx = !searchTxId || (req.transaction_id || '').toLowerCase().includes(searchTxId.toLowerCase());
                  const matchPlan = !filterPlan || (req.profiles?.plan_type || 'free').toLowerCase() === filterPlan.toLowerCase();
                  return matchTx && matchPlan;
                });
                if (filteredRequests.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-brand-accent" />
                        No pending subscription requests match your search.
                      </td>
                    </tr>
                  );
                }
                return filteredRequests.map((req) => (`
    );

    content = content.replace(
      /\)\)\s*\)\}/,
      `));\n              })()}`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Subscriptions updated');
}

updateSubscriptions();

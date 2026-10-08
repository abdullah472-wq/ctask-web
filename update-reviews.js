const fs = require('fs');

function updateReviews() {
  const path = 'src/app/admin/manage-reviews/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('searchUserId')) {
    content = content.replace(
      /import { Loader2, Plus, Trash2, CheckCircle, XCircle, Star, Clock } from 'lucide-react';/,
      `import { Loader2, Plus, Trash2, CheckCircle, XCircle, Star, Clock, Search } from 'lucide-react';`
    );
    
    content = content.replace(
      /const \[actionLoading, setActionLoading\] = useState<string \| null>\(null\);/,
      `const [actionLoading, setActionLoading] = useState<string | null>(null);\n  const [searchUserId, setSearchUserId] = useState('');\n  const [filterRating, setFilterRating] = useState('');`
    );
  }

  if (!content.includes('Search by User ID')) {
    content = content.replace(
      /<div className="flex gap-4">[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setModalOpen\(true\)\}[\s\S]*?<\/button>[\s\S]*?<\/div>/,
      `<div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchUserId}
              onChange={e => setSearchUserId(e.target.value)}
              placeholder="Search by User ID..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <select
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Review
          </button>
        </div>`
    );
  }

  if (!content.includes('filteredReviews')) {
    content = content.replace(
      /\{reviews\.map\(\(review\) => \(/g,
      `{reviews.filter(review => {
                const matchUser = !searchUserId || (review.user_id || '').toLowerCase().includes(searchUserId.toLowerCase()) || (review.user_name || '').toLowerCase().includes(searchUserId.toLowerCase());
                const matchRating = !filterRating || review.rating?.toString() === filterRating;
                return matchUser && matchRating;
              }).map((review) => (`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Reviews updated');
}

updateReviews();

const fs = require('fs');

function updateManageTasks() {
  const path = 'src/app/admin/manage-tasks/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Update interface
  if (!content.includes('category?:')) {
    content = content.replace(
      /is_active: boolean;\n  created_at: string;\n}/,
      `is_active: boolean;\n  created_at: string;\n  category_id?: string;\n  subcategory_id?: string;\n  category?: { name: string };\n  subcategory?: { name: string };\n}`
    );
  }

  // Update query
  if (!content.includes('select(\'*, category:task_categories(name), subcategory:task_subcategories(name)\')')) {
    content = content.replace(
      /\.select\('\*'\)/,
      `.select('*, category:task_categories(name), subcategory:task_subcategories(name)')`
    );
  }

  // Add state for filter and categories
  if (!content.includes('filterCategory')) {
    content = content.replace(
      /const \[actionLoading, setActionLoading\] = useState<string \| null>\(null\);/,
      `const [actionLoading, setActionLoading] = useState<string | null>(null);\n  const [filterCategory, setFilterCategory] = useState('');\n  const [filterSubcategory, setFilterSubcategory] = useState('');\n  const [categories, setCategories] = useState<any[]>([]);\n  const [subcategories, setSubcategories] = useState<any[]>([]);`
    );
  }

  // Fetch categories
  if (!content.includes('fetchCategories')) {
    content = content.replace(
      /useEffect\(\(\) => \{\n    fetchTasks\(\);\n  \}, \[\]\);/,
      `useEffect(() => {\n    fetchTasks();\n    fetchCategories();\n  }, []);\n\n  const fetchCategories = async () => {\n    const { data: catData } = await supabase.from('task_categories').select('*');\n    const { data: subData } = await supabase.from('task_subcategories').select('*');\n    if (catData) setCategories(catData);\n    if (subData) setSubcategories(subData);\n  };`
    );
  }

  // Add filter UI
  if (!content.includes('All Categories')) {
    content = content.replace(
      /<div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">/,
      `<div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory(''); }}
          className="px-3 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterSubcategory}
          onChange={e => setFilterSubcategory(e.target.value)}
          disabled={!filterCategory}
          className="px-3 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent disabled:opacity-50"
        >
          <option value="">All Subcategories</option>
          {subcategories.filter(s => s.category_id === filterCategory).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">`
    );
  }

  // Apply filter to map
  if (!content.includes('filteredTasks')) {
    content = content.replace(
      /\{tasks\.map\(\(task\) => \(/,
      `{(() => {
                const filteredTasks = tasks.filter(t => {
                  const matchCat = !filterCategory || t.category_id === filterCategory;
                  const matchSub = !filterSubcategory || t.subcategory_id === filterSubcategory;
                  return matchCat && matchSub;
                });
                
                if (filteredTasks.length === 0) {
                  return <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No tasks found.</td></tr>;
                }
                
                return filteredTasks.map((task) => (`
    );
    
    content = content.replace(
      /\)\)\}/,
      `));\n              })()}`
    );
  }

  fs.writeFileSync(path, content);
  console.log('Manage Tasks updated');
}

updateManageTasks();

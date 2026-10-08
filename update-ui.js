const fs = require('fs');
let content = fs.readFileSync('src/app/admin/create-task/page.tsx', 'utf8');

// Replace Title
content = content.replace(
`            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title</label>`,
`            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title (English)</label>`
);

content = content.replace(
`                placeholder="e.g. Subscribe to YouTube Channel"
              />
            </div>
            
            <div>`,
`                placeholder="e.g. Subscribe to YouTube Channel"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Title (Bengali)</label>
                <input 
                  name="title_bn"
                  required
                  value={formData.title_bn}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="উদাঃ ইউটিউব চ্যানেল সাবস্ক্রাইব করুন"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>`
);

content = content.replace(
`                placeholder="Explain what the worker needs to do..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`,
`                placeholder="Explain what the worker needs to do..."
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Instructions (Bengali) / কাজের নির্দেশনা</label>
                <textarea 
                  name="description_bn"
                  required
                  value={formData.description_bn}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-24 resize-none"
                  placeholder="কর্মীকে কী করতে হবে তা ব্যাখ্যা করুন..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`
);

content = content.replace(
`            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proof Instructions</label>`,
`            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proof Requirements (English)</label>`
);

content = content.replace(
`                placeholder="What exactly should the worker submit as proof?"
              />
            </div>
          </div>`,
`                placeholder="What exactly should the worker submit as proof?"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proof Requirements (Bengali) / প্রমাণের প্রয়োজনীয়তা</label>
                <textarea 
                  name="proof_instruction_bn"
                  required
                  value={formData.proof_instruction_bn}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors h-24 resize-none"
                  placeholder="প্রমাণ হিসেবে কর্মীকে কী জমা দিতে হবে?"
                />
              </div>
            </div>
          </div>`
);

fs.writeFileSync('src/app/admin/create-task/page.tsx', content);

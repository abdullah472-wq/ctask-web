const fs = require('fs');

// 1. Update locales
const enPath = 'src/locales/en.json';
const bnPath = 'src/locales/bn.json';

let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.Dashboard.earnings) {
  enData.Dashboard.earnings = "Earnings";
  enData.Dashboard.withdrawals = "Withdrawals";
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
}

let bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
if (!bnData.Dashboard.earnings) {
  bnData.Dashboard.earnings = "উপার্জন";
  bnData.Dashboard.withdrawals = "উত্তোলন";
  fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2));
}

// 2. Update page.tsx
const pagePath = 'src/app/[locale]/dashboard/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Add Recharts import
if (!content.includes('AreaChart')) {
  content = content.replace(
    "import { supabase } from '@/utils/supabase';",
    "import { supabase } from '@/utils/supabase';\nimport { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';"
  );
}

// Add state for chartData
if (!content.includes('const [chartData, setChartData]')) {
  content = content.replace(
    "const [activityFeed, setActivityFeed] = useState<any[]>([]);",
    "const [activityFeed, setActivityFeed] = useState<any[]>([]);\n  const [chartData, setChartData] = useState<any[]>([]);"
  );
}

// Update fetchStats
const fetchChartDataInjection = `
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    const { data: chartSubmissions } = await supabase
      .from('task_submissions')
      .select('submitted_at, tasks:task_id(reward_amount)')
      .eq('worker_id', uid)
      .eq('status', 'approved')
      .gte('submitted_at', dateStr);

    const { data: chartTransactions } = await supabase
      .from('transactions')
      .select('created_at, amount, type')
      .eq('user_id', uid)
      .gte('created_at', dateStr);

    const dailyData: Record<string, { earn: number; withdraw: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[formatted] = { earn: 0, withdraw: 0 };
    }

    if (chartSubmissions) {
      chartSubmissions.forEach((sub: any) => {
        const d = new Date(sub.submitted_at);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[formatted]) {
          dailyData[formatted].earn += Number(sub.tasks?.reward_amount || 0);
        }
      });
    }

    if (chartTransactions) {
      chartTransactions.forEach((tx: any) => {
        const d = new Date(tx.created_at);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[formatted] && tx.type === 'withdrawal') {
          dailyData[formatted].withdraw += Number(tx.amount || 0);
        }
      });
    }

    setChartData(Object.keys(dailyData).map(date => ({
      date,
      [tw('earnings') || 'Earnings']: dailyData[date].earn,
      [tw('withdrawals') || 'Withdrawals']: dailyData[date].withdraw
    })));
`;

if (!content.includes('const sevenDaysAgo = new Date();')) {
  content = content.replace(
    "setActivityFeed(feed);",
    "setActivityFeed(feed);\n" + fetchChartDataInjection
  );
}

// Inject Chart UI
const chartUI = `
              <div className="mt-6 h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWithdraw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={(value) => \`৳\${value}\`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey={tw('earnings') || 'Earnings'} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarn)" />
                    <Area type="monotone" dataKey={tw('withdrawals') || 'Withdrawals'} stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorWithdraw)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>`;

if (!content.includes('<ResponsiveContainer')) {
  // Find Earnings Statistics Section
  const targetStr = `<p className="text-xl font-bold text-slate-900 dark:text-white">৳ {totalWithdrawn.toFixed(2)}</p>
                </div>
              </div>`;
  content = content.replace(targetStr, targetStr + "\n" + chartUI);
}

fs.writeFileSync(pagePath, content);

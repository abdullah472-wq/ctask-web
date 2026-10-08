const fs = require('fs');

// 1. Update locales
const enPath = 'src/locales/en.json';
const bnPath = 'src/locales/bn.json';

let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.ActivityLogPage) {
  enData.ActivityLogPage = {
    title: "Activity Log",
    subtitle: "View all your recent platform activity and earnings history.",
    date: "Date",
    description: "Description",
    type: "Type",
    amount: "Amount",
    status: "Status",
    noActivity: "No activity found.",
    withdrawalRequest: "Withdrawal Request",
    walletDeposit: "Wallet Deposit",
    task: "Task",
    unknown: "Unknown"
  };
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
}

let bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
if (!bnData.ActivityLogPage) {
  bnData.ActivityLogPage = {
    title: "অ্যাক্টিভিটি লগ",
    subtitle: "আপনার সাম্প্রতিক সমস্ত প্ল্যাটফর্ম কার্যকলাপ এবং উপার্জনের ইতিহাস দেখুন।",
    date: "তারিখ",
    description: "বিবরণ",
    type: "প্রকার",
    amount: "পরিমাণ",
    status: "অবস্থা",
    noActivity: "কোন কার্যকলাপ পাওয়া যায়নি।",
    withdrawalRequest: "উত্তোলনের অনুরোধ",
    walletDeposit: "ওয়ালেট জমা",
    task: "কাজ",
    unknown: "অজানা"
  };
  fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2));
}

// 2. Update page.tsx
const pagePath = 'src/app/[locale]/dashboard/activity/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

if (!pageContent.includes('useTranslations')) {
  pageContent = pageContent.replace(
    "import toast from 'react-hot-toast';",
    "import toast from 'react-hot-toast';\nimport { useTranslations } from 'next-intl';"
  );
}

if (!pageContent.includes('const t = useTranslations')) {
  pageContent = pageContent.replace(
    "export default function WorkerActivityLogPage() {",
    "export default function WorkerActivityLogPage() {\n  const t = useTranslations('ActivityLogPage');"
  );
}

// Replace descriptions mapping logic to use keys or raw
const oldFetchMap1 = /description: tx\.description \|\| \(tx\.type === 'withdrawal' \? 'Withdrawal Request' : 'Wallet Deposit'\),/g;
pageContent = pageContent.replace(oldFetchMap1, "description: tx.description || (tx.type === 'withdrawal' ? 'withdrawalRequest' : 'walletDeposit'),");

const oldFetchMap2 = /description: \`Task: \$\{sub\.tasks\?\.title \|\| 'Unknown'\}\$\{sub\.admin_feedback \? ' - ' \+ sub\.admin_feedback : ''\}\`,/g;
pageContent = pageContent.replace(oldFetchMap2, "description: sub.tasks?.title ? `taskTitle|${sub.tasks.title}|${sub.admin_feedback || ''}` : 'unknown',");

// Replace JSX strings
pageContent = pageContent.replace(">Activity Log</h1>", ">{t('title')}</h1>");
pageContent = pageContent.replace(">View all your recent platform activity and earnings history.</p>", ">{t('subtitle')}</p>");
pageContent = pageContent.replace(">Date</th>", ">{t('date')}</th>");
pageContent = pageContent.replace(">Description</th>", ">{t('description')}</th>");
pageContent = pageContent.replace(">Type</th>", ">{t('type')}</th>");
pageContent = pageContent.replace(">Amount</th>", ">{t('amount')}</th>");
pageContent = pageContent.replace(">Status</th>", ">{t('status')}</th>");
pageContent = pageContent.replace(">No activity found.</td>", ">{t('noActivity')}</td>");

// Replace Description rendering
const oldDescRender = "{log.description || '-'}";
const newDescRender = `{(() => {
                      if (!log.description) return '-';
                      if (log.description === 'withdrawalRequest') return t('withdrawalRequest');
                      if (log.description === 'walletDeposit') return t('walletDeposit');
                      if (log.description === 'unknown') return t('unknown');
                      if (log.description.startsWith('taskTitle|')) {
                        const parts = log.description.split('|');
                        return \`\${t('task')}: \${parts[1]}\${parts[2] ? ' - ' + parts[2] : ''}\`;
                      }
                      return log.description;
                    })()}`;
pageContent = pageContent.replace(oldDescRender, newDescRender);

fs.writeFileSync(pagePath, pageContent);

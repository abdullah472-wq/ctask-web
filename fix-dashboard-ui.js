const fs = require('fs');

// 1. Update locales
const enPath = 'src/locales/en.json';
const bnPath = 'src/locales/bn.json';

let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.Dashboard.viewAllHistory) {
  enData.Dashboard.viewAllHistory = "View All History";
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
}

let bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
if (!bnData.Dashboard.viewAllHistory) {
  bnData.Dashboard.viewAllHistory = "সম্পূর্ণ ইতিহাস দেখুন";
  fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2));
}

// 2. Update page.tsx
const pagePath = 'src/app/[locale]/dashboard/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Add h-fit to the widget container
const oldWidgetContainer = 'className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"';
const newWidgetContainer = 'className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit"';
pageContent = pageContent.replace(oldWidgetContainer, newWidgetContainer);

// Reduce max height for the scrollable list
const oldMaxHeight = 'className="space-y-6 max-h-[400px] overflow-y-auto scrollbar-thin pr-2"';
const newMaxHeight = 'className="space-y-6 max-h-[300px] overflow-y-auto scrollbar-thin pr-2"';
pageContent = pageContent.replace(oldMaxHeight, newMaxHeight);

fs.writeFileSync(pagePath, pageContent);

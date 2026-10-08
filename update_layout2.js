const fs = require('fs');
let data = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

data = data.replace(/{ label: 'Worker Dashboard', href: '\/dashboard', icon: LayoutDashboard }/g, "{ label: t('workerDashboard'), href: '/dashboard', icon: LayoutDashboard }");
data = data.replace(/{ label: 'Available Tasks', href: '\/dashboard\/tasks', icon: CheckSquare }/g, "{ label: t('availableTasks'), href: '/dashboard/tasks', icon: CheckSquare }");
data = data.replace(/{ label: 'My Submissions', href: '\/dashboard\/submissions', icon: CheckSquare }/g, "{ label: t('mySubmissions'), href: '/dashboard/submissions', icon: CheckSquare }");
data = data.replace(/{ label: 'Referrals & Downline', href: '\/dashboard\/referrals', icon: Users }/g, "{ label: t('referralsDownline'), href: '/dashboard/referrals', icon: Users }");
data = data.replace(/{ label: 'Wallet & Withdraw', href: '\/dashboard\/wallet', icon: Wallet }/g, "{ label: t('walletWithdraw'), href: '/dashboard/wallet', icon: Wallet }");
data = data.replace(/{ label: 'Deposit & Advertise', href: '\/dashboard\/deposit', icon: Wallet }/g, "{ label: t('depositAdvertise'), href: '/dashboard/deposit', icon: Wallet }");
data = data.replace(/{ label: 'Leaderboard', href: '\/dashboard\/leaderboard', icon: Trophy }/g, "{ label: t('leaderboard'), href: '/dashboard/leaderboard', icon: Trophy }");
data = data.replace(/{ label: 'Upgrade to Premium', href: '\/dashboard\/upgrade', icon: Crown }/g, "{ label: t('upgradeToPremium'), href: '/dashboard/upgrade', icon: Crown }");
data = data.replace(/{ label: 'Support Tickets', href: '\/dashboard\/support', icon: LifeBuoy }/g, "{ label: t('supportTickets'), href: '/dashboard/support', icon: LifeBuoy }");
data = data.replace(/{ label: 'Settings', href: '\/dashboard\/settings', icon: Settings }/g, "{ label: t('settings'), href: '/dashboard/settings', icon: Settings }");

data = data.replace(/<div className="flex items-center gap-3 sm:gap-6">/g, 
`<div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              🌐 {language === 'en' ? 'EN' : 'BN'}
            </button>`);

data = data.replace(/Edit Profile/g, `{t('settings')}`);
data = data.replace(/My Wallet/g, `{t('walletWithdraw')}`);
data = data.replace(/Log Out/g, `{t('logout')}`);
data = data.replace(/Admin Panel/g, `{t('adminPanel')}`);

fs.writeFileSync('src/app/dashboard/layout.tsx', data);

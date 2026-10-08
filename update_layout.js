const fs = require('fs');
let data = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');
data = data.replace(
  `          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-white/5 border border-brand-primary/30 text-brand-primary font-mono font-medium shadow-sm text-sm sm:text-base">`,
  `          <div className="flex items-center gap-3 sm:gap-6">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              🌐 {language === 'en' ? 'EN' : 'BN'}
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-white/5 border border-brand-primary/30 text-brand-primary font-mono font-medium shadow-sm text-sm sm:text-base">`
);

data = data.replace(
  `  const sidebarLinks = [
    { label: 'Worker Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Available Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'My Submissions', href: '/dashboard/submissions', icon: CheckSquare },
    { label: 'Referrals & Downline', href: '/dashboard/referrals', icon: Users },
    { label: 'Wallet & Withdraw', href: '/dashboard/wallet', icon: Wallet },
    { label: 'Deposit & Advertise', href: '/dashboard/deposit', icon: Wallet },
    { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },

    { label: 'Upgrade to Premium', href: '/dashboard/upgrade', icon: Crown },
    { label: 'Support Tickets', href: '/dashboard/support', icon: LifeBuoy },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];`,
  `  const sidebarLinks = [
    { label: t('workerDashboard'), href: '/dashboard', icon: LayoutDashboard },
    { label: t('availableTasks'), href: '/dashboard/tasks', icon: CheckSquare },
    { label: t('mySubmissions'), href: '/dashboard/submissions', icon: CheckSquare },
    { label: t('referralsDownline'), href: '/dashboard/referrals', icon: Users },
    { label: t('walletWithdraw'), href: '/dashboard/wallet', icon: Wallet },
    { label: t('depositAdvertise'), href: '/dashboard/deposit', icon: Wallet },
    { label: t('leaderboard'), href: '/dashboard/leaderboard', icon: Trophy },

    { label: t('upgradeToPremium'), href: '/dashboard/upgrade', icon: Crown },
    { label: t('supportTickets'), href: '/dashboard/support', icon: LifeBuoy },
    { label: t('settings'), href: '/dashboard/settings', icon: Settings },
  ];`
);

data = data.replace(
  `<h1 className="font-bold text-lg hidden md:block">Worker Dashboard</h1>`,
  `<h1 className="font-bold text-lg hidden md:block">{t('workerDashboard')}</h1>`
);

data = data.replace(
  `                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <User className="w-4 h-4 text-slate-500" />
                      Edit Profile
                    </Link>
                    <Link href="/dashboard/wallet" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Wallet className="w-4 h-4 text-slate-500" />
                      My Wallet
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-3 p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors w-full text-left"
                    >
                      {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      {mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>`,
  `                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <User className="w-4 h-4 text-slate-500" />
                      {t('settings')}
                    </Link>
                    <Link href="/dashboard/wallet" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Wallet className="w-4 h-4 text-slate-500" />
                      {t('walletWithdraw')}
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                      <Settings className="w-4 h-4 text-slate-500" />
                      {t('settings')}
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-3 p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors w-full text-left"
                    >
                      {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      {mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>`
);

data = data.replace(
  `Admin Panel`,
  `{t('adminPanel')}`
);

data = data.replace(
  `<h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>`,
  `<h3 className="font-bold text-slate-900 dark:text-white">{t('notifications')}</h3>`
);

data = data.replace(
  `Mark all as read`,
  `{t('markAllAsRead')}`
);

fs.writeFileSync('src/app/dashboard/layout.tsx', data);

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Wallet, ArrowUpRight, History } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useTranslations } from 'next-intl';

// Mock Data for Wallet Growth
const initialEarningsData = [
  { name: 'Mon', balance: 2.50 },
  { name: 'Tue', balance: 3.00 },
  { name: 'Wed', balance: 5.50 },
  { name: 'Thu', balance: 8.20 },
  { name: 'Fri', balance: 12.00 },
  { name: 'Sat', balance: 14.50 },
  { name: 'Sun', balance: 18.75 },
];

export default function WalletPage() {
  const t = useTranslations('WalletPage');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [chartData, setChartData] = useState(initialEarningsData);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savedMethods, setSavedMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setIsEmailVerified(!!session.user.email_confirmed_at);

    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setBalance(data.wallet_balance);
      // Let's dynamically update the last day's mock balance to match reality
      setChartData(prev => {
        const newData = [...prev];
        newData[newData.length - 1] = { ...newData[newData.length - 1], balance: Number(data.wallet_balance) };
        return newData;
      });
    }

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (txData) {
      setTransactions(txData);
    }

    // Fetch saved payment methods
    const { data: methodsData } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false });

    if (methodsData && methodsData.length > 0) {
      setSavedMethods(methodsData);
      // Auto-select default or first
      const defaultMethod = methodsData.find(m => m.is_default) || methodsData[0];
      setSelectedMethodId(defaultMethod.id);
    }

    setLoading(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) > balance) {
      toast.error(t('insufficientBalance'));
      return;
    }
    if (!selectedMethodId && savedMethods.length > 0) {
      toast.error('Please select a payment method.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const selectedMethod = savedMethods.find(m => m.id === selectedMethodId);
    const methodName = selectedMethod?.provider || '';
    const accountNum = selectedMethod?.account_number || '';

    try {
      // Create withdrawal request for admin panel
      const { error: wdError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: session.user.id,
          amount: Number(amount),
          method: methodName,
          account_number: accountNum,
          payment_method: methodName,
          status: 'pending'
        });

      if (wdError) throw wdError;

      // Create transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: 'withdrawal',
          amount: Number(amount),
          description: `Withdrawal via ${methodName} to ${accountNum}`,
          status: 'pending'
        });

      if (txError) throw txError;

      // Deduct wallet balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ wallet_balance: balance - Number(amount) })
        .eq('id', session.user.id);

      if (balanceError) throw balanceError;

      toast.success(t('withdrawSuccess', { amount, method: methodName }));
      setAmount('');
      fetchBalance();
    } catch (error: any) {
      toast.error('Failed to process withdrawal: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-xl">
          <p className="text-slate-300 font-bold mb-2">{t(label.toLowerCase())}</p>
          <p className="text-sm text-brand-accent font-bold">
            {t('balanceLabel')} {payload[0].value.toFixed(2)} ৳
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-slate-400">{t('subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-brand-accent/20 to-brand-primary/20 border border-brand-accent/30 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center min-h-[250px]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <p className="text-purple-950 dark:text-brand-accent font-medium mb-2 uppercase tracking-wider text-sm">{t('availableBalance')}</p>
          <h2 className="text-5xl font-bold text-purple-950 dark:text-white mb-2">{balance.toFixed(2)} ৳</h2>
          <p className="text-purple-900 dark:text-slate-300 text-sm">{t('minWithdrawal')}</p>
        </div>

        {/* Withdraw Form */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[250px] flex flex-col justify-center shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ArrowUpRight className="text-brand-accent w-5 h-5" /> {t('requestWithdrawal')}
          </h3>

          {savedMethods.length === 0 ? (
            <div className="text-center py-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl">
              <p className="text-yellow-800 dark:text-yellow-300 font-medium text-sm mb-2">⚠ No payment method saved.</p>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Please{' '}
                <a href="../dashboard/settings?tab=payment" className="underline font-bold hover:text-yellow-900 dark:hover:text-yellow-200">
                  add a payment method in Settings
                </a>{' '}
                first to request a withdrawal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">{t('amountLabel')}</label>
                <input
                  type="number"
                  min="100"
                  step="0.01"
                  max={balance}
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                  placeholder="100.00"
                />
              </div>

              {savedMethods.length === 1 ? (
                // Single method: show as read-only
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Withdrawal to</p>
                  <p className="font-bold text-slate-900 dark:text-white">{savedMethods[0].provider}</p>
                  <p className="text-sm font-mono text-slate-600 dark:text-slate-300">{savedMethods[0].account_number}</p>
                </div>
              ) : (
                // Multiple methods: dropdown
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">{t('methodLabel')}</label>
                  <select
                    value={selectedMethodId}
                    onChange={e => setSelectedMethodId(e.target.value)}
                    className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                  >
                    {savedMethods.map(m => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-[#0f172a]">
                        {m.provider} — {m.account_number}{m.is_default ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity"
              >{t('submitBtn')}</button>
            </form>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-200">{t('earningsGrowth')}</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F2FE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dx={-10}
                tickFormatter={(value) => `${value} ৳`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#00F2FE"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
                activeDot={{ r: 6, fill: '#10B981', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mt-8">
        <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-200 flex items-center gap-2">
          <History className="w-5 h-5 text-brand-accent" /> {t('transactionHistory')}
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {t('noTransactions')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-4 font-medium rounded-l-xl">{t('txDate')}</th>
                  <th className="p-4 font-medium">{t('txDescription')}</th>
                  <th className="p-4 font-medium">{t('txType')}</th>
                  <th className="p-4 font-medium">{t('txAmount')}</th>
                  <th className="p-4 font-medium rounded-r-xl">{t('txStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-900 dark:text-slate-200 font-medium">
                      {tx.description}
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-medium">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <span className={tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                        {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} ৳
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tx.status === 'completed' || tx.status === 'paid' || tx.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                          tx.status === 'failed' || tx.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


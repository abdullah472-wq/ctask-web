'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Wallet, ArrowUpRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// Mock Data for Wallet Growth
const earningsData = [
  { name: 'Mon', balance: 2.50 },
  { name: 'Tue', balance: 3.00 },
  { name: 'Wed', balance: 5.50 },
  { name: 'Thu', balance: 8.20 },
  { name: 'Fri', balance: 12.00 },
  { name: 'Sat', balance: 14.50 },
  { name: 'Sun', balance: 18.75 },
];

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setBalance(data.wallet_balance);
      // Let's dynamically update the last day's mock balance to match reality
      earningsData[earningsData.length - 1].balance = Number(data.wallet_balance);
    }
    setLoading(false);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) > balance) {
      alert("Insufficient balance!");
      return;
    }
    alert(`Withdrawal request for ${amount} ৳ via ${method} sent successfully! (Mocked)`);
    setAmount('');
    setAccountNumber('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-xl">
          <p className="text-slate-300 font-bold mb-2">{label}</p>
          <p className="text-sm text-brand-cyan font-bold">
            Balance: {payload[0].value.toFixed(2)} ৳
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Wallet & Earnings</h1>
        <p className="text-slate-400">Track your earnings growth and request withdrawals.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-brand-cyan/20 to-brand-emerald/20 border border-brand-cyan/30 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center min-h-[250px]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <p className="text-brand-cyan font-medium mb-2 uppercase tracking-wider text-sm">Available Balance</p>
          <h2 className="text-5xl font-bold text-white mb-2">{balance.toFixed(2)} ৳</h2>
          <p className="text-slate-300 text-sm">Minimum withdrawal is 100 ৳</p>
        </div>

        {/* Withdraw Form */}
        <div className="bg-dark-card border border-slate-800 rounded-3xl p-6 min-h-[250px] flex flex-col justify-center">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ArrowUpRight className="text-brand-cyan w-5 h-5" /> Request Withdrawal
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount (৳)</label>
                <input 
                  type="number" 
                  min="100" 
                  step="0.01" 
                  max={balance}
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan transition-colors"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Method</label>
                <select 
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full bg-transparent dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors appearance-none"
                >
                  <option value="bKash" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">bKash</option>
                  <option value="Nagad" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Nagad</option>
                  <option value="Binance Pay" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">Binance Pay (USDT)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-1">Account Number / ID</label>
                <input 
                  type="text" 
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full bg-white/5 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-cyan transition-colors"
                  placeholder="Enter your account details"
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-dark-card border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-bold mb-6 text-slate-200">Earnings Growth (Last 7 Days)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00F2FE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}} 
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Users, FileCheck, CircleDollarSign, Loader2 } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// Mock Data for Admin Charts
const tasksCompletedData = [
  { name: 'Mon', completed: 12 },
  { name: 'Tue', completed: 19 },
  { name: 'Wed', completed: 15 },
  { name: 'Thu', completed: 25 },
  { name: 'Fri', completed: 22 },
  { name: 'Sat', completed: 30 },
  { name: 'Sun', completed: 28 },
];

const financialData = [
  { name: 'Payouts vs Pending', payouts: 450, pending: 120 }
];

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingProofs: 0,
    totalPaid: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: proofsCount } = await supabase
      .from('task_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('wallet_balance');
    
    let totalPaid = 0;
    if (profilesData) {
      totalPaid = profilesData.reduce((acc, curr) => acc + Number(curr.wallet_balance), 0);
    }

    setStats({
      totalUsers: usersCount || 0,
      pendingProofs: proofsCount || 0,
      totalPaid: totalPaid,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  // Custom Tooltip for Recharts to match the dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-xl">
          <p className="text-slate-300 font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome to the Ctask administration panel.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-card border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-cyan/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-300">Total Users</h3>
          </div>
          <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-dark-card border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileCheck className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-300">Pending Proofs</h3>
          </div>
          <p className="text-4xl font-bold text-white">{stats.pendingProofs}</p>
        </div>

        <div className="bg-dark-card border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-emerald/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <CircleDollarSign className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-emerald/10 rounded-xl text-brand-emerald">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-300">Total Worker Earnings</h3>
          </div>
          <p className="text-4xl font-bold text-white">${stats.totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Line Chart: Tasks Completed */}
        <div className="bg-dark-card border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Tasks Completed (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tasksCompletedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="Completed" 
                  stroke="#00F2FE" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00F2FE', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#10B981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Financials */}
        <div className="bg-dark-card border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Financial Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} barSize={80}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="payouts" name="Total Payouts ($)" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" name="Pending Withdrawals ($)" fill="#00F2FE" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

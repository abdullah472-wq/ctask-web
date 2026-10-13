import React from 'react';

export interface RegistrationItem {
  name: string;
  joinDate: string;
}

export interface AdminReportData {
  generatedDate?: string;
  totalUsers?: number | string;
  workerEarnings?: number | string;
  totalDeposits?: number | string;
  totalWithdrawals?: number | string;
  activeTasks?: number | string;
  pendingProofs?: number | string;
  pendingKyc?: number | string;
  pendingWithdrawals?: number | string;
  openTickets?: number | string;
  recentRegistrations?: RegistrationItem[];
}

export interface AdminReportDocumentProps {
  data?: AdminReportData;
  id?: string;
}

const defaultRegistrations: RegistrationItem[] = [
  { name: 'Fatima Ali', joinDate: '10/9/2026' },
  { name: 'David Smith', joinDate: '10/9/2026' },
  { name: 'Isabella Rossi', joinDate: '10/9/2026' },
  { name: 'Chen Wei', joinDate: '10/9/2026' },
  { name: 'Aisha Patel', joinDate: '10/9/2026' },
];

export default function AdminReportDocument({ data, id }: AdminReportDocumentProps = {}) {
  const generatedDate = data?.generatedDate ?? 'October 12, 2026, 9:50 PM';
  const totalUsers = data?.totalUsers ?? '51';
  const workerEarnings = data?.workerEarnings ?? '221,538.00 ৳';
  const totalDeposits = data?.totalDeposits ?? '0.00 ৳';
  const totalWithdrawals = data?.totalWithdrawals ?? '563.00 ৳';
  const activeTasks = data?.activeTasks ?? '0';
  const pendingProofs = data?.pendingProofs ?? '0';
  const pendingKyc = data?.pendingKyc ?? '0';
  const pendingWithdrawals = data?.pendingWithdrawals ?? '0';
  const openTickets = data?.openTickets ?? '1';
  const recentRegistrations = data?.recentRegistrations ?? defaultRegistrations;

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center print:p-0 print:bg-white">
      {/* Main A4/Print Container */}
      <div 
        id={id}
        className="w-full max-w-4xl bg-white p-10 shadow-lg rounded-sm print:shadow-none print:w-full print:max-w-none print:p-0 text-gray-900"
      >
        {/* Header Section */}
        <div className="flex justify-between items-end border-b-2 border-gray-300 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">Ctask</h1>
            <h2 className="text-xl font-semibold text-gray-600 uppercase tracking-widest mt-1">Global System Report</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Generated Date</p>
            <p className="text-lg font-bold text-gray-800">{generatedDate}</p>
          </div>
        </div>

        {/* Financial Overview Section */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Financial Overview</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500 font-medium">Worker Earnings</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{workerEarnings}</p>
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500 font-medium">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalDeposits}</p>
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-500 font-medium">Total Withdrawals</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{totalWithdrawals}</p>
            </div>
          </div>
        </div>

        {/* Platform Activity Section */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Platform Activity</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white p-3 border-l-4 border-purple-500 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Active Tasks</p>
              <p className="text-xl font-bold text-gray-800">{activeTasks}</p>
            </div>
            <div className="bg-white p-3 border-l-4 border-yellow-500 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Pending Proofs</p>
              <p className="text-xl font-bold text-gray-800">{pendingProofs}</p>
            </div>
            <div className="bg-white p-3 border-l-4 border-blue-500 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Pending KYC</p>
              <p className="text-xl font-bold text-gray-800">{pendingKyc}</p>
            </div>
            <div className="bg-white p-3 border-l-4 border-orange-500 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Pending W/D</p>
              <p className="text-xl font-bold text-gray-800">{pendingWithdrawals}</p>
            </div>
            <div className="bg-white p-3 border-l-4 border-red-500 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Open Tickets</p>
              <p className="text-xl font-bold text-gray-800">{openTickets}</p>
            </div>
          </div>
        </div>

        {/* Recent Registrations Table */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Recent Registrations</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/2">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/2">Join Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((user, idx) => (
                <tr 
                  key={`${user.name}-${idx}`} 
                  className={idx < recentRegistrations.length - 1 ? 'border-b border-gray-100' : ''}
                >
                  <td className="py-3 px-4 text-gray-800">{user.name}</td>
                  <td className="py-3 px-4 text-gray-600">{user.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

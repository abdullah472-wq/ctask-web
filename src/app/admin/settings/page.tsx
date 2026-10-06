'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';
import { 
  Settings, 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Users, 
  ShieldCheck,
  Save,
  Loader2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<any>({
    site_name: '',
    contact_email: '',
    support_phone: '',
    currency: 'BDT',
    min_task_reward: 0,
    max_task_reward: 0,
    task_expiry_days: 7,
    max_tasks_per_client: 10,
    proof_requirement: true,
    platform_commission: 10,
    min_withdrawal: 50,
    withdrawal_fee: 2,
    automatic_payout: false,
    payment_gateway: 'bKash',
    gateway_api_key: '',
    gateway_sandbox_mode: true,
    open_registration: true,
    require_verification: true,
    default_client_status: 'active',
    system_notifications: true,
    two_factor_auth: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Strip null values so default empty strings are preserved and React doesn't complain about null input values
        const cleanData = Object.entries(data).reduce((acc: any, [key, value]) => {
          if (value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {});
        
        setSettings((prev: any) => ({ ...prev, ...cleanData }));
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: 1, ...settings });
        
      if (error) throw error;
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? Number(value) : value;
    
    setSettings((prev: any) => ({ ...prev, [name]: val }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'tasks', label: 'Task Settings', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'earnings', label: 'Earnings & Withdrawal', icon: <Wallet className="w-4 h-4" /> },
    { id: 'gateway', label: 'Payment Gateway', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'clients', label: 'Client Settings', icon: <Users className="w-4 h-4" /> },
    { id: 'security', label: 'Notifications & Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00F2FE]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage global platform configurations</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-[#00F2FE]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 sm:p-8">
              
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">General Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Site Name</label>
                      <input 
                        type="text" name="site_name" value={settings.site_name} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Currency Symbol/Code</label>
                      <input 
                        type="text" name="currency" value={settings.currency} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contact Email</label>
                      <input 
                        type="email" name="contact_email" value={settings.contact_email} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Support Phone</label>
                      <input 
                        type="text" name="support_phone" value={settings.support_phone} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Task Settings Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Task Configuration</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Minimum Task Reward</label>
                      <input 
                        type="number" name="min_task_reward" value={settings.min_task_reward} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Maximum Task Reward</label>
                      <input 
                        type="number" name="max_task_reward" value={settings.max_task_reward} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task Expiry (Days)</label>
                      <input 
                        type="number" name="task_expiry_days" value={settings.task_expiry_days} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Tasks Per Client</label>
                      <input 
                        type="number" name="max_tasks_per_client" value={settings.max_tasks_per_client} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="proof_requirement" checked={settings.proof_requirement} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.proof_requirement ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.proof_requirement ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Require workers to submit proof by default</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Earnings & Withdrawal */}
              {activeTab === 'earnings' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Financial Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Platform Commission (%)</label>
                      <input 
                        type="number" name="platform_commission" value={settings.platform_commission} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Minimum Withdrawal</label>
                      <input 
                        type="number" name="min_withdrawal" value={settings.min_withdrawal} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Withdrawal Fee (%)</label>
                      <input 
                        type="number" name="withdrawal_fee" value={settings.withdrawal_fee} onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="automatic_payout" checked={settings.automatic_payout} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.automatic_payout ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.automatic_payout ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Automatic Payouts</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Payment Gateway */}
              {activeTab === 'gateway' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Integrations</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Gateway</label>
                    <select 
                      name="payment_gateway" value={settings.payment_gateway} onChange={handleChange}
                      className="w-full md:w-1/2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="SSLCommerz">SSLCommerz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Key / Secret</label>
                    <input 
                      type="password" name="gateway_api_key" value={settings.gateway_api_key} onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      placeholder="Enter secret key..."
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="gateway_sandbox_mode" checked={settings.gateway_sandbox_mode} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.gateway_sandbox_mode ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.gateway_sandbox_mode ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sandbox / Test Mode</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Client Settings */}
              {activeTab === 'clients' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">User Onboarding</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default Account Status</label>
                    <select 
                      name="default_client_status" value={settings.default_client_status} onChange={handleChange}
                      className="w-full md:w-1/2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending Review</option>
                    </select>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="open_registration" checked={settings.open_registration} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.open_registration ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.open_registration ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Allow Open Registration</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="require_verification" checked={settings.require_verification} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.require_verification ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.require_verification ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Require Email/Phone Verification</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Notifications & Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Platform Security</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="system_notifications" checked={settings.system_notifications} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.system_notifications ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.system_notifications ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable System Notifications (Admin Alerts)</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="two_factor_auth" checked={settings.two_factor_auth} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${settings.two_factor_auth ? 'bg-[#00F2FE]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.two_factor_auth ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enforce 2FA for Admin Accounts</span>
                    </label>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">Change Admin Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="password" placeholder="New Password"
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                      <input 
                        type="password" placeholder="Confirm Password"
                        className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-colors"
                      />
                    </div>
                    <button className="mt-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

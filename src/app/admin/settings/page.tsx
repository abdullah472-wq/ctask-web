'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Settings, 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Users, 
  ShieldCheck,
  Save,
  Loader2,
  HelpCircle,
  Clock,
  AlertOctagon,
  Sparkles,
  RefreshCcw,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { getSiteSettings, updateSiteSettings } from '@/app/actions/siteSettings';
import { SiteSettings, defaultSiteSettings } from '@/types/siteSettings';

interface SettingLabelProps {
  label: string;
  tooltip?: string;
  badge?: string;
  badgeColor?: 'purple' | 'emerald' | 'amber' | 'red';
}

function SettingLabel({ label, tooltip, badge, badgeColor = 'purple' }: SettingLabelProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const badgeClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    red: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
  }[badgeColor];

  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
          {badge}
        </span>
      )}
      {tooltip && (
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-slate-400 hover:text-[#7B2CBF] dark:hover:text-purple-400 transition-colors focus:outline-none cursor-help"
            aria-label={`Info: ${label}`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showTooltip && (
            <div className="absolute left-6 -top-2 z-50 w-64 p-3 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white text-xs leading-relaxed rounded-xl shadow-2xl border border-slate-700/60 transition-all animate-in fade-in zoom-in-95 pointer-events-none">
              {tooltip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'tasks' | 'financial' | 'maintenance' | 'gateway' | 'security'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [initialSettings, setInitialSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getSiteSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setInitialSettings(res.data);
      } else {
        toast.error(res.error || 'Failed to load site settings');
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Check if form is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  // Prompt before navigation if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await updateSiteSettings(settings);
      if (res.success) {
        setInitialSettings(settings);
        if (res.notice) {
          toast.success(res.notice, { duration: 6000 });
        } else {
          toast.success('Settings saved successfully!');
        }
      } else {
        toast.error(res.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(initialSettings);
    toast('Unsaved changes discarded', { icon: '↩️' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setSettings((prev) => ({ ...prev, [name]: val }));
  };

  const setPreset = (field: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  interface SettingsTab {
    id: 'general' | 'tasks' | 'financial' | 'maintenance' | 'gateway' | 'security';
    label: string;
    icon: React.ReactNode;
    highlight?: boolean;
  }

  const tabs: SettingsTab[] = [
    { id: 'general', label: 'General Info', icon: <Settings className="w-4 h-4" /> },
    { id: 'tasks', label: 'Task Automation', icon: <Clock className="w-4 h-4" /> },
    { id: 'financial', label: 'Financial Limits', icon: <Wallet className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance Mode', icon: <AlertOctagon className="w-4 h-4" />, highlight: settings.maintenance_mode },
    { id: 'gateway', label: 'Payment Gateway', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'security', label: 'User & Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 dark:text-purple-400" />
        <p className="text-sm font-medium text-slate-500">Loading platform settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5A189A] to-[#7B2CBF] flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Admin Settings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage global configurations, task lifecycle timers, and financial controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer ${
              isDirty
                ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed shadow-none'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Maintenance Mode Alert Banner if active */}
      {settings.maintenance_mode && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 to-amber-500/15 border border-rose-500/30 flex items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                Maintenance Mode is Currently Active
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </h4>
              <p className="text-xs text-rose-600/80 dark:text-rose-300/80 mt-0.5">
                Task reservations, proof submissions, and withdrawals are currently frozen for all users.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          >
            Configure Notice
          </button>
        </div>
      )}

      {/* Main Layout: Tabs + Glassmorphic Card */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600/10 text-purple-700 dark:bg-purple-600/20 dark:text-purple-300 border-l-4 border-[#7B2CBF] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={activeTab === tab.id ? 'text-[#7B2CBF] dark:text-purple-400' : ''}>
                  {tab.icon}
                </span>
                {tab.label}
              </div>
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Active Alert" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area in Subtle Dark Glassmorphic Card */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            <div className="p-6 sm:p-8">

              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      General Platform Information
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure platform identity, public currency symbol, and official support contacts
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <SettingLabel label="Platform Name" tooltip="The brand name displayed in headers, titles, and automated emails." />
                      <input 
                        type="text" 
                        name="site_name" 
                        value={settings.site_name || ''} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel label="Currency Symbol / Code" tooltip="Symbol shown next to rewards and balances across the dashboard (e.g. ৳, BDT, $)." />
                      <input 
                        type="text" 
                        name="currency" 
                        value={settings.currency || ''} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel label="Contact Email" tooltip="Official contact email displayed to users and workers in the support section." />
                      <input 
                        type="email" 
                        name="contact_email" 
                        value={settings.contact_email || ''} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel label="Support Helpline Phone" tooltip="Customer support helpline number displayed in contact pages and footer." />
                      <input 
                        type="text" 
                        name="support_phone" 
                        value={settings.support_phone || ''} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TASK AUTOMATION & LIFECYCLE */}
              {activeTab === 'tasks' && (
                <div className="space-y-8 animate-in fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Task Lifecycle & Automation
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        Tier 1 Automation
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure dynamic reservation timers, auto-approval settlement windows, and default limits
                    </p>
                  </div>

                  {/* Slot Reservation Timer */}
                  <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-4">
                    <div>
                      <SettingLabel 
                        label="Slot Reservation Duration (Minutes)" 
                        tooltip="Amount of time allotted to a worker after clicking 'Start Task' to submit their proof screenshot. If timer expires without submission, the slot is automatically released for other workers."
                        badge="Dynamic Timer"
                        badgeColor="purple"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Choose a quick preset or specify custom minutes (replaces legacy hardcoded 30-min timer):
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setPreset('slot_reservation_minutes', mins)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            settings.slot_reservation_minutes === mins
                              ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white shadow-md shadow-purple-600/30'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400'
                          }`}
                        >
                          {mins} Minutes
                        </button>
                      ))}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500">Custom:</span>
                        <input
                          type="number"
                          name="slot_reservation_minutes"
                          min={5}
                          max={300}
                          value={settings.slot_reservation_minutes || 30}
                          onChange={handleChange}
                          className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Creator Review Auto-Approve Window */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-4">
                    <div>
                      <SettingLabel 
                        label="Creator Review Auto-Approve Window (Hours)" 
                        tooltip="Settlement window after task submission. If a task creator does not approve or reject proof within this window, the backend RPC automatically approves the submission and releases funds to worker."
                        badge="Auto-Settlement"
                        badgeColor="emerald"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Choose auto-approval hours threshold (replaces legacy hardcoded 48-hour timer):
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { hours: 24, label: '24 Hours (1 Day)' },
                        { hours: 48, label: '48 Hours (2 Days)' },
                        { hours: 72, label: '72 Hours (3 Days)' },
                      ].map((item) => (
                        <button
                          key={item.hours}
                          type="button"
                          onClick={() => setPreset('auto_approve_hours', item.hours)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            settings.auto_approve_hours === item.hours
                              ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white shadow-md shadow-purple-600/30'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500">Custom:</span>
                        <input
                          type="number"
                          name="auto_approve_hours"
                          min={1}
                          max={168}
                          value={settings.auto_approve_hours || 48}
                          onChange={handleChange}
                          className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Task Boundaries Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <SettingLabel label="Minimum Task Reward (৳)" tooltip="Minimum reward creators can assign per completed task slot." />
                      <input 
                        type="number" 
                        name="min_task_reward" 
                        value={settings.min_task_reward} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel label="Maximum Task Reward (৳)" tooltip="Maximum allowed single task reward." />
                      <input 
                        type="number" 
                        name="max_task_reward" 
                        value={settings.max_task_reward} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel label="Task Expiry Days" tooltip="Number of days a campaign stays active before remaining uncompleted slots expire." />
                      <input 
                        type="number" 
                        name="task_expiry_days" 
                        value={settings.task_expiry_days} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel label="Max Tasks Per Client" tooltip="Maximum number of active campaigns an individual client can run simultaneously." />
                      <input 
                        type="number" 
                        name="max_tasks_per_client" 
                        value={settings.max_tasks_per_client} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Auto-Publish User Tasks
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          When enabled, new campaigns created by advertisers go live immediately without waiting for manual admin review.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="auto_publish_tasks" 
                          checked={Boolean(settings.auto_publish_tasks)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.auto_publish_tasks ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.auto_publish_tasks ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Require Proof Upload by Default
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Force workers to submit screenshot or proof text when completing any task.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="proof_requirement" 
                          checked={Boolean(settings.proof_requirement)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.proof_requirement ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.proof_requirement ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: FINANCIAL LIMITS */}
              {activeTab === 'financial' && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Financial & Commission Controls
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure platform commission rates, deposit thresholds, and withdrawal rules
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <SettingLabel 
                        label="Minimum Deposit Threshold (৳)" 
                        tooltip="The lowest amount an advertiser can deposit when funding their wallet balance."
                        badge="Deposit Limit"
                        badgeColor="purple"
                      />
                      <input 
                        type="number" 
                        name="min_deposit_amount" 
                        value={settings.min_deposit_amount} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <SettingLabel 
                        label="Platform Commission Fee (%)" 
                        tooltip="Percentage collected by the platform on task creation or transaction settlements."
                        badge="Platform Revenue"
                        badgeColor="emerald"
                      />
                      <input 
                        type="number" 
                        name="platform_commission" 
                        value={settings.platform_commission} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <SettingLabel 
                        label="Minimum Withdrawal Limit (৳)" 
                        tooltip="Minimum balance workers must have to request a payout." 
                      />
                      <input 
                        type="number" 
                        name="min_withdrawal" 
                        value={settings.min_withdrawal} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel 
                        label="Withdrawal Processing Fee (%)" 
                        tooltip="Service charge deducted during withdrawal processing." 
                      />
                      <input 
                        type="number" 
                        name="withdrawal_fee" 
                        value={settings.withdrawal_fee} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>

                    <div>
                      <SettingLabel 
                        label="Daily Withdrawal Limit (৳)" 
                        tooltip="Maximum total payout an individual user can withdraw per 24 hours." 
                      />
                      <input 
                        type="number" 
                        name="daily_withdrawal_limit" 
                        value={settings.daily_withdrawal_limit || 2000} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Automatic Payout Approval
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Automatically approve withdrawal requests without requiring manual verification in the Admin Withdrawals panel.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="automatic_payout" 
                          checked={Boolean(settings.automatic_payout)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.automatic_payout ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.automatic_payout ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: MAINTENANCE MODE */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Platform Maintenance Controls
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                        Emergency Switch
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Instantly freeze user transactions and task submissions during database migrations or upgrades
                    </p>
                  </div>

                  {/* Prominent Toggle Card */}
                  <div className={`p-6 rounded-3xl border transition-all ${
                    settings.maintenance_mode 
                      ? 'bg-rose-500/10 border-rose-500/40 dark:bg-rose-950/30' 
                      : 'bg-slate-50/70 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          settings.maintenance_mode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          <AlertOctagon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Maintenance Mode Switch
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {settings.maintenance_mode 
                              ? '🔴 Platform is in MAINTENANCE MODE. Task submissions & withdrawals are frozen.'
                              : '🟢 Platform is LIVE. All operations, submissions, and withdrawals are functioning normally.'}
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer shrink-0 self-end sm:self-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {settings.maintenance_mode ? 'Enabled' : 'Disabled'}
                        </span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            name="maintenance_mode" 
                            checked={Boolean(settings.maintenance_mode)} 
                            onChange={handleChange} 
                            className="sr-only" 
                          />
                          <div className={`w-14 h-8 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-rose-500 shadow-md shadow-rose-500/40' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.maintenance_mode ? 'transform translate-x-6' : ''}`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Maintenance Notice Input */}
                  <div>
                    <SettingLabel 
                      label="Maintenance Notice Banner Message" 
                      tooltip="This message will be broadcast to users across the application when maintenance mode is active."
                    />
                    <textarea 
                      name="maintenance_notice" 
                      rows={3}
                      value={settings.maintenance_notice || ''} 
                      onChange={handleChange}
                      placeholder="Platform is undergoing scheduled maintenance..."
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: PAYMENT GATEWAY */}
              {activeTab === 'gateway' && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Payment Integrations & Gateways
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure bKash, Nagad, and third-party gateway keys for deposits
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <SettingLabel label="Primary Payment Gateway" tooltip="Main payment provider displayed by default on deposit and upgrade pages." />
                      <select 
                        name="payment_gateway" 
                        value={settings.payment_gateway || 'bKash'} 
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all cursor-pointer"
                      >
                        <option value="bKash">bKash Merchant</option>
                        <option value="Nagad">Nagad Merchant</option>
                        <option value="SSLCommerz">SSLCommerz Sandbox</option>
                      </select>
                    </div>

                    <div>
                      <SettingLabel label="Merchant API Key / Secret" tooltip="Secure private key provided by the payment gateway." />
                      <input 
                        type="password" 
                        name="gateway_api_key" 
                        value={settings.gateway_api_key || ''} 
                        onChange={handleChange}
                        placeholder="••••••••••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Sandbox / Test Mode
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Route transactions through developer test endpoints instead of real money accounts.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="gateway_sandbox_mode" 
                          checked={Boolean(settings.gateway_sandbox_mode)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.gateway_sandbox_mode ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.gateway_sandbox_mode ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 6: SECURITY & ONBOARDING */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      User Onboarding & Security
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure registration policies, email verification rules, and administrator security
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Allow Open Registration
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Allow new users to sign up freely without invitation or referral-only restrictions.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="open_registration" 
                          checked={Boolean(settings.open_registration)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.open_registration ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.open_registration ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Require Email / Phone Verification
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Users must confirm their email before completing tasks or requesting payouts.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="require_verification" 
                          checked={Boolean(settings.require_verification)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.require_verification ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.require_verification ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
                      <div className="pr-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                          Admin System Alerts
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Send internal system notifications on new withdrawal requests and KYC submissions.
                        </span>
                      </div>
                      <div className="relative shrink-0">
                        <input 
                          type="checkbox" 
                          name="system_notifications" 
                          checked={Boolean(settings.system_notifications)} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.system_notifications ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.system_notifications ? 'transform translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Sticky "Unsaved Changes" Bar */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-purple-500/40 shadow-2xl shadow-purple-950/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                You have unsaved changes
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click save to update platform timers and financial rules immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] hover:opacity-90 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

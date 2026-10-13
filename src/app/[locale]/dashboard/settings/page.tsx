'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { toast } from 'react-hot-toast';
import { 
  User, CreditCard, Lock, Loader2, Save, UploadCloud, ShieldCheck, 
  CheckCircle2, AlertCircle, Clock, AlertTriangle, Building2, 
  Eye, EyeOff, Smartphone, Laptop, LogOut, RefreshCw, Trash2, Check, 
  X, Sparkles, Bell, Shield, ChevronRight
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { useTranslations } from 'next-intl';
import { logActivity } from '@/utils/logger';

const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe'
];

interface NotificationPreferences {
  task_updates: boolean;
  withdrawals: boolean;
  daily_streak: boolean;
}

const COUNTRY_OPTIONS = [
  'Bangladesh',
  'India',
  'Pakistan',
  'Malaysia',
  'Saudi Arabia',
  'United Arab Emirates',
  'United States',
  'United Kingdom',
  'Other'
];

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const [activeTab, setActiveTab] = useState<'profile' | 'payment' | 'security' | 'kyc'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile State
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [avatarId, setAvatarId] = useState('avatar-1');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [postCode, setPostCode] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [gender, setGender] = useState('Male');

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentProvider, setNewPaymentProvider] = useState('bKash');
  const [newPaymentCountryCode, setNewPaymentCountryCode] = useState('+880');
  const [newPaymentNumber, setNewPaymentNumber] = useState('');
  // Bank account specific fields
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountName, setNewBankAccountName] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const isMobileBanking = ['bKash', 'Nagad', 'Rocket'].includes(newPaymentProvider);
  const paymentNumberValid = isMobileBanking && newPaymentNumber.replace(/\D/g, '').length === 11;
  const bankFormValid = !isMobileBanking && newBankName.trim() !== '' && newBankAccountName.trim() !== '' && newBankAccountNumber.trim() !== '';

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ browser: 'Browser', os: 'Desktop', isMobile: false });

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    task_updates: true,
    withdrawals: true,
    daily_streak: true
  });

  // KYC State
  const [kycStatus, setKycStatus] = useState('unverified');
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [idType, setIdType] = useState('NID');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    fetchUserData();
    detectDeviceInfo();
  }, []);

  const detectDeviceInfo = () => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent;
    let browser = 'Web Browser';
    if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/')) browser = 'Apple Safari';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

    let os = 'Desktop OS';
    let isMobile = false;
    if (ua.includes('Windows')) os = 'Windows 11 / 10';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) { os = 'Android Device'; isMobile = true; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'Apple iOS'; isMobile = true; }
    else if (ua.includes('Linux')) os = 'Linux';

    setDeviceInfo({ browser, os, isMobile });
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      setEmail(user.email || '');
      setEmailVerified(!!user.email_confirmed_at);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.avatar_id) setAvatarId(profile.avatar_id);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhone(profile.phone || '');
        setAddress(profile.address || '');
        setDistrict(profile.district || '');
        setPostCode(profile.post_code || '');
        if (profile.country) setCountry(profile.country);
        if (profile.gender) setGender(profile.gender);
        setKycStatus(profile.kyc_status || 'unverified');
        setKycRejectReason(profile.kyc_reject_reason || '');
        if (profile.id_type) setIdType(profile.id_type);
        if (profile.id_number) setIdNumber(profile.id_number);
        
        if (profile.notification_preferences) {
          setNotificationPreferences({
            task_updates: profile.notification_preferences.task_updates ?? true,
            withdrawals: profile.notification_preferences.withdrawals ?? true,
            daily_streak: profile.notification_preferences.daily_streak ?? true
          });
        } else if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('ctask_notif_prefs');
          if (cached) {
            try { setNotificationPreferences(JSON.parse(cached)); } catch {}
          }
        }
      }

      const { data: methods } = await supabase.from('user_payment_methods').select('*').eq('user_id', user.id);
      if (methods) setPaymentMethods(methods);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Error sending verification email');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_id: avatarId,
          avatar_url: avatarUrl,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone,
          address,
          district,
          post_code: postCode,
          country,
          gender
        })
        .eq('id', userId);
        
      if (error) throw error;

      await logActivity({
        userId,
        actionType: 'profile',
        description: 'Updated profile information',
        role: 'worker'
      });

      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultPayment = async (methodId: string) => {
    if (!userId) return;
    try {
      // Optimistic update
      setPaymentMethods(prev => prev.map(m => ({ ...m, is_default: m.id === methodId })));

      await supabase.from('user_payment_methods').update({ is_default: false }).eq('user_id', userId);
      await supabase.from('user_payment_methods').update({ is_default: true }).eq('id', methodId);
      
      const { data: methods } = await supabase.from('user_payment_methods').select('*').eq('user_id', userId);
      if (methods) setPaymentMethods(methods);
      
      toast.success('Default payout method updated!');
    } catch {
      toast.error('Error updating default payment');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    let accountNumber = '';
    let extraData: Record<string, string> = {};

    if (isMobileBanking) {
      const digitsOnly = newPaymentNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 11) {
        toast.error('Account number must be exactly 11 digits.');
        return;
      }
      accountNumber = `${newPaymentCountryCode}${digitsOnly}`;
      extraData = { country_code: newPaymentCountryCode };
    } else {
      // Bank account
      if (!newBankName.trim() || !newBankAccountName.trim() || !newBankAccountNumber.trim()) {
        toast.error('Please fill in all bank account fields.');
        return;
      }
      accountNumber = `${newBankName} | ${newBankAccountName} | A/C ${newBankAccountNumber}`;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('user_payment_methods').insert({
        user_id: userId,
        provider: newPaymentProvider,
        account_number: accountNumber,
        is_default: paymentMethods.length === 0,
        ...extraData
      });
      if (error) throw error;
      
      const { data: methods } = await supabase.from('user_payment_methods').select('*').eq('user_id', userId);
      if (methods) setPaymentMethods(methods);
      
      setIsAddingPayment(false);
      setNewPaymentNumber('');
      setNewPaymentCountryCode('+880');
      setNewBankName('');
      setNewBankAccountName('');
      setNewBankAccountNumber('');
      toast.success('Payment method added!');
    } catch (err: any) {
      toast.error(err.message || 'Error adding payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (methodId: string) => {
    if (!userId) return;
    try {
      await supabase.from('user_payment_methods').delete().eq('id', methodId);
      setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
      toast.success('Payment method removed');
    } catch {
      toast.error('Error deleting payment method');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete account');
      
      toast.success('Account deleted successfully');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || 'Error deleting account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Error updating password');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOutOtherDevices = async () => {
    setSigningOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      toast.success('Signed out of all other active sessions successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error signing out other sessions');
    } finally {
      setSigningOutOthers(false);
    }
  };

  const handleToggleNotification = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key]
    };
    setNotificationPreferences(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ctask_notif_prefs', JSON.stringify(updated));
    }

    if (!userId) return;
    try {
      await supabase
        .from('profiles')
        .update({ notification_preferences: updated })
        .eq('id', userId);
    } catch (err) {
      console.warn('Could not persist notification preference to database:', err);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      e.target.value = '';
      return;
    }

    setFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const clearFilePreview = (
    preview: string | null,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    if (!idFront || !idBack) {
      toast.error('Please upload both front and back sides of your ID.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          kyc_reject_reason: null,
          id_type: idType,
          id_number: idNumber,
        })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success('KYC Documents submitted successfully!');
      setKycStatus('pending');
      setIsResubmitting(false);
    } catch (err: any) {
      toast.error(err.message || 'Error submitting KYC');
    } finally {
      setSaving(false);
    }
  };

  // Password evaluation
  const evaluatePassword = (pass: string) => {
    let score = 0;
    const hasMinLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);

    if (hasMinLength) score += 1;
    if (hasUpper && hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSymbol) score += 1;

    let label = t('weak');
    let colorClass = 'bg-rose-500';
    if (score >= 4) {
      label = t('strong');
      colorClass = 'bg-emerald-500';
    } else if (score >= 2) {
      label = t('medium');
      colorClass = 'bg-amber-500';
    }

    return {
      score,
      label,
      colorClass,
      hasMinLength,
      hasUpper,
      hasNumberOrSymbol: hasNumber || hasSymbol,
      matches: confirmPassword.length > 0 && pass === confirmPassword
    };
  };

  const passStats = evaluatePassword(newPassword);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  // Pill tab items with live status indicators
  const tabs = [
    { 
      id: 'profile' as const, 
      label: t('tabProfile'), 
      icon: User,
      indicator: emailVerified ? (
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Email verified" />
      ) : null
    },
    { 
      id: 'payment' as const, 
      label: t('tabPayment'), 
      icon: CreditCard,
      indicator: paymentMethods.length > 0 ? (
        <span className="px-1.5 py-0.5 text-[10px] bg-white/20 dark:bg-purple-950/60 rounded-full font-bold">
          {paymentMethods.length}
        </span>
      ) : null
    },
    { 
      id: 'security' as const, 
      label: t('tabSecurity'), 
      icon: Lock,
      indicator: (
        <span className="w-2 h-2 rounded-full bg-purple-400" />
      )
    },
    { 
      id: 'kyc' as const, 
      label: t('tabKyc'), 
      icon: ShieldCheck,
      indicator: kycStatus === 'verified' ? (
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" title="Verified" />
      ) : kycStatus === 'pending' ? (
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30 animate-pulse" title="Under Review" />
      ) : kycStatus === 'rejected' ? (
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30 animate-ping" title="Rejected" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" title="Unverified" />
      )
    },
  ];

  return (
    <>
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
        </div>

        {/* 1. Modern Segmented Pill Tab Bar (Sticky) */}
        <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-[#070b14]/90 backdrop-blur-xl py-3 border-b border-slate-200/60 dark:border-slate-800/60 -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-900/90 border border-slate-300/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white shadow-md shadow-purple-900/20 scale-[1.01]' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.indicator}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Card */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm transition-all">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('profileInfo')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage personal details and official identity matching.</p>
                </div>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {kycStatus !== 'verified' && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-2xl flex gap-3 text-sm font-medium">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p>{t('profileWarning')}</p>
                  </div>
                )}

                {/* Predefined Avatar Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Choose Profile Avatar</label>
                  <div className="flex flex-wrap gap-3">
                    {PREDEFINED_AVATARS.map((url, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setAvatarUrl(url);
                          setAvatarId('avatar-' + (i + 1));
                        }}
                        className={`w-14 h-14 rounded-full overflow-hidden cursor-pointer border-4 transition-all duration-200 ${
                          avatarUrl === url 
                            ? 'border-[#5A189A] scale-110 shadow-lg shadow-purple-900/20' 
                            : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <img src={url} alt="avatar" className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('firstName')}</label>
                    <input 
                      type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                      disabled={kycStatus === 'verified'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {kycStatus === 'verified' && (
                      <p className="text-xs text-slate-400 mt-1">{t('nameLockedMsg')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('lastName')}</label>
                    <input 
                      type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                      disabled={kycStatus === 'verified'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('emailAddress')}</label>
                      {emailVerified ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('verified')}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> {t('unverified')}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="email" disabled value={email}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    {!emailVerified && (
                      <button 
                        type="button" 
                        onClick={resendVerification}
                        className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline mt-1.5 inline-block"
                      >
                        {t('resendLink')}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('phoneNumber')}</label>
                    <input 
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">{t('addressInfo')}</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('streetAddress')}</label>
                      <input 
                        type="text" required value={address} onChange={e => setAddress(e.target.value)}
                        placeholder="House / Road / Area"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('district')}</label>
                      <input 
                        type="text" required value={district} onChange={e => setDistrict(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('postCode')}</label>
                      <input 
                        type="text" required value={postCode} onChange={e => setPostCode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('country')}</label>
                      <select 
                        required 
                        value={country} 
                        onChange={e => setCountry(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {country && !COUNTRY_OPTIONS.includes(country) && (
                          <option value={country}>{country}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('gender')}</label>
                      <select 
                        required value={gender} onChange={e => setGender(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                      >
                        <option value="Male">{t('male')}</option>
                        <option value="Female">{t('female')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-md shadow-purple-900/20"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('saveProfile')}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {t('dangerZone')}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl gap-4">
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300">{t('deleteAccount')}</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">{t('deleteAccountDesc')}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shrink-0 text-sm shadow-sm"
                  >
                    {t('deleteAccount')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. VISUAL MOBILE BANKING CARDS (PAYMENT TAB) */}
          {activeTab === 'payment' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('withdrawalSettings')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your mobile banking and bank payout destinations.</p>
                </div>
                {!isAddingPayment && (
                  <button 
                    onClick={() => setIsAddingPayment(true)} 
                    className="px-4 py-2 text-sm bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white rounded-xl font-bold hover:opacity-90 shadow-md shadow-purple-900/20 flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('addNewAccount')}
                  </button>
                )}
              </div>

              {/* Saved Payment Methods as Card-Style UI */}
              <div className="space-y-4">
                {paymentMethods.length === 0 && !isAddingPayment && (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800">
                    <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                    <p className="text-slate-500 dark:text-slate-400 mb-4 font-medium">{t('noPaymentMethods')}</p>
                    <button 
                      onClick={() => setIsAddingPayment(true)} 
                      className="px-5 py-2.5 bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white rounded-xl font-bold hover:opacity-90 text-sm shadow-md shadow-purple-900/20"
                    >
                      {t('addNewAccount')}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => {
                    const isBkash = method.provider === 'bKash';
                    const isNagad = method.provider === 'Nagad';
                    const isRocket = method.provider === 'Rocket';
                    const isBank = method.provider === 'Bank Account';

                    // Authentic brand color definition
                    const brandColor = isBkash ? '#E2136E' : isNagad ? '#F7941D' : isRocket ? '#8C3494' : '#0284C7';

                    return (
                      <div 
                        key={method.id} 
                        className={`relative rounded-2xl p-5 border transition-all duration-200 bg-white dark:bg-slate-900/90 shadow-sm ${
                          method.is_default 
                            ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-emerald-500/5' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Top: Brand Badge + Action */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2.5">
                            <span 
                              style={{ backgroundColor: brandColor }}
                              className="px-3 py-1 rounded-full text-white text-xs font-black tracking-wide uppercase shadow-sm"
                            >
                              {method.provider}
                            </span>
                            {method.is_default && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                                <Check className="w-3 h-3" /> Default Payout
                              </span>
                            )}
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleDeletePayment(method.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Remove payment method"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Account Number in clean Monospace */}
                        <div className="my-3">
                          <p className="text-xs text-slate-400 uppercase font-semibold">Account Details</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white font-mono tracking-wider mt-0.5">
                            {method.account_number}
                          </p>
                        </div>

                        {/* Default Toggle Switch */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Set as Default Payout Method
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={method.is_default}
                            onClick={() => handleSetDefaultPayment(method.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              method.is_default ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                method.is_default ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Payment Form with Brand Pill Selectors */}
                {isAddingPayment && (
                  <form onSubmit={handleAddPayment} className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="font-bold text-base mb-4 text-slate-900 dark:text-white">{t('addNewAccount')}</h3>

                    {/* Brand Pill Selectors */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Provider</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        
                        {/* bKash Selector */}
                        <div 
                          onClick={() => {
                            setNewPaymentProvider('bKash');
                            setNewPaymentNumber('');
                          }}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center justify-center text-center ${
                            newPaymentProvider === 'bKash'
                              ? 'border-[#E2136E] bg-[#E2136E]/10 ring-2 ring-[#E2136E]/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-[#E2136E] text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-sm">
                            bK
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">bKash</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">Personal</span>
                        </div>

                        {/* Nagad Selector */}
                        <div 
                          onClick={() => {
                            setNewPaymentProvider('Nagad');
                            setNewPaymentNumber('');
                          }}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center justify-center text-center ${
                            newPaymentProvider === 'Nagad'
                              ? 'border-[#F7941D] bg-[#F7941D]/10 ring-2 ring-[#F7941D]/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-[#F7941D] text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-sm">
                            ন
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">Nagad</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">Personal</span>
                        </div>

                        {/* Rocket Selector */}
                        <div 
                          onClick={() => {
                            setNewPaymentProvider('Rocket');
                            setNewPaymentNumber('');
                          }}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center justify-center text-center ${
                            newPaymentProvider === 'Rocket'
                              ? 'border-[#8C3494] bg-[#8C3494]/10 ring-2 ring-[#8C3494]/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-[#8C3494] text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-sm">
                            🚀
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">Rocket</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">DBBL Account</span>
                        </div>

                        {/* Bank Account Selector */}
                        <div 
                          onClick={() => {
                            setNewPaymentProvider('Bank Account');
                            setNewPaymentNumber('');
                          }}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center justify-center text-center ${
                            newPaymentProvider === 'Bank Account'
                              ? 'border-[#0284C7] bg-[#0284C7]/10 ring-2 ring-[#0284C7]/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-[#0284C7] text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-sm">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">Bank</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">Any BD Bank</span>
                        </div>

                      </div>
                    </div>

                    {/* Mobile Banking Input Fields */}
                    {isMobileBanking && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {newPaymentProvider} 11-digit Mobile Number
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={newPaymentCountryCode}
                            onChange={(e) => setNewPaymentCountryCode(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-3 text-slate-900 dark:text-white text-sm font-mono shrink-0 focus:outline-none"
                          >
                            <option value="+880">🇧🇩 +880</option>
                          </select>
                          <input
                            type="tel"
                            maxLength={11}
                            value={newPaymentNumber}
                            onChange={(e) => setNewPaymentNumber(e.target.value)}
                            required
                            placeholder="01XXXXXXXXX"
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors font-mono tracking-wider"
                          />
                        </div>
                        {paymentNumberValid && (
                          <p className="text-emerald-500 text-xs mt-1.5 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid 11-digit Bangladesh mobile account number
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bank Account Specific Fields */}
                    {!isMobileBanking && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Name</label>
                          <input
                            type="text"
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            required
                            placeholder="e.g. Islami Bank, DBBL"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Holder Name</label>
                          <input
                            type="text"
                            value={newBankAccountName}
                            onChange={(e) => setNewBankAccountName(e.target.value)}
                            required
                            placeholder="e.g. Md. Abdullah"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Number</label>
                          <input
                            type="text"
                            value={newBankAccountNumber}
                            onChange={(e) => setNewBankAccountNumber(e.target.value)}
                            required
                            placeholder="e.g. 20501234567890"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPayment(false);
                          setNewPaymentNumber('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={saving || (isMobileBanking ? !paymentNumberValid : !bankFormValid)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-900/20"
                      >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('saveAccount')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 4. ADVANCED SECURITY & PREFERENCES TAB */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              
              {/* Section A: Password Change & Visual Strength Meter */}
              <div>
                <div className="pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('securityAuth')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Protect your account with a high-entropy password.</p>
                </div>
                
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('newPassword')}</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pr-10 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Real-time Password Strength Meter */}
                      {newPassword.length > 0 && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">{t('passwordStrength')}:</span>
                            <span className="font-bold uppercase tracking-wider">{passStats.label}</span>
                          </div>
                          
                          {/* Segmented bar */}
                          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full mb-3">
                            <div className={`h-full rounded-full transition-all ${passStats.score >= 1 ? passStats.colorClass : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full rounded-full transition-all ${passStats.score >= 2 ? passStats.colorClass : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full rounded-full transition-all ${passStats.score >= 3 ? passStats.colorClass : 'bg-slate-200 dark:bg-slate-700'}`} />
                            <div className={`h-full rounded-full transition-all ${passStats.score >= 4 ? passStats.colorClass : 'bg-slate-200 dark:bg-slate-700'}`} />
                          </div>

                          {/* Checklist indicators */}
                          <div className="space-y-1 text-xs">
                            <div className={`flex items-center gap-1.5 ${passStats.hasMinLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {passStats.hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              <span>At least 8 characters</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${passStats.hasUpper ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {passStats.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              <span>Contains uppercase letter (A-Z)</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${passStats.hasNumberOrSymbol ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {passStats.hasNumberOrSymbol ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              <span>Contains number or symbol</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('confirmNewPassword')}</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pr-10 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && (
                        <p className={`text-xs mt-2 flex items-center gap-1 font-semibold ${passStats.matches ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {passStats.matches ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {passStats.matches ? 'Passwords match' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={saving || newPassword.length < 8 || newPassword !== confirmPassword}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 text-sm shadow-md shadow-purple-900/20"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      {t('updatePassword')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Section B: Active Sessions & Devices */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      {t('activeSessions')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage devices currently logged into your account.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOutOtherDevices}
                    disabled={signingOutOthers}
                    className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {signingOutOthers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    {t('signOutOthers')}
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      {deviceInfo.isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {deviceInfo.browser} on {deviceInfo.os}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t('currentDevice')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Active Session • Bangladesh Timezone • Verified</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section C: Notification Preferences Toggles */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" />
                    {t('notificationPreferences')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure what automated event updates you receive.</p>
                </div>

                <div className="space-y-3">
                  {/* Toggle 1: Task Proof Updates */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t('notifTaskUpdates')}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifTaskUpdatesDesc')}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationPreferences.task_updates}
                      onClick={() => handleToggleNotification('task_updates')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.task_updates ? 'bg-[#5A189A]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.task_updates ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Withdrawals */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t('notifWithdrawals')}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifWithdrawalsDesc')}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationPreferences.withdrawals}
                      onClick={() => handleToggleNotification('withdrawals')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.withdrawals ? 'bg-[#5A189A]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.withdrawals ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: Daily Streak */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t('notifStreak')}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifStreakDesc')}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationPreferences.daily_streak}
                      onClick={() => handleToggleNotification('daily_streak')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.daily_streak ? 'bg-[#5A189A]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.daily_streak ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. INTERACTIVE KYC & IDENTITY TAB */}
          {activeTab === 'kyc' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('identityVerification')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Government ID verification to unlock high-tier earning limits.</p>
                </div>
                
                {/* Live Badge */}
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto
                  ${kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                  ${kycStatus === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                  ${kycStatus === 'unverified' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                  ${kycStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                `}>
                  {kycStatus === 'verified' && <CheckCircle2 className="w-4 h-4" />}
                  {kycStatus === 'pending' && <Clock className="w-4 h-4" />}
                  {kycStatus === 'unverified' && <ShieldCheck className="w-4 h-4" />}
                  {kycStatus === 'rejected' && <AlertCircle className="w-4 h-4" />}
                  {kycStatus === 'verified' ? t('statusVerified') : kycStatus === 'pending' ? t('statusPending') : kycStatus === 'rejected' ? t('statusRejected') : t('statusUnverified')}
                </div>
              </div>

              {/* CELEBRATORY CARD: If KYC is Verified */}
              {kycStatus === 'verified' && (
                <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-purple-500/10 to-emerald-500/5 border border-emerald-500/30 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {t('accountVerified')}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('accountVerifiedDesc')}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Document Number: <span className="font-mono font-bold text-slate-900 dark:text-white">{idNumber ? `••••${idNumber.slice(-4)}` : 'Verified'}</span> ({idType})
                      </p>
                    </div>
                  </div>

                  {/* Unlocked Benefits Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-emerald-500/20">
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/20 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">⚡</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">High Payout Limits</h4>
                        <p className="text-[11px] text-slate-500">Zero limits on task earnings</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/20 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">🚀</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Priority Approvals</h4>
                        <p className="text-[11px] text-slate-500">Fast 24h payout processing</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-500/20 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">💎</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Verified Badge</h4>
                        <p className="text-[11px] text-slate-500">Official trust status</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REJECTION ALERT BANNER: If KYC is Rejected */}
              {kycStatus === 'rejected' && !isResubmitting && (
                <div className="rounded-3xl bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/5 border border-red-500/30 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                          {t('kycRejected')}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Action Required: Resubmit Documents</h3>
                        
                        <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-red-200 dark:border-red-900/50">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">
                            {t('reason')}
                          </span>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            "{kycRejectReason || 'Submitted document images were blurry or details did not match profile.'}"
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {t('reviewAndResubmit')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsResubmitting(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-md shadow-red-600/20 flex items-center gap-2 shrink-0 self-end md:self-center"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('resubmitDocs')}
                    </button>
                  </div>
                </div>
              )}

              {/* PENDING BANNER: If Documents Are Under Review */}
              {kycStatus === 'pending' && (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('underReview')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
                    {t('underReviewDesc')}
                  </p>
                </div>
              )}

              {/* INTERACTIVE KYC UPLOAD FORM: Unverified or Resubmitting */}
              {(kycStatus === 'unverified' || (kycStatus === 'rejected' && isResubmitting)) && (
                <form onSubmit={handleSubmitKyc} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('documentType')}</label>
                      <select 
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors"
                      >
                        <option value="NID">{t('nid')}</option>
                        <option value="Passport">{t('passport')}</option>
                        <option value="Driving License">{t('drivingLicense')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('documentNumber')}</label>
                      <input 
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        required
                        placeholder={`Enter your ${idType} number`}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#5A189A] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Visual Image Previews with Document Edge Guidelines */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Front Document Upload / Preview */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {t('uploadFront')}
                      </label>
                      
                      {idFrontPreview ? (
                        <div className="relative group overflow-hidden rounded-2xl border-2 border-purple-500/50 bg-slate-950 aspect-[16/10] flex items-center justify-center shadow-md">
                          <img src={idFrontPreview} alt="ID Front Preview" className="w-full h-full object-cover" />
                          
                          {/* Corner Scan Edge Guides */}
                          <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-purple-400 rounded-tl pointer-events-none" />
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-purple-400 rounded-tr pointer-events-none" />
                          <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-purple-400 rounded-bl pointer-events-none" />
                          <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-purple-400 rounded-br pointer-events-none" />

                          {/* Overlay Controls */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between text-white">
                            <span className="text-xs font-medium truncate max-w-[150px]">{idFront?.name}</span>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur-sm transition-colors">
                                Replace
                                <input 
                                  type="file" 
                                  accept="image/jpeg, image/png, image/webp"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, setIdFront, setIdFrontPreview)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => clearFilePreview(idFrontPreview, setIdFront, setIdFrontPreview)}
                                className="p-1 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500/60 dark:hover:border-purple-500/60 rounded-2xl p-6 text-center hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-all aspect-[16/10] flex flex-col items-center justify-center cursor-pointer group">
                          {/* Corner Edge Guidelines */}
                          <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-slate-400/40 group-hover:border-purple-500 rounded-tl transition-colors pointer-events-none" />
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-slate-400/40 group-hover:border-purple-500 rounded-tr transition-colors pointer-events-none" />
                          <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-slate-400/40 group-hover:border-purple-500 rounded-bl transition-colors pointer-events-none" />
                          <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-slate-400/40 group-hover:border-purple-500 rounded-br transition-colors pointer-events-none" />

                          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-purple-500 group-hover:scale-110 transition-all mb-2" />
                          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                            Click to upload front photo
                            <input 
                              type="file" 
                              accept="image/jpeg, image/png, image/webp"
                              required={!idFront}
                              className="hidden"
                              onChange={(e) => handleFileChange(e, setIdFront, setIdFrontPreview)}
                            />
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('fileSizeInfo')}</p>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-2">
                            Keep all 4 edges visible • No glare
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Back Document Upload / Preview */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {t('uploadBack')}
                      </label>
                      
                      {idBackPreview ? (
                        <div className="relative group overflow-hidden rounded-2xl border-2 border-purple-500/50 bg-slate-950 aspect-[16/10] flex items-center justify-center shadow-md">
                          <img src={idBackPreview} alt="ID Back Preview" className="w-full h-full object-cover" />
                          
                          {/* Corner Scan Edge Guides */}
                          <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-purple-400 rounded-tl pointer-events-none" />
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-purple-400 rounded-tr pointer-events-none" />
                          <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-purple-400 rounded-bl pointer-events-none" />
                          <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-purple-400 rounded-br pointer-events-none" />

                          {/* Overlay Controls */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between text-white">
                            <span className="text-xs font-medium truncate max-w-[150px]">{idBack?.name}</span>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur-sm transition-colors">
                                Replace
                                <input 
                                  type="file" 
                                  accept="image/jpeg, image/png, image/webp"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, setIdBack, setIdBackPreview)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => clearFilePreview(idBackPreview, setIdBack, setIdBackPreview)}
                                className="p-1 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500/60 dark:hover:border-purple-500/60 rounded-2xl p-6 text-center hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-all aspect-[16/10] flex flex-col items-center justify-center cursor-pointer group">
                          {/* Corner Edge Guidelines */}
                          <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-slate-400/40 group-hover:border-purple-500 rounded-tl transition-colors pointer-events-none" />
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-slate-400/40 group-hover:border-purple-500 rounded-tr transition-colors pointer-events-none" />
                          <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-slate-400/40 group-hover:border-purple-500 rounded-bl transition-colors pointer-events-none" />
                          <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-slate-400/40 group-hover:border-purple-500 rounded-br transition-colors pointer-events-none" />

                          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-purple-500 group-hover:scale-110 transition-all mb-2" />
                          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                            Click to upload back photo
                            <input 
                              type="file" 
                              accept="image/jpeg, image/png, image/webp"
                              required={!idBack}
                              className="hidden"
                              onChange={(e) => handleFileChange(e, setIdBack, setIdBackPreview)}
                            />
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('fileSizeInfo')}</p>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-2">
                            Keep all 4 edges visible • No glare
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {isResubmitting && (
                      <button
                        type="button"
                        onClick={() => setIsResubmitting(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
                      >
                        {t('cancel')}
                      </button>
                    )}
                    <button 
                      type="submit" 
                      disabled={saving || !idFront || !idBack}
                      className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#5A189A] to-[#7B2CBF] text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-md shadow-purple-900/20"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {t('submitDocuments')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold">{t('deleteAccountModalTitle')}</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
              {t('deleteAccountModalDesc')}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <span dangerouslySetInnerHTML={{ __html: t('typeDeleteToConfirm') }} />
              </label>
              <input 
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors"
                disabled={deletingAccount}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

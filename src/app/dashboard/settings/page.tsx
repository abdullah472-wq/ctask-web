'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { toast } from 'react-hot-toast';
import { User, CreditCard, Lock, Loader2, Save, UploadCloud, ShieldCheck, CheckCircle2, AlertCircle, Clock, AlertTriangle, Phone } from 'lucide-react';
import { UserAvatar, AVATARS } from '@/components/UserAvatar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'payment' | 'security' | 'kyc'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile State
  const [email, setEmail] = useState('');
  const [avatarId, setAvatarId] = useState('avatar-1');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [postCode, setPostCode] = useState('');
  const [country, setCountry] = useState('Bangladesh');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // KYC State
  const [kycStatus, setKycStatus] = useState('unverified');
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [idType, setIdType] = useState('NID');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, phone_verified, address, district, post_code, country, avatar_id, default_payment_method, default_payment_number, kyc_status, kyc_reject_reason, id_type, id_number')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.avatar_id) setAvatarId(profile.avatar_id);
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhone(profile.phone || '');
        setPhoneVerified(profile.phone_verified || false);
        setAddress(profile.address || '');
        setDistrict(profile.district || '');
        setPostCode(profile.post_code || '');
        if (profile.country) setCountry(profile.country);
        setPaymentMethod(profile.default_payment_method || '');
        setPaymentNumber(profile.default_payment_number || '');
        setKycStatus(profile.kyc_status || 'unverified');
        setKycRejectReason(profile.kyc_reject_reason || '');
        if (profile.id_type) setIdType(profile.id_type);
        if (profile.id_number) setIdNumber(profile.id_number);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
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
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone,
          address,
          district,
          post_code: postCode,
          country
        })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPhone = () => {
    toast.success('OTP Sent! (Mock)');
    setTimeout(() => {
      setPhoneVerified(true);
      toast.success('Phone verified successfully!');
    }, 1500);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          default_payment_method: paymentMethod,
          default_payment_number: paymentNumber
        })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success('Payment settings updated!');
    } catch (err: any) {
      toast.error(err.message || 'Error updating payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      e.target.value = ''; // Reset input
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      e.target.value = ''; // Reset input
      return;
    }

    setFile(file);
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    if (!idFront || !idBack) {
      toast.error('Please upload both front and back sides of your ID.');
      return;
    }
    
    // In a real app, upload idFront and idBack to Supabase Storage here
    // const frontPath = await uploadToStorage(idFront); ...

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          id_type: idType,
          id_number: idNumber,
          // id_front_url: frontPath,
          // id_back_url: backPath
        })
        .eq('id', userId);
        
      if (error) throw error;
      toast.success('KYC Documents submitted successfully!');
      setKycStatus('pending');
    } catch (err: any) {
      toast.error(err.message || 'Error submitting KYC');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'General Profile', icon: User },
    { id: 'payment', label: 'Payment Settings', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account preferences and configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap border
                ${activeTab === tab.id 
                  ? 'bg-purple-50 dark:bg-brand-accent/10 text-brand-accent border-brand-accent/30 shadow-sm' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-brand-accent' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 p-4 rounded-xl flex gap-3 text-sm font-medium mb-8">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>⚠️ Important: Please ensure your Name and Address exactly match your NID or Government ID. Mismatches will result in KYC rejection and account suspension.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" /> Choose Avatar
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 mb-6">
                      {AVATARS.map(avatar => (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setAvatarId(avatar.id)}
                          className={`relative rounded-xl overflow-hidden transition-all border-2 ${
                            avatarId === avatar.id 
                              ? 'border-brand-accent shadow-[0_0_15px_-3px_#00F2FE] scale-110 z-10' 
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <UserAvatar avatarId={avatar.id} className="w-full aspect-square" />
                          {avatarId === avatar.id && (
                            <div className="absolute inset-0 bg-brand-accent/20 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="w-6 h-6 bg-brand-accent text-dark-bg rounded-full flex items-center justify-center font-bold shadow-md text-xs">✓</div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                      <input 
                        type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                        disabled={kycStatus === 'verified'}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                      <input 
                        type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                        disabled={kycStatus === 'verified'}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  {kycStatus === 'verified' && (
                    <p className="text-xs text-brand-primary font-medium mt-2">
                      <ShieldCheck className="inline-block w-3 h-3 mr-1" />
                      Your name is locked because your identity is already verified.
                    </p>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                      <input 
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-2">Cannot be changed here.</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center w-full mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                        {phoneVerified ? (
                          <span className="text-brand-primary text-xs flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                        ) : (
                          <span className="text-yellow-500 text-xs font-semibold">Unverified</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                          placeholder="+880..."
                        />
                        {!phoneVerified && (
                          <button type="button" onClick={handleVerifyPhone} className="px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Verify
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white">Address Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Street Address</label>
                      <input 
                        type="text" required value={address} onChange={e => setAddress(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">District / State</label>
                        <input 
                          type="text" required value={district} onChange={e => setDistrict(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Post Code</label>
                        <input 
                          type="text" required value={postCode} onChange={e => setPostCode(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country</label>
                        <input 
                          type="text" required value={country} onChange={e => setCountry(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeTab === 'payment' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Withdrawal Settings</h2>
                
                <form onSubmit={handleUpdatePayment} className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>Note:</strong> Set your default withdrawal method here. This will be automatically selected when you request a payout.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default Withdrawal Method</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                      >
                        <option value="" disabled>Select Method</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Binance">Binance</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default Account Number</label>
                      <input 
                        type="text"
                        value={paymentNumber}
                        onChange={(e) => setPaymentNumber(e.target.value)}
                        required
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Payment Settings
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Security & Authentication</h2>
                
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* KYC TAB */}
            {activeTab === 'kyc' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Identity Verification</h2>
                  
                  {/* KYC Status Badge */}
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5
                    ${kycStatus === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${kycStatus === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                    ${kycStatus === 'unverified' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                    ${kycStatus === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                  `}>
                    {kycStatus === 'verified' && <CheckCircle2 className="w-4 h-4" />}
                    {kycStatus === 'pending' && <Clock className="w-4 h-4" />}
                    {kycStatus === 'unverified' && <ShieldCheck className="w-4 h-4" />}
                    {kycStatus === 'rejected' && <AlertCircle className="w-4 h-4" />}
                    {kycStatus}
                  </div>
                </div>
                
                {(kycStatus === 'unverified' || kycStatus === 'rejected') ? (
                  <form onSubmit={handleSubmitKyc} className="space-y-6">
                    {kycStatus === 'rejected' && (
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4 mb-6">
                        <p className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Your KYC submission was rejected
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          <strong>Reason:</strong> {kycRejectReason || 'No reason provided.'}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                          Please review your details and submit clear photos again.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Document Type</label>
                        <select 
                          value={idType}
                          onChange={(e) => setIdType(e.target.value)}
                          required
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                        >
                          <option value="NID">National ID (NID)</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving License">Driving License</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Document Number</label>
                        <input 
                          type="text"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          required
                          placeholder={`Enter your ${idType} number`}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                          Upload Front Side
                          <input 
                            type="file" 
                            accept="image/jpeg, image/png, image/webp"
                            required
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setIdFront)}
                          />
                        </label>
                        <p className="text-xs text-slate-500">{idFront ? idFront.name : "JPEG, PNG, WebP up to 5MB"}</p>
                      </div>

                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                          Upload Back Side
                          <input 
                            type="file" 
                            accept="image/jpeg, image/png, image/webp"
                            required
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setIdBack)}
                          />
                        </label>
                        <p className="text-xs text-slate-500">{idBack ? idBack.name : "JPEG, PNG, WebP up to 5MB"}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-3 rounded-xl bg-[#5A189A] hover:bg-[#7B2CBF] text-white font-bold transition-colors flex items-center justify-center w-full md:w-auto gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Submit Documents
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    {kycStatus === 'pending' ? (
                      <>
                        <Clock className="w-16 h-16 text-amber-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Documents Under Review</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">
                          We have received your KYC submission and our admins are currently reviewing it. This process usually takes 24-48 hours.
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account Verified</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">
                          Your identity has been fully verified. You can now access all premium features and fast withdrawals on Ctask.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}

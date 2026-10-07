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
  const [emailVerified, setEmailVerified] = useState(false);
  const [avatarId, setAvatarId] = useState('avatar-1');
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
  const [newPaymentNumber, setNewPaymentNumber] = useState('');

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

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
      setEmailVerified(!!user.email_confirmed_at);

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, phone_verified, address, district, post_code, country, gender, avatar_id, default_payment_method, default_payment_number, kyc_status, kyc_reject_reason, id_type, id_number')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.avatar_id) setAvatarId(profile.avatar_id);
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
      // First, set all to false
      await supabase.from('user_payment_methods').update({ is_default: false }).eq('user_id', userId);
      // Set selected to true
      await supabase.from('user_payment_methods').update({ is_default: true }).eq('id', methodId);
      
      const { data: methods } = await supabase.from('user_payment_methods').select('*').eq('user_id', userId);
      if (methods) setPaymentMethods(methods);
      
      toast.success('Default payment method updated!');
    } catch (err: any) {
      toast.error('Error updating default payment');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_payment_methods').insert({
        user_id: userId,
        provider: newPaymentProvider,
        account_number: newPaymentNumber,
        is_default: paymentMethods.length === 0
      });
      if (error) throw error;
      
      const { data: methods } = await supabase.from('user_payment_methods').select('*').eq('user_id', userId);
      if (methods) setPaymentMethods(methods);
      
      setIsAddingPayment(false);
      setNewPaymentNumber('');
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
    } catch (err: any) {
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
      // First get current session to send JWT
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
    <>
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
                      <div className="flex justify-between items-center w-full mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                        {emailVerified ? (
                          <span className="text-brand-primary text-xs flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500 text-xs font-semibold">Unverified</span>
                            <button type="button" onClick={resendVerification} className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300 transition-colors">
                              Resend Link
                            </button>
                          </div>
                        )}
                      </div>
                      <input 
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed overflow-hidden text-ellipsis truncate"
                      />
                      <p className="text-xs text-slate-500 mt-2">Cannot be changed here.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                      <input 
                        type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                        placeholder="+880..."
                      />
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

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                        <select 
                          required value={gender} onChange={e => setGender(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
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

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Danger Zone
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl gap-4">
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-300">Delete Account</h4>
                      <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and all associated data.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shrink-0"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeTab === 'payment' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal Settings</h2>
                  {!isAddingPayment && (
                    <button onClick={() => setIsAddingPayment(true)} className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary/90">
                      Add New Account
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {paymentMethods.length === 0 && !isAddingPayment && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-slate-500 mb-4">No payment methods added yet.</p>
                      <button onClick={() => setIsAddingPayment(true)} className="px-4 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary/90">
                        Add New Account
                      </button>
                    </div>
                  )}

                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl gap-4 bg-white dark:bg-slate-900">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{method.provider}</h3>
                          {method.is_default && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-full uppercase">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-mono">{method.account_number}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {!method.is_default && (
                          <button onClick={() => handleSetDefaultPayment(method.id)} className="text-sm text-brand-primary font-medium hover:underline">
                            Set as Default
                          </button>
                        )}
                        <button onClick={() => handleDeletePayment(method.id)} className="text-sm text-red-500 font-medium hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {isAddingPayment && (
                    <form onSubmit={handleAddPayment} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 mt-4">
                      <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Add New Account</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Provider</label>
                          <select 
                            value={newPaymentProvider}
                            onChange={(e) => setNewPaymentProvider(e.target.value)}
                            required
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                          >
                            <option value="bKash">bKash</option>
                            <option value="Nagad">Nagad</option>
                            <option value="Rocket">Rocket</option>
                            <option value="Bank Account">Bank Account</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Number / Details</label>
                          <input 
                            type="text"
                            value={newPaymentNumber}
                            onChange={(e) => setNewPaymentNumber(e.target.value)}
                            required
                            placeholder="e.g. 017XXXXXXXX"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAddingPayment(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                          Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-bold flex items-center gap-2">
                          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save Account
                        </button>
                      </div>
                    </form>
                  )}
                </div>
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

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-xl shadow-2xl border border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold">Delete Account</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure? This action cannot be undone. All your data, tasks, and earnings will be permanently erased.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input 
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

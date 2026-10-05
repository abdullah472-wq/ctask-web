'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader2, Save, Image as ImageIcon, ShieldCheck, Upload, AlertTriangle, Phone, CheckCircle2 } from 'lucide-react';
import { UserAvatar, AVATARS } from '@/components/UserAvatar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  // Profile States
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarId, setAvatarId] = useState('avatar-1');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [postCode, setPostCode] = useState('');
  const [country, setCountry] = useState('Bangladesh');

  // KYC States
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, phone_verified, address, district, post_code, country, verification_status, avatar_id')
      .eq('id', session.user.id)
      .single();

    if (data) {
      if (data.avatar_id) setAvatarId(data.avatar_id);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setPhone(data.phone || '');
      setPhoneVerified(data.phone_verified || false);
      setAddress(data.address || '');
      setDistrict(data.district || '');
      setPostCode(data.post_code || '');
      if (data.country) setCountry(data.country);
      setVerificationStatus(data.verification_status || 'unverified');
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const fullName = `${firstName} ${lastName}`.trim();

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
      .eq('id', session.user.id);

    if (error) {
      toast.error(error.message || 'Error saving profile');
    } else {
      toast.success('Profile updated successfully!');
    }
    setSavingProfile(false);
  };

  const handleVerifyPhone = () => {
    toast.success('OTP Sent! (Mock)');
    setTimeout(() => {
      setPhoneVerified(true);
      toast.success('Phone verified successfully!');
    }, 1500);
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidFile || !selfieFile) return;

    setSubmittingKyc(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const uid = session.user.id;
      
      const nidExt = nidFile.name.split('.').pop();
      const nidPath = `nid-${uid}.${nidExt}`;
      const { error: nidError } = await supabase.storage
        .from('kyc-docs')
        .upload(nidPath, nidFile, { upsert: true });
      if (nidError) throw nidError;

      const selfieExt = selfieFile.name.split('.').pop();
      const selfiePath = `selfie-${uid}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from('kyc-docs')
        .upload(selfiePath, selfieFile, { upsert: true });
      if (selfieError) throw selfieError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'pending',
          nid_image_url: nidPath,
          selfie_image_url: selfiePath
        })
        .eq('id', uid);
      if (updateError) throw updateError;

      setVerificationStatus('pending');
      toast.success('Verification documents submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error submitting documents');
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Edit Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile information and identity verification.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 p-4 rounded-xl flex gap-3 text-sm font-medium mb-8">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>⚠️ Important: Please ensure your Name and Address exactly match your NID or Government ID. Mismatches will result in KYC rejection and account suspension.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Choose Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 mb-6">
              {AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarId(avatar.id)}
                  className={`relative rounded-xl overflow-hidden transition-all border-2 ${
                    avatarId === avatar.id 
                      ? 'border-brand-cyan shadow-[0_0_15px_-3px_#00F2FE] scale-110' 
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <UserAvatar avatarId={avatar.id} className="w-full aspect-square" />
                  {avatarId === avatar.id && (
                    <div className="absolute inset-0 bg-brand-cyan/20 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-6 h-6 bg-brand-cyan text-dark-bg rounded-full flex items-center justify-center font-bold shadow-md">✓</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                <input 
                  type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  disabled={verificationStatus === 'verified'}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                <input 
                  type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  disabled={verificationStatus === 'verified'}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            {verificationStatus === 'verified' && (
              <p className="text-xs text-brand-emerald font-medium mt-2">
                <ShieldCheck className="inline-block w-3 h-3 mr-1" />
                Your name is locked because your identity is already verified.
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center w-full mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                {phoneVerified ? (
                  <span className="text-brand-emerald text-xs flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                ) : (
                  <span className="text-yellow-500 text-xs font-semibold">Unverified</span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
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

          <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Address Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Street Address</label>
              <input 
                type="text" required value={address} onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">District / State</label>
                <input 
                  type="text" required value={district} onChange={e => setDistrict(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Post Code</label>
                <input 
                  type="text" required value={postCode} onChange={e => setPostCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country</label>
                <input 
                  type="text" required value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" disabled={savingProfile}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 mt-8"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>

      {/* KYC Section */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-emerald" /> Identity Verification (KYC)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verify your identity to unlock withdrawals and higher limits.</p>
        </div>

        {verificationStatus === 'verified' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-brand-emerald/10 text-brand-emerald rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account Verified</h3>
            <p className="text-slate-500 dark:text-slate-400">Your identity has been successfully verified. You have full access.</p>
          </div>
        )}

        {verificationStatus === 'pending' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verification Pending</h3>
            <p className="text-slate-500 dark:text-slate-400">We are reviewing your documents. This usually takes 1-2 business days.</p>
          </div>
        )}

        {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
          <form onSubmit={handleKycSubmit} className="space-y-6">
            {verificationStatus === 'rejected' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Your previous verification request was rejected. Please ensure your photos are clear and your details exactly match your NID.</p>
              </div>
            )}
            
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl text-sm">
              Please upload clear, legible images. Blurry documents will be rejected. Required for all withdrawals above 100 ৳.
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">National ID (Front)</label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-brand-cyan/50 transition-colors bg-slate-50 dark:bg-white/5 h-48 flex flex-col items-center justify-center group cursor-pointer overflow-hidden">
                  <input
                    type="file" accept="image/*" required onChange={e => setNidFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <ImageIcon className="w-8 h-8 mb-2 text-slate-400 group-hover:text-teal-700 dark:group-hover:text-brand-cyan transition-colors" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 z-0 relative">
                    {nidFile ? nidFile.name : "Upload NID Image"}
                  </p>
                  <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Clear Selfie</label>
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-brand-cyan/50 transition-colors bg-slate-50 dark:bg-white/5 h-48 flex flex-col items-center justify-center group cursor-pointer overflow-hidden">
                  <input
                    type="file" accept="image/*" required onChange={e => setSelfieFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <ImageIcon className="w-8 h-8 mb-2 text-slate-400 group-hover:text-teal-700 dark:group-hover:text-brand-cyan transition-colors" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 z-0 relative">
                    {selfieFile ? selfieFile.name : "Upload Selfie Image"}
                  </p>
                  <p className="text-xs text-slate-500">Face must be clearly visible</p>
                </div>
              </div>
            </div>

            <button 
              type="submit" disabled={submittingKyc || !nidFile || !selfieFile}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-emerald text-dark-bg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {submittingKyc ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Submit Documents
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full text-slate-200">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          User Privacy & Safety
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
          Last Updated: 10/13/2026
        </p>
      </div>
      
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8 leading-relaxed text-slate-300 text-base sm:text-lg">
        <p className="text-slate-200 leading-relaxed">
          Your privacy is of utmost importance to us at Ctask. This policy outlines how we collect, use, and protect your personal information.
        </p>
        
        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Data Collection
          </h2>
          <p className="mb-3 text-slate-300">
            When you register, we collect basic information such as your name, email address, and IP address. IP addresses are securely tracked to prevent fraud and multi-account abuse.
          </p>
          <p className="text-slate-300">
            During the KYC (Know Your Customer) process, we collect verification data such as National ID (NID) images and verification selfies.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Data Protection & Storage
          </h2>
          <p className="mb-4 text-slate-300">
            All KYC documents (NID, Selfies) are securely encrypted and stored in our protected cloud storage buckets (Supabase Storage). These files are strictly accessed only by authorized Admins for the sole purpose of verifying your identity.
          </p>
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/30 text-purple-200 font-medium">
            🛡️ We will never sell, share, or rent your personal data, email, or KYC documents to any third-party advertisers or external organizations.
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Cookies & Session
          </h2>
          <p className="text-slate-300">
            We use standard session cookies to maintain your login state and provide a smooth, secure browsing experience.
          </p>
        </div>
      </div>
    </div>
  );
}

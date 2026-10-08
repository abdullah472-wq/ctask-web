import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary mt-8">
        Privacy Policy
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Your privacy is of utmost importance to us at Ctask. This policy outlines how we collect, use, and protect your personal information.
        </p>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Data Collection</h2>
        <p>
          When you register, we collect basic information such as your name, email address, and IP address. IP addresses are securely tracked to prevent fraud and multi-account abuse.
        </p>
        <p>
          During the KYC (Know Your Customer) process, we collect sensitive data such as National ID (NID) images and selfies.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Data Protection & Storage</h2>
        <p>
          All KYC documents (NID, Selfies) are securely encrypted and stored in our protected cloud storage buckets (Supabase Storage). These files are strictly accessed only by authorized Admins for the sole purpose of verifying your identity.
        </p>
        <p className="font-bold text-brand-accent">
          We will never sell, share, or rent your personal data, email, or KYC documents to any third-party advertisers or external organizations.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Cookies</h2>
        <p>
          We use standard session cookies to maintain your login state and provide a secure browsing experience.
        </p>
      </div>
    </div>
  );
}

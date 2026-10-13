export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full text-slate-200">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Legal Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
          Terms and Conditions
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
          Last Updated: 10/13/2026
        </p>
      </div>
      
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8 leading-relaxed text-slate-300 text-base sm:text-lg">
        <p className="text-slate-200 leading-relaxed">
          Please read these Terms and Conditions carefully before using the Ctask platform. By registering and using our services, you agree to comply with and be bound by the following rules.
        </p>
        
        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400 font-extrabold">1.</span> Account Rules & Anti-Fraud Policy
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-300">
            <li><strong className="text-white font-semibold">One Account Per Person:</strong> Users are strictly prohibited from creating multiple accounts. We monitor IP addresses. Violations will result in an immediate, permanent ban of all associated accounts.</li>
            <li><strong className="text-white font-semibold">Accurate Information:</strong> You must provide truthful KYC information (NID, Selfie). Fake documents will lead to account termination.</li>
            <li><strong className="text-white font-semibold">No VPNs/Proxies:</strong> The use of VPNs or proxy servers to mask your location is not allowed.</li>
          </ul>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400 font-extrabold">2.</span> Task Guidelines for Workers
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-300">
            <li><strong className="text-white font-semibold">Honest Proofs:</strong> Do not submit fake, recycled, or photoshopped screenshots as task proofs.</li>
            <li><strong className="text-white font-semibold">Rejection:</strong> Advertisers and Admins have the right to reject proofs that do not meet the specified instructions. Excessive rejected proofs may lower your trust score or result in a ban.</li>
          </ul>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400 font-extrabold">3.</span> Guidelines for Advertisers
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-300">
            <li><strong className="text-white font-semibold">Legal Content Only:</strong> Tasks promoting illegal activities, adult content, hate speech, or scams are strictly forbidden.</li>
            <li><strong className="text-white font-semibold">Fair Verification:</strong> Advertisers must review proofs fairly. Maliciously rejecting valid proofs to avoid paying rewards is a violation of our terms.</li>
          </ul>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400 font-extrabold">4.</span> Account Termination
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Ctask reserves the right to block or delete any account at any time without prior notice if we detect suspicious activity, fraud, or violation of these terms.
          </p>
        </div>
      </div>
    </div>
  );
}

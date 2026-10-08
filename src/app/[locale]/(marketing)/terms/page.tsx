
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary mt-8">
        Terms and Conditions
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Last Updated: {new Date().toLocaleDateString()}
        </p>
        <p>
          Please read these Terms and Conditions carefully before using the Ctask platform. By registering and using our services, you agree to comply with and be bound by the following rules.
        </p>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">1. Account Rules & Anti-Fraud Policy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>One Account Per Person:</strong> Users are strictly prohibited from creating multiple accounts. We monitor IP addresses. Violations will result in an immediate, permanent ban of all associated accounts.</li>
          <li><strong>Accurate Information:</strong> You must provide truthful KYC information (NID, Selfie). Fake documents will lead to account termination.</li>
          <li><strong>No VPNs/Proxies:</strong> The use of VPNs or proxy servers to mask your location is not allowed.</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">2. Task Guidelines for Workers</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Honest Proofs:</strong> Do not submit fake, recycled, or photoshopped screenshots as task proofs. </li>
          <li><strong>Rejection:</strong> Advertisers and Admins have the right to reject proofs that do not meet the specified instructions. Excessive rejected proofs may lower your trust score or result in a ban.</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">3. Guidelines for Advertisers</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Legal Content Only:</strong> Tasks promoting illegal activities, adult content, hate speech, or scams are strictly forbidden.</li>
          <li><strong>Fair Verification:</strong> Advertisers must review proofs fairly. Maliciously rejecting valid proofs to avoid paying rewards is a violation of our terms.</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">4. Account Termination</h2>
        <p>
          Ctask reserves the right to block or delete any account at any time without prior notice if we detect suspicious activity, fraud, or violation of these terms.
        </p>
      </div>
    </div>
  );
}

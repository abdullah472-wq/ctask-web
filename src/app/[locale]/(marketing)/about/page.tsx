export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full text-slate-200">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Company Overview
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
          About Us
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
          The leading micro-task & gig economy platform in Bangladesh
        </p>
      </div>
      
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8 leading-relaxed text-slate-300 text-base sm:text-lg">
        <p className="text-slate-200 leading-relaxed">
          Welcome to <strong className="text-white font-bold">Ctask</strong>, the premier micro-task platform built to connect ambitious individuals with businesses and advertisers looking for real, verifiable engagement.
        </p>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-slate-300 leading-relaxed">
            Our mission is to create a transparent, reliable, and highly accessible gig-economy ecosystem. We believe that anyone with an internet connection should have the opportunity to earn a supplementary income from the comfort of their home, while providing immense value to advertisers who need authentic human interaction.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Why Choose Ctask?</h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-300">
            <li><strong className="text-white font-semibold">For Workers:</strong> Easy-to-understand tasks, instant payouts, and zero withdrawal fees.</li>
            <li><strong className="text-white font-semibold">For Advertisers:</strong> Affordable packages, real human engagement, and robust anti-fraud systems to ensure you get exactly what you pay for.</li>
            <li><strong className="text-white font-semibold">Security:</strong> All users undergo a strict KYC process, ensuring our community remains safe and trustworthy.</li>
          </ul>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Our Vision</h2>
          <p className="text-slate-300 leading-relaxed">
            We envision a future where geographical barriers don't limit earning potential. Ctask aims to become the most trusted micro-tasking hub in South Asia, constantly innovating with new task types, faster payout methods, and a thriving community.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-950/30 text-center">
          <p className="font-bold text-purple-200 text-base sm:text-lg">
            Join thousands of users who are already part of the Ctask revolution.
          </p>
        </div>
      </div>
    </div>
  );
}

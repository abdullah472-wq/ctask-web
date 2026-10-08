export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary mt-8">
        About Us
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Welcome to <strong className="text-brand-accent">Ctask</strong>, the leading micro-task platform built to connect ambitious individuals with businesses and advertisers looking for real, verifiable engagement.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Our Mission</h2>
        <p>
          Our mission is to create a transparent, reliable, and highly accessible gig-economy ecosystem. We believe that anyone with an internet connection should have the opportunity to earn a supplementary income from the comfort of their home, while providing immense value to advertisers who need authentic human interaction.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Why Choose Ctask?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>For Workers:</strong> Easy-to-understand tasks, instant payouts, and zero withdrawal fees.</li>
          <li><strong>For Advertisers:</strong> Affordable packages, real human engagement, and robust anti-fraud systems to ensure you get exactly what you pay for.</li>
          <li><strong>Security:</strong> All users undergo a strict KYC process, ensuring our community remains safe and trustworthy.</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Our Vision</h2>
        <p>
          We envision a future where geographical barriers don't limit earning potential. Ctask aims to become the most trusted micro-tasking hub in South Asia, constantly innovating with new task types, faster payout methods, and a thriving community.
        </p>

        <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-6 mt-12">
          <p className="text-center font-bold text-brand-accent mb-0">
            Join thousands of users who are already part of the Ctask revolution.
          </p>
        </div>
      </div>
    </div>
  );
}


export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary mt-8">
        Refund Policy
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Thank you for using Ctask. Please read our refund policy carefully regarding Advertiser deposits and Premium subscriptions.
        </p>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Premium Subscriptions</h2>
        <p>
          Upgrades to the Premium plan are <strong>non-refundable</strong>. Once your account is upgraded and you gain access to premium tasks, the transaction is considered final.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Advertiser Deposits</h2>
        <p>
          Funds deposited into your Advertiser balance are generally <strong>non-refundable</strong> to your original payment method. These funds are intended solely for creating tasks on the platform.
        </p>
        <p>
          If a task you posted is cancelled or deleted by an Admin due to policy violations, the remaining unspent reward budget is not refunded. If the cancellation was due to a system error, the budget will be credited back to your Ctask deposit balance.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-12 mb-4">Exceptions</h2>
        <p>
          If you accidentally sent money twice (duplicate transaction), or if there was a critical technical failure on our end that prevented your funds from being credited, please contact our Support team via WhatsApp within 48 hours for a manual review.
        </p>
      </div>
    </div>
  );
}

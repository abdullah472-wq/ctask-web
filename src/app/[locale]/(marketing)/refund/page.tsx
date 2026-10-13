export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full text-slate-200">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Billing & Payments
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
          Refund Policy
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
          Last Updated: 10/13/2026
        </p>
      </div>
      
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8 leading-relaxed text-slate-300 text-base sm:text-lg">
        <p className="text-slate-200 leading-relaxed">
          Thank you for using Ctask. Please read our refund policy carefully regarding Advertiser deposits and platform transactions.
        </p>
        
        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Advertiser Deposits
          </h2>
          <p className="mb-3 text-slate-300">
            Funds deposited into your Advertiser balance are generally <strong className="text-white font-semibold">non-refundable</strong> to your original payment method. These funds are intended solely for creating tasks and campaigns on the platform.
          </p>
          <p className="text-slate-300">
            If a task you posted is cancelled or deleted by an Admin due to policy violations, the remaining unspent reward budget is not refunded. If the cancellation was due to a verified system error, the remaining budget will be credited back to your Ctask deposit balance.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Exceptions & Dispute Resolution
          </h2>
          <p className="text-slate-300">
            If you accidentally sent money twice (duplicate transaction), or if there was a critical technical failure on our end that prevented your funds from being credited, please contact our Support team via WhatsApp within 48 hours for a manual review.
          </p>
        </div>
      </div>
    </div>
  );
}

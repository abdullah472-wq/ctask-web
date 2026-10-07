const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

// 1. Update Email Field
content = content.replace(
  /className="w-full bg-slate-100 dark:bg-slate-800\/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed"/,
  'className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed overflow-hidden text-ellipsis truncate"'
);

// 2. Add multiple payment methods state & logic
// Find "// Payment State"
content = content.replace(
  /\/\/ Payment State[\s\S]*?\/\/ Security State/,
  `// Payment State
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentProvider, setNewPaymentProvider] = useState('bKash');
  const [newPaymentNumber, setNewPaymentNumber] = useState('');

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Security State`
);

// In fetchUserData:
content = content.replace(
  /setLoading\(false\);\n    }\n  };/,
  `const { data: methods } = await supabase.from('user_payment_methods').select('*').eq('user_id', user.id);
        if (methods) setPaymentMethods(methods);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };`
);

// Replace handleUpdatePayment and add handleDeletePayment, handleAddPayment, handleDeleteAccount
content = content.replace(
  /const handleUpdatePayment = async \([\s\S]*?finally {\n      setSaving\(false\);\n    }\n  };/,
  `const handleSetDefaultPayment = async (methodId: string) => {
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
          'Authorization': \`Bearer \${session.access_token}\`
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
  };`
);

// Add Delete Account Danger Zone in Profile Tab
content = content.replace(
  /<\/button>\n                  <\/div>\n                <\/form>\n              <\/div>/,
  `</button>
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
              </div>`
);

// Replace Payment Tab UI
content = content.replace(
  /<h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Withdrawal Settings<\/h2>[\s\S]*?<\/form>\n              <\/div>/,
  `<div className="flex items-center justify-between mb-6">
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
              </div>`
);

// Append Delete Modal at the bottom before last closing div
content = content.replace(
  /    <\/div>\n  \);\n}\n$/,
  `    </div>

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
    </div>
  );
}
`
);

fs.writeFileSync('src/app/dashboard/settings/page.tsx', content);
console.log('done updating page');

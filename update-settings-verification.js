const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

// Add emailVerified state
content = content.replace(
  "const [email, setEmail] = useState('');",
  "const [email, setEmail] = useState('');\n  const [emailVerified, setEmailVerified] = useState(false);"
);

// Update fetchUserData
content = content.replace(
  "setEmail(user.email || '');",
  "setEmail(user.email || '');\n      setEmailVerified(!!user.email_confirmed_at);"
);

// Add resendVerification
const resendFunc = `
  const resendVerification = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Error sending verification email');
    }
  };
`;
content = content.replace(
  "const handleUpdateProfile = async (e: React.FormEvent) => {",
  resendFunc + "\n  const handleUpdateProfile = async (e: React.FormEvent) => {"
);

// Replace Email UI and Phone UI
const emailPhoneUIReplacement = `                  <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <div className="flex justify-between items-center w-full mb-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                        {emailVerified ? (
                          <span className="text-brand-primary text-xs flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500 text-xs font-semibold">Unverified</span>
                            <button type="button" onClick={resendVerification} className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300 transition-colors">
                              Resend Link
                            </button>
                          </div>
                        )}
                      </div>
                      <input 
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed overflow-hidden text-ellipsis truncate"
                      />
                      <p className="text-xs text-slate-500 mt-2">Cannot be changed here.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                      <input 
                        type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand-accent transition-colors"
                        placeholder="+880..."
                      />
                    </div>
                  </div>`;

// We use regex to replace the old layout block
content = content.replace(
  /<div className="grid sm:grid-cols-2 gap-6 pt-2">[\s\S]*?<\/div>\n                  <\/div>/,
  emailPhoneUIReplacement
);

// We need to remove the handleVerifyPhone function and phoneVerified state
content = content.replace(/const \[phoneVerified, setPhoneVerified\] = useState\(false\);\n/, '');
content = content.replace(/setPhoneVerified\(profile\.phone_verified \|\| false\);\n/, '');
content = content.replace(/const handleVerifyPhone = \(\) => {[\s\S]*?};\n/, '');


fs.writeFileSync('src/app/dashboard/settings/page.tsx', content);
console.log('done settings');

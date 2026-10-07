const fs = require('fs');
let content = fs.readFileSync('src/app/auth/page.tsx', 'utf8');

const replacement = `{!isLogin && (
              <div className="flex items-start gap-3 mt-4 mb-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-[#5A189A] focus:ring-[#5A189A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#5A189A] hover:underline font-medium dark:text-purple-400">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-[#5A189A] hover:underline font-medium dark:text-purple-400">
                    Privacy Policy
                  </Link>.
                </label>
              </div>
            )}

            <button
              type="submit"`;

content = content.replace(/<button\s+type="submit"/g, replacement);

fs.writeFileSync('src/app/auth/page.tsx', content);
console.log('done');

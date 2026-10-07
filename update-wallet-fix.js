const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/wallet/page.tsx', 'utf8');

// Add user session to state to check email_confirmed_at
content = content.replace(
  'const [balance, setBalance] = useState(0);',
  'const [balance, setBalance] = useState(0);\n  const [isEmailVerified, setIsEmailVerified] = useState(false);'
);

content = content.replace(
  'if (!session) return;',
  'if (!session) return;\n    setIsEmailVerified(!!session.user.email_confirmed_at);'
);

const newWithdraw = `const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) {
      toast.error("Action Denied: You must verify your email address from your profile before requesting a payout.");
      return;
    }`;

content = content.replace(
  'const handleWithdraw = (e: React.FormEvent) => {\n    e.preventDefault();',
  newWithdraw
);

fs.writeFileSync('src/app/dashboard/wallet/page.tsx', content);
console.log('done wallet');

const fs = require('fs');
let content = fs.readFileSync('src/app/auth/page.tsx', 'utf8');

const newCode = `setError(null);
          toast.success('Registration successful! Please check your email inbox (and spam folder) to verify your account before logging in.', { duration: 8000 });
          setIsLogin(true);`;

content = content.replace(/setError\('Please check your email to verify your account.'\);/, newCode);

fs.writeFileSync('src/app/auth/page.tsx', content);
console.log('done auth');

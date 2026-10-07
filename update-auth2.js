const fs = require('fs');
let content = fs.readFileSync('src/app/auth/page.tsx', 'utf8');

const newCode = `const trackLogin = async (token: string) => {
    try {
      await fetch('/api/auth/track', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
    } catch (e) {}
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: \`\${window.location.origin}/auth/callback\`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || \`An error occurred during \${provider} authentication.\`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
          await trackLogin(data.session.access_token);
        }
        
        router.push('/dashboard');
      } else {
        // Signup logic & Anti-Fraud
        if (!termsAccepted) {
          toast.error("You must accept the Terms and Privacy Policy to register.");
          setLoading(false);
          return;
        }

        // IP Validation via Server Route
        const preCheckRes = await fetch('/api/auth/pre-check');
        const { exists, ip: clientIp } = await preCheckRes.json();
        
        if (exists) {
          throw new Error('Registration blocked: Multiple accounts from the same network or device are not permitted.');
        }

        let referredById = null;
        if (referralCode) {
          const { data: refUser } = await supabase
            .from('profiles')
            .select('id, wallet_balance')
            .eq('referral_code', referralCode.toUpperCase())
            .single();
            
          if (refUser) {
            referredById = refUser.id;
            await supabase
              .from('profiles')
              .update({ wallet_balance: Number(refUser.wallet_balance) + 20 })
              .eq('id', refUser.id);
          } else {
            throw new Error('Invalid Referral Code');
          }
        }

        const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              referral_code: newReferralCode,
              referred_by: referredById,
              last_ip: clientIp // Stored initially for reference
            },
          },
        });
        if (signUpError) throw signUpError;
        
        if (data.session) {
          // If auto-login is on (confirm email disabled), log IP
          await trackLogin(data.session.access_token);
          router.push('/dashboard');
        } else {
          setError(null);
          toast.success('Registration successful! Please check your email inbox (and spam folder) to verify your account before logging in.', { duration: 8000 });
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
      if (err.message.includes('blocked')) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(/const fetchClientIP = async \(\) => \{[\s\S]*?\} finally \{\s*setLoading\(false\);\s*\}\s*\};\s*/, newCode);

fs.writeFileSync('src/app/auth/page.tsx', content);
console.log('done auth update');

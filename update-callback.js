const fs = require('fs');
let content = fs.readFileSync('src/app/auth/callback/page.tsx', 'utf8');

const newAuthLogic = `    const handleAuth = async () => {
      // Supabase client automatically processes the URL parameters (like access_token or code) on load
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      
      if (session) {
        // Run anti-cheat IP tracking logic for OAuth callback
        try {
          const res = await fetch('/api/auth/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${session.access_token}\`
            }
          });
          const { blocked } = await res.json();
          
          if (blocked) {
            await supabase.auth.signOut();
            setError('Registration blocked: Multiple accounts from the same network or device are not permitted.');
            return;
          }
        } catch (e) {
          console.error('Failed to run IP tracking', e);
        }

        // Auth success
        router.push('/dashboard');
      } else {
        // Fallback: listen for auth state change
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            try {
              const res = await fetch('/api/auth/track', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': \`Bearer \${session.access_token}\`
                }
              });
              const { blocked } = await res.json();
              if (blocked) {
                await supabase.auth.signOut();
                setError('Registration blocked: Multiple accounts from the same network or device are not permitted.');
                return;
              }
            } catch (e) {}
            router.push('/dashboard');
          }
        });
        
        // Timeout if no event happens after 5 seconds
        setTimeout(() => {
          if (!session) {
            setError('Authentication failed or timed out. Please try again.');
          }
        }, 5000);
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      }
    };`;

content = content.replace(/    const handleAuth = async \(\) => \{[\s\S]*?    \};\n/g, newAuthLogic + '\n');
fs.writeFileSync('src/app/auth/callback/page.tsx', content);
console.log('done callback update');

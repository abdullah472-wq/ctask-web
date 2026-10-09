const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env.local or .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BD_NAMES = [
  { name: 'Md. Rahim', gender: 'male' },
  { name: 'Nusrat Jahan', gender: 'female' },
  { name: 'Abdul Karim', gender: 'male' },
  { name: 'Maryam Akter', gender: 'female' },
  { name: 'Tariqul Islam', gender: 'male' },
  { name: 'Sadia Sultana', gender: 'female' },
  { name: 'Faisal Ahmed', gender: 'male' },
  { name: 'Sumaiya Binte', gender: 'female' },
  { name: 'Arif Hossain', gender: 'male' },
  { name: 'Farhana Haque', gender: 'female' }
];

const INTL_NAMES = [
  { name: 'John Doe', gender: 'male', country: 'USA' },
  { name: 'Maria Garcia', gender: 'female', country: 'Spain' },
  { name: 'David Smith', gender: 'male', country: 'UK' },
  { name: 'Aisha Patel', gender: 'female', country: 'India' },
  { name: 'Chen Wei', gender: 'male', country: 'China' },
  { name: 'Fatima Ali', gender: 'female', country: 'UAE' },
  { name: 'Emmanuel Ojo', gender: 'male', country: 'Nigeria' },
  { name: 'Isabella Rossi', gender: 'female', country: 'Italy' },
  { name: 'James Wilson', gender: 'male', country: 'Australia' },
  { name: 'Sophia Kim', gender: 'female', country: 'South Korea' }
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TOTAL_USERS = 40;

async function seedUsers() {
  console.log(`🚀 Starting Mock User Seeding (${TOTAL_USERS} users)...`);
  
  let successCount = 0;
  
  for (let i = 1; i <= TOTAL_USERS; i++) {
    try {
      const isBd = i <= (TOTAL_USERS * 0.75); // 75% BD, 25% Intl
      
      const identity = isBd ? getRandomElement(BD_NAMES) : getRandomElement(INTL_NAMES);
      const email = `mockuser_${Date.now()}_${i}@ctask.local`;
      const country = isBd ? 'Bangladesh' : identity.country;
      const balance = Math.random() > 0.5 ? Math.floor(Math.random() * 500) : 0; // 50% chance of having balance
      
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: {
          full_name: identity.name
        }
      });

      if (authError) {
        console.error(`❌ Failed to create auth user ${email}:`, authError.message);
        continue;
      }

      const userId = authData.user.id;
      
      // Wait for trigger to fire
      await new Promise(res => setTimeout(res, 500));

      // 2. Update Public Profile
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(identity.name)}`;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: identity.name,
          country: country,
          gender: identity.gender,
          wallet_balance: balance,
          avatar_url: avatarUrl,
          role: 'worker'
        })
        .eq('id', userId);

      if (profileError) {
        console.error(`❌ Failed to update profile for ${email}:`, profileError.message);
      } else {
        console.log(`✅ [${i}/${TOTAL_USERS}] Created: ${identity.name} (${country}) | Balance: ${balance}৳`);
        successCount++;
      }
      
    } catch (err) {
      console.error(`❌ Unexpected error on iteration ${i}:`, err.message);
    }
  }
  
  console.log(`🎉 Seeding complete! Successfully generated ${successCount} mock users.`);
}

seedUsers();

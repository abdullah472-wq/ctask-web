import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: This route requires SUPABASE_SERVICE_ROLE_KEY to bypass RLS and create users.
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase Admin credentials' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const dummyNames = [
    { name: 'John Doe', gender: 'Male', country: 'US' },
    { name: 'Sarah Rahman', gender: 'Female', country: 'BD' },
    { name: 'Ali Khan', gender: 'Male', country: 'PK' },
    { name: 'Emily Chen', gender: 'Female', country: 'US' },
    { name: 'Michael Smith', gender: 'Male', country: 'UK' },
    { name: 'Fatima Zahra', gender: 'Female', country: 'BD' },
    { name: 'Rahul Sharma', gender: 'Male', country: 'IN' },
    { name: 'Jessica Taylor', gender: 'Female', country: 'UK' },
    { name: 'David Wong', gender: 'Male', country: 'US' },
    { name: 'Aisha Patel', gender: 'Female', country: 'IN' },
    { name: 'Omar Farooq', gender: 'Male', country: 'PK' },
    { name: 'Sophia Miller', gender: 'Female', country: 'US' },
    { name: 'Arif Hossain', gender: 'Male', country: 'BD' },
    { name: 'Emma Wilson', gender: 'Female', country: 'UK' },
    { name: 'Kevin Lee', gender: 'Male', country: 'US' },
    { name: 'Priya Desai', gender: 'Female', country: 'IN' },
    { name: 'Tariq Mahmood', gender: 'Male', country: 'PK' },
    { name: 'Olivia Brown', gender: 'Female', country: 'UK' },
    { name: 'Hasan Mahmud', gender: 'Male', country: 'BD' },
    { name: 'Daniel Martinez', gender: 'Male', country: 'US' },
    { name: 'Nusrat Jahan', gender: 'Female', country: 'BD' },
    { name: 'Amit Kumar', gender: 'Male', country: 'IN' },
    { name: 'Chloe Davies', gender: 'Female', country: 'UK' },
    { name: 'Bilal Ahmed', gender: 'Male', country: 'PK' },
    { name: 'Isabella Anderson', gender: 'Female', country: 'US' },
    { name: 'Shakil Ahmed', gender: 'Male', country: 'BD' },
    { name: 'Grace Taylor', gender: 'Female', country: 'UK' },
    { name: 'Vikram Singh', gender: 'Male', country: 'IN' },
    { name: 'Sana Khan', gender: 'Female', country: 'PK' },
    { name: 'Matthew Davis', gender: 'Male', country: 'US' }
  ];

  const results = [];

  try {
    for (const [index, person] of dummyNames.entries()) {
      // 1. Create unique fake email
      const fakeEmail = `demo.user.${index + 1}.${Date.now()}@example.com`;
      const fakePassword = `DemoPassword${Date.now()}!`;
      const randomEarned = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
      
      // Dicebear avatar
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(person.name)}`;

      // 2. Create user with admin API
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true, // Auto-verify
        user_metadata: {
          full_name: person.name,
          avatar_url: avatarUrl,
        }
      });

      if (userError) {
        results.push({ name: person.name, status: 'Failed to create auth', error: userError.message });
        continue;
      }

      const userId = userData.user.id;

      // Wait a tiny bit for the postgres trigger to finish inserting into profiles
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Update the profile row with leaderboard stats
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          gender: person.gender,
          country: person.country,
          total_earned: randomEarned,
          avatar_url: avatarUrl
        })
        .eq('id', userId);

      if (profileError) {
        results.push({ name: person.name, status: 'Failed to update profile', error: profileError.message });
      } else {
        results.push({ name: person.name, status: 'Success', earned: randomEarned });
      }
    }

    return NextResponse.json({
      message: 'Seeding completed. PLEASE DELETE THIS FILE FOR SECURITY.',
      results
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

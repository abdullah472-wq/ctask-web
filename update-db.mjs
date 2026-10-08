import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name');
  if (error) {
    console.error(error);
    return;
  }

  for (const profile of profiles) {
    const name = profile.full_name || 'User';
    const seed = encodeURIComponent(name);
    // Use DiceBear API as requested: https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    
    // Update both avatar_url and avatar_id so RPCs using avatar_id still work
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl, avatar_id: newAvatarUrl })
      .eq('id', profile.id);
      
    if (updateError) {
      console.error(`Failed to update ${profile.id}:`, updateError);
    } else {
      console.log(`Updated ${name} -> ${newAvatarUrl}`);
    }
  }
  console.log('Done');
}

main();

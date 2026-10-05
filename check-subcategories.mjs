import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zymzkdepyvhmnvetksbr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bXprZGVweXZobW52ZXRrc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NDE3NzUsImV4cCI6MjEwNjUxNzc3NX0._qrTwIRHXenP11Df5UiUQ4Rwuzbt0q8OfsqXrO6l1PQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubcategories() {
  const { data, error } = await supabase.from('task_subcategories').select('*');
  if (error) {
    console.error('Error fetching subcategories:', error);
  } else {
    console.log('Subcategories found:', data.length);
    if (data.length > 0) {
      console.log('First subcategory:', data[0]);
    }
  }
}

checkSubcategories();

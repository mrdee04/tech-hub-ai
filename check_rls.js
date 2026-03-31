import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  // We can't directly check RLS status without being admin, 
  // but we can try to see if a simple select works or if there are any errors.
  const { data, error, status } = await supabase.from('reviews').select('*');
  console.log('Status:', status);
  console.log('Error:', error);
  console.log('Data Length:', data ? data.length : 'null');
  
  // Try to insert a test review to see if it even works
  const { data: insData, error: insError } = await supabase.from('reviews').insert({
    product_id: '9099b2f4-b3e9-4b9f-a56f-7b03856aa08a',
    author: 'Test Bot',
    content: 'Test Review',
    rating: 5,
    type: 'user'
  }).select();
  
  console.log('Insert Error:', insError);
  console.log('Insert Data:', insData);
}

checkRLS();

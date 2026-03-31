import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllReviews() {
  const ids = [
    'f07ab0bf-d300-4049-a6d6-7f066bb8b565',
    'e7b856a4-a889-4a9f-a9de-ef4e300a5549',
    '9099b2f4-b3e9-4b9f-a56f-7b03856aa08a'
  ];

  for (const id of ids) {
    const { data, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', id);
    
    console.log(`Product ID: ${id} | Review Count: ${count}`);
    if (data && data.length > 0) {
      console.log('Sample Review:', JSON.stringify(data[0], null, 2));
    }
  }
}

checkAllReviews();

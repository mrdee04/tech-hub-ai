import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReviews() {
  const productId = '9099b2f4-b3e9-4b95-a56f-7b03856aa08a';
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewers(*)')
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching reviews:', error);
    // Try without join in case join fails
    const { data: d2, error: e2 } = await supabase.from('reviews').select('*').eq('product_id', productId);
    if (e2) console.error(e2);
    else console.log('Reviews (no join):', JSON.stringify(d2, null, 2));
    return;
  }

  console.log('Reviews for product:', JSON.stringify(data, null, 2));
}

checkReviews();

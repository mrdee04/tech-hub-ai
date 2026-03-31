import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*');

  if (error) {
    console.error('Error listing reviews:', error);
    return;
  }

  console.log(`Total reviews: ${data.length}`);
  data.forEach(r => {
    console.log(`ID: ${r.id} | ProductID: ${r.product_id} | Author: ${r.author} | Type: ${r.type}`);
  });
}

listAllReviews();

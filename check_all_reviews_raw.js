import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllReviewsRaw() {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      products ( name )
    `);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total reviews found:', data.length);
    console.log('Reviews:', JSON.stringify(data, null, 2));
  }
}

checkAllReviewsRaw();

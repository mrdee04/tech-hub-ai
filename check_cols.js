import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching reviews:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in reviews table:', Object.keys(data[0]));
  } else {
    // Try to get another product if this one has no reviews
    const { data: allData, error: allErr } = await supabase.from('reviews').select('*').limit(1);
    if (allErr) console.error(allErr);
    else if (allData && allData.length > 0) console.log('Columns in reviews table:', Object.keys(allData[0]));
    else console.log('No data in reviews table to check columns.');
  }
}

checkColumns();

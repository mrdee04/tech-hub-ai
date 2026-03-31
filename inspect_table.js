import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
  const { data, error } = await supabase.from('reviews').select('*').limit(1);
  if (error) {
    console.error('Error selecting from reviews:', error.message);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

inspectTable();

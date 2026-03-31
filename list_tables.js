import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  // We can use a trick to list tables via a RPC or just by trying to select from common names
  const commonNames = ['reviews', 'review', 'product_reviews', 'user_reviews', 'comments', 'comment'];
  for (const name of commonNames) {
    const { count, error } = await supabase.from(name).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table exists: ${name} | Count: ${count}`);
    } else if (error.code !== 'PGRST116' && error.code !== '42P01') {
      console.log(`Table might exist: ${name} | Error: ${error.message} (${error.code})`);
    }
  }
}

listTables();

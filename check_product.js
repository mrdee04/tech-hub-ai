import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%iPhone 17 Pro Max%')
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return;
  }

  console.log('Product data:', JSON.stringify(data, null, 2));
  
  // Also check reviews table again, but just count
  const { count, error: countErr } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });
    
  console.log('Total reviews in table:', count);
}

checkProduct();

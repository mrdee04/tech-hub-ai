import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIphone() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%iPhone 17%');

  if (error) {
    console.error(error);
    return;
  }

  fs.writeFileSync('iphone_details.json', JSON.stringify(data, null, 2));
  console.log('Details written to iphone_details.json');
}

checkIphone();

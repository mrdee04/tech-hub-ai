import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrInitSettings() {
  console.log('Checking for site_settings table...');
  const { data, error } = await supabase.from('site_settings').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Table site_settings does not exist. We need to create it.');
    // Since we only have anon key, we might need a SQL script or assume Admin has to do it.
    // Let's print out the error to be sure.
    console.log(error);
  } else if (error) {
    console.log('Error accessing site_settings:', error.message);
  } else {
    console.log('Table exists. Data:', data);
  }
}

checkOrInitSettings();

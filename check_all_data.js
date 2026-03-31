import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllData() {
  const tables = ['products', 'reviews', 'reviewers', 'profiles', 'sale_posts', 'comments'];
  let results = '';
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      results += `Table: ${table} | Error: ${error.message}\n`;
    } else {
      results += `Table: ${table} | Row Count: ${count}\n`;
    }
  }
  fs.writeFileSync('counts.txt', results);
  console.log('Results written to counts.txt');
}

checkAllData();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://anmyctrnuqhlndeiohpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubXljdHJudXFobG5kZWlvaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTY0ODUsImV4cCI6MjA4OTQ5MjQ4NX0.2mLQPWGYHhIkQ-wYxvbBLIGAptb76AA0dPon_LUHEqk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function dumpProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Error dumping products:', error);
    return;
  }

  const output = data.map(p => `ID: ${p.id} | Name: ${p.name}`).join('\n');
  fs.writeFileSync('product_dump_utf8.txt', output, 'utf8');
  console.log('Dumped to product_dump_utf8.txt');
}

dumpProducts();

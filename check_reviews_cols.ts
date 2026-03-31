import { supabase } from './src/supabaseClient';

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
    console.log('No data in reviews table to check columns.');
  }
}

checkColumns();

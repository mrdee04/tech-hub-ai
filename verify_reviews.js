import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load ENV from .env file manually since we are in ESM
const envFile = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.trim().split('=')));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('--- Verification Started ---');

  // 1. Find Product ID
  const { data: products } = await supabase.from('products').select('id, name').ilike('name', '%iPhone 17 Pro Max%');
  if (!products || products.length === 0) {
    console.error('Product not found!');
    return;
  }
  const productId = products[0].id;
  console.log(`Found Product: ${products[0].name} (${productId})`);

  // 2. Find a Reviewer (KOL)
  const { data: reviewers } = await supabase.from('reviewers').select('id, name').limit(1);
  const reviewerId = reviewers?.[0]?.id;
  const reviewerName = reviewers?.[0]?.name || 'Vật Vờ Studio';
  console.log(`Using Reviewer: ${reviewerName} (${reviewerId})`);

  // 3. Add Test Reviews
  const testReviews = [
    {
      product_id: productId,
      author: reviewerName,
      type: 'reviewer',
      content: 'Chip A19 Pro cực mạnh, camera 120MP zoom quang 10x thật sự ấn tượng.',
      post_url: 'https://youtube.com',
      reviewer_id: reviewerId,
      rating: 5
    },
    {
      product_id: productId,
      author: 'Tuấn Ngọc Đây',
      type: 'reviewer',
      content: 'Màn hình 144Hz quá mượt, tuy nhiên giá hơi cao.',
      post_url: 'https://facebook.com',
      rating: 4
    },
    {
      product_id: productId,
      author: 'Thanh Hằng',
      type: 'user',
      content: 'Mình vừa mua xong, dùng rất thích, pin trâu lắm!',
      rating: 5
    },
    {
      product_id: productId,
      author: 'Minh Tuấn',
      type: 'user',
      content: 'Máy hơi nặng tay nhưng cầm rất sang trọng.',
      rating: 4
    }
  ];

  console.log('Adding 4 test reviews...');
  const { error } = await supabase.from('reviews').insert(testReviews);
  
  if (error) {
    console.error('Error adding reviews:', error);
  } else {
    console.log('Successfully added 4 test reviews!');
  }

  // 4. Verify Joining logic
  console.log('Verifying joining logic...');
  const { data: joinedData } = await supabase
    .from('reviews')
    .select('*, reviewers(*)')
    .eq('product_id', productId);
  
  console.log(`Retrieved ${joinedData?.length} reviews with joined reviewer info.`);
  if (joinedData && joinedData.some(r => r.reviewers)) {
    console.log('SUCCESS: Reviewer data is correctly joined.');
  } else {
    console.warn('WARNING: Reviewer data join returned no matches (expected if reviewer_id was null or not found).');
  }

  console.log('--- Verification Complete ---');
}

verify();

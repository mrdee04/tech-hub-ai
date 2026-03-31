import { supabase } from '../supabaseClient';
import type { Product } from '../components/ProductCard';
import { fetchCommentsCountForProducts } from './commentService';
import { fetchSalePostsCountForProducts } from './saleHuntingService';
import { fetchReviewsForProduct } from './reviewService';

export const fetchProducts = async (category: string = 'all'): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*');

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Supabase error fetching products:', error);
    return [];
  }

  // Fetch comment counts
  const productIds = data.map((item: any) => item.id);
  const commentCounts = await fetchCommentsCountForProducts(productIds);
  const salePostCounts = await fetchSalePostsCountForProducts(productIds);
  
  return Promise.all(data.map(async (item: any) => {
    const dbReviews = await fetchReviewsForProduct(item.id);
    const commentsCount = commentCounts[item.id] || 0;
    const salePostCount = salePostCounts[item.id] || 0;
    
    // Status mocking logic
    let status: Product['status'] = undefined;
    if (item.name.includes('iPhone 17')) status = 'hot';
    else if (item.name.includes('S26')) status = 'new';
    else if (item.name.includes('MacBook')) status = 'best-seller';

    return {
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      bottomPrice: item.bottom_price,
      rating: Number(item.rating),
      reviewCount: dbReviews.length + (item.review_count || 0) + commentsCount,
      topReview: item.top_review,
      category: item.category,
      shops: item.shops || [],
      reviews: dbReviews,
      status: status,
      bottomPriceTime: item.bottom_price_time,
      bottomPricePlatform: item.bottom_price_platform,
      bottomPriceLink: item.bottom_price_link,
      dayVuong: item.day_vuong,
      variants: item.variants
    };
  }));
};

export const addProduct = async (product: Omit<Product, 'id' | 'reviewCount'>): Promise<Product | null> => {
  const dbProduct = {
    name: product.name,
    image_url: product.imageUrl,
    bottom_price: product.bottomPrice,
    rating: product.rating,
    top_review: product.topReview,
    shops: product.shops,
    review_count: 0,
    bottom_price_time: product.bottomPriceTime,
    bottom_price_platform: product.bottomPricePlatform,
    bottom_price_link: product.bottomPriceLink,
    day_vuong: product.dayVuong,
    variants: product.variants
  };

  const { data, error } = await supabase
    .from('products')
    .insert([dbProduct])
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    imageUrl: data.image_url,
    bottomPrice: data.bottom_price,
    rating: Number(data.rating),
    reviewCount: data.review_count,
    topReview: data.top_review,
    shops: data.shops || [],
    bottomPriceTime: data.bottom_price_time,
    bottomPricePlatform: data.bottom_price_platform,
    bottomPriceLink: data.bottom_price_link,
    dayVuong: data.day_vuong,
    variants: data.variants
  } as Product;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.bottomPrice !== undefined) dbUpdates.bottom_price = updates.bottomPrice;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.topReview !== undefined) dbUpdates.top_review = updates.topReview;
  if (updates.shops !== undefined) dbUpdates.shops = updates.shops;
  if (updates.bottomPriceTime !== undefined) dbUpdates.bottom_price_time = updates.bottomPriceTime;
  if (updates.bottomPricePlatform !== undefined) dbUpdates.bottom_price_platform = updates.bottomPricePlatform;
  if (updates.bottomPriceLink !== undefined) dbUpdates.bottom_price_link = updates.bottomPriceLink;
  if (updates.dayVuong !== undefined) dbUpdates.day_vuong = updates.dayVuong;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.variants !== undefined) dbUpdates.variants = updates.variants;

  const { error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }
  return true;
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching product by id:', error);
    return null;
  }

  // Fetch counts and reviews
  const commentCounts = await fetchCommentsCountForProducts([data.id]);
  const commentsCount = commentCounts[data.id] || 0;
  const dbReviews = await fetchReviewsForProduct(data.id);

  let status: Product['status'] = undefined;
  if (data.name.includes('iPhone 17')) status = 'hot';
  else if (data.name.includes('S26')) status = 'new';
  else if (data.name.includes('MacBook')) status = 'best-seller';

    return {
    id: data.id,
    name: data.name,
    imageUrl: data.image_url,
    bottomPrice: data.bottom_price,
    rating: Number(data.rating),
    reviewCount: dbReviews.length + (data.review_count || 0) + commentsCount,
    topReview: data.top_review,
    category: data.category,
    shops: data.shops || [],
    reviews: dbReviews,
    status: status,
    bottomPriceTime: data.bottom_price_time,
    bottomPricePlatform: data.bottom_price_platform,
    bottomPriceLink: data.bottom_price_link,
    dayVuong: data.day_vuong,
    variants: data.variants
  } as Product;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }

  return true;
};

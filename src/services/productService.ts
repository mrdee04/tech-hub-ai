import { supabase } from '../supabaseClient';
import type { Product } from '../components/ProductCard';

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Map snake_case from DB to camelCase for Frontend
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.image_url,
    bottomPrice: item.bottom_price,
    rating: Number(item.rating),
    reviewCount: item.review_count,
    topReview: item.top_review,
    shops: item.shops
  })) as Product[];
};

export const addProduct = async (product: Omit<Product, 'id' | 'reviewCount'>): Promise<Product | null> => {
  // Map camelCase from Frontend to snake_case for DB
  const dbProduct = {
    name: product.name,
    image_url: product.imageUrl,
    bottom_price: product.bottomPrice,
    rating: product.rating,
    top_review: product.topReview,
    shops: product.shops,
    review_count: 0
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
    shops: data.shops
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

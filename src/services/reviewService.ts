import { supabase } from '../supabaseClient';

export interface Reviewer {
  id: string;
  name: string;
  avatar_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  created_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  author: string;
  content: string;
  rating: number;
  type: 'user' | 'reviewer';
  reviewer_id?: string;
  reviewerProfile?: {
    avatarUrl?: string;
    facebookUrl?: string;
    youtubeUrl?: string;
  };
  screenshotUrl?: string;
  postUrl?: string;
  created_at: string;
}

export const fetchReviewsForProduct = async (productId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewers(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  // Map reviewer data to reviewerProfile if present
  return (data as any[]).map(item => ({
    ...item,
    reviewerProfile: item.reviewers ? {
      avatarUrl: item.reviewers.avatar_url,
      facebookUrl: item.reviewers.facebook_url,
      youtubeUrl: item.reviewers.youtube_url
    } : item.reviewerProfile
  })) as Review[];
};

export const fetchAllReviewers = async (): Promise<Reviewer[]> => {
  const { data, error } = await supabase
    .from('reviewers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching reviewers:', error);
    return [];
  }
  return data as Reviewer[];
};

export const fetchReviewerById = async (id: string): Promise<Reviewer | null> => {
  const { data, error } = await supabase
    .from('reviewers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching reviewer:', error);
    return null;
  }
  return data as Reviewer;
};

export const fetchReviewsByReviewer = async (reviewerId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, products(*)')
    .eq('reviewer_id', reviewerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviewer reviews:', error);
    return [];
  }
  return data as Review[];
};

export const addReview = async (review: Omit<Review, 'id' | 'created_at'>): Promise<Review | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single();

  if (error) {
    console.error('Error adding review:', error);
    return null;
  }
  return data as Review;
};

export const updateReview = async (id: string, updates: Partial<Review>): Promise<boolean> => {
  const { error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating review:', error);
    return false;
  }
  return true;
};

export const deleteReview = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting review:', error);
    return false;
  }
  return true;
};

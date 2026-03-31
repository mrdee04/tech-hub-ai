import { supabase } from '../supabaseClient';
import type { Review } from '../components/ProductCard';

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  reputation_score?: number;
  role?: string;
  created_at?: string;
}

export interface ReviewWithProduct extends Review {
  product_id: string;
  products?: {
    name: string;
  };
}

// ------ USERS (PROFILES) ------

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data as UserProfile[];
};

export const updateUser = async (id: string, updates: Partial<UserProfile>): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating user:', error);
    return false;
  }
  return true;
};

// ------ REVIEWS ------

export const fetchAllReviews = async (): Promise<ReviewWithProduct[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      products ( name ),
      reviewers ( * )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
  
  // Parse reviewerProfile if it comes back as stringified JSON or an object
  return (data || []).map(item => {
    // Priority: Fresh data from join > Stored JSON
    let reviewerProfile = (item as any).reviewers ? {
      avatarUrl: (item as any).reviewers.avatar_url,
      facebookUrl: (item as any).reviewers.facebook_url,
      youtubeUrl: (item as any).reviewers.youtube_url
    } : item.reviewerProfile;

    // Check if reviewerProfile needs parsing (in case stored differently)
    if (typeof reviewerProfile === 'string') {
      try {
        reviewerProfile = JSON.parse(reviewerProfile);
      } catch (e) {
        // Ignore
      }
    }
    
    return {
      ...item,
      productName: (item as any).products?.name || 'Unknown Product',
      reviewerProfile,
    };
  }) as ReviewWithProduct[];
};

export const updateReview = async (id: string, updates: Partial<Review>): Promise<boolean> => {
  const dbUpdates: any = { ...updates };
  
  const { error } = await supabase
    .from('reviews')
    .update(dbUpdates)
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

// ------ REVIEWERS (CUSTOM AGGREGATION) ------

export const updateReviewerProfile = async (author: string, newProfile: any): Promise<boolean> => {
  const { error } = await supabase
    .from('reviews')
    .update({ reviewerProfile: newProfile })
    .eq('author', author)
    .eq('type', 'reviewer');

  if (error) {
    console.error('Error updating reviewer profile:', error);
    return false;
  }
  return true;
};

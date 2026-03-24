import { supabase } from '../supabaseClient';

export type SalePostType = 'request' | 'offer' | 'pass';
export type SalePostStatus = 'open' | 'matched' | 'closed';

export interface SalePost {
  id: string;
  user_id: string;
  type: SalePostType;
  product_id?: string | null;
  custom_product_name?: string | null;
  details: {
    color?: string;
    ram?: string;
    storage?: string;
    platform?: string;
    shop?: string;
    [key: string]: any;
  };
  target_price: number;
  status: SalePostStatus;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    reputation_score: number;
    review_count: number;
    contact_info: string;
  };
  products?: {
    name: string;
    image_url: string;
  };
}

export interface SalePostResponse {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    reputation_score: number;
    review_count: number;
    contact_info?: string;
  };
}

export const fetchSalePosts = async (type?: SalePostType): Promise<SalePost[]> => {
  let query = supabase
    .from('sale_posts')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, reputation_score, review_count),
      products:product_id (name, image_url)
    `)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sale posts:', error);
    return [];
  }
  return data as SalePost[];
};

export const fetchSalePostById = async (id: string): Promise<SalePost | null> => {
  const { data, error } = await supabase
    .from('sale_posts')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, reputation_score, review_count, contact_info),
      products:product_id (name, image_url)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching sale post:', error);
    return null;
  }
  return data as SalePost;
};

export const createSalePost = async (post: Omit<SalePost, 'id' | 'created_at'>): Promise<SalePost | null> => {
  const now = new Date();
  const xx = String(now.getFullYear()).slice(-2);
  const yy = String(now.getMonth() + 1).padStart(2, '0');
  const zz = String(now.getDate()).padStart(2, '0');
  
  const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
  const { count } = await supabase
    .from('sale_posts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay);
    
  const aaa = String((count || 0) + 1).padStart(3, '0');
  const code = `${xx}${yy}${zz}${aaa}`;
  
  const postWithCode = {
    ...post,
    details: {
      ...post.details,
      code
    }
  };

  const { data, error } = await supabase
    .from('sale_posts')
    .insert([postWithCode])
    .select()
    .single();

  if (error) {
    console.error('Error creating sale post:', error);
    return null;
  }
  return data as SalePost;
};

export const respondToPost = async (response: Omit<SalePostResponse, 'id' | 'created_at' | 'status' | 'profiles'>): Promise<boolean> => {
  const { error } = await supabase
    .from('sale_post_responses')
    .insert([response]);

  if (error) {
    console.error('Error responding to post:', error);
    return false;
  }
  return true;
};

export const fetchResponsesForPost = async (postId: string): Promise<SalePostResponse[]> => {
  const { data, error } = await supabase
    .from('sale_post_responses')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, reputation_score, review_count, contact_info)
    `)
    .eq('post_id', postId);

  if (error) {
    console.error('Error fetching responses:', error);
    return [];
  }
  return data as SalePostResponse[];
};

export const acceptResponse = async (postId: string, responseId: string): Promise<boolean> => {
  // 1. Update response status
  const { error: resError } = await supabase
    .from('sale_post_responses')
    .update({ status: 'accepted' })
    .eq('id', responseId);

  if (resError) return false;

  // 2. Fetch current post details
  const currentPost = await fetchSalePostById(postId);

  // 3. Update post status to matched
  const { error: postError } = await supabase
    .from('sale_posts')
    .update({ 
      status: 'matched',
      details: {
        ...(currentPost?.details || {}),
        matched_at: new Date().toISOString()
      }
    })
    .eq('id', postId);

  return !postError;
};

export const submitReputationReview = async (review: {
  reviewer_id: string;
  reviewee_id: string;
  post_id: string;
  rating: number;
  comment: string;
}): Promise<boolean> => {
  const { error } = await supabase
    .from('reputation_reviews')
    .insert([review]);

  if (error) {
    console.error('Error submitting review:', error);
    return false;
  }
  return true;
};

export const fetchSalePostsCountForProducts = async (productIds: string[]): Promise<Record<string, number>> => {
  if (!productIds.length) return {};
  const { data, error } = await supabase
    .from('sale_posts')
    .select('product_id')
    .in('product_id', productIds)
    .eq('status', 'open');

  const counts: Record<string, number> = {};
  if (data) {
    data.forEach(post => {
      if (post.product_id) {
        counts[post.product_id] = (counts[post.product_id] || 0) + 1;
      }
    });
  }
  return counts;
};

export const fetchAllSalePostsForAdmin = async (): Promise<SalePost[]> => {
  const { data, error } = await supabase
    .from('sale_posts')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, reputation_score, review_count),
      products:product_id (name, image_url)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all sale posts for admin:', error);
    return [];
  }
  return data as SalePost[];
};

export const updateSalePost = async (id: string, updates: Partial<SalePost>): Promise<boolean> => {
  const { error } = await supabase
    .from('sale_posts')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating sale post:', error);
    return false;
  }
  return true;
};

export const deleteSalePost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('sale_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting sale post:', error);
    return false;
  }
  return true;
};

// --- ADVANCED POST WORKFLOWS ---

export const finalizeSalePost = async (postId: string): Promise<boolean> => {
  // 1. Mark as completed
  const post = await fetchSalePostById(postId);
  if (!post) return false;

  const success = await updateSalePost(postId, { status: 'closed' }); // closed means "Bắt kèo thành công" in this context
  if (!success) return false;

  // 2. Check and update bottom price for the associated product
  if (post.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('bottom_price')
      .eq('id', post.product_id)
      .single();

    if (product && post.target_price < Number(product.bottom_price)) {
      const today = new Date();
      const timeStr = `${today.getMonth() + 1}/${today.getFullYear()}`;
      
      await supabase
        .from('products')
        .update({
          bottom_price: post.target_price,
          bottom_price_time: timeStr,
          day_vuong: post.profiles?.full_name || 'Người dùng ẩn danh',
          bottom_price_platform: 'TechHub Sale Hunting'
        })
        .eq('id', post.product_id);
    }
  }

  return true;
};

export const checkAndAutoConfirmPosts = async (): Promise<void> => {
  const { data: matchedPosts } = await supabase
    .from('sale_posts')
    .select('*')
    .eq('status', 'matched');

  if (!matchedPosts) return;

  const now = new Date();
  
  for (const post of matchedPosts) {
    if (post.details && post.details.matched_at) {
      const matchedDate = new Date(post.details.matched_at);
      const diffTime = Math.abs(now.getTime() - matchedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays >= 5) {
        await finalizeSalePost(post.id);
      }
    }
  }
};


import { supabase } from '../supabaseClient';
import type { Comment } from '../components/ProductCard';

export const fetchComments = async (targetId: string, targetType: 'news' | 'product'): Promise<Comment[]> => {
  let { data, error } = await supabase
    .from('comments')
    .select('*, profiles:user_id(full_name, avatar_url, reputation_score)')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Could not fetch profiles for comments. Fallback to basic query.', error);
    const fallback = await supabase
      .from('comments')
      .select('*')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data as Comment[];
};

export const addComment = async (comment: Omit<Comment, 'id' | 'created_at'> & { target_id: string, target_type: 'news' | 'product' }): Promise<Comment | null> => {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }

  return data as Comment;
};

export const fetchCommentsCountForProducts = async (productIds: string[]): Promise<Record<string, number>> => {
  if (productIds.length === 0) return {};

  const { data, error } = await supabase
    .from('comments')
    .select('target_id')
    .in('target_id', productIds)
    .eq('target_type', 'product');

  if (error) {
    console.error('Error fetching comments count:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data.forEach((c: any) => {
    counts[c.target_id] = (counts[c.target_id] || 0) + 1;
  });

  return counts;
};

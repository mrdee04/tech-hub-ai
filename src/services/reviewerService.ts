import { supabase } from '../supabaseClient';

export interface Reviewer {
  id: string;
  name: string;
  avatar_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  created_at?: string;
}

export const fetchReviewers = async (): Promise<Reviewer[]> => {
  const { data, error } = await supabase
    .from('reviewers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviewers:', error);
    return [];
  }
  return data as Reviewer[];
};

export const addReviewer = async (reviewer: Omit<Reviewer, 'id' | 'created_at'>): Promise<Reviewer | null> => {
  const { data, error } = await supabase
    .from('reviewers')
    .insert([reviewer])
    .select()
    .single();

  if (error) {
    console.error('Error adding reviewer:', error);
    return null;
  }
  return data as Reviewer;
};

export const updateReviewer = async (id: string, updates: Partial<Reviewer>): Promise<boolean> => {
  const { error } = await supabase
    .from('reviewers')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating reviewer:', error);
    return false;
  }
  return true;
};

export const deleteReviewer = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('reviewers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting reviewer:', error);
    return false;
  }
  return true;
};

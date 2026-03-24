import { supabase } from '../supabaseClient';
import type { NewsData } from '../components/NewsCard';

export const fetchNews = async (category: string = 'all'): Promise<NewsData[]> => {
  let query = supabase
    .from('news')
    .select('*');

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    source: item.source,
    url: item.url,
    imageUrl: item.image_url,
    publishedAt: item.published_at
  })) as NewsData[];
};

export const addNews = async (news: Omit<NewsData, 'id'>): Promise<NewsData | null> => {
  const dbNews = {
    title: news.title,
    summary: news.summary,
    source: news.source,
    url: news.url,
    image_url: news.imageUrl,
    published_at: news.publishedAt || new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('news')
    .insert([dbNews])
    .select()
    .single();

  if (error) {
    console.error('Error adding news:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    source: data.source,
    url: data.url,
    imageUrl: data.image_url,
    publishedAt: data.published_at
  } as NewsData;
};

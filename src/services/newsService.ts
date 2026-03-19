import { supabase } from '../supabaseClient';
import type { NewsItem } from '../components/NewsCard';

export const fetchNews = async (): Promise<NewsItem[]> => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false });

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
  })) as NewsItem[];
};

export const addNews = async (news: Omit<NewsItem, 'id'>): Promise<NewsItem | null> => {
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
  } as NewsItem;
};

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import type { NewsData } from './NewsCard';
import { fetchNews } from '../services/newsService';

const NewsFeed: React.FC<{ category?: string }> = ({ category = 'all' }) => {
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        // Try fetching from RSS first (VnExpress Số hóa)
        const rssUrl = 'https://vnexpress.net/rss/so-hoa.rss';
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await response.json();
        
        if (data.status === 'ok') {
          const rssNews: NewsData[] = data.items.map((item: any) => ({
            id: item.guid || item.link,
            title: item.title,
            summary: item.description.replace(/<[^>]*>?/gm, '').split('.')[0] + '...', // Strip HTML and truncate
            source: 'VnExpress',
            url: item.link,
            imageUrl: item.thumbnail || item.enclosure?.link || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=500',
            publishedAt: item.pubDate
          }));
          setNews(rssNews.slice(0, 6)); // Show latest 6
        } else {
          throw new Error('RSS fetch failed');
        }
      } catch (err) {
        console.warn('RSS failed, falling back to database news:', err);
        const data = await fetchNews(category);
        setNews(data);
      }
      setLoading(false);
    };
    loadNews();
  }, [category]);

  if (loading) {
    return (
      <div className="placeholder-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card placeholder-card">
            <div className="placeholder-img"></div>
            <div className="placeholder-text">
              <div className="line"></div>
              <div className="line short"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="news-grid">
      {news.map(item => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default NewsFeed;

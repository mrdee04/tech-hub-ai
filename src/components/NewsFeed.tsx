import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import type { NewsItem } from './NewsCard';
import { fetchNews } from '../services/newsService';

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      const data = await fetchNews();
      setNews(data);
      setLoading(false);
    };
    loadNews();
  }, []);

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

import React from 'react';

export interface NewsData {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  imageUrl: string;
  url: string;
}

const NewsCard: React.FC<{ item: NewsData }> = ({ item }) => {
  return (
    <div className="glass-card news-card">
      <div className="news-image" style={{ backgroundImage: `url(${item.imageUrl})` }}>
        <span className="source-tag">{item.source}</span>
      </div>
      <div className="news-content">
        <span className="news-date">{new Date(item.publishedAt).toLocaleDateString()}</span>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-more">
          Đọc tiếp →
        </a>
      </div>
    </div>
  );
};

export default NewsCard;

import React from 'react';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  imageUrl: string;
  url: string;
}

const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => {
  return (
    <div className="glass-card news-card">
      <div className="news-image" style={{ backgroundImage: `url(${item.imageUrl})` }}>
        <span className="source-tag">{item.source}</span>
      </div>
      <div className="news-content">
        <span className="news-date">{item.date}</span>
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

import React, { useState, useEffect } from 'react';
import { fetchComments, addComment } from '../services/commentService';
import type { Comment } from './ProductCard';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ nickname: '', content: '' });
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, item.id]);

  const loadComments = async () => {
    const data = await fetchComments(item.id, 'news');
    setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.nickname || !newComment.content) return;
    const added = await addComment({
      nickname: newComment.nickname,
      content: newComment.content,
      target_id: item.id,
      target_type: 'news'
    });
    if (added) {
      setComments([added, ...comments]);
      setNewComment({ nickname: '', content: '' });
    }
  };

  return (
    <div className="glass-card news-card">
      <div className="news-image" style={{ backgroundImage: `url(${item.imageUrl})` }}>
        <span className="source-tag">{item.source}</span>
      </div>
      <div className="news-content">
        <span className="news-date">{new Date(item.publishedAt).toLocaleDateString()}</span>
        <h3>{item.title}</h3>
        <p className="truncate-text">{item.summary}</p>
        
        <div className="news-footer news-footer-row">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-more">
            Đọc tiếp →
          </a>
          <button className="expand-btn" onClick={() => setShowComments(!showComments)}>
            Bình luận ({comments.length})
          </button>
        </div>

        {showComments && (
          <div className="comment-section news-comment-box">
            <form onSubmit={handleAddComment} className="comment-form">
              <input 
                className="nickname-input" 
                placeholder="Biệt danh" 
                value={newComment.nickname}
                onChange={e => setNewComment({...newComment, nickname: e.target.value})}
              />
              <textarea 
                className="comment-textarea" 
                placeholder="Nghĩ gì nói đó..."
                value={newComment.content}
                onChange={e => setNewComment({...newComment, content: e.target.value})}
              ></textarea>
              <button type="submit" className="btn-primary comment-submit-btn">Gửi</button>
            </form>
            <div className="comment-list">
              {comments.slice(0, 3).map(c => (
                <div key={c.id} className="comment-item">
                  <span className="comment-nickname">{c.nickname}:</span>
                  <span className="comment-content">{c.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;

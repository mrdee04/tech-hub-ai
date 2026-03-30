import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import type { SalePost, SalePostType } from '../services/saleHuntingService';
import { fetchSalePosts } from '../services/saleHuntingService';
import CreateSalePost from './CreateSalePost';
import SalePostDetail from './SalePostDetail';

const SaleHuntingList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalePostType>('request');
  const [posts, setPosts] = useState<SalePost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const loadPosts = async () => {
    setLoading(true);
    const data = await fetchSalePosts(activeTab);
    setPosts(data || []);
    setLoading(false);
  };

  return (
    <div className="container-width animate-fade-in mb-8">
      <div className="flex-between page-header" style={{flexWrap: 'wrap', gap: 24}}>
        <div>
          <h2 className="page-title text-gradient">🎯 Cộng Đồng Săn Sale</h2>
          <p className="page-description">Nơi kết nối các thợ săn và người có nhu cầu chuyên nghiệp.</p>
        </div>
        <button onClick={() => navigate('create')} className="btn btn-primary" style={{padding: '12px 24px'}}>
          <span style={{fontSize: '1.2rem', marginRight: 8}}>+</span> Đăng Tin Ngay
        </button>
      </div>

      <div className="flex-center mb-8">
        <div className="pill-tabs">
          <button className={`pill-tab ${activeTab === 'request' ? 'active' : ''}`} onClick={() => setActiveTab('request')}>Nhờ Săn Hộ</button>
          <button className={`pill-tab ${activeTab === 'offer' ? 'active' : ''}`} onClick={() => setActiveTab('offer')}>Đi Săn Hộ</button>
          <button className={`pill-tab ${activeTab === 'pass' ? 'active' : ''}`} onClick={() => setActiveTab('pass')}>Pass Kèo Thơm</button>
        </div>
      </div>

      <div className="sale-grid">
        {loading ? (
          Array(6).fill(0).map((_, i) => <div key={i} className="premium-card" style={{height: 220, background: 'var(--bg-hover)', opacity: 0.5}}></div>)
        ) : posts.length === 0 ? (
          <div className="premium-card flex-center w-full" style={{gridColumn: '1 / -1', padding: 60}}>
             <p className="text-secondary" style={{fontSize: '1.1rem'}}>Chưa có bài đăng nào trong mục này. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          posts.map(post => <SalePostCard key={post.id} post={post} onClick={() => navigate(`post/${post.id}`)} />)
        )}
      </div>
    </div>
  );
};

const SalePostCard: React.FC<{ post: SalePost; onClick: () => void }> = ({ post, onClick }) => {
  return (
    <div className="post-card" onClick={onClick} style={{cursor: 'pointer'}}>
      <div className="post-card-header">
        <span className={`badge ${post.type === 'request' ? 'badge-request' : post.type === 'offer' ? 'badge-offer' : 'badge-pass'}`}>
          {post.type === 'request' ? 'Nhờ Săn' : post.type === 'offer' ? 'Đi Săn' : 'Pass Kèo'}
        </span>
        <span className="text-gradient" style={{fontSize: '1.25rem', fontWeight: 800}}>
          {Number(post.target_price).toLocaleString('vi-VN')} đ
        </span>
      </div>
      
      <h3 style={{fontSize: '1.1rem', marginBottom: 12, lineHeight: 1.4}}>{post.products?.name || post.custom_product_name}</h3>
      
      <div className="flex-center" style={{justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap'}}>
        <span className="badge badge-neutral">📍 {post.details.platform}</span>
        {post.details?.variant_combination && Object.entries(post.details.variant_combination as Record<string, string>).map(([name, value]) => (
          <span key={name} className="badge badge-neutral" style={{borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)'}}>
            {value}
          </span>
        ))}
        {!post.details?.variant_combination && post.details.color && <span className="badge badge-neutral">🎨 {post.details.color}</span>}
      </div>

      <div className="post-card-author">
        <div className="avatar">{post.profiles?.full_name?.charAt(0) || '?'}</div>
        <div className="author-info">
          <span className="author-name">{post.profiles?.full_name || 'Người dùng ẩn danh'}</span>
          <span className="author-rep">★ {post.profiles?.reputation_score || 0} Ngôi sao uy tín</span>
        </div>
      </div>
    </div>
  );
};

const SaleHunting: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SaleHuntingList />} />
      <Route path="/create" element={<CreateSalePost />} />
      <Route path="/post/:id" element={<SalePostDetail />} />
    </Routes>
  );
};

export default SaleHunting;

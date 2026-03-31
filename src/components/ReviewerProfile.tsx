import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchReviewerById, fetchReviewsByReviewer, type Reviewer, type Review } from '../services/reviewService';
import { ProductCard } from './ProductCard';

const ReviewerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [revData, reviewsData] = await Promise.all([
      fetchReviewerById(id!),
      fetchReviewsByReviewer(id!)
    ]);
    setReviewer(revData);
    setReviews(reviewsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container-width min-h-screen flex-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!reviewer) {
    return (
      <div className="container-width min-h-screen flex-center flex-column gap-4">
        <h2>Không tìm thấy reviewer</h2>
        <Link to="/" className="btn-secondary">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="container-width mt-8 mb-16 animate-fade-in">
      {/* Profile Header */}
      <div className="admin-card p-8 flex-column flex-center gap-6 text-center mb-12">
        <div className="reviewer-avatar-large">
          <img src={reviewer.avatar_url || 'https://via.placeholder.com/150'} alt={reviewer.name} />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{reviewer.name}</h1>
          <p className="text-secondary mb-6">Chuyên gia đánh giá sản phẩm công nghệ</p>
          
          <div className="flex-center gap-4">
            {reviewer.facebook_url && (
              <a href={reviewer.facebook_url} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-center gap-2 px-6">
                <span className="text-blue text-xl">f</span> Facebook
              </a>
            )}
            {reviewer.youtube_url && (
              <a href={reviewer.youtube_url} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-center gap-2 px-6">
                <span className="text-red text-xl">▶</span> YouTube
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid-3 mb-12">
        <div className="admin-card p-6 text-center">
           <div className="text-3xl font-bold text-gradient mb-1">{reviews.length}</div>
           <div className="text-secondary text-sm uppercase tracking-wider">Bài Đánh Giá</div>
        </div>
        <div className="admin-card p-6 text-center">
           <div className="text-3xl font-bold text-gradient mb-1">
             {(reviews.reduce((acc, r) => acc + Number(r.rating), 0) / (reviews.length || 1)).toFixed(1)}
           </div>
           <div className="text-secondary text-sm uppercase tracking-wider">Điểm Trung Bình</div>
        </div>
        <div className="admin-card p-6 text-center">
           <div className="text-3xl font-bold text-gradient mb-1">{new Set(reviews.map(r => r.product_id)).size}</div>
           <div className="text-secondary text-sm uppercase tracking-wider">Sản Phẩm Đã Review</div>
        </div>
      </div>

      {/* Reviews/Products List */}
      <h2 className="mb-8 flex-between">
        <span>Sản phẩm đã review</span>
        <span className="text-secondary text-lg font-normal">{reviews.length} đánh giá</span>
      </h2>

      <div className="product-grid">
        {reviews.map(r => (
          <div key={r.id} className="relative">
            <ProductCard product={r.products} />
            <div className="review-snippet-card p-3 mt-2 bg-deep-light rounded-lg border-primary-subtle border border-dashed">
               <div className="text-sm text-secondary italic mb-2 line-clamp-2">"{r.content}"</div>
               <div className="flex-between text-xs">
                 <span className="text-yellow font-bold">⭐ {r.rating}</span>
                 <span className="text-secondary opacity-60">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerProfile;

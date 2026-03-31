import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProductById } from '../services/productService';
import { fetchComments, addComment } from '../services/commentService';
import type { Product, Comment } from './ProductCard';
import { useAuth } from './AuthContext';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReviewTab, setActiveReviewTab] = useState<'reviewer' | 'user'>('reviewer');
  const [comment, setComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  
  // Modal state for specific details
  const [modalType, setModalType] = useState<'proof' | 'screenshot' | null>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product?.variants) {
      setSelectedVariant({});
    }
  }, [product]);

  useEffect(() => {
    if (id) {
      loadProduct(id);
      loadComments(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    const data = await fetchProductById(productId);
    setProduct(data);
    setLoading(false);
  };

  const loadComments = async (productId: string) => {
    const data = await fetchComments(productId, 'product');
    setComments(data);
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !id) return;
    const newCommentData = {
      nickname: user ? (user.user_metadata?.full_name || user.email) : (nickname || 'Người dùng ẩn danh'),
      content: comment,
      target_id: id,
      user_id: user?.id,
      target_type: 'product' as const
    };
    const added = await addComment(newCommentData);
    if (added) {
      setComments([{
        ...added, 
        profiles: user ? { full_name: user.user_metadata?.full_name || user.email || '', avatar_url: '', reputation_score: 0 } : undefined
      }, ...comments]);
    } else {
      const localComment = {
        id: 'local-' + Date.now(),
        ...newCommentData,
        created_at: new Date().toISOString(),
        profiles: user ? { full_name: user.user_metadata?.full_name || user.email || '', avatar_url: '', reputation_score: 0 } : undefined
      };
      setComments([localComment as Comment, ...comments]);
    }
    setComment('');
    if (!user) setNickname('');
  };

  const handleSaleAction = (type: 'request' | 'offer' | 'pass') => {
    navigate('/sale-hunting/create', { state: { type, product } });
  };

  if (loading) return <div className="loading-state">Đang tải thông tin sản phẩm...</div>;
  if (!product) return <div className="error-state">Không tìm thấy sản phẩm. <button onClick={() => navigate('/')}>Quay lại</button></div>;

  const filteredReviews = product.reviews?.filter(r => r.type === activeReviewTab) || [];
  const reviewers = product.reviews?.filter(r => r.type === 'reviewer') || [];

  const currentVariantPrice = product.variants?.variantPrices.find(vp => 
    Object.entries(selectedVariant).length > 0 &&
    Object.entries(selectedVariant).every(([k, v]) => vp.combination[k] === v)
  );

  const getMinVariantPrice = () => {
    if (!product.variants?.variantPrices || product.variants.variantPrices.length === 0) return null;
    const prices = product.variants.variantPrices.map(vp => Number(vp.bottomPrice)).filter(p => !isNaN(p) && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const minPrice = getMinVariantPrice();
  const displayPrice = currentVariantPrice?.bottomPrice || minPrice || product.bottomPrice;

  return (
    <div className="product-detail-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Quay lại trang chủ</button>
      
      <div className="product-detail-container glass-card">
        <div className="detail-header">
          <div className="detail-image-box">
            <img src={product.imageUrl} alt={product.name} className="detail-image" />
          </div>
          <div className="detail-title-meta">
            <span className="category-badge">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="detail-rating">
              <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
              <span className="count">({product.reviewCount} đánh giá từ người dùng)</span>
            </div>
            <div className="detail-price">
              <div className="flex-column">
                <span className="label">{currentVariantPrice ? 'Giá Biến Thể:' : 'Giá Đáy Thấp Nhất:'}</span>
                <span className="value">
                  {typeof displayPrice === 'number' 
                    ? displayPrice.toLocaleString('vi-VN') 
                    : Number(displayPrice?.toString().replace(/[^0-9.-]+/g,"")).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* VARIANT SELECTOR */}
            {product.variants?.attributes && product.variants.attributes.length > 0 && (
              <div className="variant-selector-detail mt-6 flex-column gap-4 p-4 rounded bg-deep-light border-glass">
                <h3 className="text-secondary">CHỌN PHIÊN BẢN SẢN PHẨM</h3>
                {product.variants.attributes.map(attr => (
                  <div key={attr.name} className="variant-row-detail flex-column gap-2">
                    <span className="text-sm font-semibold opacity-70">{attr.name}</span>
                    <div className="flex-center flex-wrap flex-start gap-2">
                      {attr.options.map(opt => (
                        <button 
                          key={opt}
                          onClick={() => setSelectedVariant({ ...selectedVariant, [attr.name]: opt })}
                          className={`variant-opt-btn ${selectedVariant[attr.name] === opt ? 'active' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="community-actions">
              <button className="btn btn-community btn-request" onClick={() => handleSaleAction('request')}>🙏 Nhờ Săn Hộ</button>
              <button className="btn btn-community btn-offer" onClick={() => handleSaleAction('offer')}>🕵️ Đi Săn Hộ</button>
              <button className="btn btn-community btn-pass" onClick={() => handleSaleAction('pass')}>💸 Pass Kèo Thơm</button>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-sidebar">
            <div className="journey-card">
              <h3 onClick={() => { setModalType('proof'); setModalContent(product.bottomPriceLink || null); }}>
                🏆 Hành Trình Săn Đáy {product.bottomPriceLink && <span className="info-icon">ⓘ</span>}
              </h3>
              <div className="journey-info">
                <div className="info-row">
                  <span className="label">Đáy Vương:</span>
                  <span className="value highlight">{product.dayVuong || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Thời điểm:</span>
                  <span className="value">{product.bottomPriceTime || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Nền tảng:</span>
                  <span className="value">{product.bottomPricePlatform || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="shop-list-card">
              <h3>Thị trường hiện nay</h3>
              <div className="shop-items">
                {product.shops.map((shop, i) => (
                  <a key={i} href={shop.url} target="_blank" rel="noopener noreferrer" className="shop-link-item">
                    <span>{shop.name}</span>
                    <span className="arrow">→</span>
                  </a>
                ))}
              </div>
              <a href={product.shops[0]?.url} className="buy-now-btn" target="_blank" rel="noopener noreferrer">
                Mua Ngay Tại {product.shops[0]?.name}
              </a>
            </div>
          </div>

          <div className="detail-main-content">
            <div className="detail-reviews">
              <div className="pill-tabs" style={{marginBottom: 24, alignSelf: 'flex-start'}}>
                <button 
                  className={`pill-tab ${activeReviewTab === 'reviewer' ? 'active' : ''}`}
                  onClick={() => setActiveReviewTab('reviewer')}
                >
                  Reviewers ({reviewers.length})
                </button>
                <button 
                  className={`pill-tab ${activeReviewTab === 'user' ? 'active' : ''}`}
                  onClick={() => setActiveReviewTab('user')}
                >
                  Đánh giá người dùng
                </button>
              </div>

              <div className="review-list-detailed">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map(review => (
                    <div key={review.id} className="detail-review-card">
                      <div className="reviewer-info-detailed">
                        {review.type === 'reviewer' && review.reviewerProfile ? (
                          <Link to={`/reviewer/${review.reviewer_id}`} className="reviewer-profile-detailed link-hover">
                            <img className="avatar" src={review.reviewerProfile.avatarUrl} alt={review.author} />
                            <div className="meta">
                              <span className="name">{review.author}</span>
                              <div className="social">
                                Đã có bài đánh giá chi tiết
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <span className="reviewer-user-name">{review.author}</span>
                        )}
                      </div>
                      
                      {review.type === 'user' ? (
                        <div className="flex-1">
                          <p className="review-content-text">{review.content}</p>
                          {review.screenshotUrl && (
                            <div className="review-media-preview" onClick={() => { setModalType('screenshot'); setModalContent(review.screenshotUrl || null); }}>
                              <img src={review.screenshotUrl} alt="Review proof" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="review-action-container">
                          <a href={review.postUrl || review.reviewerProfile?.youtubeUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-primary review-action-btn">
                            {review.postUrl ? '📄 Xem Bài Viết' : '▶️ Xem Video'}
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="empty">Chưa có đánh giá nào cho mục này.</p>
                )}
              </div>
            </div>

            <div className="detail-comments">
              <div className="comments-header">
                <h3>Thảo luận community ({comments.length})</h3>
                <button className="btn btn-secondary" onClick={() => setShowComments(!showComments)}>
                  {showComments ? 'Đóng' : 'Viết bình luận'}
                </button>
              </div>

              {showComments && (
                <div className="comment-form-detailed">
                  {!user && (
                    <div className="input-row mb-3">
                      <input type="text" className="premium-input" placeholder="Biệt danh..." value={nickname} onChange={e => setNickname(e.target.value)} />
                    </div>
                  )}
                  <div className="input-row">
                    <textarea className="premium-input comment-textarea" placeholder={user ? `Đăng bình luận với tư cách ${user.user_metadata?.full_name || user.email}...` : "Bạn nghĩ gì về sản phẩm này?"} value={comment} onChange={e => setComment(e.target.value)} />
                    <button className="btn btn-primary comment-submit-btn" onClick={handleAddComment} disabled={!comment.trim()}>Gửi</button>
                  </div>
                </div>
              )}

              <div className="comment-list-detailed">
                {comments.map(c => (
                  <div key={c.id} className="comment-box">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt={c.profiles.full_name} className="comment-avatar" />
                    ) : (
                      <div className="comment-avatar-fallback">
                        {c.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="body" style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                        <span className="name" style={{fontWeight: 700, color: 'var(--text-primary)'}}>{c.profiles?.full_name || c.nickname}</span>
                        {c.profiles && (
                          <span className="reputation-badge" style={{fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px', fontWeight: 600}}>
                            Uy tín: {c.profiles.reputation_score || 0}
                          </span>
                        )}
                        <span className="time" style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto'}}>
                          {new Date(c.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p style={{margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5}}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specific Modals */}
      {modalType && (
        <div className="mini-modal-overlay" onClick={() => setModalType(null)}>
          <div className="mini-modal-content glass-card" onClick={e => e.stopPropagation()}>
            <button className="close-mini-modal" onClick={() => setModalType(null)}>×</button>
            {modalType === 'proof' && (
              <div className="proof-viewer">
                <h3>Bằng chứng săn giá</h3>
                <p>Bạn đang được dẫn đến liên kết xác minh giá đáy kỷ lục.</p>
                <a href={modalContent || '#'} target="_blank" rel="noopener noreferrer" className="go-btn">Mở liên kết bằng chứng →</a>
              </div>
            )}
            {modalType === 'screenshot' && (
              <div className="screenshot-viewer">
                <img src={modalContent || ''} alt="Full size proof" style={{ maxWidth: '100%', borderRadius: '12px' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

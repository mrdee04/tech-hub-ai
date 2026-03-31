import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './ProductCard.css';

export interface ReviewerProfile {
  avatarUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
}

export interface Review {
  id: string;
  type: 'reviewer' | 'user';
  author: string;
  content: string;
  rating: number;
  created_at: string;
  reviewer_id?: string;
  reviewerProfile?: ReviewerProfile;
  screenshotUrl?: string;
  postUrl?: string;
}

export interface Comment {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
  user_id?: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    reputation_score?: number;
  };
}

export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface VariantPrice {
  combination: Record<string, string>; // e.g., {"Màu sắc": "Xanh", "Dung lượng": "128GB"}
  bottomPrice?: number;
  updatedAt?: string;
  isVerified?: boolean;
}

export interface ProductVariants {
  attributes: ProductAttribute[];
  variantPrices: VariantPrice[];
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  bottomPrice: string | number;
  rating: number;
  reviewCount: number;
  topReview?: string;
  category: string;
  shops: Array<{ name: string; url: string }>;
  reviews?: Review[];
  bottomPriceTime?: string;
  bottomPricePlatform?: string;
  bottomPriceLink?: string;
  dayVuong?: string;
  comments?: Comment[];
  status?: 'hot' | 'new' | 'best-seller';
  salePostCount?: number;
  variants?: ProductVariants;
}
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reviewers = product.reviews?.filter(r => r.type === 'reviewer') || [];
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [showReportModal, setShowReportModal] = useState(false);

  // Initialize selected variant with empty object to show "lowest price" by default
  useEffect(() => {
    setSelectedVariant({});
  }, [product.variants]);

  // Find price for current selection
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
  const isPriceDefined = !!displayPrice && displayPrice !== 'Chưa xác định' && displayPrice !== 0;

  return (
    <>
      <div className="post-card product-card-container">
        {product.status && (
          <div className={`badge product-status-badge ${product.status === 'hot' ? 'badge-request' : product.status === 'new' ? 'badge-offer' : 'badge-pass'}`}>
            {product.status === 'hot' ? '🔥 HOT' : 
             product.status === 'new' ? '✨ MỚI' : '🏆 BÁN CHẠY'}
          </div>
        )}
        
        <Link to={`/product/${product.id}`} className="display-block">
          <div className="product-image-wrapper">
            <img src={product.imageUrl} alt={product.name} />
            <div className="badge category-badge-overlay">
              {product.category.toLowerCase() === 'phone' ? 'Điện thoại' :
               product.category.toLowerCase() === 'laptop' ? 'Laptop' :
               product.category.toLowerCase() === 'tablet' ? 'Máy tính bảng' :
               product.category.toLowerCase() === 'accessory' ? 'Phụ kiện' : 
               product.category.toLowerCase() === 'other' ? 'Khác' : product.category}
            </div>
          </div>
        </Link>
        
        <div className="flex-column gap-2 flex-1">
          <Link to={`/product/${product.id}`} className="text-decoration-none">
            <h3 className="text-primary product-name-hover product-name-title">{product.name}</h3>
          </Link>

          {/* VARIANT SELECTOR */}
          {product.variants?.attributes && product.variants.attributes.length > 0 && (
            <div className="flex-column gap-2 mt-2">
              {product.variants.attributes.map(attr => (
                <div key={attr.name} className="flex-center variant-row-mini">
                  <span className="variant-label-mini">{attr.name}</span>
                  <div className="flex-center variant-options-mini">
                    {attr.options.map(opt => (
                      <button 
                        key={opt}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedVariant({ ...selectedVariant, [attr.name]: opt });
                        }}
                        className={`variant-opt-btn-mini ${selectedVariant[attr.name] === opt ? 'active' : ''}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex-center stats-row-mini">
            <span className="stats-label-sale">🔥 {product.salePostCount || 0} Kèo Săn</span>
            <Link to={`/product/${product.id}`} className="text-secondary stats-detail-link">Chi tiết</Link>
          </div>

          <div className="flex-column mt-2 mb-4">
            <span className="text-muted price-label-mini">
              {currentVariantPrice ? 'Giá Biến Thể' : 'Giá Đáy Thấp Nhất'}
            </span>
            {isPriceDefined ? (
              <span className="text-gradient price-value-mini">
                {typeof displayPrice === 'number' 
                  ? displayPrice.toLocaleString('vi-VN') 
                  : Number(displayPrice.toString().replace(/[^0-9.-]+/g,"")).toLocaleString('vi-VN')} đ
              </span>
            ) : (
              <div className="flex-column gap-2">
                <span className="price-empty-mini">Chưa xác định, mời bạn bắt đáy</span>
                <button 
                  className="btn-primary btn-report-mini"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      alert('Vui lòng đăng nhập để báo giá đáy');
                      navigate('/auth');
                      return;
                    }
                    setShowReportModal(true);
                  }}
                >
                  Báo giá đáy
                </button>
              </div>
            )}
          </div>
          
          <div className="post-card-author">
            <div className="reviewer-avatars-list">
              {reviewers.slice(0, 3).map(r => (
                <Link key={r.id} to={`/reviewer/${r.reviewer_id}`} onClick={e => e.stopPropagation()}>
                  <img 
                    className="reviewer-mini-avatar"
                    title={r.author}
                    src={r.reviewerProfile?.avatarUrl || 'https://via.placeholder.com/20'}
                    alt={r.author}
                  />
                </Link>
              ))}
              {reviewers.length > 3 && <span className="text-muted text-xs ml-1">+{reviewers.length - 3}</span>}
              {reviewers.length === 0 && <span className="text-muted text-xs">Chưa có reviewer</span>}
            </div>
            <span className="text-muted text-xs ml-auto">({product.reviewCount} đánh giá)</span>
          </div>
        </div>
      </div>

      {showReportModal && (
        <BottomPriceReportModal 
          product={product} 
          selectedVariant={selectedVariant}
          user={user}
          onClose={() => setShowReportModal(false)} 
        />
      )}
    </>
  );
};

// Placeholder for the modal - will create it in a separate file or inline here if requested
// For now, I'll assume we want a separate file for cleanliness.
const BottomPriceReportModal: React.FC<any> = ({ product, selectedVariant, user, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="glass-card report-modal-card">
        <div className="flex-between mb-4">
          <h2 className="report-modal-header">Báo giá đáy</h2>
          <button className="btn report-modal-close" onClick={onClose}> đóng</button>
        </div>
        
        <div className="mb-4">
          <div className="product-info-label">{product.name}</div>
          <div className="product-info-variants">
            {Object.entries(selectedVariant).map(([k,v]) => `${k}: ${v}`).join(' | ')}
          </div>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as any;
          const reportedPrice = Number(target.price.value.replace(/[^0-9]/g, ''));
          const huntingTime = target.time.value;
          const screenshotUrl = target.screenshot.value;

          if (!reportedPrice || !huntingTime) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
          }

          // In a real app, we'd call the service here.
          // Since we already have bottomPriceService.ts, let's import it if possible
          // but for now I'll just alert and close to show it's working.
          try {
            const { submitBottomPriceReport } = await import('../services/bottomPriceService');
            const success = await submitBottomPriceReport({
              product_id: product.id,
              user_id: user.id,
              variant_combination: selectedVariant,
              reported_price: reportedPrice,
              screenshot_url: screenshotUrl,
              shopping_time: huntingTime
            });
            if (success) {
              alert('Cảm ơn bạn! Báo cáo đã được gửi và đang chờ quản trị viên duyệt.');
              onClose();
            }
          } catch (error) {
            alert('Có lỗi xảy ra khi gửi báo cáo.');
            console.error(error);
          }
        }} className="flex-column gap-3">
          <div className="input-group">
            <label className="premium-label">Giá bạn đã săn được (đ)</label>
            <input name="price" type="text" placeholder="Ví dụ: 12.500.000" required className="premium-input" />
          </div>
          
          <div className="input-group">
            <label className="premium-label">Ngày giờ săn (Khoảng thời gian)</label>
            <input name="time" type="text" placeholder="Ví dụ: 00:00 ngày 10/10/2023" required className="premium-input" />
          </div>

          <div className="input-group">
            <label className="premium-label">Link ảnh chụp màn hình đơn hàng (Nhiều nhất có thể)</label>
            <input name="screenshot" type="text" placeholder="https://imgur.com/..." className="premium-input" />
            <small className="text-muted text-xs mt-1">
              Hãy upload ảnh lên Imgur hoặc các trang hosting ảnh rồi dán link vào đây.
            </small>
          </div>

          <div className="report-note">
            📍 Lưu ý: Ảnh chụp màn hình phải rõ ràng giá và mã đơn hàng đã thanh toán thành công.
          </div>

          <button type="submit" className="btn-primary mt-2">Gửi báo cáo</button>
        </form>
      </div>
    </div>
  );
};

export default ProductCard;

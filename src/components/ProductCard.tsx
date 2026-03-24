import { Link } from 'react-router-dom';

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
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const reviewers = product.reviews?.filter(r => r.type === 'reviewer') || [];

  return (
    <Link to={`/product/${product.id}`} className="post-card" style={{position: 'relative', overflow: 'hidden'}}>
      {product.status && (
        <div style={{position: 'absolute', top: 12, right: 12, zIndex: 10}} className={`badge ${product.status === 'hot' ? 'badge-request' : product.status === 'new' ? 'badge-offer' : 'badge-pass'}`}>
          {product.status === 'hot' ? '🔥 HOT' : 
           product.status === 'new' ? '✨ MỚI' : '🏆 BÁN CHẠY'}
        </div>
      )}
      
      <div style={{width: '100%', aspectRatio: '4/3', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: '12px', marginBottom: '16px', position: 'relative', overflow: 'hidden'}}>
        <img src={product.imageUrl} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: 'white', border: '1px solid rgba(255,255,255,0.1)'}} className="badge">
          {product.category.toLowerCase() === 'phone' ? 'Điện thoại' :
           product.category.toLowerCase() === 'laptop' ? 'Laptop' :
           product.category.toLowerCase() === 'tablet' ? 'Máy tính bảng' :
           product.category.toLowerCase() === 'accessory' ? 'Phụ kiện' : 
           product.category.toLowerCase() === 'other' ? 'Khác' : product.category}
        </div>
      </div>
      
      <div className="flex-column gap-2" style={{flex: 1}}>
        <h3 style={{fontSize: '1.05rem', lineHeight: 1.4, margin: 0}} className="text-primary">{product.name}</h3>
        
        <div className="flex-center" style={{justifyContent: 'flex-start', gap: '6px', fontSize: '0.85rem'}}>
          <span style={{color: 'var(--accent-green)'}}>🔥 {product.salePostCount || 0} Kèo Săn</span>
          <span className="text-secondary" style={{marginLeft: 'auto'}}>Mở ngay</span>
        </div>

        <div className="flex-column mt-2" style={{marginBottom: '16px'}}>
          <span className="text-muted" style={{fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Giá Đáy</span>
          <span className="text-gradient" style={{fontSize: '1.3rem', fontWeight: 800}}>
            {typeof product.bottomPrice === 'number' 
              ? product.bottomPrice.toLocaleString('vi-VN') 
              : Number(product.bottomPrice?.toString().replace(/[^0-9.-]+/g,"")).toLocaleString('vi-VN')} đ
          </span>
        </div>
        
        <div className="post-card-author" style={{marginTop: 'auto'}}>
          <div className="flex-center" style={{justifyContent: 'flex-start'}}>
            {reviewers.slice(0, 3).map(r => (
                <img 
                  key={r.id} 
                  style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--bg-card)', marginLeft: -6, background: '#333'}}
                  title={r.author}
                  src={r.reviewerProfile?.avatarUrl || 'https://via.placeholder.com/20'}
                  alt={r.author}
                />
            ))}
            {reviewers.length > 3 && <span className="text-muted" style={{fontSize: '0.75rem', marginLeft: 6}}>+{reviewers.length - 3}</span>}
            {reviewers.length === 0 && <span className="text-muted" style={{fontSize: '0.75rem'}}>Chưa có reviewer</span>}
          </div>
          <span className="text-muted" style={{fontSize: '0.75rem', marginLeft: 'auto'}}>({product.reviewCount} đánh giá)</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

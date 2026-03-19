import React from 'react';

export interface Product {
  id: string;
  name: string;
  description?: string;
  bottomPrice: string;
  shops: { name: string; url: string }[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  topReview: string;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="glass-card product-card">
      <div className="product-image" style={{ backgroundImage: `url(${product.imageUrl})` }}></div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <div className="rating">
          <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
          <span className="count">({product.reviewCount} đánh giá)</span>
        </div>
        <p className="top-review">"{product.topReview}"</p>
        
        <div className="price-tag">
          <span className="label">Giá đáy:</span>
          <span className="value">{product.bottomPrice}</span>
        </div>

        <div className="shop-links">
          {product.shops.map((shop, i) => (
            <a key={i} href={shop.url} target="_blank" rel="noopener noreferrer" className="shop-btn">
              Mua tại {shop.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

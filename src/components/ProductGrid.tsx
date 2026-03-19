import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import type { Product } from './ProductCard';
import { fetchProducts } from '../services/productService';

const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="placeholder-grid">
        {[1, 2, 3, 4].map(i => (
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
    <div className="product-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;

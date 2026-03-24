import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import type { Product } from './ProductCard';
import { fetchProducts } from '../services/productService';

const ProductGrid: React.FC<{ category?: string }> = ({ category = 'all' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const categoryToFetch = category === 'Tất cả' ? 'all' : category;
      const data = await fetchProducts(categoryToFetch);
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, [category]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="product-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="premium-card" style={{height: 380, background: 'var(--bg-hover)', opacity: 0.5}}></div>
        ))}
      </div>
    );
  }

  return (
    <div className="product-container animate-fade-in">
      <div className="flex-center" style={{marginBottom: 32}}>
        <div style={{position: 'relative', width: '100%', maxWidth: 500}}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm công nghệ..."
            className="premium-input"
            value={searchTerm}
            style={{paddingRight: 40, borderRadius: '99px'}}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5}}>🔍</span>
        </div>
      </div>
      
      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex-column flex-center gap-4 mt-8" style={{opacity: 0.5}}>
          <span style={{fontSize: '3rem'}}>🔍</span>
          <p>Không tìm thấy sản phẩm nào khớp với tìm kiếm của bạn.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;

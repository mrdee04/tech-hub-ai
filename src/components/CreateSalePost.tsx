import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { SalePostType } from '../services/saleHuntingService';
import { createSalePost } from '../services/saleHuntingService';
import { fetchProducts } from '../services/productService';
import type { Product } from './ProductCard';

const CreateSalePost: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { type?: SalePostType, product?: Product } | null;

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<SalePostType>(state?.type || 'request');
  const [searchTerm, setSearchTerm] = useState(state?.product?.name || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(state?.product || null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const renderRules = () => {
    switch(type) {
      case 'request':
        return (
          <ul style={{fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '16px'}}>
            <li>Bài đăng "Nhờ Săn Hộ" không có giá trị giao dịch, chỉ nhằm mục đích nhờ cộng đồng tìm kiếm giá tốt.</li>
            <li>Sau khi có người "Đi Săn Hộ" cung cấp link thành công, bạn có quyền tự quyết định mua hoặc không mua.</li>
          </ul>
        );
      case 'offer':
        return (
          <ul style={{fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '16px'}}>
            <li>Bài đăng "Đi Săn Hộ" yêu cầu người đăng chia sẻ Link / Mã giảm giá minh bạch.</li>
            <li>Nghiêm cấm chia sẻ link lừa đảo, vi rút hoặc mã giảm giá giả mạo. Vi phạm sẽ bị khóa tài khoản vĩnh viễn.</li>
          </ul>
        );
      case 'pass':
        return (
          <ul style={{fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '16px'}}>
            <li>Người đăng "Pass Kèo Thơm" phải chịu trách nhiệm về tình trạng nhượng lại đơn hàng hoặc pass đồ cũ.</li>
            <li>Nền tảng không chịu trách nhiệm trong vấn đề thanh toán. Khuyến khích giao dịch trực tiếp hoặc COD để đảm bảo an toàn.</li>
          </ul>
        );
    }
  };

  const [details, setDetails] = useState({
    color: '',
    ram: '',
    storage: '',
    platform: 'Shopee',
    shop: '',
    customName: ''
  });
  const [targetPrice, setTargetPrice] = useState('');
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>(['Shopee', 'Lazada', 'Tiki', 'TikTok Shop', 'Khác']);

  useEffect(() => {
    if (selectedProduct) {
      // Platform Locking Logic
      const productShops = selectedProduct.shops?.map(s => {
        if (!s) return '';
        if (typeof s === 'string') return s;
        if (typeof s === 'object') return (s as any).name || (s as any).shop || '';
        return '';
      }).filter(Boolean) || [];
      
      const platforms = productShops.length > 0 ? productShops : ['Shopee', 'Lazada', 'Tiki', 'TikTok Shop'];
      // Ensure 'Khác' is always an available option, but not duplicated
      const finalPlatforms = platforms.includes('Khác') ? platforms : [...platforms];
      setAvailablePlatforms(finalPlatforms);
      
      if (productShops.length > 0 && !productShops.includes(details.platform) && details.platform !== 'Khác') {
        setDetails(prev => ({ ...prev, platform: productShops[0] }));
      }
    } else {
      setAvailablePlatforms(['Shopee', 'Lazada', 'Tiki', 'TikTok Shop']);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchProducts();
    }
  }, [searchTerm]);

  const searchProducts = async () => {
    const allProducts = await fetchProducts();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProducts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Vui lòng đăng nhập!');
    
    setLoading(true);
    try {
      const postData = {
        user_id: user.id,
        type,
        product_id: selectedProduct?.id || null,
        custom_product_name: selectedProduct ? null : details.customName,
        details: {
          color: details.color,
          ram: details.ram,
          storage: details.storage,
          platform: details.platform,
          shop: details.shop
        },
        target_price: Number(targetPrice),
        status: 'open' as const
      };

      const result = await createSalePost(postData);
      if (result) {
        alert('🎉 Đăng tin thành công!');
        navigate('/sale-hunting');
      } else {
        throw new Error('Không thể lưu bài đăng. Vui lòng thử lại.');
      }
    } catch (err: any) {
      alert('❌ Lỗi: ' + (err.message || 'Đã có lỗi xảy ra'));
    } finally {
      setLoading(false);
    }
  };

  const applyPriceSuggestion = (suggestion: number) => {
    setTargetPrice(Math.round(suggestion).toString());
  };

  if (!user) {
    return (
      <div className="container-width flex-center" style={{minHeight: '60vh'}}>
        <div className="premium-card text-center flex-column flex-center gap-4" style={{maxWidth: 400}}>
          <h2 style={{fontSize: '1.5rem'}}>Chưa Đăng Nhập</h2>
          <p className="text-secondary">Vui lòng đăng nhập để đăng tin săn sale cùng cộng đồng.</p>
          <button onClick={() => navigate('/auth')} className="btn btn-primary w-full mt-2">Đăng Nhập Ngay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-width animate-fade-in mb-8">
      <div className="create-post-layout">
        <div className="premium-card">
          <div className="mb-6">
            <h2 className="text-gradient" style={{fontSize: '2rem', marginBottom: 8}}>🎯 Đăng Tin Săn Sale</h2>
            <p className="text-secondary">Chia sẻ hoặc tìm kiếm những kèo thơm nhất cùng cộng đồng.</p>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <div className="input-group">
              <label className="premium-label">Bạn muốn làm gì?</label>
              <div className="pill-tabs" style={{width: 'fit-content'}}>
                <button type="button" className={`pill-tab ${type === 'request' ? 'active' : ''}`} onClick={() => setType('request')}>Nhờ Săn Hộ</button>
                <button type="button" className={`pill-tab ${type === 'offer' ? 'active' : ''}`} onClick={() => setType('offer')}>Đi Săn Hộ</button>
                <button type="button" className={`pill-tab ${type === 'pass' ? 'active' : ''}`} onClick={() => setType('pass')}>Pass Kèo Thơm</button>
              </div>
            </div>

            <div className="input-group">
              <label className="premium-label">Sản phẩm mục tiêu</label>
              <div style={{position: 'relative'}}>
                <input 
                  placeholder="Nhập tên sản phẩm (VD: iPhone 15...)" 
                  value={searchTerm} 
                  className="premium-input"
                  onChange={e => setSearchTerm(e.target.value)} 
                />
                {products.length > 0 && !selectedProduct && (
                  <div style={{position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 50, background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {products.map(p => (
                      <div key={p.id} style={{padding: '10px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)'}} onClick={() => {
                        setSelectedProduct(p);
                        setSearchTerm(p.name);
                        setProducts([]);
                      }}>
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <div className="flex-between mt-2" style={{background: 'var(--bg-hover)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-focus)'}}>
                  <span className="text-secondary" style={{fontSize: '0.9rem'}}>Đã chọn: <strong className="text-primary">{selectedProduct.name}</strong></span>
                  <button type="button" className="btn btn-ghost" style={{padding: '4px 8px', fontSize: '0.8rem'}} onClick={() => {
                    setSelectedProduct(null);
                    setSearchTerm('');
                  }}>Thay đổi</button>
                </div>
              )}
            </div>

            {!selectedProduct && (
              <div className="input-group">
                <label className="premium-label">Tên sản phẩm tự nhập</label>
                <input 
                  placeholder="Nếu không tìm thấy sản phẩm, hãy tự nhập..." 
                  value={details.customName} 
                  className="premium-input"
                  onChange={e => setDetails({...details, customName: e.target.value})} 
                />
              </div>
            )}

            <div className="form-row">
              <div className="input-group">
                <label className="premium-label">Sàn/Nơi săn</label>
                <select title="Nơi săn sale" value={details.platform} onChange={e => setDetails({...details, platform: e.target.value})} className="premium-input">
                  {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="input-group">
                <label className="premium-label">Giá mong muốn (VNĐ)</label>
                <input 
                  type="number" 
                  placeholder="VD: 15000000" 
                  value={targetPrice} 
                  className="premium-input"
                  onChange={e => setTargetPrice(e.target.value)} 
                  required 
                />
                {selectedProduct && selectedProduct.bottomPrice && (
                  <div className="price-suggestions">
                    <span className="chip" onClick={() => applyPriceSuggestion(Number(selectedProduct.bottomPrice))}>
                      🎯 Giá đáy: {Number(selectedProduct.bottomPrice).toLocaleString('vi-VN')}
                    </span>
                    <span className="chip" onClick={() => applyPriceSuggestion(Number(selectedProduct.bottomPrice) * 0.95)}>
                      🔥 Đáy -5%
                    </span>
                    <span className="chip" onClick={() => applyPriceSuggestion(Number(selectedProduct.bottomPrice) * 1.05)}>
                      ⚡ Đáy +5%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="premium-label">Màu sắc</label>
                <input placeholder="VD: Titan" value={details.color} className="premium-input" onChange={e => setDetails({...details, color: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="premium-label">Cấu hình (RAM/ROM)</label>
                <input placeholder="VD: 8/256GB" value={details.ram} className="premium-input" onChange={e => setDetails({...details, ram: e.target.value})} />
              </div>
            </div>

            <div className="terms-section" style={{background: 'var(--bg-hover)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '24px', marginBottom: '24px'}}>
              <h4 style={{marginBottom: '12px', color: 'var(--text-primary)', fontSize: '1.05rem'}}>Quy định Đăng tin ({type === 'request' ? 'Nhờ Săn' : type === 'offer' ? 'Đi Săn' : 'Pass Kèo'})</h4>
              {renderRules()}
              
              <div className="disclaimer-box" style={{fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '16px', lineHeight: 1.6}}>
                <strong>⚠️ Miễn trừ trách nhiệm:</strong> TechHub AI chỉ là nền tảng trung gian kết nối cộng đồng săn sale. Chúng tôi tuyệt đối không can thiệp hay quản lý tài sản, không đảm bảo hoàn toàn tính xác thực của các giao dịch thỏa thuận cá nhân từ người dùng đóng góp. Người dùng tự chịu trách nhiệm về các giao dịch, mua bán trên không gian mạng. Admin có quyền gỡ bỏ mọi thông tin vi phạm quy định nền tảng (spam, lừa đảo, công kích) mà không cần báo trước.
              </div>

              <div style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: agreedToTerms ? 'rgba(59, 130, 246, 0.1)' : 'transparent', padding: '12px', borderRadius: '8px', border: agreedToTerms ? '1px solid var(--primary-color)' : '1px solid transparent', transition: 'all 0.2s ease'}} onClick={() => setAgreedToTerms(!agreedToTerms)}>
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={e => setAgreedToTerms(e.target.checked)} 
                  style={{width: '24px', height: '24px', accentColor: 'var(--primary-color)', cursor: 'pointer', borderRadius: '4px'}}
                />
                <label style={{fontSize: '0.95rem', fontWeight: agreedToTerms ? 600 : 500, userSelect: 'none', cursor: 'pointer', color: agreedToTerms ? 'var(--primary-color)' : 'var(--text-primary)'}}>
                  Tôi đã đọc, hiểu rõ và đồng ý với Hướng dẫn cộng đồng & Miễn trừ trách nhiệm.
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2" style={{padding: '16px', fontSize: '1.1rem', opacity: (!agreedToTerms || loading) ? 0.6 : 1, transition: 'all 0.3s ease'}} disabled={loading || !agreedToTerms}>
              {loading ? 'Đang xử lý...' : 'Xác Nhận Đăng Tin Ngay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSalePost;

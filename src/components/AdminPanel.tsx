import React, { useState, useEffect } from 'react';
import type { Product } from './ProductCard';
import { fetchProducts, addProduct, deleteProduct } from '../services/productService';
import { supabase } from '../supabaseClient';

const AdminPanel: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [summarizationFreq, setSummarizationFreq] = useState('1h');
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    imageUrl: '',
    bottomPrice: '',
    rating: 5,
    topReview: '',
    shops: [{ name: 'Shopee', url: '' }]
  });

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadProducts();
    }
  }, [session]);

  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Lỗi đăng nhập: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addProduct(newProduct as Omit<Product, 'id' | 'reviewCount'>);
    if (result) {
      alert('Đã thêm sản phẩm thành công!');
      loadProducts();
      setNewProduct({
        name: '',
        imageUrl: '',
        bottomPrice: '',
        rating: 5,
        topReview: '',
        shops: [{ name: 'Shopee', url: '' }]
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    const success = await deleteProduct(id);
    if (success) {
      loadProducts();
    }
  };

  if (!session) {
    return (
      <div className="admin-login-container">
        <div className="glass-card admin-panel login-card">
          <h2>Đăng Nhập Quản Trị</h2>
          <form onSubmit={handleLogin} className="product-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Mật khẩu</label>
              <input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang kiểm tra...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <h2>Bảng Quản Trị</h2>
        <button onClick={handleLogout} className="toggle-btn">Đăng xuất</button>
      </div>

      <div className="glass-card admin-panel">
        <h3>Cài Đặt Tổng Quan</h3>
        <div className="setting-group">
          <label htmlFor="summarizationFreq">Tần suất tóm tắt AI</label>
          <select 
            id="summarizationFreq"
            title="Chọn tần suất tóm tắt tin tức"
            value={summarizationFreq} 
            onChange={(e) => setSummarizationFreq(e.target.value)}
          >
            <option value="30m">Mỗi 30 phút</option>
            <option value="1h">Mỗi 1 giờ</option>
            <option value="6h">Mỗi 6 giờ</option>
          </select>
        </div>
        <button className="btn-primary save-btn">Lưu Cài Đặt</button>
      </div>

      <div className="glass-card admin-panel mt-40">
        <h3>Thêm Sản Phẩm Mới</h3>
        <form onSubmit={handleAddProduct} className="product-form">
          <div className="input-group">
            <label htmlFor="prodName">Tên sản phẩm</label>
            <input id="prodName" title="Tên sp" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
          </div>
          <div className="input-group">
            <label htmlFor="prodImg">URL Hình ảnh</label>
            <input id="prodImg" title="URL ảnh" value={newProduct.imageUrl || ''} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} required />
          </div>
          <div className="input-group">
            <label htmlFor="prodPrice">Giá đáy (VNĐ)</label>
            <input id="prodPrice" title="Giá" value={newProduct.bottomPrice || ''} onChange={e => setNewProduct({...newProduct, bottomPrice: e.target.value})} required />
          </div>
          <div className="input-group">
            <label htmlFor="prodLink">Link Shop</label>
            <input id="prodLink" title="Link" value={newProduct.shops?.[0].url || ''} onChange={e => setNewProduct({...newProduct, shops: [{ name: 'Sàn TMĐT', url: e.target.value }]})} required />
          </div>
          <div className="input-group">
            <label htmlFor="prodReview">Nhận xét tóm tắt</label>
            <textarea id="prodReview" title="Review" value={newProduct.topReview || ''} onChange={e => setNewProduct({...newProduct, topReview: e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary">Thêm Sản Phẩm Mới</button>
        </form>

        <div className="admin-product-list">
          <h3>Danh sách sản phẩm hiện có</h3>
          {products.map(p => (
            <div key={p.id} className="admin-product-item">
              <span>{p.name}</span>
              <button type="button" onClick={() => handleDelete(p.id)} className="delete-btn">Xóa</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

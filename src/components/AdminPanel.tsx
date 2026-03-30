import React, { useState, useEffect } from 'react';
import type { Product, Review } from './ProductCard';
import { fetchProducts, addProduct, deleteProduct, updateProduct } from '../services/productService';
import { fetchAllSalePostsForAdmin, deleteSalePost as deletePostApi, updateSalePost, checkAndAutoConfirmPosts } from '../services/saleHuntingService';
import type { SalePost } from '../services/saleHuntingService';
import type { GlobalBannerData, BannerItem } from '../services/settingsService';
import { fetchAllUsers, fetchAllReviews, updateReview, deleteReview, updateUser, type UserProfile, type ReviewWithProduct } from '../services/adminService';
import { fetchReviewers, addReviewer, updateReviewer, deleteReviewer, type Reviewer } from '../services/reviewerService';
import { supabase } from '../supabaseClient';
import { CATEGORIES } from './CategoryTabs';
import { fetchAllReportsForAdmin, updateReportStatus, type BottomPriceReport } from '../services/bottomPriceService';

const AdminPanel: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard'|'products'|'reviewers'|'salePosts'|'users'|'settings'|'reports'>('products');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [salePosts, setSalePosts] = useState<SalePost[]>([]);
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [bottomPriceReports, setBottomPriceReports] = useState<BottomPriceReport[]>([]);

  // Editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewWithProduct | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null);

  // Modals & Sub-views
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);

  // Filters
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // New item states
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', imageUrl: '', bottomPrice: '', rating: 5, category: 'phone', shops: [{ name: 'Shopee', url: '' }]
  });

  const [newReview, setNewReview] = useState<Partial<Review>>({
    type: 'reviewer', author: '', content: '', rating: 5,
    reviewerProfile: { avatarUrl: '', facebookUrl: '', youtubeUrl: '' },
    screenshotUrl: '', postUrl: ''
  });

  const [newReviewer, setNewReviewer] = useState<Partial<Reviewer>>({
    name: '', avatar_url: '', facebook_url: '', youtube_url: ''
  });

  const [bannerConfig, setBannerConfig] = useState<GlobalBannerData>({ enabled: false, items: [] });
  const [editingBannerItem, setEditingBannerItem] = useState<Partial<BannerItem>>({ id: '', isActive: true, text: '', link: '', imageUrl: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    // Auto-confirm old matched posts silently
    checkAndAutoConfirmPosts().catch(console.error);

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadAllData();
  }, [session]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadProducts(),
      loadSalePosts(),
      loadReviews(),
      loadUsers(),
      loadReviewers(),
      loadSettings(),
      loadReports()
    ]);
    setLoading(false);
  };

  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
  };

  const loadSalePosts = async () => {
    const data = await fetchAllSalePostsForAdmin();
    setSalePosts(data);
  };

  const loadReviews = async () => {
    const data = await fetchAllReviews();
    setReviews(data);
  };

  const loadUsers = async () => {
    const data = await fetchAllUsers();
    setUsers(data);
  };

  const loadReviewers = async () => {
    const data = await fetchReviewers();
    setReviewers(data);
  };

  const loadSettings = async () => {
    try {
      // Import on demand to avoid dependency cycle if any, or static import at top. Let's assume dynamic for safety, or we can add static later.
      const { fetchGlobalBanner } = await import('../services/settingsService');
      const banner = await fetchGlobalBanner();
      if (banner) {
        setBannerConfig(banner);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };
  
  const loadReports = async () => {
    const data = await fetchAllReportsForAdmin();
    setBottomPriceReports(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Lỗi đăng nhập: ' + error.message);
    setLoading(false);
  };

  // --- PRODUCT HANDLERS ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addProduct(newProduct as Omit<Product, 'id' | 'reviewCount'>);
    if (result) {
      alert('Đã thêm sản phẩm thành công!');
      loadProducts();
      setNewProduct({ name: '', imageUrl: '', bottomPrice: '', rating: 5, category: 'phone', shops: [{ name: 'Shopee', url: '' }] });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    const success = await deleteProduct(id);
    if (success) loadProducts();
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const { id, reviews: _revs, reviewCount: _rc, topReview: _tr, ...updates } = editingProduct as any;
    const success = await updateProduct(id, updates);
    if (success) {
      alert('Cập nhật thành công!');
      setEditingProduct(null);
      loadProducts();
    } else alert('Lỗi khi cập nhật sản phẩm.');
  };

  // --- REVIEW HANDLERS ---
  const extractReviewerProfileProps = (reviewerName: string) => {
    const found = reviewers.find(r => r.name === reviewerName);
    if (found) {
      return {
        avatarUrl: found.avatar_url,
        facebookUrl: found.facebook_url,
        youtubeUrl: found.youtube_url
      };
    }
    return { avatarUrl: '', facebookUrl: '', youtubeUrl: '' };
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForReviews) return;
    
    let profileToSave = newReview.reviewerProfile;
    if (newReview.type === 'reviewer') {
      profileToSave = extractReviewerProfileProps(newReview.author || '');
    }

    const { error } = await supabase.from('reviews').insert([{ 
      ...newReview, 
      reviewerProfile: profileToSave,
      product_id: selectedProductForReviews.id 
    }]);

    if (error) alert('Lỗi thêm review: ' + error.message);
    else {
      alert('Đã thêm đánh giá!');
      setNewReview({ type: 'reviewer', author: '', content: '', rating: 5, reviewerProfile: { avatarUrl: '', facebookUrl: '', youtubeUrl: '' }, screenshotUrl: '', postUrl: '' });
      loadReviews();
    }
  };

  const handleUpdateReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    const { id, product_id, products, ...updates } = editingReview as any;
    
    if (updates.type === 'reviewer') {
      updates.reviewerProfile = extractReviewerProfileProps(updates.author);
    }
    
    const success = await updateReview(id, updates);
    if (success) {
      alert('Cập nhật đánh giá thành công!');
      setEditingReview(null);
      loadReviews();
    } else alert('Lỗi khi cập nhật.');
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    const success = await deleteReview(id);
    if (success) loadReviews();
  };

  // --- REVIEWER ADMIN HANDLERS ---
  const handleAddReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addReviewer(newReviewer as Omit<Reviewer, 'id' | 'created_at'>);
    if (result) {
      alert('Thêm Reviewer thành công!');
      loadReviewers();
      setNewReviewer({ name: '', avatar_url: '', facebook_url: '', youtube_url: '' });
    }
  };

  const handleUpdateReviewerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewer) return;
    const { id, created_at, ...updates } = editingReviewer;
    const success = await updateReviewer(id, updates);
    if (success) {
      alert('Cập nhật Profile Reviewer thành công!');
      setEditingReviewer(null);
      loadReviewers();
    } else alert('Lỗi khi cập nhật Reviewer.');
  };

  const handleDeleteReviewer = async (id: string) => {
    if (!window.confirm('Xoá Reviewer này? Lưu ý: Các thẻ review đã có sẽ không mất người đăng, nhưng sẽ mất profile liên kết nếu cập nhật mới.')) return;
    const success = await deleteReviewer(id);
    if (success) loadReviewers();
  };

  // --- SALE POST HANDLERS ---
  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Xóa bài đăng này vĩnh viễn?')) return;
    const success = await deletePostApi(id);
    if (success) loadSalePosts();
  };

  const handleTogglePostStatus = async (post: SalePost) => {
    const newStatus = post.status === 'open' ? 'closed' : 'open';
    const success = await updateSalePost(post.id, { status: newStatus });
    if (success) loadSalePosts();
  };

  // --- USER HANDLERS ---
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const { id, created_at, ...updates } = editingUser;
    const success = await updateUser(id, updates);
    if (success) {
      alert('Cập nhật thành viên thành công!');
      setEditingUser(null);
      loadUsers();
    } else alert('Lỗi khi cập nhật.');
  };

  // --- SETTINGS HANDLERS ---
  const handleUpdateBannerSubmit = async () => {
    try {
      const { updateGlobalBanner } = await import('../services/settingsService');
      const success = await updateGlobalBanner(bannerConfig);
      if (success) {
        alert('Đã lưu cấu hình thông báo thành công!');
      } else {
        alert('Lỗi cập nhật cấu hình thông báo.');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi.');
    }
  };

  const handleAddOrEditBannerItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBannerItem.text) return;
    const newItem = {
      ...editingBannerItem,
      id: editingBannerItem.id || `banner-${Date.now()}`
    } as BannerItem;
    
    let updatedItems = [...bannerConfig.items];
    if (editingBannerItem.id) {
       updatedItems = updatedItems.map(it => it.id === newItem.id ? newItem : it);
    } else {
       updatedItems.push(newItem);
    }

    setBannerConfig({ ...bannerConfig, items: updatedItems });
    setEditingBannerItem({ id: '', isActive: true, text: '', link: '', imageUrl: '' });
  };

  const handleRemoveBannerItem = (id: string) => {
    if(!window.confirm('Xóa thông báo này không? Lưu ý: Bạn cần phải ấn LƯU CẤU HÌNH để thực sự xóa nó trên hệ thống.')) return;
    setBannerConfig({ ...bannerConfig, items: bannerConfig.items.filter(it => it.id !== id) });
  };

  // --- FILTERING ---
  const filteredProducts = products.filter(p => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (searchProductQuery && !p.name.toLowerCase().includes(searchProductQuery.toLowerCase())) return false;
    return true;
  });

  // --- RENDER HELPERS ---
  if (!session) {
    return (
      <div className="admin-login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card login-card" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Đăng Nhập Quản Trị</h2>
          <form onSubmit={handleLogin} className="flex-column gap-3">
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" />
            </div>
            <div className="input-group">
              <label>Mật khẩu</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" />
            </div>
            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? 'Đang kiểm tra...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <div className="admin-sidebar glass-card" style={{ borderRadius: 0, padding: '24px', position: 'sticky', top: 0, height: '100vh' }}>
        <h2 style={{ marginBottom: '32px', color: 'var(--accent-green)' }}>TechHub Panel</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'dashboard' ? '' : 'transparent' }} onClick={() => { setActiveTab('dashboard'); setSelectedProductForReviews(null); }}>📊 Thống kê</button>
          <button className={`btn ${activeTab === 'products' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'products' ? '' : 'transparent' }} onClick={() => { setActiveTab('products'); setSelectedProductForReviews(null); }}>📱 Sản phẩm ({products.length})</button>
          <button className={`btn ${activeTab === 'reviewers' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'reviewers' ? '' : 'transparent' }} onClick={() => { setActiveTab('reviewers'); setSelectedProductForReviews(null); }}>⭐ Reviewers ({reviewers.length})</button>
          <button className={`btn ${activeTab === 'salePosts' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'salePosts' ? '' : 'transparent' }} onClick={() => { setActiveTab('salePosts'); setSelectedProductForReviews(null); }}>🔥 Tin Săn Sale ({salePosts.length})</button>
          <button className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'users' ? '' : 'transparent' }} onClick={() => { setActiveTab('users'); setSelectedProductForReviews(null); }}>👥 Thành viên ({users.length})</button>
          <button className={`btn ${activeTab === 'reports' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'reports' ? '' : 'transparent' }} onClick={() => { setActiveTab('reports'); setSelectedProductForReviews(null); }}>🚩 Báo giá đáy ({bottomPriceReports.filter(r => r.status === 'pending').length})</button>
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }}></div>
          <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : ''}`} style={{ textAlign: 'left', background: activeTab === 'settings' ? '' : 'transparent' }} onClick={() => { setActiveTab('settings'); setSelectedProductForReviews(null); }}>⚙️ Thông báo Kèo Mới</button>
        </div>

        <button onClick={() => supabase.auth.signOut()} className="btn mt-auto" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Đăng xuất</button>
      </div>

      {/* CONTENT AREA */}
      <div className="admin-content">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && !selectedProductForReviews && (
          <div>
            <h2>Thống kê tổng quan</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '24px' }}>
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--accent-blue)' }}>{products.length}</h1>
                <p className="text-secondary">Sản phẩm</p>
              </div>
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--accent-yellow)' }}>{reviews.length}</h1>
                <p className="text-secondary">Tổng Đánh giá</p>
              </div>
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--accent-green)' }}>{salePosts.length}</h1>
                <p className="text-secondary">Tin săn sale</p>
              </div>
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--accent-purple)' }}>{users.length}</h1>
                <p className="text-secondary">Thành viên</p>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS FOR A SPECIFIC PRODUCT */}
        {selectedProductForReviews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '16px' }}>
              <button className="btn" onClick={() => setSelectedProductForReviews(null)}>← Quay lại Sản phẩm</button>
              <h2 style={{ margin: 0 }}>Đánh giá cho: {selectedProductForReviews.name}</h2>
            </div>

            {/* ADD REVIEW FORM */}
            <div className="glass-card">
              <h3>Thêm Đánh Giá</h3>
              <form onSubmit={handleAddReview} className="flex-column gap-3 mt-3">
                <div className="form-row">
                  <select title="Type" value={newReview.type} onChange={e => setNewReview({...newReview, type: e.target.value as any})} className="input-field" style={{ width: '180px' }}>
                    <option value="reviewer">Reviewer</option>
                    <option value="user">Người dùng Thường</option>
                  </select>
                  
                  {newReview.type === 'reviewer' ? (
                    <select title="Author" value={newReview.author || ''} onChange={e => setNewReview({...newReview, author: e.target.value})} className="input-field" required>
                      <option value="">-- Chọn một Reviewer --</option>
                      {reviewers.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input placeholder="Tên tác giả" value={newReview.author || ''} onChange={e => setNewReview({...newReview, author: e.target.value})} className="input-field" title="Author Name" required />
                  )}
                </div>
                
                <textarea placeholder="Nội dung đánh giá" value={newReview.content || ''} onChange={e => setNewReview({...newReview, content: e.target.value})} className="input-field" required rows={3}></textarea>
                
                <div className="form-row">
                  <input placeholder="Link ảnh screenshot (Nếu có)" value={newReview.screenshotUrl || ''} onChange={e => setNewReview({...newReview, screenshotUrl: e.target.value})} className="input-field" />
                  <input placeholder="Link bài đăng gốc (Nếu có)" value={newReview.postUrl || ''} onChange={e => setNewReview({...newReview, postUrl: e.target.value})} className="input-field" />
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu Đánh Giá</button>
              </form>
            </div>

            {/* EDIT REVIEW FORM */}
            {editingReview && (
              <div className="glass-card" style={{ border: '2px solid var(--accent-yellow)' }}>
                <h4>Sửa đánh giá của: {editingReview.author}</h4>
                <form onSubmit={handleUpdateReviewSubmit} className="flex-column gap-3 mt-3">
                  <div className="form-row">
                    <select value={editingReview.type} onChange={e => setEditingReview({...editingReview, type: e.target.value as any})} className="input-field">
                      <option value="reviewer">Reviewer</option>
                      <option value="user">Người dùng Thường</option>
                    </select>

                    {editingReview.type === 'reviewer' ? (
                      <select title="Author" value={editingReview.author || ''} onChange={e => setEditingReview({...editingReview, author: e.target.value})} className="input-field" required>
                        {reviewers.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={editingReview.author} onChange={e => setEditingReview({...editingReview, author: e.target.value})} className="input-field" />
                    )}
                  </div>
                  <textarea value={editingReview.content} onChange={e => setEditingReview({...editingReview, content: e.target.value})} className="input-field" rows={4} required></textarea>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                    <button type="submit" className="btn-primary">Lưu thay đổi</button>
                    <button type="button" className="btn" onClick={() => setEditingReview(null)}>Hủy</button>
                  </div>
                </form>
              </div>
            )}

            <div className="glass-card">
              <h3>Danh sách Đánh giá</h3>
              <div className="admin-table-container mt-3">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tác giả</th>
                      <th>Loại</th>
                      <th>Nội dung</th>
                      <th style={{ textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.filter(r => r.product_id === selectedProductForReviews.id).map(r => (
                      <tr key={r.id}>
                        <td>{r.author}</td>
                        <td>
                          <span className="badge" style={{ background: r.type === 'reviewer' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: r.type === 'reviewer' ? '#a855f7' : '#3b82f6' }}>
                            {r.type === 'reviewer' ? 'Reviewer' : 'Thường'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.content}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn mr-2" style={{ padding: '4px 8px', fontSize: '0.85rem' }} onClick={() => { setEditingReview(r); window.scrollTo(0,0); }}>Sửa</button>
                          <button className="delete-btn" style={{ padding: '4px 8px', fontSize: '0.85rem' }} onClick={() => handleDeleteReview(r.id)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                    {reviews.filter(r => r.product_id === selectedProductForReviews.id).length === 0 && <tr><td colSpan={4} className="text-center p-4 text-muted">Sản phẩm này chưa có đánh giá nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && !selectedProductForReviews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card">
              <h3>Thêm Sản Phẩm Mới</h3>
              <form onSubmit={handleAddProduct} className="form-row mt-3">
                <input placeholder="Tên sản phẩm" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required style={{ flex: 1 }} className="input-field" autoComplete="off" />
                <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="input-field">
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input placeholder="URL Hình ảnh" value={newProduct.imageUrl || ''} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} required className="input-field" />
                <input placeholder="Giá đáy" value={newProduct.bottomPrice || ''} onChange={e => setNewProduct({...newProduct, bottomPrice: e.target.value})} required style={{ width: '150px' }} className="input-field" />
                <button type="submit" className="btn-primary">Thêm</button>
              </form>
            </div>

            {editingProduct && (
              <div className="glass-card" style={{ border: '2px solid var(--accent-blue)' }}>
                <h4>Sửa "{editingProduct.name}"</h4>
                <form onSubmit={handleUpdateProduct} className="flex-column gap-3 mt-3">
                  <div className="form-row">
                    <input value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="input-field" />
                    <input value={editingProduct.imageUrl || ''} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} className="input-field" />
                    <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="input-field">
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <input placeholder="Giá đáy" value={editingProduct.bottomPrice || ''} onChange={e => setEditingProduct({...editingProduct, bottomPrice: e.target.value})} className="input-field" />
                    <input placeholder="Đáy vương" value={editingProduct.dayVuong || ''} onChange={e => setEditingProduct({...editingProduct, dayVuong: e.target.value})} className="input-field" />
                    <input placeholder="Nền tảng giá đáy" value={editingProduct.bottomPricePlatform || ''} onChange={e => setEditingProduct({...editingProduct, bottomPricePlatform: e.target.value})} className="input-field" />
                  </div>

                  {/* VARIANT MANAGEMENT */}
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', marginTop: '16px' }}>
                    <h5 style={{ marginBottom: '16px' }}>⚙️ Quản lý Phân loại (Variants)</h5>
                    <div className="flex-column gap-3">
                      {/* Attributes list */}
                      {(editingProduct.variants?.attributes || []).map((attr, attrIdx) => (
                        <div key={attrIdx} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
                          <div className="flex-between mb-2">
                            <input 
                              value={attr.name} 
                              onChange={e => {
                                const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                newAttrs[attrIdx].name = e.target.value;
                                setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, attributes: newAttrs }});
                              }}
                              className="input-field"
                              placeholder="Tên phân loại (VD: Màu sắc)"
                              style={{ fontWeight: 'bold' }}
                            />
                            <button type="button" className="delete-btn" style={{ padding: '4px 8px' }} onClick={() => {
                              const newAttrs = (editingProduct.variants?.attributes || []).filter((_, i) => i !== attrIdx);
                              setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, attributes: newAttrs }});
                            }}>Xóa loại</button>
                          </div>
                          <div className="flex-center" style={{ flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start' }}>
                            {attr.options.map((opt, optIdx) => (
                              <div key={optIdx} className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                  value={opt} 
                                  onChange={e => {
                                    const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                    newAttrs[attrIdx].options[optIdx] = e.target.value;
                                    setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, attributes: newAttrs }});
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '80px' }}
                                />
                                <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => {
                                  const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                  newAttrs[attrIdx].options = newAttrs[attrIdx].options.filter((_, i) => i !== optIdx);
                                  setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, attributes: newAttrs }});
                                }}>×</span>
                              </div>
                            ))}
                            <button type="button" className="btn" style={{ padding: '2px 8px' }} onClick={() => {
                              const newAttrs = [...(editingProduct.variants?.attributes || [])];
                              newAttrs[attrIdx].options.push('Mới');
                              setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, attributes: newAttrs }});
                            }}>+ Thêm lựa chọn</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', alignSelf: 'flex-start' }} onClick={() => {
                        const currentVariants = editingProduct.variants || { attributes: [], variantPrices: [] };
                        setEditingProduct({...editingProduct, variants: { ...currentVariants, attributes: [...currentVariants.attributes, { name: 'Loại mới', options: [] }] }});
                      }}>+ Thêm tiêu chí phân loại mới</button>

                      {/* Variant Prices Table */}
                      {(editingProduct.variants?.attributes?.length || 0) > 0 && (
                        <div style={{ marginTop: '24px' }}>
                          <h6 style={{ marginBottom: '8px' }}>📍 Giá đáy theo từng phiên bản</h6>
                          <div className="admin-table-container">
                             <table className="admin-table">
                               <thead>
                                 <tr>
                                   <th>Phiên bản</th>
                                   <th>Giá đáy (đ)</th>
                                   <th>Trạng thái</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {(editingProduct.variants?.variantPrices || []).map((vp, vpIdx) => (
                                   <tr key={vpIdx}>
                                     <td>
                                       {Object.entries(vp.combination).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                     </td>
                                     <td>
                                       <input 
                                         type="number"
                                         value={vp.bottomPrice || ''}
                                         onChange={e => {
                                           const newPrices = [...(editingProduct.variants?.variantPrices || [])];
                                           newPrices[vpIdx].bottomPrice = parseInt(e.target.value);
                                           setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, variantPrices: newPrices }});
                                         }}
                                         className="input-field"
                                         style={{ width: '120px' }}
                                       />
                                     </td>
                                     <td>
                                        <button type="button" className="delete-btn" onClick={() => {
                                          const newPrices = (editingProduct.variants?.variantPrices || []).filter((_, i) => i !== vpIdx);
                                          setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, variantPrices: newPrices }});
                                        }}>Gỡ</button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                             <div className="mt-3 p-3 bg-deep rounded flex-column gap-2" style={{ background: 'var(--bg-deep)', borderRadius: '8px' }}>
                                <strong>Thêm giá cho phiên bản:</strong>
                                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                                  {(editingProduct.variants?.attributes || []).map((attr, i) => (
                                    <select key={i} id={`new-vp-opt-${i}`} className="input-field" style={{ width: 'auto' }}>
                                      {attr.options.map((o, j) => <option key={j} value={o}>{o}</option>)}
                                    </select>
                                  ))}
                                  <input id="new-vp-price" type="number" placeholder="Giá..." className="input-field" style={{ width: '120px' }} />
                                  <button type="button" className="btn-primary" onClick={() => {
                                    const comb: Record<string, string> = {};
                                    (editingProduct.variants?.attributes || []).forEach((attr, i) => {
                                      const el = document.getElementById(`new-vp-opt-${i}`) as HTMLSelectElement;
                                      comb[attr.name] = el.value;
                                    });
                                    const pr = document.getElementById('new-vp-price') as HTMLInputElement;
                                    const newPrices = [...(editingProduct.variants?.variantPrices || []), { combination: comb, bottomPrice: parseInt(pr.value), isVerified: true }];
                                    setEditingProduct({...editingProduct, variants: { ...editingProduct.variants!, variantPrices: newPrices }});
                                    pr.value = '';
                                  }}>Thêm giá</button>
                                </div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px', marginTop: '16px' }}>
                    <button type="submit" className="btn-primary">Lưu thay đổi</button>
                    <button type="button" className="btn" onClick={() => setEditingProduct(null)}>Hủy</button>
                  </div>
                </form>
              </div>
            )}

            <div className="glass-card">
              <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ margin: 0 }}>Danh sách Sản phẩm</h3>
                <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', justifyContent: 'flex-end', maxWidth: '500px' }}>
                  <input 
                    type="search" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    value={searchProductQuery}
                    onChange={e => setSearchProductQuery(e.target.value)}
                    className="input-field"
                    style={{ background: 'var(--bg-deep)' }}
                  />
                  <select title="Filter Category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field" style={{ width: '150px', background: 'var(--bg-deep)' }}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table w-100">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 8px' }}>Tên</th>
                      <th>Danh mục</th>
                      <th>Giá đáy</th>
                      <th style={{ textAlign: 'right', paddingRight: '12px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                            <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                            {p.name}
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td>{p.bottomPrice.toLocaleString('vi-VN')} đ</td>
                        <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                          <button className="btn mr-2" style={{ padding: '4px 8px', fontSize: '0.85rem', background: 'var(--accent-purple)', color: 'white', border: 'none' }} onClick={() => setSelectedProductForReviews(p)}>Đánh giá</button>
                          <button className="btn mr-2" style={{ padding: '4px 8px', fontSize: '0.85rem' }} onClick={() => { setEditingProduct(p); window.scrollTo(0,0); }}>Sửa</button>
                          <button className="delete-btn" style={{ padding: '4px 8px', fontSize: '0.85rem' }} onClick={() => handleDeleteProduct(p.id)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-muted">Không tìm thấy sản phẩm phù hợp</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWERS TAB */}
        {activeTab === 'reviewers' && !selectedProductForReviews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card">
              <h3>Thêm Reviewer Mới</h3>
              <form onSubmit={handleAddReviewer} className="flex-column gap-3 mt-3">
                <div className="form-row">
                  <input placeholder="Tên Reviewer" value={newReviewer.name || ''} onChange={e => setNewReviewer({...newReviewer, name: e.target.value})} required className="input-field" />
                  <input placeholder="Avatar URL" value={newReviewer.avatar_url || ''} onChange={e => setNewReviewer({...newReviewer, avatar_url: e.target.value})} className="input-field" />
                </div>
                <div className="form-row">
                  <input placeholder="Facebook URL" value={newReviewer.facebook_url || ''} onChange={e => setNewReviewer({...newReviewer, facebook_url: e.target.value})} className="input-field" />
                  <input placeholder="Youtube URL" value={newReviewer.youtube_url || ''} onChange={e => setNewReviewer({...newReviewer, youtube_url: e.target.value})} className="input-field" />
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Thêm Reviewer</button>
              </form>
            </div>

            {editingReviewer && (
              <div className="glass-card" style={{ border: '2px solid var(--accent-purple)' }}>
                <h4>Chỉnh sửa Reviewer: {editingReviewer.name}</h4>
                <form onSubmit={handleUpdateReviewerSubmit} className="flex-column gap-3 mt-3">
                  <div className="form-row">
                    <input placeholder="Tên" value={editingReviewer.name} onChange={e => setEditingReviewer({...editingReviewer, name: e.target.value})} required className="input-field" />
                    <input placeholder="Avatar URL" value={editingReviewer.avatar_url || ''} onChange={e => setEditingReviewer({...editingReviewer, avatar_url: e.target.value})} className="input-field" />
                  </div>
                  <div className="form-row">
                    <input placeholder="Facebook URL" value={editingReviewer.facebook_url || ''} onChange={e => setEditingReviewer({...editingReviewer, facebook_url: e.target.value})} className="input-field" />
                    <input placeholder="Youtube URL" value={editingReviewer.youtube_url || ''} onChange={e => setEditingReviewer({...editingReviewer, youtube_url: e.target.value})} className="input-field" />
                  </div>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                    <button type="submit" className="btn-primary">Lưu hồ sơ</button>
                    <button type="button" className="btn" onClick={() => setEditingReviewer(null)}>Hủy</button>
                  </div>
                </form>
              </div>
            )}

            <div className="glass-card">
              <h3>Danh sách Reviewers</h3>
              <div className="mt-3 admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reviewer</th>
                      <th>Social Links</th>
                      <th style={{ textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewers.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                            <img src={r.avatar_url || 'https://via.placeholder.com/40'} alt={r.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            <strong style={{ color: 'var(--text-primary)' }}>{r.name}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="flex-column gap-1" style={{ fontSize: '0.8rem' }}>
                              {r.facebook_url && <a href={r.facebook_url} target="_blank" rel="noreferrer" style={{color: 'var(--accent-blue)'}}>Facebook</a>}
                              {r.youtube_url && <a href={r.youtube_url} target="_blank" rel="noreferrer" style={{color: 'var(--accent-red)'}}>YouTube</a>}
                              {!r.facebook_url && !r.youtube_url && <span className="text-muted">Chưa có link</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn mr-2" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => { setEditingReviewer(r); window.scrollTo(0,0); }}>Chỉnh sửa</button>
                          <button className="delete-btn" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleDeleteReviewer(r.id)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                    {reviewers.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-muted">Chưa có Reviewer nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SALE POSTS TAB */}
        {activeTab === 'salePosts' && !selectedProductForReviews && (
          <div className="glass-card">
            <h3>Quản lý Tin Săn Sale</h3>
            <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {salePosts.map(post => {
                const isMatched = post.status === 'matched';
                let matchedDays = 0;
                if (isMatched && post.details?.matched_at) {
                  const passed = new Date().getTime() - new Date(post.details.matched_at).getTime();
                  matchedDays = Math.floor(passed / (1000 * 60 * 60 * 24));
                }

                return (
                  <div key={post.id} className="admin-post-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="flex-center mb-2" style={{ justifyContent: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`badge ${post.type === 'request' ? 'badge-request' : post.type === 'offer' ? 'badge-offer' : 'badge-pass'}`}>
                          {post.type === 'request' ? 'Nhờ Săn' : post.type === 'offer' ? 'Đi Săn' : 'Pass Kèo'}
                        </span>
                        {post.details?.code && (
                          <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>#{post.details.code}</span>
                        )}
                        <strong style={{ color: 'var(--text-primary)' }}>{post.profiles?.full_name || 'Khách'}</strong>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(post.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                      
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{post.products?.name || post.custom_product_name || 'Sản phẩm không xác định'}</div>
                      <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Mức giá mục tiêu: <strong style={{ color: 'var(--accent-yellow)' }}>{post.target_price.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      {(post as any).content && <p style={{ fontSize: '0.9rem', marginTop: '8px', color: 'var(--text-muted)' }}>"{(post as any).content}"</p>}
                      
                      <div className="mt-2 text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Trạng thái: 
                        <strong style={{ 
                          color: post.status === 'open' ? 'var(--accent-green)' : 
                                 post.status === 'matched' ? 'var(--accent-blue)' : 'var(--text-muted)'
                        }}> 
                          {post.status === 'closed' ? 'BẮT KÈO THÀNH CÔNG' : post.status.toUpperCase()}
                        </strong>
                        
                        {isMatched && (
                          <span style={{ fontSize: '0.75rem', color: matchedDays >= 3 ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>
                            (Đã chờ {matchedDays}/5 ngày)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button type="button" className="btn" style={{ minWidth: '120px' }} onClick={() => handleTogglePostStatus(post)}>
                        {post.status === 'open' ? 'Khóa post' : 'Mở lại'}
                      </button>
                      <button type="button" className="delete-btn" style={{ minWidth: '120px' }} onClick={() => handleDeletePost(post.id)}>
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                );
              })}
              {salePosts.length === 0 && <p className="text-secondary text-center">Chưa có bài đăng nào.</p>}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && !selectedProductForReviews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {editingUser && (
              <div className="glass-card" style={{ border: '2px solid var(--accent-purple)' }}>
                <h4>Chỉnh sửa thành viên: {editingUser.full_name}</h4>
                <form onSubmit={handleUpdateUserSubmit} className="flex-column gap-3 mt-3">
                  <div className="form-row">
                    <input placeholder="Họ và tên" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} className="input-field" required />
                    <input placeholder="Avatar URL" value={editingUser.avatar_url || ''} onChange={e => setEditingUser({...editingUser, avatar_url: e.target.value})} className="input-field" />
                    <input type="number" placeholder="Điểm Uy Tín" value={editingUser.reputation_score || 0} onChange={e => setEditingUser({...editingUser, reputation_score: parseInt(e.target.value)})} className="input-field" />
                  </div>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                    <button type="submit" className="btn-primary">Lưu thay đổi</button>
                    <button type="button" className="btn" onClick={() => setEditingUser(null)}>Hủy</button>
                  </div>
                </form>
              </div>
            )}

            <div className="glass-card">
              <h3>Quản lý Thành Viên</h3>
              <div className="mt-3 admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 8px' }}>Thành viên</th>
                      <th>Lịch sử tham gia</th>
                      <th>Uy tín</th>
                      <th style={{ textAlign: 'right', paddingRight: '12px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                            <img src={u.avatar_url || 'https://via.placeholder.com/40'} alt={u.full_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div className="flex-column">
                              <strong style={{ color: 'var(--text-primary)' }}>{u.full_name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.id.substring(0,8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'Unknown'}</td>
                        <td>
                          <div className="badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                            ⭐ {u.reputation_score || 0}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                          <button className="btn mr-2" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => { setEditingUser(u); window.scrollTo(0,0); }}>Chỉnh sửa</button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-muted">Chưa có thành viên nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && !selectedProductForReviews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card flex-between" style={{ padding: '20px 24px' }}>
              <div>
                <h3 style={{ margin: 0, marginBottom: '8px' }}>Quản lý Thông Báo Kèo Ngon (Multi-banner)</h3>
                <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>Thêm và sửa các banner, sau đó nhớ ấn nút <strong>Lưu Tất Cả</strong>.</p>
              </div>
              <button className="btn-primary" onClick={handleUpdateBannerSubmit} style={{ padding: '12px 24px', fontSize: '1rem' }}>
                💾 Lưu Tất Cả Cấu Hình
              </button>
            </div>

            <div className="form-row">
              {/* Cột trái: Form nhập liệu và Global switch */}
              <div className="flex-column gap-4">
                <div className="glass-card" style={{ padding: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '20px' }}>
                    <input 
                      type="checkbox" 
                      checked={bannerConfig.enabled} 
                      onChange={e => setBannerConfig({...bannerConfig, enabled: e.target.checked})}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--accent-purple)' }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: bannerConfig.enabled ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                      {bannerConfig.enabled ? 'HỆ THỐNG BANNER ĐANG MỞ' : 'HỆ THỐNG BANNER ĐANG TẮT'}
                    </span>
                  </label>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>Bật/Tắt master switch này sẽ cho phép hoặc chặn toàn bộ banner hiển thị.</p>
                </div>

                <div className="glass-card" style={{ border: editingBannerItem.id ? '2px solid var(--accent-yellow)' : '1px solid var(--border-subtle)' }}>
                  <h4 style={{ marginBottom: '16px' }}>{editingBannerItem.id ? 'Sửa Banner' : 'Thêm Banner Mới'}</h4>
                  <form onSubmit={handleAddOrEditBannerItem} className="flex-column gap-4">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editingBannerItem.isActive} 
                        onChange={e => setEditingBannerItem({...editingBannerItem, isActive: e.target.checked})}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-green)' }}
                      />
                      <span style={{ fontWeight: 600, color: editingBannerItem.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        Kích hoạt hiển thị cho banner này
                      </span>
                    </label>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="premium-label">Nội dung báo kèo (Có thể chèn emoji / HTML)</label>
                      <textarea 
                        value={editingBannerItem.text || ''} 
                        onChange={e => setEditingBannerItem({...editingBannerItem, text: e.target.value})} 
                        className="premium-input" 
                        rows={3}
                        placeholder="VD: 🎉 Kèo iPhone 15 Promax giá đáy!"
                        required
                      />
                    </div>
                    
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="premium-label">Hình ảnh minh họa (URL tùy chọn)</label>
                      <input 
                        value={editingBannerItem.imageUrl || ''} 
                        onChange={e => setEditingBannerItem({...editingBannerItem, imageUrl: e.target.value})} 
                        className="premium-input" 
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="premium-label">Đường dẫn khi click vào (Tùy chọn)</label>
                      <input 
                        value={editingBannerItem.link || ''} 
                        onChange={e => setEditingBannerItem({...editingBannerItem, link: e.target.value})} 
                        className="premium-input" 
                        placeholder="/sale-hunting"
                      />
                    </div>
                    
                    <div className="flex-center" style={{ gap: '12px', justifyContent: 'flex-start' }}>
                      <button type="submit" className="btn-primary">
                        {editingBannerItem.id ? 'Cập nhật vào danh sách' : 'Thêm vào danh sách'}
                      </button>
                      {editingBannerItem.id && (
                        <button type="button" className="btn" onClick={() => setEditingBannerItem({ id: '', isActive: true, text: '', link: '', imageUrl: '' })}>
                          Hủy sửa
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Cột phải: Danh sách các banner */}
              <div className="flex-column gap-4">
                <div className="glass-card h-100" style={{ padding: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Danh sách Banner ({bannerConfig.items.length})</h4>
                  <div className="flex-column gap-3">
                    {bannerConfig.items.map((item, index) => (
                      <div key={item.id} style={{ 
                        padding: '16px', 
                        background: 'var(--bg-deep)', 
                        border: '1px solid var(--border-subtle)', 
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        opacity: item.isActive ? 1 : 0.6
                      }}>
                        <div className="flex-between">
                          <span className="badge" style={{ background: item.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: item.isActive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {item.isActive ? 'ĐANG HIỂN THỊ' : 'ĐANG TẮT'}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>#{index + 1}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                           {item.imageUrl && <img src={item.imageUrl} alt="Banner Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />}
                           <div style={{ fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: item.text }} />
                        </div>
                        {item.link && <div className="text-secondary" style={{ fontSize: '0.85rem' }}>🔗 Link: {item.link}</div>}
                        
                        <div className="flex-center" style={{ justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px' }}>
                          <button type="button" className="btn" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => setEditingBannerItem(item)}>
                            Sửa
                          </button>
                          <button type="button" className="delete-btn" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleRemoveBannerItem(item.id)}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {bannerConfig.items.length === 0 && (
                      <div className="text-center text-muted p-4">Chưa có banner nào. Hãy thêm ở form bên cạnh.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex-between mb-4">
              <h2>Báo giá đáy từ thành viên</h2>
              <button className="btn" onClick={loadReports}>🔄 Làm mới</button>
            </div>
            
            <div className="glass-card">
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Sản phẩm & Phân loại</th>
                      <th>Giá báo cáo</th>
                      <th>Minh chứng</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottomPriceReports.map(report => (
                      <tr key={report.id}>
                        <td>{report.profiles?.full_name}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{report.products?.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {Object.entries(report.variant_combination).map(([k,v]) => `${k}: ${v}`).join(' | ')}
                          </div>
                        </td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{report.reported_price.toLocaleString('vi-VN')} đ</td>
                        <td>
                          {report.screenshot_url ? (
                            <a href={report.screenshot_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>Xem ảnh</a>
                          ) : 'Không có'}
                        </td>
                        <td>
                          <span className="badge" style={{ 
                            background: report.status === 'pending' ? 'rgba(234, 179, 8, 0.1)' : report.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: report.status === 'pending' ? '#eab308' : report.status === 'approved' ? '#22c55e' : '#ef4444'
                          }}>
                            {report.status === 'pending' ? 'Chờ duyệt' : report.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {report.status === 'pending' && (
                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.85rem', background: 'var(--accent-green)', color: 'white', border: 'none' }} onClick={async () => {
                                if (!window.confirm('Duyệt giá đáy này?')) return;
                                const success = await updateReportStatus(report.id, 'approved');
                                if (success) {
                                  alert('Đã duyệt!');
                                  loadReports();
                                }
                              }}>Duyệt</button>
                              <button className="delete-btn" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={async () => {
                                if (!window.confirm('Từ chối báo cáo này?')) return;
                                const success = await updateReportStatus(report.id, 'rejected');
                                if (success) loadReports();
                              }}>Từ chối</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bottomPriceReports.length === 0 && <tr><td colSpan={6} className="text-center p-4 text-muted">Chưa có báo cáo nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;

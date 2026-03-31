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
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard'|'products'|'reviewers'|'salePosts'|'users'|'settings'|'reports'>('dashboard');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [salePosts, setSalePosts] = useState<SalePost[]>([]);
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [bottomPriceReports, setBottomPriceReports] = useState<BottomPriceReport[]>([]);

  // Editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewWithProduct | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null);
  const [isEditingReviewer, setIsEditingReviewer] = useState(false);

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addProduct(newProduct as Omit<Product, 'id' | 'reviewCount'>);
    if (result) {
      alert('Đã thêm sản phẩm thành công!');
      loadProducts();
      setNewProduct({ name: '', imageUrl: '', bottomPrice: '', rating: 5, category: 'phone', shops: [{ name: 'Shopee', url: '' }] });
      setIsEditingProduct(false);
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
    
    // Ensure numeric types
    const updates = {
      ...editingProduct,
      bottomPrice: Number(editingProduct.bottomPrice),
      rating: Number(editingProduct.rating)
    };
    
    const { id, reviews: _revs, reviewCount: _rc, topReview: _tr, ...cleanUpdates } = updates as any;
    const success = await updateProduct(id, cleanUpdates);
    if (success) {
      alert('Cập nhật thành công!');
      setEditingProduct(null);
      setIsEditingProduct(false);
      loadProducts();
    } else alert('Lỗi khi cập nhật sản phẩm.');
  };

  const generateVariantCombinations = (attributes: any[]) => {
    if (!attributes || attributes.length === 0) return [];
    
    let combinations: any[] = [{}];
    
    attributes.forEach(attr => {
      const newCombinations: any[] = [];
      attr.options.forEach((opt: string) => {
        combinations.forEach(comb => {
          newCombinations.push({ ...comb, [attr.name]: opt });
        });
      });
      combinations = newCombinations;
    });
    
    return combinations;
  };

  const handleSyncVariantPrices = () => {
    if (!editingProduct) return;
    const attrs = editingProduct.variants?.attributes || [];
    if (attrs.length === 0) {
      alert('Vui lòng thêm ít nhất một tiêu chí phân loại trước.');
      return;
    }

    const combinations = generateVariantCombinations(attrs);
    const existingPrices = editingProduct.variants?.variantPrices || [];
    
    const newVariantPrices = combinations.map(comb => {
      const existing = existingPrices.find((vp: any) => 
        Object.keys(comb).every(k => comb[k] === vp.combination[k]) &&
        Object.keys(vp.combination).every(k => comb[k] === vp.combination[k])
      );
      return existing || { combination: comb, bottomPrice: 0 };
    });

    setEditingProduct({
      ...editingProduct,
      variants: {
        ...(editingProduct.variants || { attributes: [] }),
        variantPrices: newVariantPrices
      }
    });
  };

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

  const handleAddReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addReviewer(newReviewer as Omit<Reviewer, 'id' | 'created_at'>);
    if (result) {
      alert('Thêm Reviewer thành công!');
      loadReviewers();
      setNewReviewer({ name: '', avatar_url: '', facebook_url: '', youtube_url: '' });
      setIsEditingReviewer(false);
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
      setIsEditingReviewer(false);
      loadReviewers();
    } else alert('Lỗi khi cập nhật Reviewer.');
  };

  const handleDeleteReviewer = async (id: string) => {
    if (!window.confirm('Xoá Reviewer này? Lưu ý: Các thẻ review đã có sẽ không mất người đăng, nhưng sẽ mất profile liên kết nếu cập nhật mới.')) return;
    const success = await deleteReviewer(id);
    if (success) loadReviewers();
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Xóa bài đăng này vĩnh viễn?')) return;
    const success = await deletePostApi(id);
    if (success) loadSalePosts();
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const { id, created_at, ...updates } = editingUser;
    const success = await updateUser(id, updates);
    if (success) {
      alert('Cập nhật thành viên thành công!');
      setEditingUser(null);
      setIsEditingUser(false);
      loadUsers();
    } else alert('Lỗi khi cập nhật.');
  };

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

  const handleRemoveBannerItem = (id: string) => {
    if(!window.confirm('Xóa thông báo này không? Lưu ý: Bạn cần phải ấn LƯU CẤU HÌNH để thực sự xóa nó trên hệ thống.')) return;
    setBannerConfig({ ...bannerConfig, items: bannerConfig.items.filter(it => it.id !== id) });
  };

  if (!session) {
    return (
      <div className="admin-login-container min-h-screen flex-center bg-deep">
        <div className="admin-card p-4 modal-content">
          <h2 className="text-center mb-8 font-bold">TechHub <span className="text-gradient">Admin</span></h2>
          <form onSubmit={handleLogin} className="flex-column gap-4">
            <div className="input-group flex-column gap-2">
              <label className="text-sm font-semibold text-secondary">EMAIL QUẢN TRỊ</label>
              <input type="email" placeholder="admin@techhub.ai" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" />
            </div>
            <div className="input-group flex-column gap-2">
              <label className="text-sm font-semibold text-secondary">MẬT KHẨU</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" />
            </div>
            <button type="submit" className="btn-primary mt-2 w-full p-4" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Hệ Thống'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="text-gradient">TechHub Panel</h2>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('dashboard'); setSelectedProductForReviews(null); }}
          >
            📊 <span>Thống kê</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'products' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('products'); setSelectedProductForReviews(null); }}
          >
            📱 <span>Sản phẩm</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'reviewers' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('reviewers'); setSelectedProductForReviews(null); }}
          >
            ⭐ <span>Reviewers</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'salePosts' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('salePosts'); setSelectedProductForReviews(null); }}
          >
            🔥 <span>Tin Săn Sale</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('users'); setSelectedProductForReviews(null); }}
          >
            👥 <span>Thành viên</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('reports'); setSelectedProductForReviews(null); }}
          >
            🚩 <span>Báo giá đáy</span>
          </button>
          
          <div className="sidebar-divider"></div>
          
          <button 
            className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('settings'); setSelectedProductForReviews(null); }}
          >
            ⚙️ <span>Banner & Thông báo</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => supabase.auth.signOut()} className="btn-admin btn-admin-danger w-100">
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="admin-content">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && !selectedProductForReviews && (
          <div className="animate-fade-in">
            <header className="admin-header">
              <h2>Thống kê tổng quan</h2>
              <p className="text-secondary">Dưới đây là tóm tắt dữ liệu hệ thống hiện tại.</p>
            </header>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value text-gradient">{products.length}</div>
                <div className="stat-label">Sản phẩm</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-gradient tertiary">{reviews.length}</div>
                <div className="stat-label">Đánh giá</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-gradient secondary">{salePosts.length}</div>
                <div className="stat-label">Tin săn sale</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-gradient quinary">{users.length}</div>
                <div className="stat-label">Thành viên</div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && !selectedProductForReviews && (
          <div className="animate-fade-in">
            <header className="admin-header flex-between">
              <div>
                <h2>Danh sách Sản phẩm</h2>
                <p className="text-secondary">Quản lý kho hàng và thông tin chi tiết từng sản phẩm.</p>
              </div>
              <button className="btn-admin btn-admin-primary" onClick={() => { setEditingProduct(null); setIsEditingProduct(true); }}>
                + Thêm sản phẩm
              </button>
            </header>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Cập nhật</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => 
                    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) &&
                    (filterCategory === 'all' || p.category === filterCategory)
                  ).map(p => (
                    <tr key={p.id}>
                      <td>
                        <img src={p.imageUrl} alt={p.name} className="admin-thumb" />
                      </td>
                      <td>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-secondary text-sm">{p.bottomPrice.toLocaleString('vi-VN')}đ</div>
                      </td>
                      <td>{CATEGORIES.find(c => c.id === p.category)?.label || p.category}</td>
                      <td>{p.bottomPriceTime || 'N/A'}</td>
                      <td>
                        <div className="flex-center gap-2 flex-end">
                          <button className="btn-admin btn-admin-secondary" onClick={() => setSelectedProductForReviews(p)}>⭐ Reviews</button>
                          <button className="btn-admin btn-admin-secondary" onClick={() => { setEditingProduct(p); setIsEditingProduct(true); }}>Sửa</button>
                          <button className="btn-admin btn-admin-danger" onClick={() => handleDeleteProduct(p.id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS FOR PRODUCT */}
        {selectedProductForReviews && (
          <div className="animate-fade-in">
            <header className="admin-header flex-between">
              <div>
                <h2>⭐ Đánh giá: {selectedProductForReviews.name}</h2>
                <p className="text-secondary">Quản lý các nhận xét từ Reviewers và người dùng cho sản phẩm này.</p>
              </div>
              <button className="btn-admin btn-admin-secondary" onClick={() => setSelectedProductForReviews(null)}>
                ← Quay lại
              </button>
            </header>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tác giả</th>
                    <th>Loại</th>
                    <th>Nội dung</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.filter(r => r.product_id === selectedProductForReviews.id).map(r => (
                    <tr key={r.id}>
                      <td>{r.author}</td>
                      <td>
                        <span className={`admin-badge badge-${r.type}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="text-secondary">
                        <div className="text-truncate max-w-300">{r.content}</div>
                      </td>
                      <td>
                        <div className="flex-center gap-2 flex-end">
                          <button className="btn-admin btn-admin-danger" onClick={() => handleDeleteReview(r.id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWERS TAB */}
        {activeTab === 'reviewers' && (
          <div className="animate-fade-in">
            <header className="admin-header flex-between">
              <div>
                <h2>👥 Quản lý Reviewers</h2>
                <p className="text-secondary">Quản lý danh sách các KOLs / Reviewers tham gia hệ thống.</p>
              </div>
              <button className="btn-admin btn-admin-primary" onClick={() => { setEditingReviewer(null); setIsEditingReviewer(true); }}>
                + Thêm Reviewer
              </button>
            </header>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Tên</th>
                    <th>Socials</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewers.map(r => (
                    <tr key={r.id}>
                      <td>
                        <img src={r.avatar_url || 'https://via.placeholder.com/40'} alt={r.name} className="admin-avatar" />
                      </td>
                      <td>{r.name}</td>
                      <td>
                        <div className="flex-center gap-2 flex-start">
                          {r.facebook_url && <span className="text-blue">FB</span>}
                          {r.youtube_url && <span className="text-red">YT</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex-center gap-2 flex-end">
                          <button className="btn-admin btn-admin-secondary" onClick={() => { setEditingReviewer(r); setIsEditingReviewer(true); }}>Sửa</button>
                          <button className="btn-admin btn-admin-danger" onClick={() => handleDeleteReviewer(r.id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SALE POSTS TAB */}
        {activeTab === 'salePosts' && (
          <div className="animate-fade-in">
            <header className="admin-header flex-between">
              <div>
                <h2>🔥 Tin Săn Sale</h2>
                <p className="text-secondary">Duyệt và kiểm soát các tin đăng từ người dùng.</p>
              </div>
            </header>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Người đăng</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {salePosts.map(post => (
                    <tr key={post.id}>
                      <td>{products.find(p => p.id === post.product_id)?.name || 'Sản phẩm'}</td>
                      <td>{users.find(u => u.id === post.user_id)?.full_name || 'Người dùng'}</td>
                      <td className="font-bold text-green">{post.target_price?.toLocaleString('vi-VN')}đ</td>
                      <td>
                        <span className={`admin-badge badge-${post.status === 'open' ? 'open' : post.status === 'matched' ? 'matched' : 'closed'}`}>
                          {post.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex-center gap-2 flex-end">
                          <button className="btn-admin btn-admin-danger" onClick={() => handleDeletePost(post.id)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <header className="admin-header">
              <h2>👤 Thành viên</h2>
              <p className="text-secondary">Quản lý người dùng và điểm uy tín.</p>
            </header>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Tham gia</th>
                    <th>Uy tín</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex-center flex-start gap-3">
                          <img src={u.avatar_url || 'https://via.placeholder.com/40'} alt={u.full_name} className="admin-avatar-sm" />
                          {u.full_name}
                        </div>
                      </td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td>⭐ {u.reputation_score || 0}</td>
                      <td>
                        <div className="flex-center gap-2 flex-end">
                          <button className="btn-admin btn-admin-secondary" onClick={() => { setEditingUser(u); setIsEditingUser(true); }}>Sửa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in">
            <header className="admin-header flex-between">
              <div>
                <h2>🚩 Báo giá đáy</h2>
                <p className="text-secondary">Các báo cáo giá rẻ từ cộng đồng chờ xác thực.</p>
              </div>
              <button className="btn-admin btn-admin-secondary" onClick={loadReports}>🔄 Refresh</button>
            </header>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Người báo</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomPriceReports.map(report => (
                    <tr key={report.id}>
                      <td>{report.products?.name}</td>
                      <td>{report.profiles?.full_name}</td>
                      <td className="text-green font-bold">{report.reported_price.toLocaleString('vi-VN')}đ</td>
                      <td>
                        <span className={`admin-badge badge-${report.status}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex-center gap-2 flex-end">
                          {report.status === 'pending' && (
                            <button className="btn-admin btn-admin-success" onClick={async () => {
                               if (window.confirm('Duyệt báo cáo này?')) {
                                 await updateReportStatus(report.id, 'approved');
                                 loadReports();
                               }
                            }}>Duyệt</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <header className="admin-header flex-between">
              <div>
                <h2>⚙️ Banner & Thông báo</h2>
                <p className="text-secondary">Cài đặt banner khuyến mãi và thông báo toàn trang.</p>
              </div>
              <button className="btn-admin btn-admin-primary" onClick={handleUpdateBannerSubmit}>
                💾 Lưu tất cả
              </button>
            </header>

            <div className="stats-grid grid-settings">
              <div className="admin-card">
                <h3>Trạng thái Banner</h3>
                <label className="flex-center gap-4 flex-start cursor-pointer">
                  <input title="Bật/Tắt Banner" type="checkbox" checked={bannerConfig.enabled} onChange={e => setBannerConfig({...bannerConfig, enabled: e.target.checked})} className="input-checkbox" />
                  <span className="font-bold text-lg">{bannerConfig.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</span>
                </label>
              </div>

              <div className="admin-card">
                <h3>Danh sách Banner ({bannerConfig.items.length})</h3>
                <div className="flex-column gap-3 mt-4">
                  {bannerConfig.items.map(item => (
                    <div key={item.id} className="admin-card-inner">
                       <div className="flex-between">
                         <div className="text-sm" dangerouslySetInnerHTML={{ __html: item.text }} />
                         <button className="btn-admin btn-admin-danger btn-sm" onClick={() => handleRemoveBannerItem(item.id)}>Xóa</button>
                       </div>
                    </div>
                  ))}
                  <button className="btn-admin btn-admin-primary mt-2" onClick={() => setEditingBannerItem({ id: '', isActive: true, text: '', link: '', imageUrl: '' })}>
                    + Thêm banner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* OVERLAY MODALS FOR EDITING */}
      {(isEditingProduct || isEditingReviewer || isEditingUser) && (
        <div className="modal-overlay" onClick={() => {
            setIsEditingProduct(false);
            setIsEditingReviewer(false);
            setIsEditingUser(false);
            setEditingBannerItem({ id: '', isActive: true, text: '', link: '', imageUrl: '' });
          }}>
          <div className="admin-card modal-content" onClick={e => e.stopPropagation()}>
             <h3>{isEditingProduct ? (editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm') : isEditingReviewer ? 'Quản lý Reviewer' : 'Quản lý Thành Viên'}</h3>
             <p className="text-secondary mb-4">Vui lòng nhập đầy đủ thông tin bên dưới.</p>
             
             <div className="flex-column gap-4">
                {isEditingProduct && (
                  <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="flex-column gap-4">
                    <div className="grid-settings gap-3">
                      <div className="input-group flex-column gap-2">
                        <label className="text-sm font-semibold text-secondary">TÊN SẢN PHẨM</label>
                        <input className="input-field" placeholder="iPhone 15 Pro Max" value={editingProduct?.name || newProduct.name} onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} required />
                      </div>
                      <div className="input-group flex-column gap-2">
                        <label className="text-sm font-semibold text-secondary">CATEGORIES</label>
                        <select className="input-field" value={editingProduct?.category || newProduct.category} onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})}>
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid-settings gap-3">
                      <div className="input-group flex-column gap-2">
                        <label className="text-sm font-semibold text-secondary">URL HÌNH ẢNH</label>
                        <input className="input-field" placeholder="https://..." value={editingProduct?.imageUrl || newProduct.imageUrl} onChange={e => editingProduct ? setEditingProduct({...editingProduct, imageUrl: e.target.value}) : setNewProduct({...newProduct, imageUrl: e.target.value})} required />
                      </div>
                      <div className="input-group flex-column gap-2">
                        <label className="text-sm font-semibold text-secondary">GIÁ ĐÁY (ĐỊNH MỨC)</label>
                        <input className="input-field" type="number" placeholder="20000000" value={editingProduct?.bottomPrice || newProduct.bottomPrice} onChange={e => editingProduct ? setEditingProduct({...editingProduct, bottomPrice: e.target.value}) : setNewProduct({...newProduct, bottomPrice: e.target.value})} />
                      </div>
                    </div>

                    <div className="admin-card-inner">
                      <div className="flex-between mb-2">
                        <label className="text-sm font-semibold text-secondary">CÁC SHOP ĐANG BÁN</label>
                        <button type="button" className="btn-admin btn-admin-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => {
                          const currentShops = editingProduct ? [...(editingProduct.shops || [])] : [...(newProduct.shops || [])];
                          currentShops.push({ name: 'Shopee', url: '' });
                          editingProduct ? setEditingProduct({...editingProduct, shops: currentShops}) : setNewProduct({...newProduct, shops: currentShops});
                        }}>+ Thêm shop</button>
                      </div>
                      <div className="flex-column gap-2">
                        {(editingProduct?.shops || newProduct.shops || []).map((shop, idx) => (
                          <div key={idx} className="flex-center gap-2">
                            <input className="input-field" style={{ flex: 1 }} placeholder="Tên Shop" value={shop.name} onChange={e => {
                               const currentShops = editingProduct ? [...(editingProduct.shops || [])] : [...(newProduct.shops || [])];
                               currentShops[idx].name = e.target.value;
                               editingProduct ? setEditingProduct({...editingProduct, shops: currentShops}) : setNewProduct({...newProduct, shops: currentShops});
                            }} />
                            <input className="input-field" style={{ flex: 2 }} placeholder="URL Shop" value={shop.url} onChange={e => {
                               const currentShops = editingProduct ? [...(editingProduct.shops || [])] : [...(newProduct.shops || [])];
                               currentShops[idx].url = e.target.value;
                               editingProduct ? setEditingProduct({...editingProduct, shops: currentShops}) : setNewProduct({...newProduct, shops: currentShops});
                            }} />
                            <button type="button" className="btn-admin btn-admin-danger" style={{ padding: '8px' }} onClick={() => {
                               const currentShops = (editingProduct ? editingProduct.shops : newProduct.shops || []).filter((_, i) => i !== idx);
                               editingProduct ? setEditingProduct({...editingProduct, shops: currentShops}) : setNewProduct({...newProduct, shops: currentShops});
                            }}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Variant Section */}
                    {editingProduct && (
                      <div className="admin-card-inner">
                        <div className="flex-between mb-3">
                           <h4 className="text-secondary text-sm font-bold m-0">📍 QUẢN LÝ PHIÊN BẢN (VARIANTS)</h4>
                           <button type="button" className="btn-admin btn-admin-primary btn-sm" onClick={handleSyncVariantPrices}>
                             🔄 Cập nhật danh sách biến thể
                           </button>
                        </div>
                        
                        {/* Attributes Editor */}
                        <div className="flex-column gap-3 mb-4">
                          {(editingProduct.variants?.attributes || []).map((attr, attrIdx) => (
                            <div key={attrIdx} className="p-3 rounded bg-deep border-glass">
                               <div className="flex-between mb-2">
                                  <input className="input-field font-bold w-auto" placeholder="Tên loại" value={attr.name} onChange={e => {
                                     const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                     newAttrs[attrIdx].name = e.target.value;
                                     setEditingProduct({...editingProduct, variants: {...editingProduct.variants!, attributes: newAttrs }});
                                  }} />
                                  <button type="button" className="btn-admin btn-admin-danger" style={{ padding: '4px 8px' }} onClick={() => {
                                     const newAttrs = editingProduct.variants?.attributes?.filter((_, i) => i !== attrIdx);
                                     setEditingProduct({...editingProduct, variants: {...editingProduct.variants!, attributes: newAttrs || [] }});
                                  }}>Xóa</button>
                               </div>
                               <div className="flex-center gap-2 flex-wrap" style={{ justifyContent: 'flex-start' }}>
                                 {attr.options.map((opt, optIdx) => (
                                   <div key={optIdx} className="admin-badge flex-center gap-2">
                                      <input className="input-field-inline w-fit" value={opt} onChange={e => {
                                         const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                         newAttrs[attrIdx].options[optIdx] = e.target.value;
                                         setEditingProduct({...editingProduct, variants: {...editingProduct.variants!, attributes: newAttrs }});
                                      }} />
                                      <span className="cursor-pointer opacity-60" onClick={() => {
                                         const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                         newAttrs[attrIdx].options = newAttrs[attrIdx].options.filter((_, i) => i !== optIdx);
                                         setEditingProduct({...editingProduct, variants: {...editingProduct.variants!, attributes: newAttrs }});
                                      }}>×</span>
                                   </div>
                                 ))}
                                 <button type="button" className="btn-admin btn-admin-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => {
                                    const newAttrs = [...(editingProduct.variants?.attributes || [])];
                                    newAttrs[attrIdx].options.push('Mới');
                                    setEditingProduct({...editingProduct, variants: {...editingProduct.variants!, attributes: newAttrs }});
                                 }}>+ Lựa chọn</button>
                               </div>
                            </div>
                          ))}
                          <button type="button" className="btn-admin btn-admin-secondary" onClick={() => {
                             const currentVariants = editingProduct.variants || { attributes: [], variantPrices: [] };
                             setEditingProduct({...editingProduct, variants: { ...currentVariants, attributes: [...currentVariants.attributes, { name: 'Phân loại mới', options: [] }] }});
                          }}>+ Thêm tiêu chí phân loại</button>
                        </div>

                        {/* Prices Editor */}
                        {editingProduct.variants?.variantPrices && editingProduct.variants.variantPrices.length > 0 && (
                          <div className="variant-prices-list mt-4">
                            <div className="flex-between mb-2">
                               <h5 className="text-secondary text-xs font-bold uppercase">Giá đáy từng biến thể</h5>
                               <button type="button" className="btn-admin btn-admin-secondary btn-sm" style={{fontSize: '0.7rem'}} onClick={() => {
                                  const prices = (editingProduct.variants?.variantPrices || []).map(vp => Number(vp.bottomPrice)).filter(p => !isNaN(p) && p > 0);
                                  if (prices.length > 0) {
                                    const minPrice = Math.min(...prices);
                                    setEditingProduct({...editingProduct, bottomPrice: minPrice});
                                  }
                               }}>Lấy giá thấp nhất làm giá đáy chính</button>
                            </div>
                            <div className="flex-column gap-2">
                              {editingProduct.variants.variantPrices.map((vp, vpIdx) => (
                                <div key={vpIdx} className="variant-price-row flex-between p-2 rounded bg-deep-light">
                                  <div className="variant-label text-sm">
                                    {Object.entries(vp.combination).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                                  </div>
                                  <div className="flex-center gap-2">
                                    <input 
                                      type="number" 
                                      className="input-field input-field-sm w-120" 
                                      placeholder="Giá đáy"
                                      value={vp.bottomPrice || ''} 
                                      onChange={e => {
                                        const newPrices = [...(editingProduct.variants?.variantPrices || [])];
                                        newPrices[vpIdx].bottomPrice = Number(e.target.value);
                                        setEditingProduct({...editingProduct, variants: {...editingProduct.variants!, variantPrices: newPrices }});
                                      }}
                                    />
                                    <span className="text-xs text-secondary">đ</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-center gap-3 mt-2">
                      <button type="submit" className="btn-admin btn-admin-primary flex-1">Lưu Sản Phẩm</button>
                      <button type="button" className="btn-admin btn-admin-secondary" onClick={() => setIsEditingProduct(false)}>Hủy</button>
                    </div>
                  </form>
                )}
                
                {isEditingReviewer && (
                  <form onSubmit={editingReviewer ? handleUpdateReviewerSubmit : handleAddReviewer} className="flex-column gap-4">
                    <div className="input-group flex-column gap-2">
                       <label className="text-sm font-semibold text-secondary">TÊN REVIEWER</label>
                       <input className="input-field" placeholder="VD: Duy Luân Dễ Thương" value={editingReviewer?.name || newReviewer.name} onChange={e => editingReviewer ? setEditingReviewer({...editingReviewer, name: e.target.value}) : setNewReviewer({...newReviewer, name: e.target.value})} required />
                    </div>
                    <div className="input-group flex-column gap-2">
                       <label className="text-sm font-semibold text-secondary">AVATAR URL</label>
                       <input className="input-field" placeholder="https://..." value={editingReviewer?.avatar_url || newReviewer.avatar_url} onChange={e => editingReviewer ? setEditingReviewer({...editingReviewer, avatar_url: e.target.value}) : setNewReviewer({...newReviewer, avatar_url: e.target.value})} />
                    </div>
                    <div className="grid-settings gap-3">
                        <div className="input-group flex-column gap-2">
                          <label className="text-sm font-semibold text-secondary">FACEBOOK URL</label>
                          <input className="input-field" placeholder="facebook.com/..." value={editingReviewer?.facebook_url || newReviewer.facebook_url} onChange={e => editingReviewer ? setEditingReviewer({...editingReviewer, facebook_url: e.target.value}) : setNewReviewer({...newReviewer, facebook_url: e.target.value})} />
                        </div>
                        <div className="input-group flex-column gap-2">
                          <label className="text-sm font-semibold text-secondary">YOUTUBE URL</label>
                          <input className="input-field" placeholder="youtube.com/@..." value={editingReviewer?.youtube_url || newReviewer.youtube_url} onChange={e => editingReviewer ? setEditingReviewer({...editingReviewer, youtube_url: e.target.value}) : setNewReviewer({...newReviewer, youtube_url: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex-center gap-3 mt-2">
                      <button type="submit" className="btn-admin btn-admin-primary flex-1">Lưu Reviewer</button>
                      <button type="button" className="btn-admin btn-admin-secondary" onClick={() => setIsEditingReviewer(false)}>Hủy</button>
                    </div>
                  </form>
                )}

                {isEditingUser && editingUser && (
                  <form onSubmit={handleUpdateUserSubmit} className="flex-column gap-3">
                    <input className="input-field" placeholder="Tên hiển thị" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} required />
                    <input className="input-field" type="number" placeholder="Điểm uy tín" value={editingUser.reputation_score || 0} onChange={e => setEditingUser({...editingUser, reputation_score: parseInt(e.target.value)})} />
                    <div className="flex-center gap-3">
                      <button type="submit" className="btn-admin btn-admin-primary flex-1">Lưu</button>
                      <button type="button" className="btn-admin btn-admin-secondary" onClick={() => setIsEditingUser(false)}>Hủy</button>
                    </div>
                  </form>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

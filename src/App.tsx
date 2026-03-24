import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import AuthPage from './components/AuthPage';
import SaleHunting from './components/SaleHunting';
import Profile from './components/Profile';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import NewsFeed from './components/NewsFeed';
import AdminPanel from './components/AdminPanel';
import CategoryTabs from './components/CategoryTabs';
import NotificationBanner from './components/NotificationBanner';
import './App.css';

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const navigate = useNavigate();

  return (
    <main className="container-width flex-column gap-8 mt-8 mb-8">
      {/* Sale Hunting Banner */}
      <div className="premium-card flex-between" style={{cursor: 'pointer'}} onClick={() => navigate('/sale-hunting')}>
        <div>
          <h2 className="text-gradient" style={{fontSize: '2rem', marginBottom: 8}}>🎯 Bắt Kèo Săn Sale</h2>
          <p className="text-secondary">Cộng đồng săn sale chuyên nghiệp. Nhờ săn hộ - Đi săn hộ - Pass kèo thơm.</p>
        </div>
        <button className="btn btn-primary">Khám phá ngay</button>
      </div>

      <section className="flex-column gap-6">
        <CategoryTabs 
          activeCategory={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        <ProductGrid category={selectedCategory} />
      </section>

      <section className="premium-card flex-column gap-6 mt-4">
        <div>
          <h2>🗞️ Tin tức công nghệ mới nhất</h2>
          <p className="text-muted mt-2">Cập nhật mới nhất từ các trang báo</p>
        </div>
        <NewsFeed />
      </section>
    </main>
  );
}

function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="container-width flex-between header-content">
        <Link to="/" className="logo-link">
          TechHub <span className="text-gradient">AI</span>
        </Link>
        <nav className="nav-links">
          <Link to="/sale-hunting" className="nav-link">Săn Sale</Link>
        </nav>
        {user ? (
          <div className="user-nav">
            <span className="btn btn-ghost" onClick={() => navigate('/profile')}>
              <span className="hide-on-mobile">{profile?.full_name || user.email}</span>
              <span className="badge badge-neutral" style={{marginLeft: 8}}>★ {profile?.reputation_score || 0}</span>
            </span>
            <button onClick={signOut} className="btn btn-secondary hide-on-mobile">Đăng xuất</button>
            <button onClick={signOut} className="btn btn-secondary show-on-mobile" style={{padding: '8px'}} title="Đăng xuất">🚪</button>
          </div>
        ) : (
          <div className="user-nav">
            <Link to="/auth" className="btn btn-primary">Đăng Nhập</Link>
          </div>
        )}
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header />
          <NotificationBanner />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/sale-hunting/*" element={<SaleHunting />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>

        <footer className="app-footer">
          <div className="container-width flex-column flex-center gap-2">
            <p>&copy; 2026 TechHub AI - Cải tiến liên tục vì cộng đồng</p>
            <Link to="/admin" className="nav-link" style={{fontSize: '0.8rem'}}>Quản trị hệ thống</Link>
          </div>
        </footer>
      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

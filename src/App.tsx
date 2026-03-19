import { useState } from 'react';
import NewsFeed from './components/NewsFeed';
import ProductGrid from './components/ProductGrid';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'news' | 'products' | 'admin'>('news');

  return (
    <div className="app-container">
      <header className="header">
        <div className="container header-content">
          <h1 className="logo gradient-text">TechHub AI</h1>
          <nav className="nav">
            <button 
              className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => setActiveTab('news')}
            >
              Tin Tức
            </button>
            <button 
              className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Đánh Giá Sản Phẩm
            </button>
            <button 
              className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        {activeTab === 'news' && (
          <section className="news-section">
            <div className="section-header">
              <h2>Tin Công Nghệ Mới Nhất</h2>
              <p>AI tự động tóm tắt từ các nguồn uy tín</p>
            </div>
            <NewsFeed />
          </section>
        )}
        
        {activeTab === 'products' && (
          <section className="product-section">
            <div className="section-header">
              <h2>Review & Giá Đáy</h2>
              <p>Tổng hợp đánh giá và theo dõi giá tốt nhất</p>
            </div>
            <ProductGrid />
          </section>
        )}

        {activeTab === 'admin' && (
          <section className="admin-section">
            <AdminPanel />
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 TechHub AI. Powered by Advanced Agentic AI.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

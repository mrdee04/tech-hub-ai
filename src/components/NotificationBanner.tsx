import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NotificationBanner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        position: 'sticky', 
        top: '72px', 
        zIndex: 40,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        padding: '16px 0'
      }}
    >
      <div className="container-width animate-fade-in">
        <div 
          className="premium-card flex-between" 
          style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)' }} 
          onClick={() => navigate('/sale-hunting')}
        >
          <div>
            <h2 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🎯 Bắt Kèo Săn Sale</h2>
            <p className="text-secondary" style={{ fontSize: '1rem' }}>Cộng đồng săn sale chuyên nghiệp. Đăng tin bắt kèo, khớp kèo với nhau để săn đáy kỷ lục.</p>
          </div>
          <button className="btn btn-primary">Khám phá ngay</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;

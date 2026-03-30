import React, { useEffect, useState } from 'react';
import { fetchGlobalBanner, type BannerItem } from '../services/settingsService';
import { useLocation } from 'react-router-dom';

const NotificationBanner: React.FC = () => {
  const [activeItems, setActiveItems] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const getBanner = async () => {
      const data = await fetchGlobalBanner();
      if (data && data.enabled && data.items && data.items.length > 0) {
        setActiveItems(data.items.filter(item => item.isActive));
      } else {
        setActiveItems([]);
      }
    };
    getBanner();
  }, []);

  useEffect(() => {
    if (activeItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeItems.length);
    }, 4500); // Chuyển banner sau 4.5s
    return () => clearInterval(interval);
  }, [activeItems.length]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setCurrentIndex(prev => (prev + 1) % activeItems.length);
    } else if (isRightSwipe) {
      setCurrentIndex(prev => (prev - 1 + activeItems.length) % activeItems.length);
    }
  };

  const location = useLocation();

  if (activeItems.length === 0 || location.pathname.startsWith('/admin')) {
    return null;
  }

  const currentBanner = activeItems[currentIndex];

  const bannerContent = (
    <div 
      className="container-width animate-fade-in" 
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '32px',
        padding: '32px 20px',
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* Left Part: Full Visibility Alert (Fixed Dimensions) */}
      <div 
        key={currentBanner.id} 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '500px',
          background: 'var(--bg-glass)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
          cursor: 'default',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Unified Telegram Content Area (Scrollable) */}
        <div style={{
          flex: 1,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          background: 'rgba(20, 20, 20, 0.4)',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--accent-primary) transparent'
        }}>
          <div style={{
            borderLeft: '4px solid var(--accent-primary)',
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '0 12px 12px 0',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Header */}
            <div style={{ 
              color: 'var(--accent-primary)', 
              fontWeight: 800, 
              fontSize: '0.9rem', 
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span> TechHub Alert
            </div>

            {/* Content: Image then Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentBanner.imageUrl && (
                <div 
                  onClick={() => currentBanner.link && window.open(currentBanner.link, '_blank')}
                  style={{ 
                    width: '100%', 
                    cursor: currentBanner.link ? 'pointer' : 'default',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    justifyContent: 'center',
                    minHeight: '100px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <img 
                    src={currentBanner.imageUrl} 
                    alt="Promotion" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '320px', 
                      objectFit: 'contain',
                      transition: 'transform 0.4s ease',
                      display: 'block'
                    }} 
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ 
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: 'white',
                  lineHeight: '1.4'
                }}>
                  {currentBanner.text.split('\n')[0]}
                </div>
                <div 
                  style={{ 
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }} 
                  dangerouslySetInnerHTML={{ __html: currentBanner.text.includes('\n') ? currentBanner.text.split('\n').slice(1).join('<br/>') : '' }}
                />
              </div>

              {currentBanner.link && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentBanner.link, '_blank');
                  }}
                  style={{ 
                    fontSize: '0.9rem', 
                    color: '#3b82f6', 
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    display: 'block',
                    fontWeight: 600
                  }}
                >
                  Link: {currentBanner.link}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Indicators (Top Corner) */}
        {activeItems.length > 1 && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 12px',
            borderRadius: '20px',
            backdropFilter: 'blur(8px)'
          }}>
            {activeItems.map((_, idx) => (
              <div key={idx} style={{
                width: idx === currentIndex ? '24px' : '8px', 
                height: '8px', 
                borderRadius: '4px', 
                background: idx === currentIndex ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease'
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* Right Part: Đăng Tin Bắt Kèo (Matching Dimensions) */}
      <div 
        onClick={() => window.location.href = '/sale-hunting/create'}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '500px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          cursor: 'pointer',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.3)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          textAlign: 'center',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-10px)';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border-glass)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        }}
      >
        <div style={{ 
          fontSize: '7rem', 
          filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.4))',
          animation: 'bounce 2.5s infinite'
        }}>🚀</div>
        <div>
          <div style={{ fontWeight: 950, fontSize: '2.2rem', color: 'white', marginBottom: '12px' }}>Tạo kèo ngay</div>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '350px', lineHeight: '1.7', opacity: 0.8 }}>
            Bạn thấy deal hời? Chia sẻ ngay với cộng đồng TechHub hoặc nhờ săn hộ sản phẩm cực phẩm
          </p>
        </div>
        <div style={{
          background: 'var(--accent-gradient)',
          color: 'white',
          padding: '20px 48px',
          borderRadius: '20px',
          fontSize: '1.25rem',
          fontWeight: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '0 12px 32px rgba(139, 92, 246, 0.6)',
          width: '90%',
          marginTop: '8px'
        }}>
          ĐĂNG TIN BẮT KÈO 📝
        </div>
      </div>
    </div>
  );

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
      }}
    >
      {bannerContent}
    </div>
  );
};

export default NotificationBanner;

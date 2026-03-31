import React, { useEffect, useState } from 'react';
import { fetchGlobalBanner, type BannerItem } from '../services/settingsService';
import { useLocation } from 'react-router-dom';
import './NotificationBanner.css';

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
    <div className="banner-container container-width animate-fade-in">
      {/* Left Part: Full Visibility Alert (Fixed Dimensions) */}
      <div 
        key={currentBanner.id} 
        className="banner-card"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Unified Telegram Content Area (Scrollable) */}
        <div className="banner-content-scroll">
          <div className="banner-alert-box">
            {/* Header */}
            <div className="banner-header">
              <span>🤖</span> TechHub Alert
            </div>

            {/* Content: Image then Text */}
            <div className="flex-column gap-4">
              {currentBanner.imageUrl && (
                <div 
                  onClick={() => currentBanner.link && window.open(currentBanner.link, '_blank')}
                  className={`banner-image-container ${currentBanner.link ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <img 
                    src={currentBanner.imageUrl} 
                    alt="Promotion" 
                  />
                </div>
              )}

              <div className="banner-text-content">
                <div className="banner-title">
                  {currentBanner.text.split('\n')[0]}
                </div>
                <div 
                  className="banner-description" 
                  dangerouslySetInnerHTML={{ __html: currentBanner.text.includes('\n') ? currentBanner.text.split('\n').slice(1).join('<br/>') : '' }}
                />
              </div>

              {currentBanner.link && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentBanner.link, '_blank');
                  }}
                  className="banner-link"
                >
                  Link: {currentBanner.link}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Indicators (Top Corner) */}
        {activeItems.length > 1 && (
          <div className="carousel-indicators">
            {activeItems.map((_, idx) => (
              <div 
                key={idx} 
                className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Part: Đăng Tin Bắt Kèo (Matching Dimensions) */}
      <div 
        onClick={() => window.location.href = '/sale-hunting/create'}
        className="banner-card interactive"
      >
        <div className="banner-rocket">🚀</div>
        <div>
          <div className="banner-title-large">Bắt Kèo Săn Sale</div>
          <p className="banner-description banner-desc-muted">
            Cộng đồng săn sale chuyên nghiệp. Đăng tin bắt kèo, khớp kèo với nhau để săn đáy kỷ lục.
          </p>
        </div>
        <div className="banner-cta-btn">
          ĐĂNG TIN BẮT KÈO 📝
        </div>
      </div>
    </div>
  );

  return (
    <div className="banner-overlay">
      {bannerContent}
    </div>
  );
};

export default NotificationBanner;

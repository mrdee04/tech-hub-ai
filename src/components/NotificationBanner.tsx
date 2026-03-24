import React, { useEffect, useState } from 'react';
import { fetchGlobalBanner, type BannerItem } from '../services/settingsService';

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

  if (activeItems.length === 0) return null;

  const currentBanner = activeItems[currentIndex];

  const bannerContent = (
    <div 
      className="animate-fade-in" 
      key={currentBanner.id} 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        background: 'var(--gradient-primary)',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        fontWeight: 500,
        fontSize: '0.95rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        cursor: currentBanner.link ? 'pointer' : 'default',
        flexWrap: 'nowrap',
        minHeight: '56px',
        position: 'sticky',
        top: '72px',
        zIndex: 40,
        userSelect: 'none', // Tránh bôi đen khi vuốt
        overflow: 'hidden'
      }}
    >
      {currentBanner.imageUrl && (
        <div style={{ flexShrink: 0 }}>
          <img 
            src={currentBanner.imageUrl} 
            alt="Notification" 
            style={{ 
              height: '40px', 
              width: '60px', 
              borderRadius: '6px', 
              objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.2)'
            }} 
          />
        </div>
      )}
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div 
          style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            fontSize: '0.9rem'
          }} 
          dangerouslySetInnerHTML={{ __html: currentBanner.text }} 
        />
      </div>

      {currentBanner.link && (
        <div className="hide-on-mobile" style={{ 
          background: 'white', 
          color: 'var(--accent-blue)', 
          padding: '4px 12px', 
          borderRadius: '99px',
          fontSize: '0.8rem',
          fontWeight: 700,
          flexShrink: 0
        }}>
          XEM NGAY
        </div>
      )}
      
      {/* Vòng tròn chỉ thị số lượng banner */}
      {activeItems.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {activeItems.map((_, idx) => (
             <span key={idx} style={{
                width: '6px', height: '6px', borderRadius: '50%', 
                background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                transition: 'background 0.3s ease'
             }}/>
          ))}
        </div>
      )}
    </div>
  );

  return currentBanner.link ? (
    <a href={currentBanner.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      {bannerContent}
    </a>
  ) : (
    <div style={{ display: 'block' }}>{bannerContent}</div>
  );
};

export default NotificationBanner;

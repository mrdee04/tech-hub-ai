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

  if (activeItems.length === 0) return null;

  const currentBanner = activeItems[currentIndex];

  const content = (
    <div className="animate-fade-in" key={currentBanner.id} style={{
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
      gap: '12px',
      cursor: currentBanner.link ? 'pointer' : 'default',
      flexWrap: 'wrap',
      minHeight: '48px'
    }}>
      {currentBanner.imageUrl && (
        <img 
          src={currentBanner.imageUrl} 
          alt="Notification" 
          style={{ maxWidth: '80px', maxHeight: '50px', borderRadius: '4px', objectFit: 'cover' }} 
        />
      )}
      <div dangerouslySetInnerHTML={{ __html: currentBanner.text }} />
      
      {/* Vòng tròn chỉ thị số lượng banner */}
      {activeItems.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
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
    <a href={currentBanner.link} style={{ textDecoration: 'none', display: 'block' }}>
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
};

export default NotificationBanner;

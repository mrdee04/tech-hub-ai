import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchSalePostById, respondToPost, fetchResponsesForPost, acceptResponse } from '../services/saleHuntingService';
import type { SalePost, SalePostResponse } from '../services/saleHuntingService';

const SalePostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<SalePost | null>(null);
  const [responses, setResponses] = useState<SalePostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasClickedAffiliate, setHasClickedAffiliate] = useState(false);
  const [bidMessage, setBidMessage] = useState('');
  const [sendingBid, setSendingBid] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const postData = await fetchSalePostById(id!);
    setPost(postData);
    if (postData && user?.id === postData.user_id) {
      const res = await fetchResponsesForPost(id!);
      setResponses(res);
    }
    setLoading(false);
  };

  const handleAffiliateClick = () => {
    setHasClickedAffiliate(true);
    // Open affiliate link in new tab (mocked)
    const affiliateUrl = post?.products?.image_url ? `https://shopee.vn/search?keyword=${encodeURIComponent(post.products.name)}` : 'https://shopee.vn';
    window.open(affiliateUrl, '_blank');
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Vui lòng đăng nhập!');
    if (!hasClickedAffiliate) return alert('Bạn cần click vào link sản phẩm để xem và nhận kèo!');

    setSendingBid(true);
    const success = await respondToPost({
      post_id: id!,
      user_id: user.id,
      message: bidMessage,
    });
    
    if (success) {
      alert('Đã gửi yêu cầu nhận kèo! Chủ tin sẽ sớm liên hệ với bạn.');
      setBidMessage('');
    }
    setSendingBid(false);
  };

  const handleAcceptBid = async (resId: string) => {
    if (!window.confirm('Bạn đồng ý bắt kèo với thành viên này?')) return;
    const success = await acceptResponse(id!, resId);
    if (success) {
      alert('Đã chấp nhận kèo! Thông tin liên hệ đã được hiển thị cho cả hai.');
      loadData();
    }
  };

  if (loading) return <div className="loading-state">Đang tải chi tiết...</div>;
  if (!post) return <div className="error-state">Không tìm thấy bài đăng.</div>;

  const isPoster = user?.id === post.user_id;
  const isMatched = post.status === 'matched';
  const showContact = isMatched || isPoster;

  return (
    <div className="container-width animate-fade-in mb-8">
      <div className="flex-between mb-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">← Quay lại danh sách</button>
      </div>
      
      <div className="premium-card">
        <div className="flex-between mb-6" style={{borderBottom: '1px solid var(--border-subtle)', paddingBottom: '24px', flexWrap: 'wrap', gap: 24}}>
          <div>
            <div className="flex-center mb-4" style={{justifyContent: 'flex-start', gap: 12}}>
              <span className={`badge ${post.type === 'request' ? 'badge-request' : post.type === 'offer' ? 'badge-offer' : 'badge-pass'}`}>{post.type === 'request' ? 'Nhờ Săn' : post.type === 'offer' ? 'Đi Săn' : 'Pass Kèo'}</span>
              <span className="badge badge-neutral">{post.status === 'open' ? '🟢 Đang mở' : '🔴 Đã khớp'}</span>
            </div>
            <h2 className="text-gradient" style={{fontSize: '2rem', lineHeight: 1.3}}>{post.products?.name || post.custom_product_name}</h2>
          </div>
          <div style={{textAlign: 'right'}}>
             <div className="text-secondary" style={{fontSize: '0.9rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Giá Mong Muốn</div>
             <div className="text-primary" style={{fontSize: '2.5rem', fontWeight: 800}}>
               {Number(post.target_price).toLocaleString('vi-VN')} <span style={{fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600}}>VNĐ</span>
             </div>
          </div>
        </div>

        <div className="detail-info-grid">
          <div className="flex-column gap-8">
            <div className="flex-column gap-4">
              <h3 style={{fontSize: '1.2rem', color: 'var(--text-secondary)'}}>Thông số yêu cầu</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16}}>
                {post.details?.variant_combination && Object.keys(post.details.variant_combination).length > 0 ? (
                  Object.entries(post.details.variant_combination as Record<string, string>).map(([name, value]) => (
                    <div key={name} style={{background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
                       <div className="text-muted mb-2" style={{fontSize: '0.85rem'}}>⚙️ {name}</div>
                       <div style={{fontWeight: 600, fontSize: '1.1rem'}}>{value}</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
                       <div className="text-muted mb-2" style={{fontSize: '0.85rem'}}>🎨 Màu sắc</div>
                       <div style={{fontWeight: 500, fontSize: '1.1rem'}}>{post.details.color || 'Tùy ý'}</div>
                    </div>
                    <div style={{background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
                       <div className="text-muted mb-2" style={{fontSize: '0.85rem'}}>💾 Cấu hình</div>
                       <div style={{fontWeight: 500, fontSize: '1.1rem'}}>{post.details.ram || ''}/{post.details.storage || ''}</div>
                    </div>
                  </>
                )}
                <div style={{background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
                   <div className="text-muted mb-2" style={{fontSize: '0.85rem'}}>🛒 Sàn/Shop</div>
                   <div style={{fontWeight: 500, fontSize: '1.1rem'}}>{post.details.platform} - {post.details.shop || 'Bất kỳ'}</div>
                </div>
              </div>
            </div>

            <div className="flex-column gap-4">
              <h3 style={{fontSize: '1.2rem', color: 'var(--text-secondary)'}}>Người đăng tin</h3>
              <div className="flex-center" style={{justifyContent: 'flex-start', gap: 16, background: 'var(--bg-hover)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)'}}>
                <div style={{width: 56, height: 56, borderRadius: '50%', background: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700}}>
                   {post.profiles?.full_name?.charAt(0)}
                </div>
                <div className="flex-column gap-2">
                   <h4 style={{fontSize: '1.1rem', margin: 0}}>{post.profiles?.full_name}</h4>
                   <div className="flex-center" style={{justifyContent: 'flex-start', gap: 12}}>
                      <span className="text-secondary" style={{fontSize: '0.85rem'}}>⭐️ {post.profiles?.reputation_score} Uy tín</span>
                      <span className="text-secondary" style={{fontSize: '0.85rem'}}>🛡️ {post.profiles?.review_count || 0} Đánh giá</span>
                   </div>
                </div>
              </div>
              {showContact && (
                <div style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginTop: '8px'}}>
                   <label className="text-muted" style={{fontSize: '0.85rem', display: 'block', marginBottom: '8px'}}>Thông tin liên hệ trực tiếp:</label>
                   <p style={{color: 'var(--accent-green)', fontWeight: 600, fontSize: '1.1rem', margin: 0}}>{post.profiles?.contact_info}</p>
                   {post.profiles?.telegram_username && (
                     <p style={{color: 'var(--accent-blue)', fontWeight: 600, fontSize: '1.0rem', marginTop: '4px'}}>✈️ Telegram: {post.profiles.telegram_username}</p>
                   )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-column gap-6">
            {!isPoster && !isMatched && (
              <div style={{background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden'}}>
                 {!hasClickedAffiliate ? (
                   <div style={{padding: '32px', textAlign: 'center'}} className="flex-column flex-center">
                     <span style={{fontSize: '3rem', marginBottom: '16px', opacity: 0.8}}>🔒</span>
                     <h3 style={{marginBottom: '12px', fontSize: '1.2rem'}}>Nội dung bị khóa</h3>
                     <p className="text-secondary" style={{marginBottom: '24px', lineHeight: 1.6}}>Vui lòng click vào link sản phẩm để xem giá gốc, qua đó mở khóa thông tin liên hệ và gửi yêu cầu bắt kèo.</p>
                     <button onClick={handleAffiliateClick} className="btn btn-primary w-full" style={{padding: '16px', fontSize: '1.05rem', background: 'var(--gradient-primary)', color: 'white', border: 'none'}}>
                        🔗 Xem sản phẩm (Mở khóa)
                     </button>
                   </div>
                 ) : (
                   <div style={{padding: '32px'}}>
                     <h3 style={{marginBottom: '20px', fontSize: '1.2rem', color: 'var(--accent-cyan)'}}>⚡ Gửi yêu cầu bắt kèo</h3>
                     <form onSubmit={handleBid} className="flex-column gap-4">
                        <textarea 
                          placeholder="Nhập tin nhắn (VD: Mình săn được kèo này giá tốt...)" 
                          value={bidMessage}
                          onChange={e => setBidMessage(e.target.value)}
                          className="premium-input"
                          style={{minHeight: 120, resize: 'vertical'}}
                          required
                        />
                        <button type="submit" className="btn btn-primary w-full" style={{padding: '14px', fontSize: '1.05rem'}} disabled={sendingBid}>
                          {sendingBid ? 'Đang gửi...' : 'Gửi Yêu Cầu Nhận Kèo'}
                        </button>
                     </form>
                   </div>
                 )}
              </div>
            )}
            
            {post.products?.image_url && (
              <div style={{background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <img src={post.products.image_url} alt="Product" style={{maxWidth: '100%', maxHeight: 300, objectFit: 'contain'}} />
              </div>
            )}
          </div>
        </div>
      </div>

      {isPoster && (
        <div className="mt-8">
          <h3 style={{fontSize: '1.5rem', marginBottom: '24px'}}>Người nhận kèo ({responses.length})</h3>
          <div className="flex-column gap-6">
            {responses.length === 0 ? (
              <div className="premium-card flex-center" style={{padding: '40px', gridColumn: '1 / -1'}}>
                 <p className="text-secondary">Chưa có ai nhận kèo này.</p>
              </div>
            ) : responses.map(res => (
              <div key={res.id} className="premium-card flex-between" style={{flexWrap: 'wrap', gap: 24}}>
                <div className="flex-column gap-2">
                  <div className="flex-center" style={{justifyContent: 'flex-start', gap: 12}}>
                    <strong style={{fontSize: '1.1rem'}}>{res.profiles.full_name}</strong>
                    <span className="badge badge-neutral"> ⭐️ {res.profiles.reputation_score} Uy tín</span>
                  </div>
                  <p className="text-secondary" style={{fontSize: '0.95rem', margin: '8px 0'}}>{res.message}</p>
                </div>
                <div>
                  {res.status === 'pending' && !isMatched && (
                    <button onClick={() => handleAcceptBid(res.id)} className="btn btn-primary">Bắt tay ngay 🤝</button>
                  )}
                  {res.status === 'accepted' && (
                    <div className="badge badge-offer" style={{padding: '8px 16px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px'}}>
                      <div>✓ Đã bắt tay • LH: {res.profiles.contact_info}</div>
                      {res.profiles.telegram_username && <div style={{fontSize: '0.85rem', opacity: 0.9}}>✈️ TG: {res.profiles.telegram_username}</div>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalePostDetail;

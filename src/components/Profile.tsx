import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type { SalePost } from '../services/saleHuntingService';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { getBotLink } from '../services/telegramService';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [userPosts, setUserPosts] = useState<SalePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedContact, setEditedContact] = useState('');
  const [editedTelegram, setEditedTelegram] = useState('');
  const [editedChatId, setEditedChatId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserPosts();
      setEditedName(profile?.full_name || '');
      setEditedContact(profile?.contact_info || '');
      setEditedTelegram(profile?.telegram_username || '');
      setEditedChatId(profile?.telegram_chat_id || '');
    }
  }, [user, profile]);

  const loadUserPosts = async () => {
    const { data, error } = await supabase
      .from('sale_posts')
      .select(`
        *,
        products:product_id (name, image_url)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error) setUserPosts(data as SalePost[]);
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editedName,
        contact_info: editedContact,
        telegram_username: editedTelegram,
        telegram_chat_id: editedChatId,
        updated_at: new Date().toISOString(),

      })
      .eq('id', user?.id);

    if (error) {
      alert('❌ Lỗi cập nhật: ' + error.message);
    } else {
      alert('🎉 Cập nhật thành công!');
      setIsEditing(false);
      refreshProfile();
    }
  };

  if (!user) return <div className="container-width flex-center" style={{minHeight: '60vh'}}><p className="text-secondary text-center">Vui lòng đăng nhập để xem hồ sơ.</p></div>;

  return (
    <div className="container-width animate-fade-in mb-8">
      <div className="premium-card mb-8">
        <div className="flex-between mb-6" style={{flexWrap: 'wrap', gap: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24}}>
          <div className="flex-center" style={{justifyContent: 'flex-start', gap: 20}}>
            <div style={{width: 80, height: 80, borderRadius: '50%', background: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700}}>
               {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-column gap-2">
              <h2 className="text-gradient m-0" style={{fontSize: '2rem'}}>{profile?.full_name || 'Thành viên'}</h2>
              <p className="text-secondary m-0">{user.email}</p>
              <div className="flex-center mt-2" style={{justifyContent: 'flex-start', gap: 12}}>
                <span className="badge badge-neutral" style={{fontSize: '0.9rem'}}>⭐️ {profile?.reputation_score || 0} Uy tín</span>
                <span className="badge badge-neutral" style={{fontSize: '0.9rem'}}>🛡️ {profile?.review_count || 0} Giao dịch</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="btn btn-ghost">
            {isEditing ? 'Hủy bỏ' : 'Sửa hồ sơ'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="flex-column gap-4">
            <div className="input-group" style={{margin: 0}}>
              <label className="premium-label">Họ và tên</label>
              <input title="Họ và tên" className="premium-input" placeholder="Nhập họ và tên" value={editedName} onChange={e => setEditedName(e.target.value)} required />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="premium-label">Thông tin liên hệ (Zalo/FB/SĐT)</label>
              <input title="Thông tin liên hệ" className="premium-input" placeholder="VD: FB.com/username hoặc SĐT" value={editedContact} onChange={e => setEditedContact(e.target.value)} required />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="premium-label">Tên người dùng Telegram</label>
              <input title="Telegram" className="premium-input" placeholder="VD: @username" value={editedTelegram} onChange={e => setEditedTelegram(e.target.value)} required />
            </div>
            <div className="input-group" style={{margin: 0}}>
              <label className="premium-label">Telegram Chat ID (để nhận thông báo)</label>
              <div className="flex-between gap-2">
              <div className="flex-between gap-2">
                <input 
                  title="Chat ID" 
                  className="premium-input" 
                  placeholder={editedChatId || "Chưa kết nối"} 
                  value={editedChatId} 
                  onChange={e => setEditedChatId(e.target.value)}
                  style={{flex: 1}} 
                />
                <button 
                  type="button"
                  onClick={() => refreshProfile()}
                  className="btn btn-secondary flex-center"
                  style={{padding: '0 15px', height: 45, whiteSpace: 'nowrap', fontSize: '0.9rem'}}
                >
                  🔄 Kiểm tra
                </button>
              </div>
              </div>
              {editedChatId ? (
                <p className="text-success" style={{fontSize: '0.85rem', marginTop: 8}}>
                  ✅ Đã kết nối với Telegram Bot!
                </p>
              ) : (
                <div className="mt-4">
                  <a 
                    href={getBotLink(user?.id)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary flex-center w-100" 
                    style={{height: 50, fontSize: '1rem', background: 'linear-gradient(135deg, #0088cc 0%, #00a2ed 100%)', border: 'none'}}
                  >
                    Kết nối Telegram Ngay 🚀
                  </a>
                  <p className="text-secondary text-center" style={{fontSize: '0.85rem', marginTop: 12}}>
                    💡 Sau khi nhấn "Start" trong Telegram, hãy quay lại đây và nhấn "Kiểm tra".
                  </p>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary mt-2 flex-center" style={{maxWidth: 200}}>Lưu Thay Đổi</button>
          </form>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20}}>
            <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
               <label className="text-muted mb-2" style={{fontSize: '0.9rem', display: 'block'}}>📞 Liên hệ công khai</label>
               <span style={{fontWeight: 500, fontSize: '1.1rem'}}>{profile?.contact_info || 'Chưa cập nhật'}</span>
            </div>
            <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
               <label className="text-muted mb-2" style={{fontSize: '0.9rem', display: 'block'}}>✈️ Telegram</label>
               <span style={{fontWeight: 500, fontSize: '1.1rem'}}>{profile?.telegram_username || 'Chưa cập nhật'}</span>
            </div>
            <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'}}>
               <label className="text-muted mb-2" style={{fontSize: '0.9rem', display: 'block'}}>📅 Ngày gia nhập</label>
               <span style={{fontWeight: 500, fontSize: '1.1rem'}}>{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
            </div>

          </div>
        )}
      </div>

      <div>
        <h3 className="text-secondary" style={{fontSize: '1.2rem', marginBottom: 24, paddingLeft: 8}}>📦 Lịch sử săn kèo của tôi</h3>
        {loading ? (
           <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24}}>
              {Array(3).fill(0).map((_, i) => <div key={i} className="premium-card" style={{height: 200, animation: 'pulse 1.5s infinite var(--ease-out)'}}></div>)}
           </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24}}>
             {userPosts.map(post => {
               const products = post.products as any;
               const name = Array.isArray(products) ? products[0]?.name : products?.name;
               const productName = name || post.custom_product_name || 'Sản phẩm';
               return (
               <div key={post.id} className="post-card" onClick={() => navigate(`/sale-hunting/post/${post.id}`)}>
                  <div className="flex-between mb-4">
                    <span className={`badge ${post.type === 'request' ? 'badge-request' : post.type === 'offer' ? 'badge-offer' : 'badge-pass'}`}>
                      {post.type === 'request' ? 'Nhờ Săn' : post.type === 'offer' ? 'Đi Săn' : 'Pass Kèo'}
                    </span>
                    <span className="badge badge-neutral">{post.status === 'open' ? '🟢 Mở' : '🔴 Khớp'}</span>
                  </div>
                  <h4 style={{fontSize: '1.3rem', marginBottom: 20, lineHeight: 1.4}}>{productName}</h4>
                  <div className="mt-auto text-primary" style={{fontSize: '1.5rem', fontWeight: 700}}>
                    {Number(post.target_price).toLocaleString('vi-VN')} <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>VNĐ</span>
                  </div>
               </div>
             )})}
             {userPosts.length === 0 && (
               <div className="premium-card text-center flex-center" style={{gridColumn: '1 / -1', minHeight: 200}}>
                  <p className="text-secondary">Bạn chưa có bài đăng nào.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

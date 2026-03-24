import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              full_name: fullName,
              contact_info: contactInfo,
            }]);
          
          if (profileError) console.error('Error creating profile:', profileError);
          alert('🎉 Đăng ký thành công! Hãy kiểm tra email hoặc đăng nhập.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      alert('❌ Lỗi: ' + (err.message || 'Đã có lỗi xảy ra'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-width flex-center animate-fade-in" style={{minHeight: '80vh'}}>
      <div className="premium-card" style={{width: '100%', maxWidth: 420}}>
        <div className="text-center mb-6 mt-4">
          <h2 className="text-gradient" style={{fontSize: '2rem', marginBottom: 8}}>{isSignUp ? '✨ Tạo Tài Khoản' : '🔐 Đăng Nhập'}</h2>
          <p className="text-secondary" style={{fontSize: '0.95rem'}}>{isSignUp ? 'Gia nhập cộng đồng săn sale chuyên nghiệp' : 'Mừng bạn quay trở lại TechHub AI'}</p>
        </div>

        <form onSubmit={handleAuth} className="flex-column gap-4">
          <div className="input-group" style={{margin: 0}}>
            <label htmlFor="email" className="premium-label">Email</label>
            <input id="email" type="email" className="premium-input" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group" style={{margin: 0}}>
            <label htmlFor="password" className="premium-label">Mật khẩu</label>
            <input id="password" type="password" className="premium-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {isSignUp && (
            <div className="animate-fade-in flex-column gap-4">
              <div className="input-group" style={{margin: 0}}>
                <label htmlFor="fullName" className="premium-label">Họ và tên</label>
                <input id="fullName" className="premium-input" placeholder="VD: Nguyễn Văn A" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="input-group" style={{margin: 0}}>
                <label htmlFor="contact" className="premium-label">Thông tin liên hệ</label>
                <input id="contact" className="premium-input" placeholder="VD: Zalo 0987..." value={contactInfo} onChange={e => setContactInfo(e.target.value)} required />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full mt-4" style={{padding: '14px', fontSize: '1.05rem'}} disabled={loading}>
            {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng Ký Ngay' : 'Đăng Nhập')}
          </button>
        </form>
        
        <div className="text-center mt-8 mb-2">
          <span className="text-secondary" style={{fontSize: '0.9rem'}}>
            {isSignUp ? 'Đã có tài khoản?' : 'Bạn là thành viên mới?'} 
          </span>
          <button onClick={() => setIsSignUp(!isSignUp)} className="btn btn-ghost" style={{padding: '6px 12px', marginLeft: 4, fontSize: '0.9rem'}}>
            {isSignUp ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

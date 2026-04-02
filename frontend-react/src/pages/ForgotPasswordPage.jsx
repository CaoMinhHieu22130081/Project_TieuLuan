import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import '../pages/css/Loginpage.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Vui lòng nhập email hợp lệ');
      }

      // Request password reset
      const response = await userAPI.forgotPassword(email);
      setMessage(response.message);
      setSubmitted(true);

      // Optionally redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left panel – decorative ── */}
      <div className="auth-panel-left">
        <div className="panel-bg" />
        <div className="panel-content">
          <a href="/" className="panel-logo">
            <span className="logo-mark">U</span>
            <span className="logo-text">UNIQ<em>TEE</em></span>
          </a>
          <div className="panel-tagline">
            <h2>Quên Mật Khẩu?<br />Không Sao!</h2>
            <p>Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email của bạn.</p>
          </div>
          <div className="panel-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&h=620&fit=crop"
              alt="fashion"
              className="panel-img"
            />
          </div>
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">

          {/* mobile logo */}
          <a href="/" className="mobile-logo">
            <span className="logo-mark">U</span>
            <span className="logo-text">UNIQ<em>TEE</em></span>
          </a>

          {submitted ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Email Đã Gửi!</h2>
              <p>Vui lòng kiểm tra hộp thư của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Email gửi đến: <strong>{email}</strong>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                Bạn sẽ được chuyển hướng đến đăng nhập trong 5 giây...
              </p>
              <a href="/login" className="reg-home-link">← Quay lại đăng nhập</a>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Quên Mật Khẩu?</h1>
                <p className="auth-sub">Nhập email để nhận hướng dẫn đặt lại mật khẩu.{" "}
                  <a href="/login" className="auth-switch-link">Quay lại đăng nhập →</a>
                </p>
              </div>

              {error && (
                <div style={{
                  color: 'var(--error)',
                  backgroundColor: 'var(--error-dim)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '16px',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}>
                  {error}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    'Gửi Email'
                  )}
                </button>

                <div className="form-footer" style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Nhớ mật khẩu? <a href="/login" className="auth-switch-link">Đăng nhập</a>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import '../pages/css/Loginpage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Get token from URL
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token không hợp lệ. Vui lòng kiểm tra link trong email');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  // Check password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
    setPasswordStrength(strength);
  }, [newPassword]);

  const validatePassword = () => {
    const errors = [];
    
    if (newPassword.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('Mật khẩu phải có ít nhất 1 số');
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate
    if (!newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const validationErrors = validatePassword();
    if (validationErrors.length > 0) {
      setError('Mật khẩu không đáp ứng các yêu cầu:\n' + validationErrors.join('\n'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setLoading(true);

    try {
      const response = await userAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setError('');
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Lỗi đặt lại mật khẩu. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Yếu';
    if (passwordStrength === 2) return 'Trung bình';
    if (passwordStrength === 3) return 'Tốt';
    return 'Rất tốt';
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return '#ccc';
    if (passwordStrength === 1) return '#ff4444';
    if (passwordStrength === 2) return '#ff8800';
    if (passwordStrength === 3) return '#88dd00';
    return '#00cc00';
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-panel-left">
          <div className="panel-bg" />
          <div className="panel-content">
            <a href="/" className="panel-logo">
              <span className="logo-mark">U</span>
              <span className="logo-text">UNIQ<em>TEE</em></span>
            </a>
            <div className="panel-tagline">
              <h2>Lỗi Xác Nhận</h2>
              <p>Có vẻ như link không hợp lệ hoặc đã hết hạn.</p>
            </div>
          </div>
        </div>
        <div className="auth-panel-right">
          <div className="auth-form-wrap">
            <a href="/" className="mobile-logo">
              <span className="logo-mark">U</span>
              <span className="logo-text">UNIQ<em>TEE</em></span>
            </a>
            <div className="auth-header">
              <h1 className="auth-title">Lỗi</h1>
              <p className="auth-sub">{error}</p>
            </div>
            <Link to="/forgot-password" className="auth-switch-link" style={{ display: 'inline-block', marginTop: '16px' }}>
              ← Yêu cầu đặt lại mật khẩu mới
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h2>Mật Khẩu<br />Mạnh = An Toàn</h2>
            <p>Hãy tạo mật khẩu mạnh để bảo vệ tài khoản UniqueTee của bạn.</p>
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

          {success ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Thành Công!</h2>
              <p>Mật khẩu của bạn đã được đặt lại thành công.</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Bạn có thể đăng nhập ngay bây giờ với mật khẩu mới.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                Bạn sẽ được chuyển hướng đến đăng nhập trong 3 giây...
              </p>
              <Link to="/login" className="reg-home-link">← Đến trang đăng nhập</Link>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Đặt Lại Mật Khẩu</h1>
                <p className="auth-sub">Tạo mật khẩu mạnh mới cho tài khoản của bạn.</p>
              </div>

              {error && (
                <div style={{
                  color: 'var(--error)',
                  backgroundColor: 'var(--error-dim)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '16px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {error}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label">Mật Khẩu Mới</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength Checker */}
                  {newPassword && (
                    <div className="pass-strength">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="strength-bar"
                            style={{
                              backgroundColor: i <= passwordStrength ? getStrengthColor() : 'var(--surface-2)'
                            }}
                          />
                        ))}
                      </div>
                      <p className="strength-label" style={{ color: getStrengthColor() }}>
                        Độ mạnh: {getStrengthText()}
                      </p>

                      <div className="strength-checks">
                        <span className={`s-check ${newPassword.length >= 8 ? 'ok' : ''}`}>
                          {newPassword.length >= 8 ? '✓' : '✗'} Ít nhất 8 ký tự
                        </span>
                        <span className={`s-check ${/[A-Z]/.test(newPassword) ? 'ok' : ''}`}>
                          {/[A-Z]/.test(newPassword) ? '✓' : '✗'} Chữ hoa
                        </span>
                        <span className={`s-check ${/[0-9]/.test(newPassword) ? 'ok' : ''}`}>
                          {/[0-9]/.test(newPassword) ? '✓' : '✗'} Số
                        </span>
                        <span className={`s-check ${/[^A-Za-z0-9]/.test(newPassword) ? 'ok' : ''}`}>
                          {/[^A-Za-z0-9]/.test(newPassword) ? '✓' : '✗'} Ký tự đặc biệt
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Xác Nhận Mật Khẩu</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Xác nhận mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading || passwordStrength < 4}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    'Đặt Lại Mật Khẩu'
                  )}
                </button>

                <div className="form-footer" style={{
                  textAlign: 'center',
                  marginTop: '20px'
                }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <Link to="/login" className="auth-switch-link">← Quay lại đăng nhập</Link>
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

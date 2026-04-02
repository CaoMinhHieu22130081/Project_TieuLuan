import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./css/Loginpage.css";

export default function Loginpage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  // Check for OAuth2 error on component mount
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setServerError("OAuth2 login failed: " + error);
    }
  }, [searchParams]);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) e.password = "Mật khẩu phải ít nhất 6 ký tự";
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    if (serverError) setServerError("");
  };

  const handleOAuth2Login = (provider) => {
    console.log(`[OAuth2] User clicked ${provider} button`);
    console.log(`[OAuth2] Redirecting to: http://localhost:8080/api/oauth2/authorization/${provider}`);
    try {
      // Redirect to backend OAuth2 authorization endpoint
      window.location.href = `http://localhost:8080/api/oauth2/authorization/${provider}`;
    } catch (error) {
      console.error(`[OAuth2] Error redirecting:`, error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      return; 
    }
    
    setLoading(true);
    setServerError("");
    
    try {
      // Gọi API login
      const response = await userAPI.login(form.email, form.password);
      
      // Nếu login thành công
      if (response && response.token && response.user) {
        setSuccess(true);
        setLoading(false);
        
        // Lưu user info vào AuthContext
        login(response.token, response.user);
        
        // Redirect dựa vào role
        const userRole = response.user.role;
        setTimeout(() => {
          if (userRole === "admin") {
            navigate("/admin");
          } else if (userRole === "staff") {
            navigate("/admin/orders");
          } else {
            navigate("/profile");
          }
        }, 1500);
      }
    } catch (error) {
      setServerError(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
            <h2>Chào mừng<br />trở lại!</h2>
            <p>Đăng nhập để tiếp tục mua sắm, theo dõi đơn hàng và nhận ưu đãi độc quyền.</p>
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

          {!success ? (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Đăng nhập</h1>
                <p className="auth-sub">Chưa có tài khoản?{" "}
                  <a href="/register" className="auth-switch-link">Đăng ký ngay →</a>
                </p>
              </div>

              {/* Server error message */}
              {serverError && (
                <div className="server-error-msg" style={{
                  padding: '12px 16px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid #f87171',
                  borderRadius: 'var(--radius)',
                  color: '#f87171',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}>
                  {serverError}
                </div>
              )}

              {/* Social login */}
              <div className="social-btns">
                <button 
                  type="button" 
                  className="btn-social" 
                  disabled={loading}
                  onClick={() => handleOAuth2Login("google")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Tiếp tục với Google
                </button>
                <button 
                  type="button" 
                  className="btn-social" 
                  disabled={loading}
                  onClick={() => handleOAuth2Login("facebook")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Tiếp tục với Facebook
                </button>
              </div>

              <div className="divider"><span>hoặc</span></div>

              {/* Form */}
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className={`form-group ${errors.email ? "has-error" : ""}`}>
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
                      name="email"
                      className="form-input"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                <div className={`form-group ${errors.password ? "has-error" : ""}`}>
                  <div className="label-row">
                    <label className="form-label">Mật khẩu</label>
                    <a href="/forgot-password" className="forgot-link">Quên mật khẩu?</a>
                  </div>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      className="form-input"
                      placeholder="Nhập mật khẩu"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-toggle"
                      onClick={() => setShowPass(!showPass)}
                      aria-label="Toggle password"
                      disabled={loading}
                    >
                      {showPass ? (
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
                  {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                  <button type="submit" className={`btn-submit ${loading ? "loading" : ""}`} disabled={loading}>
                    {loading ? <span className="btn-spinner" /> : "Đăng nhập"}
                  </button>
              </form>
            </>
          ) : (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Đăng nhập thành công!</h2>
              <p>Đang chuyển hướng về trang chủ…</p>
              <a href="/" className="btn-submit" style={{ display:"block", textAlign:"center", marginTop:24 }}>
                Về trang chủ
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
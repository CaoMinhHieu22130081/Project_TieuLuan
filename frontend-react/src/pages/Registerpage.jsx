import { useState } from "react";
import "./css/Registerpage.css";

const STEPS = ["Tài khoản", "Cá nhân", "Xong"];

function PasswordStrength({ password }) {
  const checks = [
    { label: "Ít nhất 8 ký tự", ok: password.length >= 8 },
    { label: "Có chữ hoa", ok: /[A-Z]/.test(password) },
    { label: "Có số", ok: /[0-9]/.test(password) },
    { label: "Có ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const levels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
  const colors = ["", "#f87171", "#fbbf24", "#60a5fa", "#c8ff57"];

  if (!password) return null;
  return (
    <div className="pass-strength">
      <div className="strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="strength-bar"
            style={{ background: i <= score ? colors[score] : undefined }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: colors[score] }}>{levels[score]}</span>
      <div className="strength-checks">
        {checks.map((c) => (
          <span key={c.label} className={`s-check ${c.ok ? "ok" : ""}`}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Registerpage() {
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [agree, setAgree] = useState(false);

  const [form, setForm] = useState({
    email: "", password: "", confirm: "",
    fullName: "", phone: "", gender: "", dob: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep0 = () => {
    const e = {};
    if (!form.email) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 8) e.password = "Mật khẩu phải ít nhất 8 ký tự";
    if (!form.confirm) e.confirm = "Vui lòng xác nhận mật khẩu";
    else if (form.confirm !== form.password) e.confirm = "Mật khẩu không khớp";
    if (!agree) e.agree = "Bạn phải đồng ý điều khoản";
    return e;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!form.phone) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^0\d{9}$/.test(form.phone)) e.phone = "Số điện thoại không hợp lệ (VD: 0912345678)";
    return e;
  };

  const nextStep = () => {
    const errs = step === 0 ? validateStep0() : validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (step < 1) { setStep((s) => s + 1); return; }
    // final submit
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  const prevStep = () => { setErrors({}); setStep((s) => s - 1); };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-panel-left reg-left">
          <div className="panel-bg" />
          <div className="panel-content">
            <a href="/" className="panel-logo">
              <span className="logo-mark">U</span>
              <span className="logo-text">UNIQ<em>TEE</em></span>
            </a>
            <div className="panel-img-wrap">
              <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&h=620&fit=crop" alt="fashion" className="panel-img" />
            </div>
          </div>
        </div>
        <div className="auth-panel-right">
          <div className="auth-form-wrap">
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>Tạo tài khoản thành công!</h2>
              <p>Chào mừng <strong>{form.fullName || "bạn"}</strong> đến với UniqTee 🎉<br />Hãy bắt đầu khám phá ngay.</p>
              <a href="/login" className="btn-submit" style={{ display:"block", textAlign:"center", marginTop:28 }}>
                Đăng nhập ngay
              </a>
              <a href="/" className="reg-home-link">← Về trang chủ</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* ── Left panel ── */}
      <div className="auth-panel-left reg-left">
        <div className="panel-bg" />
        <div className="panel-content">
          <a href="/" className="panel-logo">
            <span className="logo-mark">U</span>
            <span className="logo-text">UNIQ<em>TEE</em></span>
          </a>
          <div className="panel-tagline">
            <h2>Tham gia<br /><span className="accent">UniqTee</span></h2>
            <p>Tạo tài khoản để trải nghiệm mua sắm thông minh hơn — từ tìm kiếm bằng ảnh đến theo dõi đơn hàng.</p>
          </div>
          <div className="panel-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&h=400&fit=crop"
              alt="fashion"
              className="panel-img"
            />
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <a href="/" className="mobile-logo">
            <span className="logo-mark">U</span>
            <span className="logo-text">UNIQ<em>TEE</em></span>
          </a>

          <div className="auth-header">
            <h1 className="auth-title">Tạo tài khoản</h1>
            <p className="auth-sub">Đã có tài khoản?{" "}
              <a href="/login" className="auth-switch-link">Đăng nhập →</a>
            </p>
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            {STEPS.map((label, i) => (
              <div key={label} className="step-wrap">
                <div className={`step-dot ${i < step ? "done" : i === step ? "active" : ""}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`step-label ${i === step ? "active" : ""}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? "done" : ""}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div className="form-step">
              <div className={`form-group ${errors.email ? "has-error" : ""}`}>
                <label className="form-label">Email</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  <input type="email" name="email" className="form-input"
                    placeholder="example@email.com"
                    value={form.email} onChange={handleChange} autoComplete="email" />
                </div>
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className={`form-group ${errors.password ? "has-error" : ""}`}>
                <label className="form-label">Mật khẩu</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  <input type={showPass ? "text" : "password"} name="password" className="form-input"
                    placeholder="Ít nhất 8 ký tự"
                    value={form.password} onChange={handleChange} autoComplete="new-password" />
                  <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      : <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    }
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
                <PasswordStrength password={form.password} />
              </div>

              <div className={`form-group ${errors.confirm ? "has-error" : ""}`}>
                <label className="form-label">Xác nhận mật khẩu</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  <input type={showConfirm ? "text" : "password"} name="confirm" className="form-input"
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirm} onChange={handleChange} autoComplete="new-password" />
                  <button type="button" className="input-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm
                      ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      : <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    }
                  </button>
                </div>
                {errors.confirm && <p className="form-error">{errors.confirm}</p>}
                {form.confirm && !errors.confirm && form.confirm === form.password && (
                  <p className="form-ok">✓ Mật khẩu khớp</p>
                )}
              </div>

              <div className={`form-group checkbox-group ${errors.agree ? "has-error" : ""}`}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (errors.agree) setErrors(p => ({...p, agree:""})); }} />
                  <span className="checkbox-box" />
                  <span>Tôi đồng ý với <a href="#" className="auth-switch-link">Điều khoản dịch vụ</a> và <a href="#" className="auth-switch-link">Chính sách bảo mật</a></span>
                </label>
                {errors.agree && <p className="form-error">{errors.agree}</p>}
              </div>

              <button type="button" className="btn-submit" onClick={nextStep}>
                Tiếp theo →
              </button>

              <div className="divider"><span>hoặc đăng ký với</span></div>
              <div className="social-btns">
                <button className="btn-social">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="btn-social">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Personal info ── */}
          {step === 1 && (
            <div className="form-step">
              <div className={`form-group ${errors.fullName ? "has-error" : ""}`}>
                <label className="form-label">Họ và tên</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  <input type="text" name="fullName" className="form-input"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName} onChange={handleChange} autoComplete="name" />
                </div>
                {errors.fullName && <p className="form-error">{errors.fullName}</p>}
              </div>

              <div className={`form-group ${errors.phone ? "has-error" : ""}`}>
                <label className="form-label">Số điện thoại</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.89 9.11 19.79 19.79 0 01.82 4.48 2 2 0 012.81 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l.97-.97a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                  <input type="tel" name="phone" className="form-input"
                    placeholder="0912 345 678"
                    value={form.phone} onChange={handleChange} autoComplete="tel" />
                </div>
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Giới tính <span className="optional">(tuỳ chọn)</span></label>
                  <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày sinh <span className="optional">(tuỳ chọn)</span></label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <input type="date" name="dob" className="form-input"
                      value={form.dob} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-step-actions">
                <button type="button" className="btn-back" onClick={prevStep}>← Quay lại</button>
                <button
                  type="button"
                  className={`btn-submit flex-1 ${loading ? "loading" : ""}`}
                  onClick={nextStep}
                  disabled={loading}
                >
                  {loading ? <span className="btn-spinner" /> : "Tạo tài khoản ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
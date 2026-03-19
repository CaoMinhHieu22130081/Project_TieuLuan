import { useState } from "react";
import "./css/CheckoutPage.css";

const CART_ITEMS = [
  { id: 1, name: "Urban Minimal Tee", price: 299000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=125&fit=crop", color: "Đen", size: "M", qty: 1 },
  { id: 2, name: "Acid Wash Street", price: 349000, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=100&h=125&fit=crop", color: "Tím", size: "L", qty: 2 },
];

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

const STEPS = ["Thông tin", "Thanh toán", "Xác nhận"];

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState("momo");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    fullName: "", phone: "", email: "",
    address: "", ward: "", district: "", city: "TP. Hồ Chí Minh",
    note: "",
  });

  const subtotal = CART_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 299000 ? 0 : 30000;
  const total = subtotal + shipping;

  const handleShipChange = (e) => {
    setShippingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 2000);
  };

  if (success) {
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="checkout-success">
            <div className="success-animation">🌸</div>
            <h2>Đặt hàng thành công!</h2>
            <p>Cảm ơn bạn đã mua sắm tại <strong>UniqTee</strong></p>
            <p>Đơn hàng của bạn đang được xử lý và sẽ giao trong 1–3 ngày làm việc.</p>
            <div className="order-code">Mã đơn hàng: #UNQ{Math.random().toString(36).slice(2,8).toUpperCase()}</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="/profile" className="btn-primary">Xem đơn hàng</a>
              <a href="/" className="btn-secondary">Về trang chủ</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-inner">
        <div className="checkout-header">
          <h1 className="checkout-title">Thanh toán <span className="accent">đơn hàng</span></h1>

          {/* Steps */}
          <div className="checkout-steps">
            {STEPS.map((s, i) => (
              <>
                <div key={s} className={`step-item ${step === i ? "active" : ""} ${step > i ? "done" : ""}`}>
                  <div className="step-circle">{step > i ? "✓" : i + 1}</div>
                  <span className="step-label">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`step-line ${step > i ? "done" : ""}`} key={"line"+i} />}
              </>
            ))}
          </div>
        </div>

        <div className="checkout-layout">
          {/* Form */}
          <div className="checkout-form-col">
            {step === 0 && (
              <>
                <div className="form-section">
                  <p className="form-section-title">
                    <span className="form-section-icon">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    Thông tin giao hàng
                  </p>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Họ và tên</label>
                      <input className="form-input" name="fullName" placeholder="Nguyễn Văn A" value={shippingForm.fullName} onChange={handleShipChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input className="form-input" name="phone" placeholder="0901 234 567" value={shippingForm.phone} onChange={handleShipChange} />
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Email</label>
                      <input className="form-input" name="email" placeholder="example@email.com" value={shippingForm.email} onChange={handleShipChange} />
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Địa chỉ</label>
                      <input className="form-input" name="address" placeholder="Số nhà, tên đường, tòa nhà..." value={shippingForm.address} onChange={handleShipChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phường/Xã</label>
                      <input className="form-input" name="ward" placeholder="Phường Bến Nghé" value={shippingForm.ward} onChange={handleShipChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quận/Huyện</label>
                      <input className="form-input" name="district" placeholder="Quận 1" value={shippingForm.district} onChange={handleShipChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tỉnh/Thành phố</label>
                      <select className="form-select" name="city" value={shippingForm.city} onChange={handleShipChange}>
                        <option>TP. Hồ Chí Minh</option>
                        <option>Hà Nội</option>
                        <option>Đà Nẵng</option>
                        <option>Cần Thơ</option>
                      </select>
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Ghi chú đơn hàng (tùy chọn)</label>
                      <input className="form-input" name="note" placeholder="Giao giờ hành chính, gọi trước khi giao..." value={shippingForm.note} onChange={handleShipChange} />
                    </div>
                  </div>
                </div>

                <button className="btn-place-order" onClick={() => setStep(1)}>
                  Tiếp theo: Thanh toán →
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="form-section">
                  <p className="form-section-title">
                    <span className="form-section-icon">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M1 10h22" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    Phương thức thanh toán
                  </p>
                  <div className="payment-methods">
                    {[
                      { id: "momo", icon: "💜", name: "Ví MoMo", sub: "Thanh toán nhanh qua ví điện tử", recommended: true },
                      { id: "vnpay", icon: "🔵", name: "VNPAY", sub: "QR code hoặc ATM nội địa" },
                      { id: "cod", icon: "💵", name: "Thanh toán khi nhận hàng (COD)", sub: "Trả tiền mặt khi nhận hàng" },
                      { id: "card", icon: "💳", name: "Thẻ tín dụng / ghi nợ", sub: "Visa, Mastercard, JCB" },
                    ].map((pm) => (
                      <div
                        key={pm.id}
                        className={`payment-option ${payMethod === pm.id ? "selected" : ""}`}
                        onClick={() => setPayMethod(pm.id)}
                      >
                        <div className="payment-radio">
                          <div className="payment-radio-dot" />
                        </div>
                        <span className="payment-icon">{pm.icon}</span>
                        <div className="payment-info">
                          <p className="payment-name">{pm.name}</p>
                          <p className="payment-sub">{pm.sub}</p>
                        </div>
                        {pm.recommended && <span className="payment-recommended">Phổ biến</span>}
                      </div>
                    ))}
                  </div>

                  {payMethod === "card" && (
                    <div className="card-form">
                      <div className="form-group">
                        <label className="form-label">Số thẻ</label>
                        <input className="form-input" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Ngày hết hạn</label>
                          <input className="form-input" placeholder="MM / YY" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input className="form-input" placeholder="•••" type="password" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn-secondary" style={{ flex: "0 0 auto" }} onClick={() => setStep(0)}>← Quay lại</button>
                  <button className={`btn-place-order ${loading ? "loading" : ""}`} onClick={handlePlaceOrder} disabled={loading} style={{ flex: 1 }}>
                    {loading ? "Đang xử lý…" : "🌸 Đặt hàng ngay"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="checkout-summary">
            <p className="checkout-summary-title">Đơn hàng của bạn</p>
            <div className="checkout-items">
              {CART_ITEMS.map((item) => (
                <div key={item.id} className="checkout-item">
                  <div className="checkout-item-img">
                    <img src={item.image} alt={item.name} />
                    <span className="checkout-item-qty-badge">{item.qty}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="checkout-item-name">{item.name}</p>
                    <p className="checkout-item-meta">{item.color} · Size {item.size}</p>
                  </div>
                  <span className="checkout-item-price">{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="summary-lines">
              <div className="summary-line">
                <span className="label">Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-line green">
                <span className="label">Phí vận chuyển</span>
                <span className="value">{shipping === 0 ? "Miễn phí 🎉" : formatPrice(shipping)}</span>
              </div>
            </div>

            <div className="summary-divider" />
            <div className="summary-total-row">
              <span className="summary-total-label">Tổng cộng</span>
              <span className="summary-total-amount">{formatPrice(total)}</span>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
              🔒 Thông tin thanh toán được mã hóa SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
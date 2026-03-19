import { useState } from "react";
import "./css/CartPage.css";

const INITIAL_CART = [
  { id: 1, name: "Urban Minimal Tee", price: 299000, originalPrice: 399000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=250&fit=crop", color: "Đen", colorHex: "#1a1a1a", size: "M", qty: 1 },
  { id: 2, name: "Acid Wash Street", price: 349000, originalPrice: null, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=250&fit=crop", color: "Tím", colorHex: "#7B68EE", size: "L", qty: 2 },
  { id: 3, name: "Oversized Graphic Tee", price: 379000, originalPrice: 450000, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=250&fit=crop", color: "Xám", colorHex: "#2C2C2C", size: "XL", qty: 1 },
];

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

export default function CartPage() {
  const [items, setItems] = useState(INITIAL_CART);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal >= 299000 ? 0 : 30000;
  const total = subtotal - discount + shipping;

  const handlePromo = () => {
    if (promoCode.toUpperCase() === "UNIQ10") {
      setPromoApplied(true);
    } else {
      alert("Mã giảm giá không hợp lệ.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-inner">
          <div className="cart-empty">
            <div className="cart-empty-icon">🛍️</div>
            <h2>Giỏ hàng trống</h2>
            <p>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi nhé!</p>
            <a href="/products" className="btn-primary">Mua sắm ngay</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-inner">
        <div className="cart-header">
          <h1 className="cart-title">Giỏ hàng <span className="accent">của bạn</span></h1>
          <p className="cart-subtitle">{items.length} sản phẩm · {items.reduce((s, i) => s + i.qty, 0)} món</p>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items-col">
            <div className="cart-items-header">
              <span className="cart-items-label">Sản phẩm đã chọn</span>
              <button className="cart-clear-btn" onClick={() => setItems([])}>Xóa tất cả</button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="cart-item-body">
                  <p className="cart-item-name">{item.name}</p>
                  <div className="cart-item-meta">
                    <span className="meta-chip">
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: item.colorHex, marginRight: 4, verticalAlign: "middle" }} />
                      {item.color}
                    </span>
                    <span className="meta-chip">Size: {item.size}</span>
                  </div>
                  <div className="cart-item-footer">
                    <span className="cart-item-price">{formatPrice(item.price * item.qty)}</span>
                    <div className="cart-item-actions">
                      <div className="qty-control-sm">
                        <button className="qty-btn-sm" onClick={() => updateQty(item.id, -1)}>−</button>
                        <span className="qty-num-sm">{item.qty}</span>
                        <button className="qty-btn-sm" onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Promo */}
            <div className="promo-row">
              <input
                className="promo-input"
                placeholder="Nhập mã giảm giá (UNIQ10)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoApplied}
              />
              <button className="promo-btn" onClick={handlePromo} disabled={promoApplied}>
                {promoApplied ? "✓ Đã áp dụng" : "Áp dụng"}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <p className="summary-title">Tóm tắt đơn hàng</p>
            <div className="summary-lines">
              <div className="summary-line">
                <span className="summary-line-label">Tạm tính ({items.reduce((s, i) => s + i.qty, 0)} món)</span>
                <span className="summary-line-value">{formatPrice(subtotal)}</span>
              </div>
              {promoApplied && (
                <div className="summary-line discount">
                  <span className="summary-line-label">Giảm giá (UNIQ10)</span>
                  <span className="summary-line-value">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="summary-line shipping">
                <span className="summary-line-label">Phí vận chuyển</span>
                <span className="summary-line-value">{shipping === 0 ? "Miễn phí 🎉" : formatPrice(shipping)}</span>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span className="summary-total-label">Tổng thanh toán</span>
              <span className="summary-total-value">{formatPrice(total)}</span>
            </div>

            <a href="/checkout" className="btn-checkout">
              Thanh toán ngay
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
            <a href="/products" className="btn-continue">← Tiếp tục mua sắm</a>

            <div className="summary-badges">
              <span className="summary-badge">🔒 Bảo mật</span>
              <span className="summary-badge">↩️ Đổi trả 30 ngày</span>
              <span className="summary-badge">🚚 Giao nhanh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
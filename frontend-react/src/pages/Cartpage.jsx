import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  PartyPopper
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { FREE_SHIPPING_THRESHOLD, formatShippingThreshold } from "../utils/shipping";
import { voucherAPI, userAPI } from "../services/api";
import "./css/Cartpage.css";

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQty, clearCart, getTotalPrice } = useCart();
  const [promoCode,    setPromoCode]    = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const items = cart;

  const toggleSelectItem = (cartItemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(cartItemId)) {
      newSelected.delete(cartItemId);
    } else {
      newSelected.add(cartItemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.cartItemId)));
    }
  };

  const updateItemQty = (cartItemId, delta) => {
    const currentItem = items.find((item) => item.cartItemId === cartItemId);
    if (currentItem) {
      updateQty(cartItemId, Math.max(1, currentItem.qty + delta));
    }
  };

  const removeItem = (cartItemId) => removeFromCart(cartItemId);

  const selectedItemsData = items.filter(item => selectedItems.has(item.cartItemId));
  const subtotal = selectedItemsData.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : null;
  const total    = subtotal - discount + (shipping ?? 0);

  const handlePromo = async () => {
    if (!promoCode) return;
    try {
      const user = userAPI.getCurrentUser();
      const result = await voucherAPI.applyVoucher({
        userId: user?.id,
        code: promoCode,
        subtotal,
        shippingFee: 0,
      });

      if (result.discountAmount > 0) {
        setAppliedVoucher(result);
        setDiscount(Number(result.discountAmount));
        setPromoApplied(true);
      } else {
        alert("Mã giảm giá không áp dụng được cho đơn này.");
      }
    } catch (err) {
      alert(err.message || "Mã giảm giá không hợp lệ.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-inner">
          <div className="cart-empty">
             <div className="cart-empty-icon"><ShoppingBag size={64} style={{ opacity: 0.2 }} /></div>
            <h2>Giỏ hàng trống</h2>
            <p>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi nhé!</p>
            <Link to="/products" className="btn-primary">Mua sắm ngay</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-inner">

        <div className="cart-header">
          <h1 className="cart-title">
            Giỏ hàng <span className="accent">của bạn</span>
          </h1>
          <p className="cart-subtitle">
            {items.length} sản phẩm · {items.reduce((s, i) => s + i.qty, 0)} món
          </p>
        </div>

        <div className="cart-layout">

          {/* ── Danh sách sản phẩm ── */}
          <div className="cart-items-col">
            <div className="cart-items-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  title="Chọn tất cả"
                />
                <span className="cart-items-label">Sản phẩm đã chọn</span>
              </div>
              <button className="cart-clear-btn" onClick={() => clearCart()}>
                Xóa tất cả
              </button>
            </div>

            {items.map((item) => (
              <div key={`${item.cartItemId}`} className="cart-item" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.cartItemId)}
                  onChange={() => toggleSelectItem(item.cartItemId)}
                />
                <div style={{ flex: 1, display: "flex", gap: 12 }}>
                <Link to={`/products/${item.productId}`} className="cart-item-img">
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Link>

                <div className="cart-item-body">
                  <Link
                    to={`/products/${item.productId}`}
                    className="cart-item-name"
                    style={{ textDecoration: "none" }}
                  >
                    {item.name}
                  </Link>

                  <div className="cart-item-meta">
                    <span className="meta-chip">
                      <span
                        style={{
                          display: "inline-block",
                          width: 8, height: 8,
                          borderRadius: "50%",
                          background: item.colorHex,
                          marginRight: 4,
                          verticalAlign: "middle",
                        }}
                      />
                      {item.color}
                    </span>
                    <span className="meta-chip">Size: {item.size}</span>
                  </div>

                  <div className="cart-item-footer">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span className="cart-item-price">
                        {formatPrice(item.price * item.qty)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span 
                            className="cart-item-price-orig"
                            style={{
                              textDecoration: "line-through",
                              color: "var(--text-muted)",
                              fontSize: "0.85rem",
                            }}
                          >
                            {formatPrice(item.originalPrice * item.qty)}
                          </span>
                          <span
                            style={{
                              background: "#dc2626",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            −{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="cart-item-actions">
                       <div className="qty-control-sm">
                         <button className="qty-btn-sm" onClick={() => updateItemQty(item.cartItemId, -1)}><Minus size={12} /></button>
                         <span className="qty-num-sm">{item.qty}</span>
                         <button className="qty-btn-sm" onClick={() => updateItemQty(item.cartItemId,  1)}><Plus size={12} /></button>
                       </div>
                       <button
                         className="cart-item-remove"
                         onClick={() => removeItem(item.cartItemId)}
                         aria-label="Xóa"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ))}

            <div className={`promo-row ${promoApplied ? "applied" : ""}`}>
              <div className="promo-copy">
                <span className="promo-ticket-mark" aria-hidden="true">
                  <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A1.5 1.5 0 0 1 19 6.5v2a3.5 3.5 0 0 0 0 7v2A1.5 1.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 0 4 16.5v-9Z" />
                  </svg>
                </span>
                <div>
                  <strong>Mã ưu đãi</strong>
                  <span>Nhập voucher cho các sản phẩm đã chọn</span>
                </div>
              </div>
              <div className="promo-input-group">
                <input
                  className="promo-input"
                  placeholder="VD: SALE10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={promoApplied}
                />
                <button className="promo-btn" onClick={handlePromo} disabled={promoApplied || selectedItemsData.length === 0}>
                  {promoApplied ? (
                    <>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                      </svg>
                      Đã áp dụng
                    </>
                  ) : "Áp dụng"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Tóm tắt ── */}
          <div className="cart-summary">
            <p className="summary-title">Tóm tắt đơn hàng</p>

            <div className="summary-lines">
              <div className="summary-line">
                <span className="summary-line-label">
                  Tạm tính ({selectedItemsData.reduce((s, i) => s + i.qty, 0)} món)
                </span>
                <span className="summary-line-value">{formatPrice(subtotal)}</span>
              </div>
              {promoApplied && (
                <div className="summary-line discount">
                  <span className="summary-line-label">Giảm giá ({promoCode})</span>
                  <span className="summary-line-value">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="summary-line shipping">
                <span className="summary-line-label">Phí vận chuyển</span>
                <span className="summary-line-value">
                   {shipping === 0 ? "Miễn phí!" : `GHN sẽ tính ở bước thanh toán`}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Đơn từ {formatPrice(FREE_SHIPPING_THRESHOLD)} được miễn phí ship. Đơn dưới mức này sẽ tính theo GHN ở bước thanh toán.
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span className="summary-total-label">Tổng thanh toán</span>
              <span className="summary-total-value">{formatPrice(total)}</span>
            </div>

             <button 
               className="btn-checkout"
               onClick={() => {
                 if (selectedItems.size === 0) {
                   alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán");
                   return;
                 }
                 navigate("/checkout", { 
                   state: { 
                     selectedItems: Array.from(selectedItems),
                     appliedVoucherCode: promoApplied ? promoCode : null
                   } 
                 });
               }}
             >
               Thanh toán ngay <ChevronRight size={18} style={{ marginLeft: 8 }} />
             </button>

             <Link to="/products" className="btn-continue"><ChevronLeft size={16} style={{ marginRight: 8 }} /> Tiếp tục mua sắm</Link>

          </div>
        </div>
      </div>
    </div>
  );
}

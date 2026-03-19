import { useState } from "react";
import "./css/ProductDetailPage.css";

const PRODUCT = {
  id: 1,
  name: "Urban Minimal Tee",
  price: 299000,
  originalPrice: 399000,
  images: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
  ],
  tag: "Bán chạy",
  colors: [
    { hex: "#1a1a1a", name: "Đen" },
    { hex: "#f0f0f2", name: "Trắng" },
    { hex: "#4A90E2", name: "Xanh biển" },
    { hex: "#ff5fa3", name: "Hồng" },
  ],
  sizes: ["XS", "S", "M", "L", "XL"],
  unavailSizes: ["XS"],
  rating: 4.8,
  reviews: 124,
  description: "Áo thun Urban Minimal Tee được thiết kế với phong cách tối giản hiện đại, phù hợp với mọi hoàn cảnh từ đường phố đến văn phòng. Chất liệu cotton cao cấp 100% mang lại cảm giác mềm mại, thoáng mát suốt cả ngày.",
  material: "100% Cotton Premium, 180gsm",
  sku: "UMT-001-BLK",
};

const REVIEWS = [
  { id: 1, name: "Nguyễn Minh Anh", rating: 5, date: "12/03/2025", text: "Áo đẹp lắm, chất vải mềm mịn, mặc rất thoải mái. Size M vừa đúng với người 60kg cao 1m68. Rất hài lòng với sản phẩm!" },
  { id: 2, name: "Trần Thúy Hằng", rating: 4, date: "05/03/2025", text: "Áo đẹp, màu sắc chuẩn như hình. Giao hàng nhanh, đóng gói cẩn thận. Sẽ mua thêm màu khác." },
  { id: 3, name: "Lê Quốc Bảo", rating: 5, date: "28/02/2025", text: "Mua lần 2 rồi, lần nào cũng hài lòng. Chất áo không bị nhăn sau khi giặt. Highly recommend!" },
];

const RELATED = [
  { id: 2, name: "Acid Wash Street", price: 349000, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&h=375&fit=crop" },
  { id: 3, name: "Oversized Graphic", price: 379000, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=375&fit=crop" },
  { id: 4, name: "Clean Line Unisex", price: 259000, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=300&h=375&fit=crop" },
  { id: 5, name: "Vintage Wash Crop", price: 319000, image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=300&h=375&fit=crop" },
];

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

export default function ProductDetailPage() {
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(PRODUCT.colors[0]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loved, setLoved] = useState(false);
  const [activeTab, setActiveTab] = useState("desc");

  const discount = Math.round((1 - PRODUCT.price / PRODUCT.originalPrice) * 100);

  const handleAddCart = () => {
    if (!selectedSize) { alert("Vui lòng chọn size!"); return; }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="detail-page">
      <div className="detail-inner">
        <div className="detail-breadcrumb">
          <a href="/">Trang chủ</a> /
          <a href="/products">Sản phẩm</a> /
          <span>{PRODUCT.name}</span>
        </div>

        <div className="detail-layout">
          {/* Gallery */}
          <div className="gallery-col">
            <div className="gallery-main">
              <img src={PRODUCT.images[activeImg]} alt={PRODUCT.name} />
              <span className="gallery-badge badge-hot">{PRODUCT.tag}</span>
            </div>
            <div className="gallery-thumbs">
              {PRODUCT.images.map((img, i) => (
                <div key={i} className={`thumb ${activeImg === i ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="info-col">
            <div className="product-tag-row">
              <span className="tag-chip hot">✦ {PRODUCT.tag}</span>
              <span className="tag-chip sale">-{discount}%</span>
            </div>

            <h1 className="detail-name">{PRODUCT.name}</h1>

            <div className="detail-rating-row">
              <div className="star-row-lg">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`star-lg ${s <= Math.round(PRODUCT.rating) ? "filled" : ""}`}>★</span>
                ))}
              </div>
              <span className="detail-rating-text">
                <strong>{PRODUCT.rating}</strong> · {PRODUCT.reviews} đánh giá
              </span>
            </div>

            <div className="detail-price-row">
              <span className="detail-price">{formatPrice(PRODUCT.price)}</span>
              <span className="detail-price-orig">{formatPrice(PRODUCT.originalPrice)}</span>
              <span className="detail-discount-badge">-{discount}%</span>
            </div>

            <div className="detail-stock">
              <span className="stock-dot" />
              Còn hàng · Giao ngay hôm nay
            </div>

            <div className="detail-divider" />

            {/* Color */}
            <p className="selector-label">Màu sắc — <span style={{ color: "var(--text-secondary)", textTransform: "none", letterSpacing: 0 }}>{selectedColor.name}</span></p>
            <div className="color-selector">
              {PRODUCT.colors.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch-lg ${selectedColor.hex === c.hex ? "selected" : ""}`}
                  style={{ background: c.hex, border: c.hex === "#f0f0f2" ? "1.5px solid rgba(255,255,255,0.2)" : undefined }}
                  onClick={() => setSelectedColor(c)}
                  title={c.name}
                />
              ))}
            </div>

            {/* Size */}
            <p className="selector-label">Kích thước {!selectedSize && <span style={{ color: "var(--accent)", textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-body)" }}>— Chọn size</span>}</p>
            <div className="size-selector">
              {PRODUCT.sizes.map((s) => (
                <button
                  key={s}
                  className={`size-btn ${selectedSize === s ? "active" : ""} ${PRODUCT.unavailSizes.includes(s) ? "unavail" : ""}`}
                  onClick={() => !PRODUCT.unavailSizes.includes(s) && setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <a className="size-guide-link">📏 Hướng dẫn chọn size</a>

            <div className="detail-divider" />

            {/* Qty */}
            <div className="quantity-row">
              <p className="selector-label" style={{ margin: 0 }}>Số lượng</p>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            </div>

            {/* CTA */}
            <div className="detail-cta">
              <button className={`btn-add-cart ${added ? "added" : ""}`} onClick={handleAddCart}>
                {added ? "✓ Đã thêm vào giỏ!" : (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2"/>
                      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Thêm vào giỏ hàng
                  </>
                )}
              </button>
              <button className={`btn-wishlist-lg ${loved ? "loved" : ""}`} onClick={() => setLoved(!loved)}>
                <svg width="20" height="20" fill={loved ? "currentColor" : "none"} viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            {/* Shipping */}
            <div className="shipping-info">
              <div className="shipping-item"><span className="shipping-icon">🚚</span> Giao hàng miễn phí đơn từ 299.000đ</div>
              <div className="shipping-item"><span className="shipping-icon">↩️</span> Đổi trả miễn phí trong 30 ngày</div>
              <div className="shipping-item"><span className="shipping-icon">🔒</span> Thanh toán bảo mật qua VNPAY / Momo</div>
              <div className="shipping-item"><span className="shipping-icon">✅</span> Cam kết hàng chính hãng 100%</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <div className="tab-bar">
            {[{ key: "desc", label: "Mô tả sản phẩm" }, { key: "reviews", label: `Đánh giá (${PRODUCT.reviews})` }, { key: "size", label: "Bảng size" }].map((t) => (
              <button key={t.key} className={`tab-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === "desc" && (
              <div className="tab-desc">
                <p>{PRODUCT.description}</p>
                <p>Thiết kế cổ tròn vừa phải, tay ngắn regular fit, phù hợp với nhiều vóc dáng. Màu sắc bền đẹp sau nhiều lần giặt, không phai màu hay co rút.</p>
                <div className="tab-features">
                  {["Chất liệu: " + PRODUCT.material, "Xuất xứ: Việt Nam", "Trọng lượng: ~180g", "Dày dặn, không nhăn"].map((f) => (
                    <div key={f} className="tab-feature">
                      <span className="tab-feature-dot" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="reviews-summary">
                  <div className="review-big-score">
                    <div className="review-score-num">{PRODUCT.rating}</div>
                    <div className="star-row-lg" style={{ justifyContent: "center" }}>
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`star-lg ${s <= Math.round(PRODUCT.rating) ? "filled" : ""}`}>★</span>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{PRODUCT.reviews} đánh giá</p>
                  </div>
                  <div className="review-bars">
                    {[{stars:5,pct:72},{stars:4,pct:18},{stars:3,pct:7},{stars:2,pct:2},{stars:1,pct:1}].map((r) => (
                      <div key={r.stars} className="review-bar-row">
                        <span style={{ color: "#fbbf24", minWidth: 14 }}>★</span>
                        <span style={{ minWidth: 8, color: "var(--text-muted)" }}>{r.stars}</span>
                        <div className="review-bar-track">
                          <div className="review-bar-fill" style={{ width: r.pct + "%" }} />
                        </div>
                        <span style={{ color: "var(--text-muted)", minWidth: 28 }}>{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="review-list">
                  {REVIEWS.map((r) => (
                    <div key={r.id} className="review-item">
                      <div className="review-author">
                        <div className="review-avatar">{r.name[0]}</div>
                        <div className="review-meta">
                          <p className="review-name">{r.name}</p>
                          <p className="review-date">{r.date}</p>
                        </div>
                        <div className="star-row-lg">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className={`star-lg ${s <= r.rating ? "filled" : ""}`} style={{ fontSize: "0.85rem" }}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "size" && (
              <div>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>Đo kích thước ở điểm rộng nhất của cơ thể.</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-2)" }}>
                      {["Size", "Chiều dài (cm)", "Rộng ngực (cm)", "Cân nặng (kg)"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[["XS","62","44","45–52"],["S","64","47","52–59"],["M","66","50","59–67"],["L","68","53","67–75"],["XL","70","56","75–85"]].map((row) => (
                      <tr key={row[0]} style={{ borderBottom: "1px solid var(--border)" }}>
                        {row.map((cell, i) => (
                          <td key={i} style={{ padding: "10px 16px", color: i === 0 ? "var(--accent)" : "var(--text-secondary)", fontWeight: i === 0 ? 700 : 400 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        <div className="related-section">
          <h2 className="related-title">Có thể bạn cũng thích <span className="accent">✦</span></h2>
          <div className="related-grid">
            {RELATED.map((p) => (
              <a key={p.id} href={`/products/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="product-card" style={{ cursor: "pointer" }}>
                  <div className="product-img-wrap" style={{ aspectRatio: "4/5" }}>
                    <img src={p.image} alt={p.name} className="product-img" />
                  </div>
                  <div className="product-info">
                    <p className="product-name">{p.name}</p>
                    <span className="price-current">{formatPrice(p.price)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
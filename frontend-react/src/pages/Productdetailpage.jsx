import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById, getRelatedProducts, ALL_PRODUCTS } from "../data/Products";
import "./css/ProductDetailPage.css";

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

/* ─── Star helper ─────────────────────────────────────── */
function Stars({ rating, size = "sm" }) {
  return (
    <div className={`star-row-${size}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`star-${size} ${s <= Math.round(rating) ? "filled" : ""}`}>★</span>
      ))}
    </div>
  );
}

/* ─── Related card ────────────────────────────────────── */
function RelatedCard({ product }) {
  const thumb = Array.isArray(product.images) ? product.images[0] : product.image;
  return (
    <Link to={`/products/${product.id}`} className="related-card" style={{ textDecoration: "none" }}>
      <div className="related-img">
        <img src={thumb} alt={product.name} />
        {product.tag && (
          <span className={`product-badge badge-${product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"}`}>
            {product.tag}
          </span>
        )}
      </div>
      <div className="related-info">
        <p className="related-name">{product.name}</p>
        <Stars rating={product.rating} size="sm" />
        <div className="related-price-row">
          <span className="related-price">{fmt(product.price)}</span>
          {product.originalPrice && <span className="related-orig">{fmt(product.originalPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function ProductDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const product    = getProductById(id);
  const related    = product ? getRelatedProducts(product, 4) : [];

  const [activeImg,  setActiveImg]  = useState(0);
  const [selColor,   setSelColor]   = useState(null);
  const [selSize,    setSelSize]    = useState(null);
  const [qty,        setQty]        = useState(1);
  const [added,      setAdded]      = useState(false);
  const [loved,      setLoved]      = useState(false);
  const [activeTab,  setActiveTab]  = useState("desc");
  const [sizeErr,    setSizeErr]    = useState(false);

  /* Reset khi chuyển sản phẩm */
  useEffect(() => {
    setActiveImg(0);
    setSelColor(product?.colors?.[0] || null);
    setSelSize(null);
    setQty(1);
    setAdded(false);
    setSizeErr(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  /* Sản phẩm không tồn tại */
  if (!product) {
    return (
      <div className="detail-page">
        <div className="detail-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontSize: "3rem", marginBottom: 16 }}>😕</p>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Không tìm thấy sản phẩm</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
            Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa.
          </p>
          <Link to="/products" className="btn-primary">← Xem tất cả sản phẩm</Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleAddCart = () => {
    if (!selSize) { setSizeErr(true); return; }
    setSizeErr(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const TABS = [
    { key: "desc",    label: "Mô tả sản phẩm"           },
    { key: "reviews", label: `Đánh giá (${product.reviews})` },
    { key: "size",    label: "Bảng size"                 },
  ];

  /* Rating distribution (giả lập) */
  const ratingDist = [
    { stars: 5, pct: 72 }, { stars: 4, pct: 18 },
    { stars: 3, pct: 7  }, { stars: 2, pct: 2  },
    { stars: 1, pct: 1  },
  ];

  return (
    <div className="detail-page">
      <div className="detail-inner">

        {/* Breadcrumb */}
        <nav className="detail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/products">Sản phẩm</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        {/* ── Main layout ── */}
        <div className="detail-layout">

          {/* ── Gallery ── */}
          <div className="gallery-col">
            <div className="gallery-main">
              <img src={product.images[activeImg]} alt={product.name} />
              {product.tag && (
                <span className={`gallery-badge badge-${
                  product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"
                }`}>{product.tag}</span>
              )}
              {/* Prev / Next arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    className="gallery-arrow prev"
                    onClick={() => setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)}
                  >‹</button>
                  <button
                    className="gallery-arrow next"
                    onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
                  >›</button>
                </>
              )}
            </div>
            <div className="gallery-thumbs">
              {product.images.map((img, i) => (
                <div key={i} className={`thumb ${activeImg === i ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Info ── */}
          <div className="info-col">
            {/* Tags */}
            <div className="product-tag-row">
              {product.tag && (
                <span className={`tag-chip ${product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"}`}>
                  ✦ {product.tag}
                </span>
              )}
              {discount && <span className="tag-chip sale">-{discount}%</span>}
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="detail-name">{product.name}</h1>

            {/* Rating */}
            <div className="detail-rating-row">
              <Stars rating={product.rating} size="lg" />
              <span className="detail-rating-text">
                <strong>{product.rating}</strong> · {product.reviews} đánh giá · {product.sold} đã bán
              </span>
            </div>

            {/* Price */}
            <div className="detail-price-row">
              <span className="detail-price">{fmt(product.price)}</span>
              {product.originalPrice && <span className="detail-price-orig">{fmt(product.originalPrice)}</span>}
              {discount && <span className="detail-discount-badge">-{discount}%</span>}
            </div>

            <div className="detail-stock">
              <span className="stock-dot" />
              Còn hàng · Giao ngay hôm nay
            </div>

            <div className="detail-divider" />

            {/* Color */}
            <p className="selector-label">
              Màu sắc
              {selColor && <span className="selector-chosen"> — {selColor.name}</span>}
            </p>
            <div className="color-selector">
              {product.colors.map((c) => (
                <button
                  key={c.hex}
                  className={`color-swatch-lg ${selColor?.hex === c.hex ? "selected" : ""}`}
                  style={{
                    background: c.hex,
                    border: c.hex === "#f0f0f2" || c.hex === "#ffffff"
                      ? "1.5px solid rgba(255,255,255,0.25)" : undefined,
                  }}
                  title={c.name}
                  onClick={() => setSelColor(c)}
                />
              ))}
            </div>

            {/* Size */}
            <p className="selector-label" style={{ color: sizeErr ? "#ff6b6b" : undefined }}>
              Kích thước
              {!selSize && <span style={{ color: sizeErr ? "#ff6b6b" : "var(--accent)", fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: 0 }}>
                {sizeErr ? " — Vui lòng chọn size!" : " — Chọn size"}
              </span>}
              {selSize && <span className="selector-chosen"> — {selSize}</span>}
            </p>
            <div className="size-selector">
              {product.sizes.map((s) => {
                const unavail = product.unavailSizes?.includes(s);
                return (
                  <button
                    key={s}
                    className={`size-btn ${selSize === s ? "active" : ""} ${unavail ? "unavail" : ""}`}
                    onClick={() => { if (!unavail) { setSelSize(s); setSizeErr(false); } }}
                    title={unavail ? "Hết hàng" : s}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <span className="size-guide-link">📏 Hướng dẫn chọn size</span>

            <div className="detail-divider" />

            {/* Qty */}
            <div className="quantity-row">
              <p className="selector-label" style={{ margin: 0 }}>Số lượng</p>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {product.sold}+ đã mua
              </span>
            </div>

            {/* CTA */}
            <div className="detail-cta">
              <button
                className={`btn-add-cart ${added ? "added" : ""}`}
                onClick={handleAddCart}
              >
                {added ? (
                  "✓ Đã thêm vào giỏ!"
                ) : (
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
              <button
                className={`btn-wishlist-lg ${loved ? "loved" : ""}`}
                onClick={() => setLoved((v) => !v)}
                aria-label="Yêu thích"
              >
                <svg width="20" height="20" fill={loved ? "currentColor" : "none"} viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            {/* Shipping */}
            <div className="shipping-info">
              <div className="shipping-item"><span className="shipping-icon">🚚</span> Miễn phí giao hàng đơn từ 299.000đ</div>
              <div className="shipping-item"><span className="shipping-icon">↩️</span> Đổi trả miễn phí trong 30 ngày</div>
              <div className="shipping-item"><span className="shipping-icon">🔒</span> Thanh toán bảo mật qua VNPAY / Momo</div>
              <div className="shipping-item"><span className="shipping-icon">✅</span> Cam kết hàng chính hãng 100%</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="detail-tabs">
          <div className="tab-bar">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* Description */}
            {activeTab === "desc" && (
              <div className="tab-desc">
                <p>{product.description}</p>
                <div className="tab-features">
                  {(product.features || []).map((f) => (
                    <div key={f} className="tab-feature">
                      <span className="tab-feature-dot" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div>
                <div className="reviews-summary">
                  <div className="review-big-score">
                    <div className="review-score-num">{product.rating}</div>
                    <Stars rating={product.rating} size="lg" />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                      {product.reviews} đánh giá
                    </p>
                  </div>
                  <div className="review-bars">
                    {ratingDist.map((r) => (
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
                  {(product.reviewList || []).map((r) => (
                    <div key={r.id} className="review-item">
                      <div className="review-author">
                        <div className="review-avatar">{r.name[0]}</div>
                        <div className="review-meta">
                          <p className="review-name">{r.name}</p>
                          <p className="review-date">{r.date}</p>
                        </div>
                        <Stars rating={r.rating} size="sm" />
                      </div>
                      <p className="review-text">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Size chart */}
            {activeTab === "size" && (
              <div>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                  Đo kích thước ở điểm rộng nhất của cơ thể khi mặc đồ lót. Đơn vị: cm.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table className="size-table">
                    <thead>
                      <tr>
                        {["Size", "Chiều dài", "Rộng ngực", "Rộng vai", "Cân nặng (kg)"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["XS", "62", "44", "38", "45–52"],
                        ["S",  "64", "47", "40", "52–59"],
                        ["M",  "66", "50", "42", "59–67"],
                        ["L",  "68", "53", "44", "67–75"],
                        ["XL", "70", "56", "46", "75–85"],
                        ["XXL","72", "60", "49", "85–95"],
                      ].map((row) => (
                        <tr key={row[0]} className={selSize === row[0] ? "size-row-active" : ""}>
                          {row.map((cell, i) => <td key={i}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 16 }}>
                  💡 Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn.
                  Với dáng oversized, nên chọn nhỏ hơn 1 size.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div className="related-section">
            <div className="related-header">
              <h2 className="related-title">Có thể bạn cũng thích <span className="accent">✦</span></h2>
              <Link to="/products" className="related-see-all">Xem tất cả →</Link>
            </div>
            <div className="related-grid">
              {related.map((p) => <RelatedCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
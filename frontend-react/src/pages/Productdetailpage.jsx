import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productAPI, reviewAPI } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { getDisplayRating, getSizeOptions } from "../utils/productDisplay";
import "./css/Productdetailpage.css";

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

/* ─── Star helper ─────────────────────────────────────── */
function Stars({ rating, size = "sm" }) {
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  return (
    <div className={`star-row-${size}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`star-${size} ${s <= Math.round(safeRating) ? "filled" : ""}`}>★</span>
      ))}
    </div>
  );
}

/* ─── Related card ────────────────────────────────────── */
function RelatedCard({ product }) {
  const rating = getDisplayRating(product);
  const thumb = product.images && product.images.length > 0 
    ? product.images[0].url 
    : (product.image || 'https://via.placeholder.com/300x400?text=No+Image');
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
        <Stars rating={rating} size="sm" />
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
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [activeImg,  setActiveImg]  = useState(0);
  const [selColor,   setSelColor]   = useState(null);
  const [selSize,    setSelSize]    = useState(null);
  const [qty,        setQty]        = useState(1);
  const [added,      setAdded]      = useState(false);
  const [activeTab,  setActiveTab]  = useState("desc");
  const [sizeErr,    setSizeErr]    = useState(false);

  // Fetch product when id changes
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getProductById(id);
        setProduct(data);
        setError(null);
        
        // Set default color
        if (data.colors && data.colors.length > 0) {
          setSelColor(data.colors[0]);
        }
      } catch (err) {
        setError("Không tìm thấy sản phẩm");
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProduct();
    }
  }, [id]);

  /* Reset khi chuyển sản phẩm */
  useEffect(() => {
    setActiveImg(0);
    setSelColor(product?.colors?.[0] || null);
    setSelSize(null);
    setQty(1);
    setAdded(false);
    setSizeErr(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product?.id]);

  /* Fetch reviews khi product id thay đổi */
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        setReviewsLoading(true);
        const data = await reviewAPI.getReviewsByProductId(id);
        setReviews(data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    
    fetchReviews();
  }, [id]);

  /* Sản phẩm không tồn tại */
  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontSize: "2rem", marginBottom: 16 }}>⏳</p>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Đang tải sản phẩm...</h2>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="detail-page">
        <div className="detail-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontSize: "3rem", marginBottom: 16 }}>😕</p>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Không tìm thấy sản phẩm</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
            {error || "Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa."}
          </p>
          <Link to="/products" className="btn-primary">← Xem tất cả sản phẩm</Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const displayRating = getDisplayRating(product);
  const sizeOptions = getSizeOptions(product);
  const reviewCount = Number(product?.reviewCount ?? 0);
  const soldCount = Number(product?.sold ?? 0);
  const availableSizeCount = sizeOptions.filter((size) => size.isAvailable).length;
  const isProductSellable = product?.isActive !== false && availableSizeCount > 0;

  // Format prices to handle both number and string
  const formatPrice = (p) => {
    const num = typeof p === 'string' ? parseFloat(p) : p;
    return num.toLocaleString("vi-VN") + "đ";
  };

  const handleAddCart = () => {
    if (!isProductSellable) {
      addToast("Sản phẩm hiện không khả dụng", "error", 3000);
      return;
    }

    if (!selSize) { setSizeErr(true); return; }
    setSizeErr(false);
    
    // Thêm vào giỏ hàng
    addToCart(product, selColor, selSize, qty);
    
    // Hiển thị thông báo
    addToast(`✓ Đã thêm ${qty} ${product.name} vào giỏ hàng`, 'success', 3000);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const TABS = [
    { key: "desc",    label: "Mô tả sản phẩm"           },
    { key: "reviews", label: `Đánh giá (${reviewCount})` },
    { key: "size",    label: "Bảng size"                 },
  ];

  /* Tính toán rating distribution từ reviews thực tế */
  const calculateRatingDist = () => {
    if (reviews.length === 0) {
      return [
        { stars: 5, pct: 0, count: 0 },
        { stars: 4, pct: 0, count: 0 },
        { stars: 3, pct: 0, count: 0 },
        { stars: 2, pct: 0, count: 0 },
        { stars: 1, pct: 0, count: 0 },
      ];
    }

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = Number(r.rating) || 0;
      if (rating >= 1 && rating <= 5) {
        counts[rating]++;
      }
    });

    const total = reviews.length;
    return [
      { stars: 5, count: counts[5], pct: Math.round((counts[5] / total) * 100) },
      { stars: 4, count: counts[4], pct: Math.round((counts[4] / total) * 100) },
      { stars: 3, count: counts[3], pct: Math.round((counts[3] / total) * 100) },
      { stars: 2, count: counts[2], pct: Math.round((counts[2] / total) * 100) },
      { stars: 1, count: counts[1], pct: Math.round((counts[1] / total) * 100) },
    ];
  };

  const ratingDist = calculateRatingDist();

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
              <img src={product.images && product.images[activeImg] ? product.images[activeImg].url : ''} alt={product.name} />
              {product.tag && (
                <span className={`gallery-badge badge-${
                  product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"
                }`}>{product.tag}</span>
              )}
              {/* Prev / Next arrows */}
              {product.images && product.images.length > 1 && (
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
              {product.images && product.images.map((img, i) => (
                <div key={i} className={`thumb ${activeImg === i ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                  <img src={img.url} alt="" />
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
              <Stars rating={displayRating} size="lg" />
              <span className="detail-rating-text">
                <strong>{displayRating}</strong> · {reviewCount} đánh giá · {soldCount} đã bán
              </span>
            </div>

            {/* Price */}
            <div className="detail-price-row">
              <span className="detail-price">{formatPrice(product.price)}</span>
              {product.originalPrice && <span className="detail-price-orig">{formatPrice(product.originalPrice)}</span>}
              {discount && <span className="detail-discount-badge">-{discount}%</span>}
            </div>

            <div className="detail-stock">
              <span className="stock-dot" />
              {product.isActive === false
                ? "Ngừng kinh doanh"
                : availableSizeCount > 0
                  ? `Còn ${availableSizeCount} size đang bán`
                  : "Hết hàng"}
            </div>

            {/* Material */}
            {product.material && (
              <div className="detail-material">
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "10px 0 5px 0" }}>
                  <strong>Chất liệu:</strong> {product.material}
                </p>
              </div>
            )}

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
              {sizeOptions.map((s) => {
                const sizeValue = s.value;
                return (
                  <button
                    key={sizeValue}
                    className={`size-btn ${selSize === sizeValue ? "active" : ""} ${s.isAvailable ? "" : "unavail"}`}
                    onClick={() => {
                      if (!s.isAvailable) return;
                      setSelSize(sizeValue);
                      setSizeErr(false);
                    }}
                    disabled={!s.isAvailable}
                    title={s.isAvailable ? sizeValue : `${sizeValue} - Hết hàng`}
                  >
                    {sizeValue}
                  </button>
                );
              })}
            </div>
            {sizeOptions.length > 0 && sizeOptions.every((size) => !size.isAvailable) && (
              <p style={{ fontSize: "0.82rem", color: "#ffb4b4", marginTop: 8 }}>
                Sản phẩm hiện đã hết size.
              </p>
            )}
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
                Đã mua {soldCount.toLocaleString("vi-VN")} sản phẩm
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
                className={`btn-wishlist-lg ${product && isInWishlist(product.id) ? "loved" : ""}`}
                onClick={() => product && toggleWishlist(product)}
                aria-label="Yêu thích"
              >
                <svg width="20" height="20" fill={product && isInWishlist(product.id) ? "currentColor" : "none"} viewBox="0 0 24 24">
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
                    <div className="review-score-num">{displayRating}</div>
                    <Stars rating={displayRating} size="lg" />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                      {reviewCount} đánh giá
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
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                      <p style={{ fontSize: "3rem", marginBottom: 12 }}>📝</p>
                      <p>Chưa có bình luận nào</p>
                      <p style={{ fontSize: "0.9rem", marginTop: 8 }}>Hãy là người đầu tiên bình luận về sản phẩm này!</p>
                    </div>
                  ) : (
                    reviews.map((r) => {
                      const reviewDate = r.createdAt 
                        ? new Date(r.createdAt).toLocaleDateString('vi-VN')
                        : 'N/A';
                      return (
                        <div key={r.id} className="review-item">
                          <div className="review-author">
                            <div className="review-avatar">{r.reviewerName?.[0]?.toUpperCase() || '?'}</div>
                            <div className="review-meta">
                              <p className="review-name">{r.reviewerName}</p>
                              <p className="review-date">{reviewDate}</p>
                            </div>
                            <Stars rating={r.rating} size="sm" />
                          </div>
                          <p className="review-text">{r.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Size chart */}
            {activeTab === "size" && (
              <div>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                  {product.type === "Quần" 
                    ? "Đo kích thước ở hông và chiều dài toàn bộ. Đơn vị: cm."
                    : "Đo kích thước ở điểm rộng nhất của cơ thể khi mặc đồ lót. Đơn vị: cm."
                  }
                </p>
                <div style={{ overflowX: "auto" }}>
                  {product.type === "Quần" ? (
                    <table className="size-table">
                      <thead>
                        <tr>
                          {["Size", "Hông (cm)", "Chiều dài (cm)", "Chiều dài bước (cm)", "Cân nặng (kg)"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["26", "66", "96", "72", "45–52"],
                          ["27", "68", "97", "73", "50–57"],
                          ["28", "70", "98", "74", "52–59"],
                          ["29", "72", "99", "75", "57–64"],
                          ["30", "74", "100", "76", "64–71"],
                          ["31", "76", "101", "77", "71–78"],
                          ["32", "78", "102", "78", "78–85"],
                          ["34", "82", "104", "80", "85–95"],
                          ["35", "84", "105", "81", "90–100"],
                          ["36", "86", "106", "82", "95–105"],
                        ].map((row) => (
                          <tr key={row[0]} className={selSize === row[0] ? "size-row-active" : ""}>
                            {row.map((cell, i) => <td key={i}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
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
                  )}
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 16 }}>
                  {product.type === "Quần"
                    ? "💡 Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn. Chiều dài bước (inseam) là khoảng cách từ crotch đến mắt cá chân."
                    : "💡 Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn. Với dáng oversized, nên chọn nhỏ hơn 1 size."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Related products ── */}
        {related && related.length > 0 && (
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
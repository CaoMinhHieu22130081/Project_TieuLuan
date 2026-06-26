import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  Loader2,
  SearchX,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Ruler,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  Lock,
  CheckCircle2,
  FileText,
  Clock
} from "lucide-react";
import { productAPI, reviewAPI } from "../services/api";
import { formatShippingThreshold } from "../utils/shipping";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../i18n/LanguageContext";
import { formatCurrency, formatDate, formatNumber } from "../utils/i18nFormat";
import { getDisplayRating, getSizeOptions } from "../utils/productDisplay";
import "./css/Productdetailpage.css";

/* ─── Star helper ─────────────────────────────────────── */
function Stars({ rating, size = "sm" }) {
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const dimension = size === "lg" ? 18 : 14;
  return (
    <div className={`star-row-${size}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={dimension}
          fill={s <= Math.round(safeRating) ? "#ffb300" : "none"}
          stroke={s <= Math.round(safeRating) ? "#ffb300" : "#444"}
          style={{ marginRight: 2 }}
        />
      ))}
    </div>
  );
}

/* ─── Related card ────────────────────────────────────── */
function RelatedCard({ product, formatPrice }) {
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
          <span className="related-price">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="related-orig">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function ProductDetailPage() {
  const { id }     = useParams();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { language, t } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);

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

        try {
          const relatedData = await productAPI.getRelatedProducts(id, 6);
          setRelated(
            (relatedData || []).filter((item) => Number(item.id) !== Number(id))
          );
        } catch (relatedError) {
          console.error("Error fetching related products:", relatedError);
          setRelated([]);
        }
      } catch (err) {
        setError("not_found");
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
  }, [product?.id, product?.colors]);

  /* Fetch reviews khi product id thay đổi */
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const data = await reviewAPI.getReviewsByProductId(id);
        setReviews(data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    
    fetchReviews();
  }, [id]);

  /* Sản phẩm không tồn tại */
  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <Loader2 className="animate-spin" size={48} style={{ color: "var(--accent)", marginBottom: 16, display: 'inline-block' }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>
            {t({ vi: "Đang tải sản phẩm...", en: "Loading product..." })}
          </h2>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="detail-page">
        <div className="detail-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <SearchX size={64} style={{ opacity: 0.3, marginBottom: 16, display: 'inline-block' }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>
            {t({ vi: "Không tìm thấy sản phẩm", en: "Product not found" })}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
            {t({ vi: "Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa.", en: "The product you are looking for does not exist or has been removed." })}
          </p>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ChevronLeft size={18} /> {t({ vi: "Xem tất cả sản phẩm", en: "View all products" })}
          </Link>
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
    return formatCurrency(num, language);
  };

  const handleAddCart = () => {
    if (!isProductSellable) {
      addToast({ vi: "Sản phẩm hiện không khả dụng", en: "This product is currently unavailable" }, "error", 3000);
      return;
    }

    if (!selSize) { setSizeErr(true); return; }
    setSizeErr(false);
    
    // Thêm vào giỏ hàng
    addToCart(product, selColor, selSize, qty);
    
    // Hiển thị thông báo
    addToast({
      vi: `✓ Đã thêm ${qty} ${product.name} vào giỏ hàng`,
      en: `✓ Added ${qty} ${product.name} to cart`,
    }, 'success', 3000);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const TABS = [
    { key: "desc",    label: t({ vi: "Mô tả sản phẩm", en: "Product description" }) },
    { key: "reviews", label: t({ vi: `Đánh giá (${reviewCount})`, en: `Reviews (${reviewCount})` }) },
    { key: "size",    label: t({ vi: "Bảng size", en: "Size chart" }) },
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
          <Link to="/">{t({ vi: "Trang chủ", en: "Home" })}</Link>
          <span>/</span>
          <Link to="/products">{t({ vi: "Sản phẩm", en: "Products" })}</Link>
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
                  ><ChevronLeft size={24} /></button>
                  <button
                    className="gallery-arrow next"
                    onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
                  ><ChevronRight size={24} /></button>
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
                  <Sparkles size={12} style={{ marginRight: 4 }} /> {product.tag}
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
                <strong>{displayRating}</strong> · {reviewCount} {t({ vi: "đánh giá", en: "reviews" })} · {soldCount} {t({ vi: "đã bán", en: "sold" })}
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
                ? t({ vi: "Ngừng kinh doanh", en: "Discontinued" })
                : availableSizeCount > 0
                  ? t({ vi: `Còn ${availableSizeCount} size đang bán`, en: `${availableSizeCount} sizes available` })
                  : t({ vi: "Hết hàng", en: "Out of stock" })}
            </div>

            {/* Material */}
            {product.material && (
              <div className="detail-material">
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "10px 0 5px 0" }}>
                  <strong>{t({ vi: "Chất liệu:", en: "Material:" })}</strong> {product.material}
                </p>
              </div>
            )}

            <div className="detail-divider" />

            {/* Color */}
            <p className="selector-label">
              {t({ vi: "Màu sắc", en: "Color" })}
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
            <p className="selector-label" style={{ color: sizeErr ? "#dc2626" : undefined }}>
              {t({ vi: "Kích thước", en: "Size" })}
              {!selSize && <span style={{ color: sizeErr ? "#dc2626" : "var(--accent)", fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: 0 }}>
                {sizeErr
                  ? t({ vi: " — Vui lòng chọn size!", en: " — Please choose a size!" })
                  : t({ vi: " — Chọn size", en: " — Choose size" })}
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
                    title={s.isAvailable ? sizeValue : t({ vi: `${sizeValue} - Hết hàng`, en: `${sizeValue} - Out of stock` })}
                  >
                    {sizeValue}
                  </button>
                );
              })}
            </div>
            {sizeOptions.length > 0 && sizeOptions.every((size) => !size.isAvailable) && (
              <p style={{ fontSize: "0.82rem", color: "#ffb4b4", marginTop: 8 }}>
                {t({ vi: "Sản phẩm hiện đã hết size.", en: "This product is currently out of stock in every size." })}
              </p>
            )}
            <span className="size-guide-link"><Ruler size={14} style={{ marginRight: 6 }} /> {t({ vi: "Hướng dẫn chọn size", en: "Size guide" })}</span>

            <div className="detail-divider" />

            {/* Qty */}
            <div className="quantity-row">
              <p className="selector-label" style={{ margin: 0 }}>{t({ vi: "Số lượng", en: "Quantity" })}</p>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty((q) => q + 1)}><Plus size={14} /></button>
              </div>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {t({ vi: `Đã mua ${formatNumber(soldCount, language)} sản phẩm`, en: `${formatNumber(soldCount, language)} products sold` })}
              </span>
            </div>

            {/* CTA */}
            <div className="detail-cta">
              <button
                className={`btn-add-cart ${added ? "added" : ""}`}
                onClick={handleAddCart}
              >
                {added ? (
                  <><Check size={18} style={{ marginRight: 8 }} /> {t({ vi: "Đã thêm vào giỏ!", en: "Added to cart!" })}</>
                ) : (
                  <>
                    <ShoppingBag size={18} style={{ marginRight: 8 }} />
                    {t({ vi: "Thêm vào giỏ hàng", en: "Add to cart" })}
                  </>
                )}
              </button>
              <button
                className={`btn-wishlist-lg ${product && isInWishlist(product.id) ? "loved" : ""}`}
                onClick={() => product && toggleWishlist(product)}
                aria-label={t({ vi: "Yêu thích", en: "Wishlist" })}
              >
                <Heart size={20} fill={product && isInWishlist(product.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Shipping */}
            <div className="shipping-info">
              <div className="shipping-item"><Truck size={14} style={{ marginRight: 8, color: "var(--accent)" }} /> {t({ vi: `Miễn phí giao hàng đơn từ ${formatShippingThreshold(language)}`, en: `Free shipping from ${formatShippingThreshold(language)}` })}</div>
              <div className="shipping-item"><RotateCcw size={14} style={{ marginRight: 8, color: "var(--accent)" }} /> {t({ vi: "Đổi trả miễn phí trong 30 ngày", en: "Free returns within 30 days" })}</div>
              <div className="shipping-item"><Lock size={14} style={{ marginRight: 8, color: "var(--accent)" }} /> {t({ vi: "Thanh toán bảo mật qua VNPAY / Momo", en: "Secure payment via VNPAY / Momo" })}</div>
              <div className="shipping-item"><CheckCircle2 size={14} style={{ marginRight: 8, color: "var(--accent)" }} /> {t({ vi: "Cam kết hàng chính hãng 100%", en: "100% authentic products guaranteed" })}</div>
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
                      {reviewCount} {t({ vi: "đánh giá", en: "reviews" })}
                    </p>
                  </div>
                  <div className="review-bars">
                    {ratingDist.map((r) => (
                      <div key={r.stars} className="review-bar-row">
                         <Star size={12} fill="#b45309" stroke="#b45309" style={{ marginRight: 4 }} />
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
                      <FileText size={48} style={{ opacity: 0.2, marginBottom: 12, display: 'inline-block' }} />
                      <p>{t({ vi: "Chưa có bình luận nào", en: "No reviews yet" })}</p>
                      <p style={{ fontSize: "0.9rem", marginTop: 8 }}>
                        {t({ vi: "Hãy là người đầu tiên bình luận về sản phẩm này!", en: "Be the first to review this product!" })}
                      </p>
                    </div>
                  ) : (
                    reviews.map((r) => {
                      const reviewDate = r.createdAt 
                        ? formatDate(r.createdAt, language)
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
                          {r.adminReply && (
                            <div className="review-admin-reply" style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(var(--accent-rgb), 0.06)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t({ vi: "Phản hồi từ cửa hàng", en: "Store reply" })}
                              </p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{r.adminReply}</p>
                            </div>
                          )}
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
                    ? t({ vi: "Đo kích thước ở hông và chiều dài toàn bộ. Đơn vị: cm.", en: "Measure hips and full length. Unit: cm." })
                    : t({ vi: "Đo kích thước ở điểm rộng nhất của cơ thể khi mặc đồ lót. Đơn vị: cm.", en: "Measure the widest point of the body while wearing underwear. Unit: cm." })
                  }
                </p>
                <div style={{ overflowX: "auto" }}>
                  {product.type === "Quần" ? (
                    <table className="size-table">
                      <thead>
                        <tr>
                          {[
                            "Size",
                            t({ vi: "Hông (cm)", en: "Hips (cm)" }),
                            t({ vi: "Chiều dài (cm)", en: "Length (cm)" }),
                            t({ vi: "Chiều dài bước (cm)", en: "Inseam (cm)" }),
                            t({ vi: "Cân nặng (kg)", en: "Weight (kg)" }),
                          ].map((h) => (
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
                          {[
                            "Size",
                            t({ vi: "Chiều dài", en: "Length" }),
                            t({ vi: "Rộng ngực", en: "Chest width" }),
                            t({ vi: "Rộng vai", en: "Shoulder width" }),
                            t({ vi: "Cân nặng (kg)", en: "Weight (kg)" }),
                          ].map((h) => (
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
                    <Sparkles size={12} style={{ marginRight: 6, display: 'inline' }} />
                    {product.type === "Quần"
                      ? t({ vi: "Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn. Chiều dài bước (inseam) là khoảng cách từ đáy quần đến mắt cá chân.", en: "If your measurement is between two sizes, choose the larger size. Inseam is measured from the crotch to the ankle." })
                      : t({ vi: "Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn. Với dáng oversized, nên chọn nhỏ hơn 1 size.", en: "If your measurement is between two sizes, choose the larger size. For an oversized fit, choose one size smaller." })
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
              <h2 className="related-title">
                {t({ vi: "Sản phẩm phù hợp với lựa chọn của bạn", en: "Products that match your choice" })} <Sparkles size={18} style={{ color: "var(--accent)" }} />
              </h2>
              <Link to="/products" className="related-see-all">{t({ vi: "Xem tất cả", en: "View all" })} <ChevronRight size={14} /></Link>
            </div>
            <div className="related-grid">
              {related.map((p) => <RelatedCard key={p.id} product={p} formatPrice={formatPrice} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

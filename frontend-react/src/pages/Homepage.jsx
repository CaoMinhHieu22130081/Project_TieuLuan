import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ALL_PRODUCTS } from "../data/Products";
import "./css/HomePage.css";

/* ── Sản phẩm nổi bật: sắp xếp theo lượt bán, lấy top 8 (cả Áo + Quần) ── */
const FEATURED_PRODUCTS = [...ALL_PRODUCTS]
  .sort((a, b) => b.sold - a.sold)
  .slice(0, 8);

const CATEGORIES = [
  { id: 1,  name: "Cơ bản",   icon: "◻", type: "Áo",   count: ALL_PRODUCTS.filter(p => p.category === "Cơ bản").length   },
  { id: 2,  name: "Graphic",  icon: "◈", type: "Áo",   count: ALL_PRODUCTS.filter(p => p.category === "Graphic").length  },
  { id: 3,  name: "Oversized",icon: "▣", type: "Áo",   count: ALL_PRODUCTS.filter(p => p.category === "Oversized").length},
  { id: 4,  name: "Vintage",  icon: "◉", type: "Áo",   count: ALL_PRODUCTS.filter(p => p.category === "Vintage").length  },
  { id: 5,  name: "Thể thao", icon: "◆", type: "Áo",   count: ALL_PRODUCTS.filter(p => p.category === "Thể thao").length },
  { id: 6,  name: "Sọc kẻ",   icon: "☰", type: "Áo",   count: ALL_PRODUCTS.filter(p => p.category === "Sọc kẻ").length   },
  { id: 7,  name: "Jeans",    icon: "▤", type: "Quần", count: ALL_PRODUCTS.filter(p => p.category === "Jeans").length    },
  { id: 8,  name: "Jogger",   icon: "▥", type: "Quần", count: ALL_PRODUCTS.filter(p => p.category === "Jogger").length   },
  { id: 9,  name: "Cargo",    icon: "▦", type: "Quần", count: ALL_PRODUCTS.filter(p => p.category === "Cargo").length    },
  { id: 10, name: "Shorts",   icon: "▧", type: "Quần", count: ALL_PRODUCTS.filter(p => p.category === "Shorts").length   },
  { id: 11, name: "Kaki",     icon: "▨", type: "Quần", count: ALL_PRODUCTS.filter(p => p.category === "Kaki").length     },
];

const AI_RESULTS = ALL_PRODUCTS.slice(4, 7).map((p, i) => ({
  id: p.id, name: p.name, price: p.price,
  similarity: [97, 91, 86][i],
  image: Array.isArray(p.images) ? p.images[0] : p.image,
}));

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

function StarRating({ rating }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "star filled" : "star"}>★</span>
      ))}
      <span className="rating-num">{rating}</span>
    </div>
  );
}

function ProductCard({ product }) {
  const [hovered,     setHovered]     = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const thumb = Array.isArray(product.images) ? product.images[0] : product.image;

  const handleCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className={`product-card ${hovered ? "hovered" : ""}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="product-img-wrap">
        <img src={thumb} alt={product.name} className="product-img" />
        {product.tag && (
          <span className={`product-badge badge-${product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"}`}>
            {product.tag}
          </span>
        )}
        {discount && <span className="product-discount">-{discount}%</span>}

        {/* Chip Áo / Quần */}
        <span className={`product-type-chip ${product.type === "Quần" ? "type-quan" : "type-ao"}`}>
          {product.type === "Áo" ? "👕" : "👖"} {product.type}
        </span>

        <button className={`btn-cart-overlay ${addedToCart ? "added" : ""}`} onClick={handleCart}>
          {addedToCart ? "✓ Đã thêm" : "+ Thêm vào giỏ"}
        </button>
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <StarRating rating={product.rating} />
        <span className="review-count">({product.reviews} đánh giá)</span>
        <div className="color-swatches">
          {(product.colors || []).map((c, i) => (
            <span key={i} className="swatch" style={{ background: typeof c === "string" ? c : c.hex }} />
          ))}
        </div>
        <div className="price-row">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="price-original">{formatPrice(product.originalPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}

function AiSearchPanel() {
  const [dragOver,  setDragOver]  = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [searching, setSearching] = useState(false);
  const [results,   setResults]   = useState(null);
  const [progress,  setProgress]  = useState(0);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setResults(null); setSearching(true); setProgress(0);
    [{ pct: 30, delay: 400 }, { pct: 65, delay: 900 }, { pct: 90, delay: 1500 }, { pct: 100, delay: 2000 }]
      .forEach(({ pct, delay }) => setTimeout(() => setProgress(pct), delay));
    setTimeout(() => { setSearching(false); setResults(AI_RESULTS); }, 2400);
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const reset  = () => { setPreview(null); setResults(null); setSearching(false); setProgress(0); };

  return (
    <section className="ai-section" id="ai-search">
      <div className="ai-section-inner">
        <div className="ai-header">
          <span className="ai-chip">✦ Tính năng mới</span>
          <h2 className="section-title">Tìm kiếm bằng <span className="accent">Hình Ảnh</span></h2>
          <p className="section-sub">
            Thấy bộ trang phục đẹp nhưng không biết tên? Tải ảnh lên — hệ thống sẽ tự động
            tìm những sản phẩm áo, quần tương tự trong cửa hàng cho bạn.
          </p>
        </div>
        <div className="ai-content">
          <div className="upload-col">
            {!preview ? (
              <div
                className={`drop-zone ${dragOver ? "drag-active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="drop-icon">
                  <svg width="52" height="52" fill="none" viewBox="0 0 52 52">
                    <rect width="52" height="52" rx="14" fill="rgba(var(--accent-rgb),0.1)" />
                    <path d="M26 16v16M19 23l7-7 7 7" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 38h24" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="drop-title">Kéo thả ảnh vào đây</p>
                <p className="drop-sub">hoặc click để chọn ảnh từ máy tính</p>
                <p className="drop-hint">Hỗ trợ JPG, PNG, WEBP · Tối đa 10MB</p>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="preview-wrap" style={{ position: "relative" }}>
                <img src={preview} alt="preview" className="preview-img" />
                <button className="btn-reset" onClick={reset}>✕ Đổi ảnh</button>
                {searching && (
                  <div className="progress-wrap">
                    <div className="progress-label">
                      <span>Đang phân tích trang phục…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: progress + "%" }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="results-col">
            {!preview && !searching && !results && (
              <div className="ai-idle">
                <div className="ai-how-it-works">
                  {[
                    { icon: "📤", title: "Tải ảnh lên",  desc: "Chọn hoặc kéo thả ảnh trang phục bạn thích (áo, quần, outfit...)" },
                    { icon: "🔍", title: "AI phân tích", desc: "Hệ thống nhận diện màu sắc, kiểu dáng, họa tiết tự động" },
                    { icon: "🛍️", title: "Xem kết quả", desc: "Nhận ngay danh sách áo & quần tương tự để chọn mua" },
                  ].map((step) => (
                    <div key={step.title} className="how-step">
                      <span className="how-icon">{step.icon}</span>
                      <div>
                        <p className="how-title">{step.title}</p>
                        <p className="how-desc">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {searching && (
              <div className="ai-loading"><div className="spinner" /><p>Đang tìm sản phẩm phù hợp…</p></div>
            )}
            {results && (
              <div className="ai-results">
                <p className="results-label">✦ Tìm thấy {results.length} sản phẩm tương tự</p>
                <div className="ai-result-list">
                  {results.map((r) => (
                    <Link key={r.id} to={`/products/${r.id}`} className="ai-result-card" style={{ textDecoration: "none" }}>
                      <img src={r.image} alt={r.name} className="ai-result-img" />
                      <div className="ai-result-info">
                        <p className="ai-result-name">{r.name}</p>
                        <p className="ai-result-price">{formatPrice(r.price)}</p>
                        <div className="similarity-bar-wrap">
                          <span className="sim-label">Độ phù hợp</span>
                          <div className="sim-bar"><div className="sim-fill" style={{ width: `${r.similarity}%` }} /></div>
                          <span className="sim-pct">{r.similarity}%</span>
                        </div>
                      </div>
                      <span className="btn-view-sm">Xem</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);

  return (
    <div className="page-wrapper">

      {/* ── Hero ── */}
      <section className={`hero ${heroVisible ? "visible" : ""}`}>
        <div className="hero-bg-grid" />
        <div className="hero-inner">
          <div className="hero-text-col">
            <h1 className="hero-title">
              Thời trang<br /><span className="accent">Unisex</span><br />Dành cho bạn
            </h1>
            <p className="hero-desc">
              Hàng trăm mẫu áo thun, quần jeans, cargo & jogger unisex đa dạng phong cách.
              Tìm đúng bộ trang phục bạn muốn chỉ bằng một tấm ảnh.
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn-primary">Mua ngay</Link>
              <a href="#ai-search" className="btn-secondary">
                <span className="btn-ai-icon">📷</span> Tìm bằng ảnh
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat"><span className="stat-num">500+</span><span className="stat-label">Mẫu sản phẩm</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-num">10K+</span><span className="stat-label">Khách hàng</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-num">4.9★</span><span className="stat-label">Đánh giá</span></div>
            </div>
          </div>

          <div className="hero-img-col">
            <div className="hero-img-frame">
              <img
                src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&h=700&fit=crop"
                alt="Hero fashion" className="hero-img"
              />
              <div className="hero-img-badge">
                <span className="badge-icon">📷</span>
                <div>
                  <p className="badge-title">Tìm kiếm bằng ảnh</p>
                  <p className="badge-sub">Tải ảnh · Nhận gợi ý ngay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-hint">
          <span>Cuộn xuống</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="categories-section" id="categories">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Danh mục <span className="accent">sản phẩm</span></h2>
            <Link to="/products" className="see-all">Xem tất cả →</Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`category-chip ${cat.type === "Quần" ? "category-chip-quan" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
                <span className="cat-count">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products: top bán chạy, cả Áo lẫn Quần ── */}
      <section className="products-section" id="products">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Sản phẩm <span className="accent">nổi bật</span></h2>
            <Link to="/products" className="see-all">Xem tất cả →</Link>
          </div>
          <div className="products-grid">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="load-more-wrap">
            <Link to="/products" className="btn-load-more" style={{ textDecoration: "none" }}>
              Xem thêm sản phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Search ── */}
      <AiSearchPanel />

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="section-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="nav-logo footer-logo" style={{ textDecoration: "none" }}>
                <span className="logo-mark">U</span>
                <span className="logo-text">UNIQ<em>TEE</em></span>
              </Link>
              <p className="footer-tagline">
                Thời trang unisex hiện đại — áo thun, quần jeans, cargo & hơn thế nữa.
                Chất lượng, phong cách, giá tốt.
              </p>
              <div className="footer-contact">
                <p>📍 TP. Hồ Chí Minh</p>
                <p>📞 085 455 3708</p>
                <p>✉️ 22130081@st.hcmuaf.edu.vn</p>
              </div>
            </div>
            <div className="footer-links-group">
              <p className="footer-group-title">Hỗ trợ khách hàng</p>
              <ul>
                <li><a href="#">Hướng dẫn mua hàng</a></li>
                <li><a href="#">Chính sách đổi trả</a></li>
                <li><a href="#">Chính sách vận chuyển</a></li>
                <li><a href="#">Câu hỏi thường gặp</a></li>
              </ul>
            </div>
            <div className="footer-links-group">
              <p className="footer-group-title">Về UniqTee</p>
              <ul>
                <li><a href="#">Giới thiệu</a></li>
                <li><a href="#">Bảng size</a></li>
                <li><a href="#">Chương trình ưu đãi</a></li>
                <li><a href="#">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 UniqTee · Áo thun & Quần thời trang unisex · Giao hàng toàn quốc</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
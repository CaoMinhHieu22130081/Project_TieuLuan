import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { productAPI } from "../services/api";
import "./css/Homepage.css";

// Danh mục cố định
const CATEGORY_CONFIG = [
  { id: 1,  name: "Cơ bản",   icon: "◻", type: "Áo"   },
  { id: 2,  name: "Graphic",  icon: "◈", type: "Áo"   },
  { id: 3,  name: "Oversized",icon: "▣", type: "Áo"   },
  { id: 4,  name: "Vintage",  icon: "◉", type: "Áo"   },
  { id: 5,  name: "Thể thao", icon: "◆", type: "Áo"   },
  { id: 6,  name: "Sọc kẻ",   icon: "☰", type: "Áo"   },
  { id: 7,  name: "Jeans",    icon: "▤", type: "Quần" },
  { id: 8,  name: "Jogger",   icon: "▥", type: "Quần" },
  { id: 9,  name: "Cargo",    icon: "▦", type: "Quần" },
  { id: 10, name: "Shorts",   icon: "▧", type: "Quần" },
  { id: 11, name: "Kaki",     icon: "▨", type: "Quần" },
];

// Hàm tạo featured products từ dữ liệu - chỉ hiển thị sản phẩm bán chạy
const getFeaturedProducts = (products) => {
  return (products || [])
    .filter(p => p.tag === "Bán chạy")
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 8);
};

// Hàm tạo AI results từ dữ liệu
const getAiResults = (products) => {
  return products.slice(4, 7).map((p, i) => ({
    id: p.id, name: p.name, price: p.price,
    similarity: [97, 91, 86][i],
    image: p.images && p.images.length > 0 ? p.images[0].url : (p.image || 'https://via.placeholder.com/300x400'),
  }));
};

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

  const thumb = product.images && product.images.length > 0 ? product.images[0].url : (product.image || 'https://via.placeholder.com/300x400');

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
        <StarRating rating={parseFloat(product.rating) || 0} />
        <span className="review-count">({product.reviewCount || 0} đánh giá)</span>
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

function AiSearchPanel({ aiResults }) {
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
    setTimeout(() => { setSearching(false); setResults(aiResults || []); }, 2400);
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

function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const [heroVisible, setHeroVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [categories, setCategories] = useState(CATEGORY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await productAPI.getAllProducts();
        setProducts(data || []);
        setFeaturedProducts(getFeaturedProducts(data || []));
        setAiResults(getAiResults(data || []));
        
        // Tính toán số lượng sản phẩm cho mỗi danh mục
        const updatedCategories = CATEGORY_CONFIG.map(cat => ({
          ...cat,
          count: (data || []).filter(p => p.category && p.category.name === cat.name).length
        }));
        setCategories(updatedCategories);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setError("Không thể tải dữ liệu sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
            {categories.map((cat) => (
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
            {loading ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#e74c3c" }}>
                <p>{error}</p>
              </div>
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          <div className="load-more-wrap">
            <Link to="/products" className="btn-load-more" style={{ textDecoration: "none" }}>
              Xem thêm sản phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Search ── */}
      <AiSearchPanel aiResults={aiResults} />

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

export default HomePage;
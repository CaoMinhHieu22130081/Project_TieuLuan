import { useState, useEffect, useRef } from "react";
import "./css/HomePage.css";

const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: "Urban Minimal Tee",
    price: 299000,
    originalPrice: 399000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
    tag: "Bán chạy",
    colors: ["#1a1a1a", "#ffffff", "#4A90E2"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 2,
    name: "Acid Wash Street",
    price: 349000,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
    tag: "Mới",
    colors: ["#7B68EE", "#F5F5DC"],
    sizes: ["S", "M", "L"],
    rating: 4.6,
    reviews: 89,
  },
  {
    id: 3,
    name: "Oversized Graphic Tee",
    price: 379000,
    originalPrice: 450000,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop",
    tag: "Sale",
    colors: ["#2C2C2C", "#E8DCC8"],
    sizes: ["M", "L", "XL", "XXL"],
    rating: 4.9,
    reviews: 201,
  },
  {
    id: 4,
    name: "Clean Line Unisex",
    price: 259000,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=500&fit=crop",
    tag: null,
    colors: ["#ffffff", "#F0E68C", "#90EE90"],
    sizes: ["S", "M", "L"],
    rating: 4.7,
    reviews: 67,
  },
];

const CATEGORIES = [
  { id: 1, name: "Cơ bản", icon: "◻", count: 48 },
  { id: 2, name: "Graphic", icon: "◈", count: 32 },
  { id: 3, name: "Oversized", icon: "▣", count: 27 },
  { id: 4, name: "Vintage", icon: "◉", count: 19 },
  { id: 5, name: "Thể thao", icon: "◆", count: 23 },
  { id: 6, name: "Sọc kẻ", icon: "☰", count: 15 },
];

const AI_RESULTS = [
  {
    id: 5,
    name: "Tee Tương Tự #1",
    price: 320000,
    similarity: 97,
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=300&h=350&fit=crop",
  },
  {
    id: 6,
    name: "Tee Tương Tự #2",
    price: 299000,
    similarity: 91,
    image: "https://images.unsplash.com/photo-1618453292459-37cb0d0af8f1?w=300&h=350&fit=crop",
  },
  {
    id: 7,
    name: "Tee Tương Tự #3",
    price: 279000,
    similarity: 86,
    image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=300&h=350&fit=crop",
  },
];

const SEARCH_HINTS = ["Oversized", "Graphic", "Vintage", "Áo trắng", "Sale"];

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
  const [hovered, setHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleCart = (e) => {
    e.preventDefault();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div
      className={`product-card ${hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="product-img-wrap">
        <img src={product.image} alt={product.name} className="product-img" />
        {product.tag && (
          <span className={`product-badge badge-${product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"}`}>
            {product.tag}
          </span>
        )}
        {discount && <span className="product-discount">-{discount}%</span>}
        <button
          className={`btn-cart-overlay ${addedToCart ? "added" : ""}`}
          onClick={handleCart}
        >
          {addedToCart ? "✓ Đã thêm" : "+ Thêm vào giỏ"}
        </button>
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <StarRating rating={product.rating} />
        <span className="review-count">({product.reviews} đánh giá)</span>
        <div className="color-swatches">
          {product.colors.map((c, i) => (
            <span key={i} className="swatch" style={{ background: c }} />
          ))}
        </div>
        <div className="price-row">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="price-original">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AiSearchPanel() {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setResults(null);
    setSearching(true);
    setProgress(0);
    [{ pct: 30, delay: 400 }, { pct: 65, delay: 900 }, { pct: 90, delay: 1500 }, { pct: 100, delay: 2000 }]
      .forEach(({ pct, delay }) => setTimeout(() => setProgress(pct), delay));
    setTimeout(() => { setSearching(false); setResults(AI_RESULTS); }, 2400);
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const reset = () => { setPreview(null); setResults(null); setSearching(false); setProgress(0); };

  return (
    <section className="ai-section" id="ai-search">
      <div className="ai-section-inner">
        <div className="ai-header">
          <span className="ai-chip">✦ Tính năng mới</span>
          <h2 className="section-title">
            Tìm kiếm bằng <span className="accent">Hình Ảnh</span>
          </h2>
          <p className="section-sub">
            Thấy chiếc áo đẹp nhưng không biết tên? Tải ảnh lên — hệ thống sẽ tự động
            tìm những sản phẩm tương tự trong cửa hàng cho bạn.
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
                <p className="drop-label">Kéo thả ảnh vào đây</p>
                <p className="drop-sub">hoặc click để chọn ảnh từ máy tính</p>
                <span className="drop-hint">Hỗ trợ JPG, PNG, WEBP</span>
                <input ref={inputRef} type="file" accept="image/*" hidden
                  onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="preview-box">
                <img src={preview} alt="preview" className="preview-img" />
                <button className="btn-reset" onClick={reset}>✕ Đặt lại</button>
                {searching && (
                  <div className="progress-wrap">
                    <div className="progress-label">
                      <span>Đang tìm sản phẩm phù hợp…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="results-col">
            {!results && !searching && (
              <div className="ai-idle">
                <div className="ai-how-it-works">
                  {[
                    { icon: "📸", title: "Tải ảnh lên", desc: "Chụp hoặc chọn ảnh áo thun bạn thích từ bất kỳ đâu" },
                    { icon: "🔍", title: "AI phân tích", desc: "Hệ thống nhận diện màu sắc, kiểu dáng, họa tiết tự động" },
                    { icon: "🛍️", title: "Xem kết quả", desc: "Nhận ngay danh sách sản phẩm tương tự để chọn mua" },
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
              <div className="ai-loading">
                <div className="spinner" />
                <p>Đang tìm sản phẩm phù hợp…</p>
              </div>
            )}

            {results && (
              <div className="ai-results">
                <p className="results-label">✦ Tìm thấy {results.length} sản phẩm tương tự</p>
                <div className="ai-result-list">
                  {results.map((r) => (
                    <div key={r.id} className="ai-result-card">
                      <img src={r.image} alt={r.name} className="ai-result-img" />
                      <div className="ai-result-info">
                        <p className="ai-result-name">{r.name}</p>
                        <p className="ai-result-price">{formatPrice(r.price)}</p>
                        <div className="similarity-bar-wrap">
                          <span className="sim-label">Độ phù hợp</span>
                          <div className="sim-bar">
                            <div className="sim-fill" style={{ width: `${r.similarity}%` }} />
                          </div>
                          <span className="sim-pct">{r.similarity}%</span>
                        </div>
                      </div>
                      <button className="btn-view-sm">Xem</button>
                    </div>
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

      <section className={`hero ${heroVisible ? "visible" : ""}`}>
        <div className="hero-bg-grid" />
        <div className="hero-inner">
          <div className="hero-text-col">
            <h1 className="hero-title">
              Thời trang<br />
              <span className="accent">Unisex</span><br />
              Dành cho bạn
            </h1>
            <p className="hero-desc">
              Hàng trăm mẫu áo thun unisex đa dạng phong cách. Tìm đúng chiếc áo bạn muốn
              chỉ bằng một tấm ảnh — nhanh chóng, dễ dàng, chính xác.
            </p>
            <div className="hero-cta">
              <a href="#products" className="btn-primary">Mua ngay</a>
              <a href="#ai-search" className="btn-secondary">
                <span className="btn-ai-icon">📷</span> Tìm bằng ảnh
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">500+</span>
                <span className="stat-label">Mẫu áo</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">10K+</span>
                <span className="stat-label">Khách hàng</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">4.9★</span>
                <span className="stat-label">Đánh giá</span>
              </div>
            </div>
          </div>

          <div className="hero-img-col">
            <div className="hero-img-frame">
              <img
                src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&h=700&fit=crop"
                alt="Hero fashion"
                className="hero-img"
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

      <section className="categories-section" id="categories">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Danh mục <span className="accent">áo thun</span></h2>
            <a href="#" className="see-all">Xem tất cả →</a>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} className="category-chip">
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
                <span className="cat-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section" id="products">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Sản phẩm <span className="accent">nổi bật</span></h2>
            <div className="filter-row">
              <select className="sort-select">
                <option>Phổ biến nhất</option>
                <option>Giá thấp → cao</option>
                <option>Giá cao → thấp</option>
                <option>Mới nhất</option>
              </select>
            </div>
          </div>
          <div className="products-grid">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="load-more-wrap">
            <button className="btn-load-more">Xem thêm sản phẩm</button>
          </div>
        </div>
      </section>

      <AiSearchPanel />

      <footer className="footer">
        <div className="section-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="nav-logo footer-logo">
                <span className="logo-mark">U</span>
                <span className="logo-text">UNIQ<em>TEE</em></span>
              </a>
              <p className="footer-tagline">
                Thời trang unisex hiện đại — chất lượng, phong cách, giá tốt.
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
            <p>© 2025 UniqTee · Giao hàng toàn quốc · Thanh toán qua VNPAY</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
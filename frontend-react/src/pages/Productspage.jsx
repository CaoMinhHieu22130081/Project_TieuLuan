import { useState } from "react";
import { Link } from "react-router-dom";
import { ALL_PRODUCTS } from "../data/Products";
import "./css/ProductsPage.css";

const CATEGORIES = ["Tất cả", "Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ"];
const SIZES     = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS    = [
  { hex: "#1a1a1a", name: "Đen"     },
  { hex: "#ffffff", name: "Trắng"   },
  { hex: "#4A90E2", name: "Xanh"    },
  { hex: "#ff6b6b", name: "Đỏ"     },
  { hex: "#90EE90", name: "Xanh lá" },
  { hex: "#F0E68C", name: "Vàng"    },
];

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

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

/* ── Card: bọc trong <Link> để click → trang chi tiết ── */
function ProductCard({ product }) {
  const [added,   setAdded]   = useState(false);
  const [loved,   setLoved]   = useState(false);
  const [hovered, setHovered] = useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  /* ảnh thumbnail: data mới dùng images[], data cũ dùng image */
  const thumb = Array.isArray(product.images) ? product.images[0] : product.image;

  const stopAndRun = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(); };

  return (
    <Link
      to={`/products/${product.id}`}
      className={`product-card ${hovered ? "hovered" : ""}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="product-img-wrap">
        <img src={thumb} alt={product.name} className="product-img" loading="lazy" />

        {product.tag && (
          <span className={`product-badge badge-${
            product.tag === "Sale" ? "sale" : product.tag === "Mới" ? "new" : "hot"
          }`}>{product.tag}</span>
        )}
        {discount && <span className="product-discount">-{discount}%</span>}

        {/* Wishlist btn — dừng navigate */}
        <button
          className={`wishlist-btn ${loved ? "loved" : ""}`}
          onClick={stopAndRun(() => setLoved((v) => !v))}
          aria-label="Yêu thích"
        >
          <svg width="16" height="16" fill={loved ? "currentColor" : "none"} viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        {/* Thêm giỏ — dừng navigate */}
        <button
          className={`btn-cart-overlay ${added ? "added" : ""}`}
          onClick={stopAndRun(() => { setAdded(true); setTimeout(() => setAdded(false), 1800); })}
        >
          {added ? "✓ Đã thêm" : "+ Thêm vào giỏ"}
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
          <span className="price-current">{fmt(product.price)}</span>
          {product.originalPrice && <span className="price-original">{fmt(product.originalPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}

/* ── Trang chính ─────────────────────────────────────── */
export default function ProductsPage() {
  const [category,   setCategory]   = useState("Tất cả");
  const [sizes,      setSizes]      = useState([]);
  const [colors,     setColors]     = useState([]);
  const [sortBy,     setSortBy]     = useState("popular");
  const [page,       setPage]       = useState(1);
  const [viewMode,   setViewMode]   = useState("grid");
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleArr = (setter, val) =>
    setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);

  let filtered = ALL_PRODUCTS;
  if (category !== "Tất cả") filtered = filtered.filter((p) => p.category === category);
  if (sizes.length)           filtered = filtered.filter((p) => p.sizes.some((s) => sizes.includes(s)));

  if (sortBy === "price_asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === "rating")     filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (sortBy === "newest")     filtered = [...filtered].sort((a, b) => b.id - a.id);

  return (
    <div className="products-page">
      <div className="products-page-header">
        <div className="products-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-sep">/</span>
          <span>Sản phẩm</span>
        </div>
        <h1 className="products-page-title">Áo thun <span className="accent">UniqTee</span></h1>
        <p className="products-page-sub">Khám phá {ALL_PRODUCTS.length}+ mẫu áo thun unisex đa dạng phong cách</p>
      </div>

      <div className="products-layout">
        {/* ── Sidebar ── */}
        <aside className={`filters-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
          <div className="filters-title">
            Bộ lọc
            <button className="filters-reset" onClick={() => { setSizes([]); setColors([]); setCategory("Tất cả"); }}>
              Xóa tất cả
            </button>
          </div>

          {/* Category */}
          <div className="filter-group">
            <p className="filter-group-label">Danh mục</p>
            <div className="filter-options">
              {CATEGORIES.map((cat) => (
                <label key={cat} className={`filter-option ${category === cat ? "checked" : ""}`} onClick={() => setCategory(cat)}>
                  <div className="filter-checkbox">{category === cat && <span className="filter-check-mark">✓</span>}</div>
                  <span className="filter-option-name">{cat}</span>
                  <span className="filter-option-count">
                    {cat === "Tất cả" ? ALL_PRODUCTS.length : ALL_PRODUCTS.filter((p) => p.category === cat).length}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="filter-group">
            <p className="filter-group-label">Kích thước</p>
            <div className="size-filter-grid">
              {SIZES.map((s) => (
                <button key={s} className={`size-filter-btn ${sizes.includes(s) ? "active" : ""}`} onClick={() => toggleArr(setSizes, s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="filter-group">
            <p className="filter-group-label">Màu sắc</p>
            <div className="color-filter-grid">
              {COLORS.map((c) => (
                <button key={c.hex} className={`color-filter-swatch ${colors.includes(c.hex) ? "selected" : ""}`}
                  style={{ background: c.hex }} title={c.name} onClick={() => toggleArr(setColors, c.hex)} />
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="filter-group">
            <p className="filter-group-label">Khoảng giá</p>
            <div className="price-range-inputs">
              <input type="number" placeholder="150.000" />
              <span className="price-range-sep">—</span>
              <input type="number" placeholder="500.000" />
            </div>
          </div>
        </aside>

        {/* ── Grid ── */}
        <div className="products-grid-area">
          <div className="products-toolbar">
            <p className="products-count">Hiển thị <strong>{filtered.length}</strong> sản phẩm</p>
            <div className="toolbar-right">
              <button className="mobile-filter-btn" onClick={() => setMobileOpen(true)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Bộ lọc
              </button>
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="popular">Phổ biến nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp → Cao</option>
                <option value="price_desc">Giá: Cao → Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="10" y="0" width="6" height="6" rx="1"/>
                    <rect x="0" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className={`p-grid ${viewMode === "list" ? "list-view" : ""}`}>
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          <div className="pagination">
            {[1, 2, 3, 4].map((p) => (
              <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setPage((p) => Math.min(p + 1, 4))}>→</button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
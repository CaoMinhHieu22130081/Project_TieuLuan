import { useState } from "react";
import "./css/ProductsPage.css";

const ALL_PRODUCTS = [
  { id: 1, name: "Urban Minimal Tee", price: 299000, originalPrice: 399000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop", tag: "Bán chạy", colors: ["#1a1a1a", "#ffffff", "#4A90E2"], sizes: ["S","M","L","XL"], rating: 4.8, reviews: 124, category: "Cơ bản" },
  { id: 2, name: "Acid Wash Street", price: 349000, originalPrice: null, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop", tag: "Mới", colors: ["#7B68EE", "#F5F5DC"], sizes: ["S","M","L"], rating: 4.6, reviews: 89, category: "Graphic" },
  { id: 3, name: "Oversized Graphic Tee", price: 379000, originalPrice: 450000, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop", tag: "Sale", colors: ["#2C2C2C", "#E8DCC8"], sizes: ["M","L","XL","XXL"], rating: 4.9, reviews: 201, category: "Oversized" },
  { id: 4, name: "Clean Line Unisex", price: 259000, originalPrice: null, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=500&fit=crop", tag: null, colors: ["#ffffff", "#F0E68C", "#90EE90"], sizes: ["S","M","L"], rating: 4.7, reviews: 67, category: "Cơ bản" },
  { id: 5, name: "Vintage Wash Crop", price: 319000, originalPrice: 380000, image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&h=500&fit=crop", tag: "Sale", colors: ["#a0522d", "#deb887"], sizes: ["XS","S","M"], rating: 4.5, reviews: 58, category: "Vintage" },
  { id: 6, name: "Bold Print Tee", price: 289000, originalPrice: null, image: "https://images.unsplash.com/photo-1618453292459-37cb0d0af8f1?w=400&h=500&fit=crop", tag: "Mới", colors: ["#ff6b6b", "#1a1a1a"], sizes: ["S","M","L","XL"], rating: 4.4, reviews: 43, category: "Graphic" },
  { id: 7, name: "Sport Performance Tee", price: 369000, originalPrice: null, image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=500&fit=crop", tag: null, colors: ["#1a1a1a", "#0077b6", "#ef233c"], sizes: ["S","M","L","XL","XXL"], rating: 4.6, reviews: 92, category: "Thể thao" },
  { id: 8, name: "Stripe Nautical Tee", price: 279000, originalPrice: 329000, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop", tag: "Sale", colors: ["#1a1a1a", "#ffffff"], sizes: ["S","M","L"], rating: 4.3, reviews: 31, category: "Sọc kẻ" },
];

const CATEGORIES = ["Tất cả", "Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  { hex: "#1a1a1a", name: "Đen" },
  { hex: "#ffffff", name: "Trắng" },
  { hex: "#4A90E2", name: "Xanh" },
  { hex: "#ff6b6b", name: "Đỏ" },
  { hex: "#90EE90", name: "Xanh lá" },
  { hex: "#F0E68C", name: "Vàng" },
];

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

function StarRating({ rating }) {
  return (
    <div className="star-row">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "star filled" : "star"}>★</span>
      ))}
      <span className="rating-num">{rating}</span>
    </div>
  );
}

function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [loved, setLoved] = useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleCart = (e) => {
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

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
        <button className={`wishlist-btn ${loved ? "loved" : ""}`} onClick={(e) => { e.stopPropagation(); setLoved(!loved); }}>
          <svg width="16" height="16" fill={loved ? "currentColor" : "none"} viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className={`btn-cart-overlay ${added ? "added" : ""}`} onClick={handleCart}>
          {added ? "✓ Đã thêm" : "+ Thêm vào giỏ"}
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

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const toggleSize = (s) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleColor = (c) =>
    setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  let filtered = ALL_PRODUCTS;
  if (selectedCategory !== "Tất cả") filtered = filtered.filter((p) => p.category === selectedCategory);
  if (selectedSizes.length) filtered = filtered.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));

  if (sortBy === "price_asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sortBy === "rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (sortBy === "newest") filtered = [...filtered].sort((a, b) => b.id - a.id);

  return (
    <div className="products-page">
      <div className="products-page-header">
        <div className="products-breadcrumb">
          <a href="/">Trang chủ</a>
          <span className="breadcrumb-sep">/</span>
          <span>Sản phẩm</span>
        </div>
        <h1 className="products-page-title">
          Áo thun <span className="accent">UniqTee</span>
        </h1>
        <p className="products-page-sub">Khám phá {ALL_PRODUCTS.length}+ mẫu áo thun unisex đa dạng phong cách</p>
      </div>

      <div className="products-layout">
        {/* Sidebar */}
        <aside className={`filters-sidebar ${mobileFiltersOpen ? "mobile-open" : ""}`}>
          <div className="filters-title">
            Bộ lọc
            <button className="filters-reset" onClick={() => { setSelectedSizes([]); setSelectedColors([]); setSelectedCategory("Tất cả"); }}>
              Xóa tất cả
            </button>
          </div>

          {/* Category */}
          <div className="filter-group">
            <p className="filter-group-label">Danh mục</p>
            <div className="filter-options">
              {CATEGORIES.map((cat) => (
                <label key={cat} className={`filter-option ${selectedCategory === cat ? "checked" : ""}`} onClick={() => setSelectedCategory(cat)}>
                  <div className="filter-checkbox">
                    {selectedCategory === cat && <span className="filter-check-mark">✓</span>}
                  </div>
                  <span className="filter-option-name">{cat}</span>
                  <span className="filter-option-count">
                    {cat === "Tất cả" ? ALL_PRODUCTS.length : ALL_PRODUCTS.filter(p => p.category === cat).length}
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
                <button
                  key={s}
                  className={`size-filter-btn ${selectedSizes.includes(s) ? "active" : ""}`}
                  onClick={() => toggleSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="filter-group">
            <p className="filter-group-label">Màu sắc</p>
            <div className="color-filter-grid">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  className={`color-filter-swatch ${selectedColors.includes(c.hex) ? "selected" : ""}`}
                  style={{ background: c.hex }}
                  title={c.name}
                  onClick={() => toggleColor(c.hex)}
                />
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

        {/* Grid */}
        <div className="products-grid-area">
          <div className="products-toolbar">
            <p className="products-count">
              Hiển thị <strong>{filtered.length}</strong> sản phẩm
            </p>
            <div className="toolbar-right">
              <button className="mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)}>
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
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="pagination">
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                className={`page-btn ${currentPage === p ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="page-btn" onClick={() => setCurrentPage((p) => Math.min(p + 1, 4))}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
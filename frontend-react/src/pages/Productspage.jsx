import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productAPI } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { getDisplayRating, getSizeOptions } from "../utils/productDisplay";
import "./css/Productspage.css";

const TYPES = ["Tất cả", "Áo", "Quần"];

const CATEGORIES_BY_TYPE = {
  "Tất cả": ["Tất cả", "Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ", "Jeans", "Jogger", "Cargo", "Shorts", "Kaki"],
  "Áo":     ["Tất cả", "Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ"],
  "Quần":   ["Tất cả", "Jeans", "Jogger", "Cargo", "Shorts", "Kaki"],
};

const SIZES_AO   = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_QUAN = ["28", "29", "30", "31", "32", "34", "S", "M", "L", "XL"];

const COLORS = [
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

/* ── Modal chọn màu, size ── */
function CartModal({ product, isOpen, onClose, onAddToCart }) {
  const { addToast } = useToast();
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!selectedSize) {
      setError("Vui lòng chọn size");
      addToast("Vui lòng chọn size", "error", 2000);
      return;
    }

    setIsAdding(true);
    try {
      onAddToCart(product, selectedColor, selectedSize, qty);
      addToast(
        `✓ Đã thêm ${qty} ${product.name} vào giỏ hàng`,
        'success',
        3000
      );
    } catch (err) {
      addToast("Có lỗi khi thêm vào giỏ", "error");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen || !product) return null;

  const sizeOptions = getSizeOptions(product);
  const fallbackSizes = product.type === "Quần" ? SIZES_QUAN : SIZES_AO;
  const displaySizes = sizeOptions.length > 0
    ? sizeOptions
    : fallbackSizes.map((value) => ({ value, isAvailable: true }));

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#1a1a1a",
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: "90%",
          zIndex: 1000,
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#fff" }}>
            {product.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#888",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.color = "#fff"}
            onMouseLeave={(e) => e.target.style.color = "#888"}
          >
            ✕
          </button>
        </div>

        {/* Màu sắc */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: "0.9rem", color: "#fff" }}>
            Màu sắc
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(product.colors || []).map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: c.hex,
                  border: selectedColor?.hex === c.hex ? "3px solid var(--accent)" : "2px solid #ddd",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title={c.name}
              />
            ))}
          </div>
          {selectedColor && (
            <p style={{ fontSize: "0.85rem", color: "#888", marginTop: 8 }}>
              {selectedColor.name}
            </p>
          )}
        </div>

        {/* Size */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: "0.9rem", color: error ? "#ff6b6b" : "#fff" }}>
            Kích thước {error && <span style={{ color: "#ff6b6b" }}>- {error}</span>}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {displaySizes.map((size) => (
              <button
                key={size.value}
                onClick={() => {
                  if (!size.isAvailable) return;
                  setSelectedSize(size.value);
                  setError("");
                }}
                disabled={!size.isAvailable}
                style={{
                  padding: 10,
                  border: selectedSize === size.value ? "2px solid var(--accent)" : "1px solid #333",
                  background: selectedSize === size.value ? "var(--accent)" : "#2a2a2a",
                  color: selectedSize === size.value ? "#fff" : size.isAvailable ? "#ccc" : "#777",
                  borderRadius: 6,
                  cursor: size.isAvailable ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  opacity: size.isAvailable ? 1 : 0.45,
                  textDecoration: size.isAvailable ? "none" : "line-through",
                }}
                title={size.isAvailable ? size.value : `${size.value} - Hết hàng`}
              >
                {size.value}
              </button>
            ))}
          </div>
        </div>

        {/* Số lượng */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: "0.9rem", color: "#fff" }}>
            Số lượng
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 32,
                height: 32,
                border: "1px solid #333",
                borderRadius: 6,
                background: "#2a2a2a",
                color: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              −
            </button>
            <span style={{ minWidth: 40, textAlign: "center", fontWeight: 600, color: "#fff" }}>{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              style={{
                width: 32,
                height: 32,
                border: "1px solid #333",
                borderRadius: 6,
                background: "#2a2a2a",
                color: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: isAdding ? "#a78bfa" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: isAdding ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              transition: "all 0.2s",
              opacity: isAdding ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !isAdding && (e.target.style.opacity = "0.9")}
            onMouseLeave={(e) => !isAdding && (e.target.style.opacity = "1")}
          >
            {isAdding ? "⏳ Đang thêm..." : "✓ Thêm vào giỏ"}
          </button>
          <button
            onClick={onClose}
            disabled={isAdding}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: "#2a2a2a",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: 6,
              fontWeight: 700,
              cursor: isAdding ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              transition: "all 0.2s",
              opacity: isAdding ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isAdding) {
                e.target.style.background = "#333";
                e.target.style.borderColor = "#555";
              }
            }}
            onMouseLeave={(e) => {
              if (!isAdding) {
                e.target.style.background = "#2a2a2a";
                e.target.style.borderColor = "#333";
              }
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}

function ProductCard({ product }) {
  const [showModal, setShowModal] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const loved = isInWishlist(product.id);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  // Handle images - API returns array of objects with {url, sortOrder}
  const thumb = product.images && product.images.length > 0 
    ? product.images[0].url 
    : (product.image || 'https://via.placeholder.com/300x400?text=No+Image');

  const rating = getDisplayRating(product);

  const stopAndRun = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(); };

  const handleAddToCart = (product, color, size, qty) => {
    addToCart(product, color, size, qty);
    setShowModal(false);
  };

  return (
    <div style={{ position: "relative" }}>
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

        {/* Type chip */}
        <span className={`product-type-chip ${product.type === "Quần" ? "type-quan" : "type-ao"}`}>
          {product.type}
        </span>

        <button
          className={`wishlist-btn ${loved ? "loved" : ""}`}
          onClick={stopAndRun(() => toggleWishlist(product))}
          aria-label="Yêu thích"
        >
          <svg width="16" height="16" fill={loved ? "currentColor" : "none"} viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        <button
          className={`btn-cart-overlay`}
          onClick={stopAndRun(() => setShowModal(true))}
          title="Chọn màu, size và thêm vào giỏ hàng"
        >
          + Thêm vào giỏ
        </button>
      </div>

      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <StarRating rating={rating} />
        <span className="review-count">({product.reviewCount || product.reviews || 0} đánh giá)</span>
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

    <CartModal
      product={product}
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onAddToCart={handleAddToCart}
    />
    </div>
  );
}

/* ── Trang chính ─────────────────────────────────────── */
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from URL query params
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") || "Tất cả");
  const [category,   setCategory]   = useState(() => searchParams.get("category") || "Tất cả");
  const [sizes,      setSizes]       = useState(() => {
    const s = searchParams.get("sizes");
    return s ? s.split(",") : [];
  });
  const [colors,     setColors]      = useState(() => {
    const c = searchParams.get("colors");
    return c ? c.split(",") : [];
  });
  const [priceMin,     setPriceMin]     = useState(() => parseInt(searchParams.get("priceMin")) || 0);
  const [priceMax,     setPriceMax]     = useState(() => parseInt(searchParams.get("priceMax")) || 1000000);
  const [minDisplay,   setMinDisplay]   = useState(() => searchParams.get("priceMin") || "");
  const [maxDisplay,   setMaxDisplay]   = useState(() => searchParams.get("priceMax") || "");
  const [sortBy,     setSortBy]      = useState(() => searchParams.get("sort") || "all");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [page,       setPage]        = useState(1);
  const [viewMode,   setViewMode]    = useState("grid");
  const [mobileOpen, setMobileOpen]  = useState(false);

  // Update URL when filters change + reset page to 1
  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "Tất cả") params.set("type", typeFilter);
    if (category !== "Tất cả") params.set("category", category);
    if (sizes.length > 0) params.set("sizes", sizes.join(","));
    if (colors.length > 0) params.set("colors", colors.join(","));
    if (priceMin > 0) params.set("priceMin", priceMin);
    if (priceMax < 1000000) params.set("priceMax", priceMax);
    if (sortBy !== "all") params.set("sort", sortBy);
    if (searchQuery) params.set("search", searchQuery);
    
    setPage(1); // Reset to page 1 when filters change
    setSearchParams(params, { replace: true });
  }, [typeFilter, category, sizes, colors, priceMin, priceMax, sortBy, searchQuery, setSearchParams]);

  // Sync searchQuery from URL when it changes
  useEffect(() => {
    const search = searchParams.get("search") || "";
    if (search !== searchQuery) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Fetch sản phẩm từ API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAllProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        setError("Lỗi tải sản phẩm. Vui lòng thử lại sau.");
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* Khi đổi typeFilter thì reset category về Tất cả */
  const handleTypeChange = (t) => {
    setTypeFilter(t);
    setCategory("Tất cả");
    setSizes([]);
  };

  const CATEGORIES = CATEGORIES_BY_TYPE[typeFilter] || CATEGORIES_BY_TYPE["Tất cả"];
  
  /* ── SMART FILTER: Tính toán products theo filter hiện tại ── */
  const getFilteredProductsWithFilters = (excludeType = null) => {
    let temp = products;
    
    if (typeFilter !== "Tất cả") temp = temp.filter(p => p.type === typeFilter);
    if (category !== "Tất cả") {
      temp = temp.filter(p => {
        const catName = p.category ? (typeof p.category === 'string' ? p.category : p.category.name) : null;
        return catName === category;
      });
    }
      if (sizes.length && excludeType !== 'size') {
        temp = temp.filter((p) => {
          const availableSizes = getSizeOptions(p, { availableOnly: true });
          if (availableSizes.length === 0) return false;
          return sizes.some((selectedSize) => availableSizes.some((size) => size.value === selectedSize));
        });
      }
    if (colors.length && excludeType !== 'color') {
      temp = temp.filter(p => {
        if (!p.colors || p.colors.length === 0) return false;
        return colors.some(selectedColor => 
          p.colors.some(c => {
            const hex = typeof c === 'string' ? c : (c.hex || c.color);
            return hex === selectedColor;
          })
        );
      });
    }
    temp = temp.filter(p => {
      const price = Number(p.price);
      return price >= priceMin && price <= priceMax;
    });
    
    return temp;
  };

  // Get available sizes từ products data
  const getAvailableSizes = () => {
    let available = new Set();
    const filtered = getFilteredProductsWithFilters('size');
    filtered.forEach(p => {
      getSizeOptions(p, { availableOnly: true }).forEach((size) => available.add(size.value));
    });
    return Array.from(available).sort((a, b) => {
      const aIsNum = !isNaN(a);
      const bIsNum = !isNaN(b);
      if (aIsNum && bIsNum) return parseInt(a) - parseInt(b);
      if (!aIsNum && !bIsNum) return a.localeCompare(b);
      return aIsNum ? 1 : -1;
    });
  };
  
  const SIZES = getAvailableSizes();
  
  // Count products có specific size (smart count)
  const countSizeInFiltered = (sizeValue) => {
    const filtered = getFilteredProductsWithFilters('size');
    return filtered.filter(p => {
      const availableSizes = getSizeOptions(p, { availableOnly: true });
      return availableSizes.some((size) => size.value === sizeValue);
    }).length;
  };

  // Get available colors từ products data
  const getAvailableColors = () => {
    let colorCount = new Map();
    const filtered = getFilteredProductsWithFilters('color');
    filtered.forEach(p => {
      if (p.colors && Array.isArray(p.colors)) {
        p.colors.forEach(c => {
          const hex = typeof c === 'string' ? c : (c.hex || c.color);
          if (hex) {
            colorCount.set(hex, (colorCount.get(hex) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hex]) => hex);
  };

  // Count products có specific color (smart count)
  const countColorInFiltered = (colorHex) => {
    const filtered = getFilteredProductsWithFilters('color');
    return filtered.filter(p => {
      if (!p.colors || p.colors.length === 0) return false;
      return p.colors.some(c => {
        const hex = typeof c === 'string' ? c : (c.hex || c.color);
        return hex === colorHex;
      });
    }).length;
  };

  const AVAILABLE_COLORS = getAvailableColors();

  const toggleArr = (setter, val) =>
    setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);

  let filtered = products;

  /* Filter search query - nếu có search query, filter sản phẩm theo tên */
  if (searchQuery) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  /* Filter type */
  if (typeFilter !== "Tất cả") filtered = filtered.filter((p) => p.type === typeFilter);
  /* Filter category */
  if (category !== "Tất cả") {
    filtered = filtered.filter((p) => {
      const catName = p.category ? (typeof p.category === 'string' ? p.category : p.category.name) : null;
      return catName === category;
    });
  }
  /* Filter sizes - từ MySQL product_sizes - OR logic (sản phẩm có bất kỳ size nào được chọn) */
  if (sizes.length) {
    filtered = filtered.filter((p) => {
      const availableSizes = getSizeOptions(p, { availableOnly: true });
      if (availableSizes.length === 0) return false;
      return sizes.some((selectedSize) => availableSizes.some((size) => size.value === selectedSize));
    });
  }

  /* Filter colors - từ MySQL product_colors - OR logic (sản phẩm có bất kỳ màu nào được chọn) */
  if (colors.length) {
    filtered = filtered.filter((p) => {
      if (!p.colors || p.colors.length === 0) return false;
      // Sản phẩm có bất kỳ màu nào trong selected colors
      return colors.some((selectedColor) => {
        return p.colors.some((c) => {
          const hex = typeof c === 'string' ? c : (c.hex || c.color);
          return hex === selectedColor;
        });
      });
    });
  }

  /* Filter price range */
  filtered = filtered.filter((p) => {
    const price = Number(p.price);
    return price >= priceMin && price <= priceMax;
  });

  /* Filter tag for popular - chỉ lấy sản phẩm "Bán chạy" */
  if (sortBy === "popular") {
    filtered = filtered.filter((p) => p.tag === "Bán chạy");
  }

  /* Filter tag for newest - chỉ lấy sản phẩm "Mới" */
  if (sortBy === "newest") {
    filtered = filtered.filter((p) => p.tag === "Mới");
  }

  /* Sort */
  if (sortBy === "popular")    filtered = [...filtered].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  if (sortBy === "price_asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === "rating")     filtered = [...filtered].sort((a, b) => getDisplayRating(b) - getDisplayRating(a));
  if (sortBy === "newest")     filtered = [...filtered].sort((a, b) => b.id - a.id);

  const totalAo   = products.filter(p => p.type === "Áo").length;
  const totalQuan = products.filter(p => p.type === "Quần").length;

  return (
    <div className="products-page">
      <div className="products-page-header">
        <div className="products-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-sep">/</span>
          <span>Sản phẩm</span>
          {searchQuery && (
            <><span className="breadcrumb-sep">/</span><span>Tìm: <strong>{searchQuery}</strong></span></>
          )}
          {typeFilter !== "Tất cả" && !searchQuery && (
            <><span className="breadcrumb-sep">/</span><span>{typeFilter}</span></>
          )}
        </div>
        <h1 className="products-page-title">
          {searchQuery ? (
            <>Kết quả tìm kiếm <span className="accent">"{searchQuery}"</span></>
          ) : (
            <>Thời trang <span className="accent">UniqTee</span></>
          )}
        </h1>
      </div>

      <div className="products-layout">
        {/* ── Sidebar ── */}
        <aside className={`filters-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
          <div className="filters-title">
            Bộ lọc
            <button className="filters-reset" onClick={() => { 
              setTypeFilter("Tất cả"); 
              setCategory("Tất cả"); 
              setSizes([]); 
              setColors([]); 
              setPriceMin(0); 
              setPriceMax(1000000); 
              setMinDisplay(""); 
              setMaxDisplay(""); 
              setSortBy("all");
              setSearchQuery("");
            }}>
              Xóa tất cả
            </button>
          </div>

          {/* Clear search */}
          {searchQuery && (
            <div className="filter-group">
              <button 
                className="filter-clear-btn"
                onClick={() => setSearchQuery("")}
                style={{ width: "100%", marginBottom: "16px", padding: "8px 0" }}
              >
                ✕ Xóa tìm kiếm: "{searchQuery}"
              </button>
            </div>
          )}

          {/* Category */}
          <div className="filter-group">
            <p className="filter-group-label">Danh mục</p>
            <div className="filter-options">
              {CATEGORIES.map((cat) => {
                let count;
                if (cat === "Tất cả") {
                  // Tất cả: count theo type + category filter
                  count = typeFilter === "Tất cả" 
                    ? products.length 
                    : products.filter(p => p.type === typeFilter).length;
                } else {
                  // Count specific category, filtered by type
                  count = products.filter((p) => {
                    // Check type filter
                    if (typeFilter !== "Tất cả" && p.type !== typeFilter) return false;
                    // Check category
                    const catName = p.category ? (typeof p.category === 'string' ? p.category : p.category.name) : null;
                    return catName === cat;
                  }).length;
                }
                return (
                  <label key={cat} className={`filter-option ${category === cat ? "checked" : ""}`} onClick={() => setCategory(cat)}>
                    <div className="filter-checkbox">{category === cat && <span className="filter-check-mark">✓</span>}</div>
                    <span className="filter-option-name">{cat}</span>
                    <span className="filter-option-count">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div className="filter-group">
            <div className="filter-group-header">
              <p className="filter-group-label">Kích thước</p>
              {sizes.length > 0 && (
                <button 
                  className="filter-clear-btn"
                  onClick={() => setSizes([])}
                  title="Xóa filter kích thước"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="size-filter-grid">
              {SIZES.map((s) => {
                const cnt = countSizeInFiltered(s);
                return (
                  <button 
                    key={s} 
                    className={`size-filter-btn ${sizes.includes(s) ? "active" : ""} ${cnt === 0 ? "disabled" : ""}`}
                    onClick={() => cnt > 0 && toggleArr(setSizes, s)}
                    disabled={cnt === 0}
                    title={cnt === 0 ? "Không có sản phẩm" : `${cnt} sản phẩm`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div className="filter-group">
            <div className="filter-group-header">
              <p className="filter-group-label">Màu sắc</p>
              {colors.length > 0 && (
                <button 
                  className="filter-clear-btn"
                  onClick={() => setColors([])}
                  title="Xóa filter màu sắc"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="color-filter-grid">
              {AVAILABLE_COLORS.map((hex) => {
                const cnt = countColorInFiltered(hex);
                return (
                  <button 
                    key={hex} 
                    className={`color-filter-swatch ${colors.includes(hex) ? "selected" : ""} ${cnt === 0 ? "disabled" : ""}`}
                    style={{ background: hex }} 
                    title={cnt === 0 ? "Không có sản phẩm" : `${cnt} sản phẩm`}
                    onClick={() => cnt > 0 && toggleArr(setColors, hex)}
                    disabled={cnt === 0}
                  />
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div className="filter-group">
            <p className="filter-group-label">Khoảng giá</p>
            <div className="price-range-inputs">
              <input 
                type="number" 
                placeholder="0" 
                value={minDisplay} 
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setMinDisplay(val);
                  setPriceMin(val === "" ? 0 : Math.max(0, parseInt(val) || 0));
                }}
                min="0"
              />
              <span className="price-range-sep">—</span>
              <input 
                type="number" 
                placeholder="1.000.000" 
                value={maxDisplay} 
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setMaxDisplay(val);
                  const newMax = val === "" ? 1000000 : parseInt(val) || 1000000;
                  setPriceMax(Math.max(priceMin, newMax));
                }}
                min={priceMin}
              />
            </div>
          </div>
        </aside>

        {/* ── Grid ── */}
        <div className="products-grid-area">
          {/* Type tabs nhanh */}
          <div className="type-quick-tabs">
            {TYPES.map((t) => {
              const cnt = t === "Tất cả" ? products.length : products.filter(p => p.type === t).length;
              return (
                <button
                  key={t}
                  className={`type-quick-tab ${typeFilter === t ? "active" : ""}`}
                  onClick={() => handleTypeChange(t)}
                >
                  {t === "Áo" ? "👕" : t === "Quần" ? "👖" : "🛍️"} {t}
                  <span className="type-quick-count">{cnt}</span>
                </button>
              );
            })}
          </div>

          {/* Applied Filters Badges */}
          {(typeFilter !== "Tất cả" || category !== "Tất cả" || sizes.length > 0 || colors.length > 0 || priceMin > 0 || priceMax < 1000000) && (
            <div className="applied-filters">
              <div className="applied-filters-list">
                {typeFilter !== "Tất cả" && (
                  <span className="filter-badge">
                    {typeFilter}
                    <button onClick={() => setTypeFilter("Tất cả")} className="badge-close">✕</button>
                  </span>
                )}
                {category !== "Tất cả" && (
                  <span className="filter-badge">
                    {category}
                    <button onClick={() => setCategory("Tất cả")} className="badge-close">✕</button>
                  </span>
                )}
                {sizes.map(s => (
                  <span key={s} className="filter-badge">
                    Size: {s}
                    <button onClick={() => setSizes(sizes.filter(x => x !== s))} className="badge-close">✕</button>
                  </span>
                ))}
                {colors.map(c => (
                  <span key={c} className="filter-badge" style={{ borderColor: c }}>
                    <span className="color-dot" style={{ background: c }}></span>
                    <button onClick={() => setColors(colors.filter(x => x !== c))} className="badge-close">✕</button>
                  </span>
                ))}
                {(priceMin > 0 || priceMax < 1000000) && (
                  <span className="filter-badge">
                    Giá: {fmt(priceMin)} - {fmt(priceMax)}
                    <button onClick={() => { setPriceMin(0); setPriceMax(1000000); setMinDisplay(""); setMaxDisplay(""); }} className="badge-close">✕</button>
                  </span>
                )}
              </div>
              <p className="products-display-count">Hiển thị : <strong>{filtered.length}</strong> sản phẩm</p>
            </div>
          )}

          {/* Display Count (when no filters) */}
          {!(typeFilter !== "Tất cả" || category !== "Tất cả" || sizes.length > 0 || colors.length > 0 || priceMin > 0 || priceMax < 1000000) && (
            <p className="products-display-count">Hiển thị : <strong>{filtered.length}</strong> sản phẩm</p>
          )}

          <div className="products-toolbar">
            <div className="toolbar-right">
              <button className="mobile-filter-btn" onClick={() => setMobileOpen(true)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Bộ lọc
              </button>
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="all">Tất cả</option>
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

          {loading ? (
            <div className="products-empty">
              <p style={{ fontSize: "2rem", marginBottom: 16 }}>⏳</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>Đang tải sản phẩm...</p>
            </div>
          ) : error ? (
            <div className="products-empty">
              <p style={{ fontSize: "2rem", marginBottom: 16 }}>❌</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>{error}</p>
              <button
                style={{ marginTop: 16, padding: "9px 20px", background: "var(--accent)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", border: "none" }}
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="products-empty">
              <p style={{ fontSize: "2.5rem", marginBottom: 16 }}>🔍</p>
              <h3 style={{ fontSize: "1.25rem", marginBottom: 8, color: "var(--text-primary)" }}>Không tìm thấy sản phẩm</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 20 }}>
                Hãy thử xóa một số bộ lọc để xem thêm sản phẩm
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {(sizes.length > 0 || colors.length > 0 || priceMin > 0 || priceMax < 1000000) && (
                  <button
                    style={{ padding: "10px 20px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", border: "none" }}
                    onClick={() => { setSizes([]); setColors([]); setPriceMin(0); setPriceMax(1000000); setMinDisplay(""); setMaxDisplay(""); }}
                  >
                    🔄 Xóa tất cả lọc
                  </button>
                )}
                {category !== "Tất cả" && (
                  <button
                    style={{ padding: "10px 20px", background: "var(--border-light)", color: "var(--text-primary)", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", border: "none" }}
                    onClick={() => setCategory("Tất cả")}
                  >
                    ← Xóa lọc danh mục
                  </button>
                )}
                {typeFilter !== "Tất cả" && (
                  <button
                    style={{ padding: "10px 20px", background: "var(--border-light)", color: "var(--text-primary)", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", border: "none" }}
                    onClick={() => { setTypeFilter("Tất cả"); setCategory("Tất cả"); setSizes([]); }}
                  >
                    ← Xem tất cả loại
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={`p-grid ${viewMode === "list" ? "list-view" : ""}`}>
                {filtered.slice((page - 1) * 9, page * 9).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {Math.ceil(filtered.length / 9) > 1 && (
                <div className="pagination">
                  {Array.from({ length: Math.ceil(filtered.length / 9) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button key={pageNum} className={`page-btn ${page === pageNum ? "active" : ""}`} onClick={() => setPage(pageNum)}>{pageNum}</button>
                    );
                  })}
                  {page < Math.ceil(filtered.length / 9) && (
                    <button className="page-btn" onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(filtered.length / 9)))}>→</button>
                  )}
                </div>
              )}
            </>
          )}
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
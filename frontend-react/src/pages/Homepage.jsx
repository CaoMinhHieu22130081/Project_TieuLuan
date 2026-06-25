import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Shirt,
  Layers,
  Camera,
  Star,
  Check,
  X,
  Upload,
  Search,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  User,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { aiAPI, categoryAPI, productAPI } from "../services/api";
import { getDisplayRating } from "../utils/productDisplay";
import "./css/Homepage.css";

// Danh mục lấy từ MySQL
const CATEGORY_ICON_MAP = {
  "Cơ bản": "◻",
  Graphic: "◈",
  Oversized: "▣",
  Vintage: "◉",
  "Thể thao": "◆",
  "Sọc kẻ": "☰",
  Jeans: "▤",
  Jogger: "▥",
  Cargo: "▦",
  Shorts: "▧",
  Kaki: "▨",
};

const normalizeCategory = (category) => ({
  ...category,
  id: Number(category?.id || 0),
  sortOrder: category?.sortOrder == null ? 0 : Number(category.sortOrder),
});

const getCategoryIcon = (name) => CATEGORY_ICON_MAP[name] || "◻";

const buildCategoriesFromProducts = (products) => {
  const byKey = new Map();

  (products || []).forEach((product) => {
    const category = product?.category && typeof product.category === "object" ? product.category : null;
    if (!category?.name) return;

    const key = String(category.id || category.name);
    if (!byKey.has(key)) {
      byKey.set(key, normalizeCategory(category));
    }
  });

  return Array.from(byKey.values());
};

const buildCategoryCards = (categories, products) => {
  return (categories || [])
    .slice()
    .sort((left, right) => (Number(left.sortOrder || 0) - Number(right.sortOrder || 0)) || String(left.name || "").localeCompare(String(right.name || ""), "vi"))
    .map((category) => ({
      ...category,
      icon: getCategoryIcon(category.name),
      count: (products || []).filter((product) => product.category && product.category.name === category.name).length,
    }));
};

// Hàm tạo featured products từ dữ liệu - chỉ hiển thị sản phẩm bán chạy
const getFeaturedProducts = (products) => {
  return (products || [])
    .filter(p => p.tag === "Bán chạy")
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 8);
};

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const AI_RESULT_LIMIT = 5;

const TYPE_FILTER_OPTIONS = [
  { value: "auto", label: "Tự động", icon: <Sparkles size={14} /> },
  { value: "Áo", label: "Áo", icon: <Shirt size={14} /> },
  { value: "Quần", label: "Quần", icon: <Layers size={14} /> },
];

const formatSearchModel = (model) => {
  if (!model) {
    return "Không xác định";
  }

  if (model === "clip-faiss") {
    return "CLIP + FAISS";
  }

  if (model === "clip-numpy") {
    return "CLIP + numpy";
  }

  if (model === "fashion-clip-faiss") {
    return "FashionCLIP + FAISS";
  }

  if (model === "fashion-clip-numpy") {
    return "FashionCLIP + numpy";
  }

  if (model.includes("clip") && model.endsWith("-faiss")) {
    return "CLIP + FAISS";
  }

  if (model.includes("clip") && model.endsWith("-numpy")) {
    return "CLIP + numpy";
  }

  if (model === "srpone-gr-lite-faiss") {
    return "GR-Lite Fashion + FAISS";
  }

  if (model === "srpone-gr-lite-numpy") {
    return "GR-Lite Fashion + numpy";
  }

  if (model.includes("marqo-fashion")) {
    return model.endsWith("-faiss") ? "Marqo Fashion + FAISS" : "Marqo Fashion + numpy";
  }

  if (model === "histogram-fallback") {
    return "Histogram fallback";
  }

  return String(model).replace(/-/g, " ").toUpperCase();
};

const formatCount = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const normalizeSimilarity = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const getSimilarityLabel = (value) => {
  const score = normalizeSimilarity(value);
  if (score >= 90) return "Khớp tuyệt đối";
  if (score >= 80) return "Khớp cao";
  if (score >= 65) return "Tương đồng";
  if (score >= 50) return "Tham khảo";
  return "Gợi ý";
};

const getSimilarityTone = (value) => {
  const score = normalizeSimilarity(value);
  if (score >= 90) return "tone-exact";
  if (score >= 80) return "tone-strong";
  if (score >= 65) return "tone-medium";
  return "tone-soft";
};

function StarRating({ rating }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          fill={s <= Math.round(rating) ? "var(--star-color, #ffb300)" : "none"}
          stroke={s <= Math.round(rating) ? "var(--star-color, #ffb300)" : "#444"}
          style={{ marginRight: 2 }}
        />
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
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}
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
          {product.type === "Áo" ? <Shirt size={12} style={{ marginRight: 4 }} /> : <Layers size={12} style={{ marginRight: 4 }} />} {product.type}
        </span>

        <button className={`btn-cart-overlay ${addedToCart ? "added" : ""}`} onClick={handleCart}>
          {addedToCart ? <><Check size={14} style={{ marginRight: 4 }} /> Đã thêm</> : <><ShoppingBag size={14} style={{ marginRight: 4 }} /> Thêm vào giỏ</>}
        </button>
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <StarRating rating={getDisplayRating(product)} />
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

function AiSearchPanel() {
  const [dragOver,  setDragOver]  = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [fileName,  setFileName]  = useState("");
  const [searching, setSearching] = useState(false);
  const [results,   setResults]   = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [model,     setModel]     = useState("Đang kiểm tra AI...");
  const [catalogSize, setCatalogSize] = useState(0);
  const [predictedType, setPredictedType] = useState("");
  const [typeConfidence, setTypeConfidence] = useState(null);
  const [filteredByType, setFilteredByType] = useState(false);
  const [noResultReason, setNoResultReason] = useState("");
  const [minSimilarity, setMinSimilarity] = useState(null);
  const [error,     setError]     = useState("");
  const [typeFilter, setTypeFilter] = useState("auto");
  const inputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const progressTimerRef = useRef(null);
  const requestIdRef = useRef(0);
  const currentFileRef = useRef(null);

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const reset = () => {
    stopProgressTimer();
    clearPreviewUrl();
    requestIdRef.current += 1;
    currentFileRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setDragOver(false);
    setPreview(null);
    setFileName("");
    setResults(null);
    setSearching(false);
    setProgress(0);
    setModel("Sẵn sàng");
    setCatalogSize(0);
    setPredictedType("");
    setTypeConfidence(null);
    setFilteredByType(false);
    setNoResultReason("");
    setMinSimilarity(null);
    setError("");
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await aiAPI.getAiStatus();
        if (status && status.model) {
          setModel(formatSearchModel(status.model));
        } else {
          setModel("Sẵn sàng");
        }
      } catch (err) {
        console.error("AI Status check failed:", err);
        setModel("AI chưa sẵn sàng");
      }
    };

    checkStatus();

    return () => {
      stopProgressTimer();
      clearPreviewUrl();
    };
  }, []);

  const beginProgress = () => {
    stopProgressTimer();
    setProgress(12);
    progressTimerRef.current = setInterval(() => {
      setProgress((current) => (current >= 90 ? 90 : current + 8));
    }, 260);
  };

  const runSearch = useCallback(async (file) => {
    if (!file) {
      return;
    }

    stopProgressTimer();
    const searchId = requestIdRef.current + 1;
    requestIdRef.current = searchId;
    const resolvedType = typeFilter === "auto" ? null : typeFilter;

    setResults(null);
    setError("");
    setNoResultReason("");
    setMinSimilarity(null);
    setModel("Đang xử lý...");
    setSearching(true);
    beginProgress();

    try {
      const response = await aiAPI.searchProductsByImage(file, AI_RESULT_LIMIT, resolvedType);
      if (requestIdRef.current !== searchId) {
        return;
      }

      const payload = Array.isArray(response) ? { results: response } : (response || {});
      const normalizedResults = Array.isArray(payload.results) ? payload.results : [];

      setResults(normalizedResults.slice(0, AI_RESULT_LIMIT));
      setModel(formatSearchModel(payload.model));
      setCatalogSize(typeof payload.catalogSize === "number" ? payload.catalogSize : 0);
      setPredictedType(payload.predictedType || "");
      setTypeConfidence(typeof payload.typeConfidence === "number" ? payload.typeConfidence : null);
      setFilteredByType(payload.filteredByType === true);
      setNoResultReason(payload.noResult === true ? (payload.noResultReason || "") : "");
      setMinSimilarity(typeof payload.minSimilarity === "number" ? payload.minSimilarity : null);
      setError("");
    } catch (err) {
      if (requestIdRef.current !== searchId) {
        return;
      }

      setResults(null);
      setCatalogSize(0);
      setPredictedType("");
      setTypeConfidence(null);
      setFilteredByType(false);
      setNoResultReason("");
      setMinSimilarity(null);
      setError(err.message || "Không thể thực hiện tìm kiếm bằng hình ảnh.");
    } finally {
      if (requestIdRef.current === searchId) {
        stopProgressTimer();
        setSearching(false);
        setProgress(0);
      }
    }
  }, [typeFilter]);

  const handleFile = async (file) => {
    if (!file) {
      return;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      stopProgressTimer();
      setResults(null);
      setSearching(false);
      setProgress(0);
      setCatalogSize(0);
      setNoResultReason("");
      setMinSimilarity(null);
      setError("Vui lòng chọn một tệp ảnh JPG, PNG hoặc WEBP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      stopProgressTimer();
      setResults(null);
      setSearching(false);
      setProgress(0);
      setCatalogSize(0);
      setNoResultReason("");
      setMinSimilarity(null);
      setError("Kích thước ảnh tối đa là 10MB.");
      return;
    }

    stopProgressTimer();
    clearPreviewUrl();

    currentFileRef.current = file;

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    setPreview(previewUrl);
    setFileName(file.name || "image-upload.jpg");
    setResults(null);
    setNoResultReason("");
    setMinSimilarity(null);
    setError("");

    await runSearch(file);
  };

  useEffect(() => {
    if (currentFileRef.current) {
      runSearch(currentFileRef.current);
    }
  }, [runSearch]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const hasResults = Array.isArray(results) && results.length > 0;
  const showEmptyState = Boolean(preview) && !searching && !error && Array.isArray(results) && results.length === 0;
  const emptyStateMessage = noResultReason || "Không tìm thấy sản phẩm tương tự. Hãy thử ảnh rõ hơn, nền gọn hơn hoặc chụp toàn bộ trang phục ở chính diện.";
  const showTypeMeta = Boolean(predictedType);
  const typeLabel = predictedType === "Quần" ? <><Layers size={14} style={{ marginRight: 4 }} /> Quần</> : predictedType === "Áo" ? <><Shirt size={14} style={{ marginRight: 4 }} /> Áo</> : predictedType;
  const topResult = hasResults ? results[0] : null;
  const topSimilarity = normalizeSimilarity(topResult?.similarity);
  const secondaryResults = hasResults ? results.slice(1) : [];
  const resultsLabel = (typeFilter !== "auto" || filteredByType)
    ? "sản phẩm cùng loại"
    : "sản phẩm tương tự";
  const filterHint = typeFilter === "auto"
    ? (filteredByType ? "Đã lọc theo loại" : "Phân tích toàn catalog")
    : `Lọc: ${typeFilter}`;
  const summaryCards = [
    {
      label: `Top ${AI_RESULT_LIMIT}`,
      value: formatCount(results?.length || 0),
      hint: "Gợi ý cùng loại",
    },
    {
      label: "Độ khớp cao nhất",
      value: `${topSimilarity}%`,
      hint: topResult ? getSimilarityLabel(topSimilarity) : "Chưa có kết quả",
    },
    {
      label: "Mô hình",
      value: model,
      hint: filterHint,
    },
    {
      label: "Sản phẩm quét",
      value: formatCount(catalogSize),
      hint: "Từ cơ sở dữ liệu",
    },
  ];

  return (
    <section className="ai-section" id="ai-search">
      <div className="ai-section-inner">
        <div className="ai-header">
          <span className="ai-chip"><Sparkles size={14} style={{ marginRight: 6 }} /> AI Visual Search</span>
          <h2 className="section-title">Tìm kiếm bằng <span className="accent">Hình Ảnh</span></h2>
          <p className="section-sub">
            Tải lên một bức ảnh trang phục, AI sẽ nhận diện loại (áo hoặc quần), phân tích đặc trưng
            hình ảnh và chỉ gợi ý các sản phẩm cùng loại có mức độ tương đồng cao nhất.
          </p>
        </div>
        <div className="ai-content">
          <div className="upload-col">
            <div className="ai-filter-row">
              <span className="ai-filter-label">Lọc theo loại</span>
              <div className="ai-filter-toggle" role="group" aria-label="Lọc theo loại sản phẩm">
                {TYPE_FILTER_OPTIONS.map((option) => {
                  const isActive = typeFilter === option.value;
                  const isQuan = option.value === "Quần";
                  const isAuto = option.value === "auto";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`ai-filter-btn ${isActive ? "active" : ""} ${isQuan ? "is-quan" : ""} ${isAuto ? "is-auto" : ""}`}
                      onClick={() => setTypeFilter(option.value)}
                    >
                      <span className="ai-filter-icon">{option.icon}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {!preview ? (
              <div
                className={`drop-zone ${dragOver ? "drag-active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="drop-icon">
                  <Upload size={52} strokeWidth={1.2} style={{ color: "var(--accent)", opacity: 0.8 }} />
                </div>
                <p className="drop-title">Kéo thả ảnh vào đây</p>
                <p className="drop-sub">hoặc click để chọn ảnh từ máy tính</p>
                <p className="drop-hint">Hỗ trợ JPG, PNG, WEBP · Tối đa 10MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="preview-wrap">
                <img src={preview} alt="preview" className="preview-img" />
                <div className="preview-meta">
                  <span className="preview-label">Ảnh đã chọn</span>
                  <span className="preview-file">{fileName || "image-upload.jpg"}</span>
                </div>
                <button className="btn-reset" onClick={reset}><X size={14} style={{ marginRight: 4 }} /> Đổi ảnh</button>
                {searching && (
                  <div className="progress-wrap">
                    <div className="progress-label">
                      <span>Đang phân tích ảnh…</span>
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
            {!preview && !searching && !error && !hasResults && (
              <div className="ai-idle">
                <div className="ai-how-it-works">
                  {[
                    { icon: <Upload size={24} />, title: "Tải ảnh chuẩn",  desc: "Chọn hoặc kéo thả ảnh sản phẩm rõ nét, ưu tiên ảnh chính diện" },
                    { icon: <Search size={24} />, title: "AI nhận diện loại", desc: "AI phân loại áo/quần trước khi so khớp với catalog" },
                    { icon: <ShoppingBag size={24} />, title: "Top 5 gợi ý", desc: "Nhận 5 sản phẩm cùng loại có độ tương đồng cao nhất" },
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
            {error && (
              <div className="ai-empty-card ai-error-card">
                <AlertTriangle size={32} style={{ color: "#ffb300", marginBottom: 16 }} />
                <p>{error}</p>
                <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
                  Thử ảnh khác
                </button>
              </div>
            )}
            {hasResults && !error && (
              <div className="ai-results">
                <div className="ai-results-header">
                  <div>
                    <p className="results-label"><Sparkles size={16} style={{ marginRight: 8, display: 'inline' }} /> Tìm thấy {results.length} {resultsLabel}</p>
                    {showTypeMeta && (
                      <div className="ai-type-row">
                        <span className={`ai-type-pill ${predictedType === "Quần" ? "ai-type-pill-quan" : "ai-type-pill-ao"}`}>
                          {typeLabel}
                        </span>
                        {typeof typeConfidence === "number" && (
                          <span className="ai-confidence">{typeConfidence}% tin cậy</span>
                        )}
                        {filteredByType && (
                          <span className="ai-filtered">Đã lọc theo loại</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="ai-engine-pill">{model}</span>
                </div>
                <div className="ai-summary-grid">
                  {summaryCards.map((item) => (
                    <div key={item.label} className="ai-summary-card">
                      <span className="ai-summary-label">{item.label}</span>
                      <strong className="ai-summary-value">{item.value}</strong>
                      <span className="ai-summary-hint">{item.hint}</span>
                    </div>
                  ))}
                </div>
                {topResult && (
                  <Link to={`/products/${topResult.id}`} className="ai-featured-result" style={{ textDecoration: "none" }}>
                    <div className="ai-featured-media">
                      <img
                        src={topResult.image || "https://via.placeholder.com/480x640?text=UniqTee"}
                        alt={topResult.name}
                        className="ai-featured-img"
                      />
                      <span className={`ai-featured-badge ${getSimilarityTone(topSimilarity)}`}>
                        {getSimilarityLabel(topSimilarity)}
                      </span>
                    </div>
                    <div className="ai-featured-info">
                      <div className="ai-featured-topline">
                        <span className="ai-featured-kicker">Top match</span>
                        <span className="ai-featured-score">{topSimilarity}%</span>
                      </div>
                      <p className="ai-featured-name">{topResult.name}</p>
                      <div className="ai-featured-meta">
                        <span>{formatPrice(topResult.price || 0)}</span>
                        {topResult.type && <span>{topResult.type}</span>}
                        {topResult.category && <span>{topResult.category}</span>}
                      </div>
                      <div className="similarity-bar-wrap ai-featured-similarity">
                        <span className="sim-label">Độ phù hợp</span>
                        <div className="sim-bar">
                          <div className="sim-fill" style={{ width: `${topSimilarity}%` }} />
                        </div>
                        <span className="sim-pct">{topSimilarity}%</span>
                      </div>
                      <span className="btn-primary ai-featured-cta">Xem chi tiết</span>
                    </div>
                  </Link>
                )}
                {secondaryResults.length > 0 && (
                  <div className="ai-result-list">
                    {secondaryResults.map((r, index) => {
                      const similarity = normalizeSimilarity(r.similarity);

                      return (
                        <Link key={r.id} to={`/products/${r.id}`} className="ai-result-card" style={{ textDecoration: "none" }}>
                          <img src={r.image || "https://via.placeholder.com/120x160?text=UniqTee"} alt={r.name} className="ai-result-img" />
                          <div className="ai-result-info">
                            <div className="ai-result-topline">
                              <span className="ai-result-rank">#{index + 2}</span>
                              <span className={`ai-result-score ${getSimilarityTone(similarity)}`}>{similarity}%</span>
                            </div>
                            {r.type && <span className="ai-result-type">{r.type}</span>}
                            <p className="ai-result-name">{r.name}</p>
                            <p className="ai-result-price">{formatPrice(r.price || 0)}</p>
                            <div className="similarity-bar-wrap">
                              <span className="sim-label">Độ phù hợp</span>
                              <div className="sim-bar"><div className="sim-fill" style={{ width: `${similarity}%` }} /></div>
                              <span className="sim-pct">{similarity}%</span>
                            </div>
                          </div>
                          <span className="btn-view-sm">Xem</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {showEmptyState && (
              <div className="ai-empty-card">
                <Search size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p>{emptyStateMessage}</p>
                {typeof minSimilarity === "number" && (
                  <small className="ai-empty-hint">Ngưỡng tối thiểu: {minSimilarity}%</small>
                )}
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getAllProducts(),
          categoryAPI.getAllCategories(),
        ]);

        const rawProducts = Array.isArray(productsResponse)
          ? productsResponse
          : Array.isArray(productsResponse?.content)
            ? productsResponse.content
            : [];

        const rawCategories = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : Array.isArray(categoriesResponse?.content)
            ? categoriesResponse.content
            : [];

        const normalizedCategories = rawCategories
          .map(normalizeCategory)
          .filter((category) => category.name && category.type);

        const categorySource = normalizedCategories.length > 0
          ? normalizedCategories
          : buildCategoriesFromProducts(rawProducts);

        setProducts(rawProducts);
        setFeaturedProducts(getFeaturedProducts(rawProducts));
        setCategories(buildCategoryCards(categorySource, rawProducts));
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
              Thời trang <span className="accent">Unisex</span><br />Dành cho bạn
            </h1>
            <p className="hero-desc">
              Khám phá bộ sưu tập hàng trăm mẫu áo thun, quần jeans, cargo & jogger cực chất. 
              Trải nghiệm không gian mua sắm thông minh, tìm đúng bộ trang phục bạn yêu thích chỉ bằng một tấm ảnh nhờ công nghệ AI tiên tiến.
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn-primary">Mua ngay</Link>
              <a href="#ai-search" className="btn-secondary">
                <Camera size={18} style={{ marginRight: 8 }} /> Tìm bằng ảnh
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
                <Camera size={20} color="var(--accent)" />
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
                <li><a href="/faq">Câu hỏi thường gặp</a></li>
                <li><a href="/faq">Chính sách đổi trả</a></li>
                <li><a href="/faq">Chính sách vận chuyển</a></li>
              </ul>
            </div>
            <div className="footer-links-group">
              <p className="footer-group-title">Về UniqTee</p>
              <ul>
                <li><a href="/about">Giới thiệu</a></li>
                <li><a href="/faq">Bảng size</a></li>
                <li><a href="/contact">Liên hệ</a></li>
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

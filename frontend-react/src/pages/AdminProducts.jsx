import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Shirt,
  Layers,
  ShoppingBag,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package
} from "lucide-react";
import { categoryAPI, productAPI } from "../services/api";
import { AdminLayout } from "./Adminheader";
import { recordAdminActivity } from "../utils/adminActivity";
import "./css/Admin.css";

const PRODUCT_TYPES = ["Tất cả", "Áo", "Quần"];

const TAG_OPTIONS = [
  { value: "", label: "Không có" },
  { value: "Mới", label: "Mới" },
  { value: "Bán chạy", label: "Bán chạy" },
  { value: "Sale", label: "Sale" },
];

const TAG_CSS = {
  "Bán chạy": "tag-hot",
  "Mới": "tag-new",
  "Sale": "tag-sale",
};

const SORT_OPTIONS = [
  { value: "id", label: "Mặc định" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "sold", label: "Bán chạy nhất" },
];

const DEFAULT_COLOR_NAME = "Đen";
const DEFAULT_COLOR_HEX = "#1a1a1a";
const DEFAULT_SIZES_BY_TYPE = {
  Áo: ["S", "M", "L"],
  Quần: ["28", "30", "32"],
};

const createImageField = (url = "", sortOrder = 0) => ({
  url,
  sortOrder,
});

const createColorField = (name = DEFAULT_COLOR_NAME, hex = DEFAULT_COLOR_HEX) => ({
  name,
  hex,
});

const createSizeField = (size = "", isAvailable = true) => ({
  size,
  isAvailable,
});

const buildDefaultSizes = (type = "Áo") => (DEFAULT_SIZES_BY_TYPE[type] || DEFAULT_SIZES_BY_TYPE.Áo)
  .map((size) => createSizeField(size, true));

const createFormState = (type = "Áo", categoryId = "") => ({
  type,
  categoryId,
  name: "",
  sku: "",
  price: "",
  originalPrice: "",
  tag: "",
  material: "",
  description: "",
  isActive: true,
  images: [],
  colors: [createColorField()],
  sizes: buildDefaultSizes(type),
});

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const normalizeCategory = (category) => ({
  ...category,
  id: Number(category.id),
  sortOrder: category.sortOrder == null ? 0 : Number(category.sortOrder),
});

const normalizeImage = (image, index = 0) => {
  if (typeof image === "string") {
    return {
      url: image,
      sortOrder: index,
    };
  }

  return {
    url: image?.url || image?.src || image?.image || "",
    sortOrder: image?.sortOrder == null ? index : Number(image.sortOrder),
  };
};

const normalizeColor = (color) => {
  if (typeof color === "string") {
    return {
      name: color,
      hex: DEFAULT_COLOR_HEX,
    };
  }

  return {
    name: color?.name || "",
    hex: color?.hex || DEFAULT_COLOR_HEX,
  };
};

const normalizeSize = (size) => {
  if (typeof size === "string") {
    return {
      size,
      isAvailable: true,
    };
  }

  return {
    size: size?.size || "",
    isAvailable: size?.isAvailable !== false,
  };
};

const normalizeProduct = (product) => {
  const category = product.category && typeof product.category === "object"
    ? normalizeCategory(product.category)
    : null;

  return {
    ...product,
    id: Number(product.id),
    sku: product.sku || "",
    name: product.name || "",
    type: product.type || "Áo",
    category,
    categoryId: product.categoryId ? Number(product.categoryId) : category?.id || "",
    price: Number(product.price || 0),
    originalPrice: product.originalPrice == null ? null : Number(product.originalPrice),
    tag: product.tag || "",
    material: product.material || "",
    description: product.description || "",
    sold: Number(product.sold || 0),
    rating: product.rating == null ? 5 : Number(product.rating),
    reviewCount: product.reviewCount == null ? Number(product.reviews || 0) : Number(product.reviewCount),
    isActive: product.isActive !== false,
    images: Array.isArray(product.images) ? product.images.map(normalizeImage).sort((a, b) => a.sortOrder - b.sortOrder) : [],
    colors: Array.isArray(product.colors) ? product.colors.map(normalizeColor) : [],
    sizes: Array.isArray(product.sizes) ? product.sizes.map(normalizeSize) : [],
  };
};

const normalizeCategories = (categories) =>
  (categories || [])
    .map(normalizeCategory)
    .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, "vi"));

export default function AdminProducts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [catFilter, setCatFilter] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("id");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createFormState());

  const getDefaultCategoryId = (type, categoryList = categories) => {
    const match = categoryList.find((category) => category.type === type);
    return match ? String(match.id) : "";
  };

  const getCategoryName = (product) => {
    if (product.category && typeof product.category === "object") {
      return product.category.name || "";
    }

    const categoryId = Number(product.categoryId);
    if (!Number.isNaN(categoryId)) {
      const match = categories.find((category) => category.id === categoryId);
      if (match) {
        return match.name;
      }
    }

    return "";
  };

  const updateFormCollectionItem = (field, index, updater) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => (itemIndex === index ? updater(item) : item)),
    }));
  };

  const addFormCollectionItem = (field, item) => {
    setForm((current) => ({
      ...current,
      [field]: [...current[field], item],
    }));
  };

  const removeFormCollectionItem = (field, index) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, categoriesData] = await Promise.all([
        productAPI.getAllProducts(),
        categoryAPI.getAllCategories(),
      ]);
      setProducts((productsData || []).map(normalizeProduct).sort((a, b) => a.id - b.id));
      setCategories(normalizeCategories(categoriesData));
    } catch (err) {
      console.error("Lỗi tải dữ liệu sản phẩm:", err);
      setError(err.message || "Không thể tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayed = products.filter((product) => {
    const keyword = search.trim().toLowerCase();
    const matchS = !keyword
      || (product.name || "").toLowerCase().includes(keyword)
      || (product.sku || "").toLowerCase().includes(keyword);
    const matchT = typeFilter === "Tất cả" || product.type === typeFilter;
    const categoryName = getCategoryName(product);
    const matchC = catFilter === "Tất cả" || categoryName === catFilter;
    return matchS && matchT && matchC;
  });

  const sortedDisplayed = [...displayed];
  if (sortBy === "price_asc") {
    sortedDisplayed.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }
  if (sortBy === "price_desc") {
    sortedDisplayed.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }
  if (sortBy === "sold") {
    sortedDisplayed.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
  }

  const formCategories = categories.filter((category) => category.type === form.type);

  const openEdit = (product) => {
    setEditProduct(product);
    const categoryId = product.category?.id || product.categoryId || getDefaultCategoryId(product.type || "Áo");
    const images = Array.isArray(product.images) && product.images.length > 0
      ? product.images.map(normalizeImage)
      : [];
    const colors = Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors.map(normalizeColor)
      : [createColorField()];
    const sizes = Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes.map(normalizeSize)
      : buildDefaultSizes(product.type || "Áo");

    setForm({
      type: product.type || "Áo",
      categoryId: categoryId ? String(categoryId) : "",
      name: product.name || "",
      sku: product.sku || "",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      tag: product.tag || "",
      material: product.material || "",
      description: product.description || "",
      isActive: product.isActive !== false,
      images,
      colors,
      sizes,
    });
    setNotice(null);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditProduct(null);
    const defaultType = "Áo";

    // Pre-fill 8 standard colors (name + hex) matching MySQL data
    const defaultPalette = [
      { name: 'Đen', hex: '#1a1a1a' },
      { name: 'Xám', hex: '#808080' },
      { name: 'Trắng', hex: '#ffffff' },
      { name: 'Kem', hex: '#F5F5DC' },
      { name: 'Be Kem', hex: '#C19A6B' },
      { name: 'Xanh Navy', hex: '#003087' },
      { name: 'Đỏ Đô', hex: '#8B0000' },
      { name: 'Xám Đậm', hex: '#4A4A4A' },
    ];

    const initial = createFormState(defaultType, getDefaultCategoryId(defaultType));
    initial.colors = defaultPalette.map((c) => createColorField(c.name, c.hex));
    setForm(initial);
    setNotice(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setNotice(null);

      const sku = form.sku.trim();
      const name = form.name.trim();
      const material = form.material.trim();
      const description = form.description.trim();
      const categoryId = Number(form.categoryId);
      const price = Number(form.price);
      const originalPrice = form.originalPrice === "" ? null : Number(form.originalPrice);
      const images = (form.images || [])
        .filter((image) => image && String(image.url || "").trim())
        .map((image, index) => ({
          url: String(image.url).trim(),
          sortOrder: image.sortOrder == null ? index : Number(image.sortOrder),
        }));
      const colors = (form.colors || [])
        .filter((color) => color && (String(color.name || "").trim() || String(color.hex || "").trim()))
        .map((color) => ({
          name: String(color.name || DEFAULT_COLOR_NAME).trim() || DEFAULT_COLOR_NAME,
          hex: String(color.hex || DEFAULT_COLOR_HEX).trim() || DEFAULT_COLOR_HEX,
        }));
      const sizes = (form.sizes || [])
        .filter((size) => size && String(size.size || "").trim())
        .map((size) => ({
          size: String(size.size).trim(),
          isAvailable: size.isAvailable !== false,
        }));

      if (!sku) throw new Error("Vui lòng nhập SKU.");
      if (!name) throw new Error("Vui lòng nhập tên sản phẩm.");
      if (!Number.isFinite(price) || price <= 0) throw new Error("Giá bán phải lớn hơn 0.");
      if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error("Vui lòng chọn danh mục hợp lệ.");
      if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice <= 0)) {
        throw new Error("Giá gốc không hợp lệ.");
      }
      if (images.length === 0) throw new Error("Vui lòng thêm ít nhất 1 hình ảnh.");
      if (colors.length === 0) throw new Error("Vui lòng thêm ít nhất 1 màu sắc.");
      if (sizes.length === 0) throw new Error("Vui lòng thêm ít nhất 1 kích cỡ.");

      const payload = {
        sku,
        name,
        type: form.type,
        category: { id: categoryId },
        price,
        originalPrice,
        tag: form.tag || null,
        material: material || null,
        description: description || null,
        isActive: form.isActive,
        images,
        colors,
        sizes,
      };

      const savedProduct = editProduct
        ? await productAPI.updateProduct(editProduct.id, payload)
        : await productAPI.createProduct(payload);

      const normalizedSavedProduct = normalizeProduct(savedProduct);
      setProducts((current) => {
        const nextProducts = editProduct
          ? current.map((product) => (product.id === normalizedSavedProduct.id ? normalizedSavedProduct : product))
          : [...current, normalizedSavedProduct];
        return nextProducts.sort((a, b) => a.id - b.id);
      });

      recordAdminActivity({
        type: "product",
        icon: "🛍️",
        text: editProduct
          ? `Đã cập nhật sản phẩm ${normalizedSavedProduct.name || name}`
          : `Đã thêm sản phẩm ${normalizedSavedProduct.name || name}`,
        unread: true,
      });

      setShowModal(false);
      setEditProduct(null);
      setForm(createFormState("Áo", getDefaultCategoryId("Áo")));
      setNotice({
        type: "success",
        text: editProduct ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Không thể lưu sản phẩm.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);
      setNotice(null);
      const targetProduct = products.find((product) => product.id === deleteId);
      await productAPI.deleteProduct(deleteId);
      setProducts((current) => current.filter((product) => product.id !== deleteId));
      setDeleteId(null);

      recordAdminActivity({
        type: "product",
        icon: "🗑️",
        text: `Đã xóa sản phẩm${targetProduct?.name ? `: ${targetProduct.name}` : ""}`,
        unread: true,
      });

      setNotice({
        type: "success",
        text: `Đã xóa sản phẩm${targetProduct?.name ? `: ${targetProduct.name}` : ""}.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Không thể xóa sản phẩm.",
      });
    } finally {
      setSaving(false);
    }
  };

  const chipCategories = [
    "Tất cả",
    ...categories
      .filter((category) => typeFilter === "Tất cả" || category.type === typeFilter)
      .map((category) => category.name),
  ];

  const countAo = products.filter((product) => product.type === "Áo").length;
  const countQuan = products.filter((product) => product.type === "Quần").length;

  return (
    <AdminLayout
      title="Quản lý sản phẩm"
      subtitle={`${products.length} sản phẩm · ${countAo} áo · ${countQuan} quần`}
      actions={<button className="topbar-btn accent" onClick={openAdd}><Plus size={18} /> Thêm sản phẩm</button>}
    >
      <div className="admin-card toolbar-card">
        <div className="toolbar-row">
          <div className="search-input-wrap">
            <span className="search-ico"><Search size={18} strokeWidth={2} /></span>
            <input
              className="admin-search-input"
              placeholder="Tìm theo tên, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="status-tabs">
            {PRODUCT_TYPES.map((type) => {
              const count = type === "Tất cả" ? products.length : products.filter((product) => product.type === type).length;
              return (
                <button
                  key={type}
                  className={`status-tab ${typeFilter === type ? "active" : ""}`}
                  onClick={() => {
                    setTypeFilter(type);
                    setCatFilter("Tất cả");
                  }}
                >
                  <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>
                    {type === "Áo" ? <Shirt size={16} /> : type === "Quần" ? <Layers size={16} /> : <ShoppingBag size={16} />}
                  </span>
                  {type}
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <select className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {notice && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${notice.type === "error" ? "rgba(220, 38, 38, .25)" : "rgba(4, 120, 87, .25)"}`,
              background: notice.type === "error" ? "rgba(220, 38, 38, .08)" : "rgba(4, 120, 87, .08)",
              color: notice.type === "error" ? "#fecaca" : "#bbf7d0",
              fontSize: "0.85rem",
            }}
          >
            {notice.text}
          </div>
        )}

        <div className="toolbar-filters" style={{ marginTop: 12 }}>
          {chipCategories.map((categoryName) => (
            <button
              key={categoryName}
              className={`filter-chip ${catFilter === categoryName ? "active" : ""}`}
              onClick={() => setCatFilter(categoryName)}
            >
              {categoryName}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card table-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#e74c3c" }}>
            <p>{error}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th><th>Loại</th><th>SKU</th><th>Danh mục</th>
                <th>Giá</th><th>Đã bán</th><th>Tag</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedDisplayed.map((product) => {
                const thumb = product.images && product.images.length > 0
                  ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0].url)
                  : "";
                const sizeList = (product.sizes || []).map((size) => typeof size === "string" ? size : size.size).join(", ");
                const categoryName = getCategoryName(product);

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="tp-product-cell">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="tp-img" />
                        ) : (
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 12,
                              border: "1px dashed var(--border-2)",
                              background: "var(--surface)",
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              textAlign: "center",
                              flexShrink: 0,
                            }}
                          >
                            Chưa có ảnh
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{product.name}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {(product.colors || []).length} màu · {sizeList}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${product.type === "Quần" ? "role-staff" : "role-customer"}`}>
                        <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>
                          {product.type === "Áo" ? <Shirt size={14} /> : <Layers size={14} />}
                        </span>
                        {product.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--accent)" }}>
                        {product.sku}
                      </span>
                    </td>
                    <td><span className="cat-pill">{categoryName}</span></td>
                    <td>
                      <p style={{ fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(product.price)}</p>
                      {product.originalPrice && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                          {formatCurrency(product.originalPrice)}
                        </p>
                      )}
                    </td>
                    <td><span className="sold-badge">{product.sold || 0}</span></td>
                    <td>
                      {product.tag
                        ? <span className={`tag-badge ${TAG_CSS[product.tag] || "tag-hot"}`}>{product.tag}</span>
                        : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn edit" onClick={() => openEdit(product)}>
                          <Pencil size={14} style={{ marginRight: 4 }} /> Sửa
                        </button>
                        {isAdmin && (
                          <button className="action-btn del" onClick={() => setDeleteId(product.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-form-group">
                  <label className="modal-label">Loại sản phẩm</label>
                  <select
                    className="modal-input"
                    value={form.type}
                    onChange={(e) => setForm((current) => {
                      const nextType = e.target.value;
                      return {
                        ...current,
                        type: nextType,
                        categoryId: getDefaultCategoryId(nextType),
                        sizes: buildDefaultSizes(nextType),
                      };
                    })}
                  >
                    <option value="Áo">Áo</option>
                    <option value="Quần">Quần</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Danh mục</label>
                  <select
                    className="modal-input"
                    value={form.categoryId}
                    onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}
                    disabled={formCategories.length === 0}
                  >
                    <option value="">Chọn danh mục</option>
                    {formCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  { label: "Tên sản phẩm", key: "name", span: 2 },
                  { label: "SKU", key: "sku", span: 1 },
                  { label: "Chất liệu", key: "material", span: 1 },
                  { label: "Giá bán (đ)", key: "price", span: 1, type: "number" },
                  { label: "Giá gốc (đ)", key: "originalPrice", span: 1, type: "number" },
                ].map(({ label, key, span, type }) => (
                  <div key={key} className={`modal-form-group ${span === 2 ? "span-2" : ""}`}>
                    <label className="modal-label">{label}</label>
                    <input
                      className="modal-input"
                      type={type || "text"}
                      value={form[key]}
                      onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                    />
                  </div>
                ))}

                <div className="modal-form-group">
                  <label className="modal-label">Trạng thái</label>
                  <select
                    className="modal-input"
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.value === "active" }))}
                  >
                    <option value="active">Đang bán</option>
                    <option value="inactive">Tạm ẩn</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Tag</label>
                  <select
                    className="modal-input"
                    value={form.tag}
                    onChange={(e) => setForm((current) => ({ ...current, tag: e.target.value }))}
                  >
                    {TAG_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group span-2">
                  <label className="modal-label">Mô tả</label>
                  <textarea
                    className="modal-input modal-textarea"
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  />
                </div>

                <div className="modal-form-group span-2">
                  <label className="modal-label">Hình ảnh sản phẩm</label>
                  <div className="media-editor">
                    {form.images.map((image, index) => (
                      <div key={`image-${index}`} className="media-row image-row">
                        <input
                          className="modal-input"
                          type="text"
                          placeholder="Link ảnh trực tiếp (https://...)"
                          value={image.url}
                          onChange={(e) => updateFormCollectionItem("images", index, (current) => ({
                            ...current,
                            url: e.target.value,
                          }))}
                        />
                        <button
                          type="button"
                          className="media-remove-btn"
                          onClick={() => removeFormCollectionItem("images", index)}
                          disabled={form.images.length === 1}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="media-add-btn"
                      onClick={() => addFormCollectionItem("images", createImageField())}
                    >
                      <Plus size={14} style={{ marginRight: 4 }} /> Thêm ảnh
                    </button>
                    {form.images.length === 0 && (
                      <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        Chưa có ảnh. Bấm + Thêm ảnh rồi dán link ảnh trực tiếp từ CDN hoặc host ảnh.
                      </p>
                    )}
                    <div className="media-preview-grid">
                      {form.images
                        .filter((image) => String(image.url || "").trim())
                        .slice(0, 4)
                        .map((image, index) => (
                          <div key={`image-preview-${index}`} className="media-preview-item">
                            <img src={image.url} alt={`Ảnh ${index + 1}`} />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="modal-form-group span-2">
                  <label className="modal-label">Màu sắc</label>
                  <div className="media-editor">
                    {form.colors.map((color, index) => (
                      <div key={`color-${index}`} className="media-row color-row">
                        <input
                          className="modal-input color-name-input"
                          type="text"
                          placeholder="Tên màu"
                          value={color.name}
                          onChange={(e) => updateFormCollectionItem("colors", index, (current) => ({
                            ...current,
                            name: e.target.value,
                          }))}
                        />
                        <input
                          className="modal-input color-hex-input"
                          type="color"
                          value={color.hex || DEFAULT_COLOR_HEX}
                          onChange={(e) => updateFormCollectionItem("colors", index, (current) => ({
                            ...current,
                            hex: e.target.value,
                          }))}
                        />
                        <input
                          className="modal-input color-code-input"
                          type="text"
                          placeholder="#1a1a1a"
                          value={color.hex}
                          onChange={(e) => updateFormCollectionItem("colors", index, (current) => ({
                            ...current,
                            hex: e.target.value,
                          }))}
                        />
                        <button
                          type="button"
                          className="media-remove-btn"
                          onClick={() => removeFormCollectionItem("colors", index)}
                          disabled={form.colors.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="media-add-btn"
                      onClick={() => addFormCollectionItem("colors", createColorField())}
                    >
                      + Thêm màu
                    </button>
                    <div className="chip-preview-list">
                      {form.colors
                        .filter((color) => String(color.name || "").trim())
                        .map((color, index) => (
                          <span key={`color-chip-${index}`} className="preview-chip">
                            <span className="preview-dot" style={{ background: color.hex || DEFAULT_COLOR_HEX }} />
                            {color.name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="modal-form-group span-2">
                  <label className="modal-label">Kích cỡ</label>
                  <div className="media-editor">
                    {form.sizes.map((size, index) => (
                      <div key={`size-${index}`} className="media-row size-row">
                        <input
                          className="modal-input size-input"
                          type="text"
                          placeholder="VD: S, M, 28"
                          value={size.size}
                          onChange={(e) => updateFormCollectionItem("sizes", index, (current) => ({
                            ...current,
                            size: e.target.value,
                          }))}
                        />
                        <label className="size-availability-toggle">
                          <input
                            type="checkbox"
                            checked={size.isAvailable !== false}
                            onChange={(e) => updateFormCollectionItem("sizes", index, (current) => ({
                              ...current,
                              isAvailable: e.target.checked,
                            }))}
                          />
                          Còn hàng
                        </label>
                        <button
                          type="button"
                          className="media-remove-btn"
                          onClick={() => removeFormCollectionItem("sizes", index)}
                          disabled={form.sizes.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="media-add-btn"
                      onClick={() => addFormCollectionItem("sizes", createSizeField())}
                    >
                      + Thêm size
                    </button>
                    <div className="chip-preview-list">
                      {form.sizes
                        .filter((size) => String(size.size || "").trim())
                        .map((size, index) => (
                          <span key={`size-chip-${index}`} className={`preview-chip ${size.isAvailable !== false ? "available" : "sold-out"}`}>
                            {size.size}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)} disabled={saving}>
                Hủy
              </button>
              <button className="modal-btn save" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box small" onClick={(e) => e.stopPropagation()}>
            <p className="del-confirm-icon">🗑️</p>
            <h3 className="del-confirm-title">Xóa sản phẩm?</h3>
            <p className="del-confirm-sub">Hành động này không thể hoàn tác.</p>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDeleteId(null)} disabled={saving}>
                Hủy
              </button>
              <button className="modal-btn del" onClick={handleDelete} disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

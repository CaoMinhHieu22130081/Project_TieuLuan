import { useState } from "react";
import { ALL_PRODUCTS } from "../data/Products";
import { AdminLayout } from "./Adminheader";
import "./css/Admin.css";
import {
  PRODUCT_TYPES,
  CATEGORIES_AO,
  CATEGORIES_QUAN,
  ALL_CATEGORIES,
  TAG_OPTIONS,
  TAG_CSS,
  SORT_OPTIONS,
  BLANK_PRODUCT_FORM,
  DEFAULT_PRODUCT_IMAGE,
} from "../data/AdminProductsData";

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

export default function AdminProducts() {
  const [products,    setProducts]    = useState(ALL_PRODUCTS);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("Tất cả");
  const [catFilter,   setCatFilter]   = useState("Tất cả");
  const [sortBy,      setSortBy]      = useState("id");
  const [showModal,   setShowModal]   = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [form,        setForm]        = useState(BLANK_PRODUCT_FORM);

  /* Danh mục trong form đổi theo loại */
  const formCategories = form.type === "Quần" ? CATEGORIES_QUAN : CATEGORIES_AO;

  /* Filter + sort */
  let displayed = products.filter((p) => {
    const matchS = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchT = typeFilter === "Tất cả" || p.type === typeFilter;
    const matchC = catFilter === "Tất cả" || p.category === catFilter;
    return matchS && matchT && matchC;
  });
  if (sortBy === "price_asc")  displayed = [...displayed].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") displayed = [...displayed].sort((a, b) => b.price - a.price);
  if (sortBy === "sold")       displayed = [...displayed].sort((a, b) => b.sold - a.sold);

  /* Mở modal sửa */
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      type:          p.type || "Áo",
      name:          p.name,
      price:         p.price,
      originalPrice: p.originalPrice || "",
      category:      p.category,
      tag:           p.tag || "",
      sku:           p.sku,
      material:      p.material,
      description:   p.description,
    });
    setShowModal(true);
  };

  /* Mở modal thêm */
  const openAdd = () => {
    setEditProduct(null);
    setForm(BLANK_PRODUCT_FORM);
    setShowModal(true);
  };

  /* Lưu */
  const handleSave = () => {
    if (editProduct) {
      setProducts((prev) => prev.map((p) =>
        p.id === editProduct.id
          ? { ...p, ...form, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : null }
          : p
      ));
    } else {
      const newId = Math.max(...products.map((p) => p.id)) + 1;
      setProducts((prev) => [
        ...prev,
        {
          ...BLANK_PRODUCT_FORM,
          ...form,
          id:            newId,
          price:         Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          rating:        5,
          reviews:       0,
          sold:          0,
          images:        [DEFAULT_PRODUCT_IMAGE],
          colors:        [{ hex: "#1a1a1a", name: "Đen" }],
          sizes:         form.type === "Quần" ? ["28", "30", "32"] : ["S", "M", "L"],
          unavailSizes:  [],
          features:      [],
          reviewList:    [],
        },
      ]);
    }
    setShowModal(false);
  };

  /* Category chips theo type đang chọn */
  const chipCategories =
    typeFilter === "Tất cả" ? ALL_CATEGORIES
    : typeFilter === "Áo"   ? ["Tất cả", ...CATEGORIES_AO]
    :                         ["Tất cả", ...CATEGORIES_QUAN];

  const countAo   = products.filter((p) => p.type === "Áo").length;
  const countQuan = products.filter((p) => p.type === "Quần").length;

  return (
    <AdminLayout
      title="Quản lý sản phẩm"
      subtitle={`${products.length} sản phẩm · ${countAo} áo · ${countQuan} quần`}
      actions={<button className="topbar-btn accent" onClick={openAdd}>+ Thêm sản phẩm</button>}
    >
      {/* Toolbar */}
      <div className="admin-card toolbar-card">
        <div className="toolbar-row">
          <div className="search-input-wrap">
            <span className="search-ico">🔍</span>
            <input className="admin-search-input" placeholder="Tìm theo tên, SKU…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="status-tabs">
            {PRODUCT_TYPES.map((t) => {
              const cnt = t === "Tất cả" ? products.length : products.filter((p) => p.type === t).length;
              return (
                <button key={t} className={`status-tab ${typeFilter === t ? "active" : ""}`}
                  onClick={() => { setTypeFilter(t); setCatFilter("Tất cả"); }}>
                  {t === "Áo" ? "👕 " : t === "Quần" ? "👖 " : "🛍️ "}{t}
                  <span className="tab-count">{cnt}</span>
                </button>
              );
            })}
          </div>

          <select className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="toolbar-filters" style={{ marginTop: 12 }}>
          {chipCategories.map((c) => (
            <button key={c} className={`filter-chip ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th><th>Loại</th><th>SKU</th><th>Danh mục</th>
              <th>Giá</th><th>Đã bán</th><th>Tag</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((p) => {
              const thumb = Array.isArray(p.images) ? p.images[0] : p.image;
              return (
                <tr key={p.id}>
                  <td>
                    <div className="tp-product-cell">
                      <img src={thumb} alt={p.name} className="tp-img" />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {p.colors.length} màu · {p.sizes.join(", ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${p.type === "Quần" ? "role-staff" : "role-customer"}`}>
                      {p.type === "Áo" ? "👕 " : "👖 "}{p.type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--accent)" }}>
                      {p.sku}
                    </span>
                  </td>
                  <td><span className="cat-pill">{p.category}</span></td>
                  <td>
                    <p style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(p.price)}</p>
                    {p.originalPrice && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                        {fmt(p.originalPrice)}
                      </p>
                    )}
                  </td>
                  <td><span className="sold-badge">{p.sold}</span></td>
                  <td>
                    {p.tag
                      ? <span className={`tag-badge ${TAG_CSS[p.tag] || "tag-hot"}`}>{p.tag}</span>
                      : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn edit" onClick={() => openEdit(p)}>✏️ Sửa</button>
                      <button className="action-btn del"  onClick={() => setDeleteId(p.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {/* Loại sản phẩm */}
                <div className="modal-form-group">
                  <label className="modal-label">Loại sản phẩm</label>
                  <select className="modal-input" value={form.type}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      type:     e.target.value,
                      category: e.target.value === "Quần" ? "Jeans" : "Cơ bản",
                    }))}>
                    <option value="Áo">👕 Áo</option>
                    <option value="Quần">👖 Quần</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Danh mục</label>
                  <select className="modal-input" value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {formCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {[
                  { label: "Tên sản phẩm", key: "name",          span: 2            },
                  { label: "SKU",           key: "sku",           span: 1            },
                  { label: "Chất liệu",     key: "material",      span: 1            },
                  { label: "Giá bán (đ)",   key: "price",         span: 1, type: "number" },
                  { label: "Giá gốc (đ)",   key: "originalPrice", span: 1, type: "number" },
                ].map(({ label, key, span, type }) => (
                  <div key={key} className={`modal-form-group ${span === 2 ? "span-2" : ""}`}>
                    <label className="modal-label">{label}</label>
                    <input className="modal-input" type={type || "text"} value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}

                <div className="modal-form-group">
                  <label className="modal-label">Tag</label>
                  <select className="modal-input" value={form.tag}
                    onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}>
                    {TAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="modal-form-group span-2">
                  <label className="modal-label">Mô tả</label>
                  <textarea className="modal-input modal-textarea" value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="modal-btn save" onClick={handleSave}>
                {editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box small" onClick={(e) => e.stopPropagation()}>
            <p className="del-confirm-icon">🗑️</p>
            <h3 className="del-confirm-title">Xóa sản phẩm?</h3>
            <p className="del-confirm-sub">Hành động này không thể hoàn tác.</p>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="modal-btn del" onClick={() => {
                setProducts((p) => p.filter((x) => x.id !== deleteId));
                setDeleteId(null);
              }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
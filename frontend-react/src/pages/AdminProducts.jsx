import { useState } from "react";
import { ALL_PRODUCTS } from "../data/Products";
import { AdminLayout } from "./Adminheader";
import "./css/Admin.css";

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";
const CATEGORIES = ["Tất cả","Cơ bản","Graphic","Oversized","Vintage","Thể thao","Sọc kẻ"];

export default function AdminProducts() {
  const [products,    setProducts]    = useState(ALL_PRODUCTS);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("Tất cả");
  const [sortBy,      setSortBy]      = useState("id");
  const [showModal,   setShowModal]   = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);

  const blank = { name:"", price:"", originalPrice:"", category:"Cơ bản", tag:"", sku:"", material:"", description:"" };
  const [form, setForm] = useState(blank);

  let displayed = products.filter((p) => {
    const matchS = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchC = catFilter === "Tất cả" || p.category === catFilter;
    return matchS && matchC;
  });
  if (sortBy === "price_asc")  displayed = [...displayed].sort((a,b) => a.price - b.price);
  if (sortBy === "price_desc") displayed = [...displayed].sort((a,b) => b.price - a.price);
  if (sortBy === "sold")       displayed = [...displayed].sort((a,b) => b.sold - a.sold);

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name:p.name, price:p.price, originalPrice:p.originalPrice||"", category:p.category, tag:p.tag||"", sku:p.sku, material:p.material, description:p.description });
    setShowModal(true);
  };
  const openAdd = () => { setEditProduct(null); setForm(blank); setShowModal(true); };

  const handleSave = () => {
    if (editProduct) {
      setProducts((prev) => prev.map((p) => p.id === editProduct.id
        ? { ...p, ...form, price:Number(form.price), originalPrice:form.originalPrice ? Number(form.originalPrice) : null }
        : p));
    } else {
      const newId = Math.max(...products.map((p) => p.id)) + 1;
      setProducts((prev) => [...prev, {
        ...blank, ...form, id:newId,
        price:Number(form.price), originalPrice:form.originalPrice ? Number(form.originalPrice) : null,
        rating:5, reviews:0, sold:0,
        images:["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop"],
        colors:[{ hex:"#1a1a1a", name:"Đen" }], sizes:["S","M","L"], unavailSizes:[], features:[], reviewList:[],
      }]);
    }
    setShowModal(false);
  };

  const TAG_COLORS = { "Bán chạy":"tag-hot", "Mới":"tag-new", "Sale":"tag-sale" };

  return (
    <AdminLayout
      title="Quản lý sản phẩm"
      subtitle={`${products.length} sản phẩm trong kho`}
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
          <div className="toolbar-filters">
            {CATEGORIES.map((c) => (
              <button key={c} className={`filter-chip ${catFilter===c?"active":""}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>
          <select className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="id">Mặc định</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="sold">Bán chạy nhất</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card table-card">
        <table className="admin-table">
          <thead>
            <tr><th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Giá</th><th>Đã bán</th><th>Tag</th><th>Thao tác</th></tr>
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
                        <p style={{fontWeight:600,fontSize:"0.875rem"}}>{p.name}</p>
                        <p style={{fontSize:"0.75rem",color:"var(--text-muted)"}}>{p.colors.length} màu · {p.sizes.join(", ")}</p>
                      </div>
                    </div>
                  </td>
                  <td><span style={{fontFamily:"var(--font-mono)",fontSize:"0.78rem",color:"var(--accent)"}}>{p.sku}</span></td>
                  <td><span className="cat-pill">{p.category}</span></td>
                  <td>
                    <p style={{fontWeight:700,color:"var(--accent)"}}>{fmt(p.price)}</p>
                    {p.originalPrice && <p style={{fontSize:"0.75rem",color:"var(--text-muted)",textDecoration:"line-through"}}>{fmt(p.originalPrice)}</p>}
                  </td>
                  <td><span className="sold-badge">{p.sold}</span></td>
                  <td>
                    {p.tag
                      ? <span className={`tag-badge ${TAG_COLORS[p.tag]||"tag-hot"}`}>{p.tag}</span>
                      : <span style={{color:"var(--text-muted)",fontSize:"0.75rem"}}>—</span>}
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

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {[
                  {label:"Tên sản phẩm",key:"name",span:2},
                  {label:"SKU",key:"sku",span:1},
                  {label:"Chất liệu",key:"material",span:1},
                  {label:"Giá bán (đ)",key:"price",span:1,type:"number"},
                  {label:"Giá gốc (đ)",key:"originalPrice",span:1,type:"number"},
                ].map(({label,key,span,type}) => (
                  <div key={key} className={`modal-form-group ${span===2?"span-2":""}`}>
                    <label className="modal-label">{label}</label>
                    <input className="modal-input" type={type||"text"} value={form[key]}
                      onChange={(e) => setForm((f) => ({...f,[key]:e.target.value}))} />
                  </div>
                ))}
                <div className="modal-form-group">
                  <label className="modal-label">Danh mục</label>
                  <select className="modal-input" value={form.category} onChange={(e) => setForm((f) => ({...f,category:e.target.value}))}>
                    {CATEGORIES.filter((c) => c!=="Tất cả").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label className="modal-label">Tag</label>
                  <select className="modal-input" value={form.tag} onChange={(e) => setForm((f) => ({...f,tag:e.target.value}))}>
                    <option value="">Không có</option>
                    <option value="Mới">Mới</option>
                    <option value="Bán chạy">Bán chạy</option>
                    <option value="Sale">Sale</option>
                  </select>
                </div>
                <div className="modal-form-group span-2">
                  <label className="modal-label">Mô tả</label>
                  <textarea className="modal-input modal-textarea" value={form.description}
                    onChange={(e) => setForm((f) => ({...f,description:e.target.value}))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="modal-btn save" onClick={handleSave}>{editProduct?"Lưu thay đổi":"Thêm sản phẩm"}</button>
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
              <button className="modal-btn del" onClick={() => { setProducts((p) => p.filter((x) => x.id!==deleteId)); setDeleteId(null); }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
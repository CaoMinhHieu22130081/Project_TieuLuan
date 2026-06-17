import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { voucherAPI } from "../services/api";
import { AdminLayout } from "./Adminheader";
import { recordAdminActivity } from "../utils/adminActivity";
import "./css/Admin.css";
import "./css/AdminVouchers.css";


const VOUCHER_TYPES = ["Tất cả", "PRODUCT_DISCOUNT", "FREE_SHIPPING"];

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const VoucherIcon = ({ name, size = 18, className = "" }) => {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    ticket: <path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A1.5 1.5 0 0 1 19 6.5v2a3.5 3.5 0 0 0 0 7v2A1.5 1.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 0 4 16.5v-9Z" />,
    edit: <><path d="m14.5 5.5 4 4" /><path d="M5 19h4l9.5-9.5a2.83 2.83 0 0 0-4-4L5 15v4Z" /></>,
    trash: <><path d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M6.5 7l.8 13h9.4l.8-13" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  };

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

const createFormState = () => ({
  code: "",
  description: "",
  voucherType: "PRODUCT_DISCOUNT",
  discountType: "percent",
  discountValue: "",
  maxDiscountAmount: "",
  minOrder: "",
  maxUses: "",
  perUserLimit: 1,
  startAt: "",
  expiresAt: "",
  isActive: true,
});

export default function AdminVouchers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [showModal, setShowModal] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createFormState());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await voucherAPI.getAllVouchers();
      setVouchers(data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu voucher:", err);
      setError(err.message || "Không thể tải dữ liệu voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && (user.role === "admin" || user.role === "staff")) {
      loadData();
    }
  }, [user?.id, user?.role]);

  const displayed = vouchers.filter((v) => {
    const keyword = search.trim().toLowerCase();
    const matchS = !keyword || (v.code || "").toLowerCase().includes(keyword);
    const matchT = typeFilter === "Tất cả" || v.voucherType === typeFilter;
    return matchS && matchT;
  });

  const openEdit = (voucher) => {
    setEditVoucher(voucher);
    setForm({
      code: voucher.code || "",
      description: voucher.description || "",
      voucherType: voucher.voucherType || "PRODUCT_DISCOUNT",
      discountType: voucher.discountType || "percent",
      discountValue: voucher.discountValue ?? "",
      maxDiscountAmount: voucher.maxDiscountAmount ?? "",
      minOrder: voucher.minOrder ?? "",
      maxUses: voucher.maxUses ?? "",
      perUserLimit: voucher.perUserLimit ?? 1,
      startAt: voucher.startAt ? voucher.startAt.substring(0, 16) : "",
      expiresAt: voucher.expiresAt ? voucher.expiresAt.substring(0, 16) : "",
      isActive: voucher.isActive !== false,
    });
    setNotice(null);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditVoucher(null);
    setForm(createFormState());
    setNotice(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setNotice(null);

      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
        startAt: form.startAt ? form.startAt + ":00" : null,
        expiresAt: form.expiresAt ? form.expiresAt + ":00" : null,
      };

      if (!payload.code) throw new Error("Vui lòng nhập mã Voucher.");
      
      const savedVoucher = editVoucher
        ? await voucherAPI.updateVoucher(editVoucher.id, payload)
        : await voucherAPI.createVoucher(payload);

      setVouchers((current) => {
        if (editVoucher) {
          return current.map(v => v.id === savedVoucher.id ? savedVoucher : v);
        }
        return [...current, savedVoucher];
      });

      recordAdminActivity({
        type: "product",
        icon: "VC",
        text: editVoucher
          ? `Đã cập nhật voucher ${payload.code}`
          : `Đã thêm voucher mới ${payload.code}`,
        unread: true,
      });

      setShowModal(false);
      setEditVoucher(null);
      setForm(createFormState());
      setNotice({
        type: "success",
        text: editVoucher ? "Đã cập nhật voucher." : "Đã thêm voucher mới.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Không thể lưu voucher.",
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
      const target = vouchers.find(v => v.id === deleteId);
      await voucherAPI.deleteVoucher(deleteId);
      setVouchers(current => current.filter(v => v.id !== deleteId));
      setDeleteId(null);

      recordAdminActivity({
        type: "product",
        icon: "VC",
        text: `Đã xóa voucher${target?.code ? `: ${target.code}` : ""}`,
        unread: true,
      });

      setNotice({
        type: "success",
        text: `Đã xóa voucher${target?.code ? `: ${target.code}` : ""}.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Không thể xóa voucher.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Quản lý voucher"
      subtitle={`${vouchers.length} mã khả dụng`}
      actions={
        <button className="topbar-btn accent voucher-add-btn" onClick={openAdd}>
          <VoucherIcon name="plus" /> Thêm voucher
        </button>
      }
    >
      <div className="admin-card toolbar-card voucher-toolbar">
        <div className="toolbar-row">
          <div className="search-input-wrap">
            <span className="search-ico"><VoucherIcon name="search" /></span>
            <input
              className="admin-search-input"
              placeholder="Tìm theo mã voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="status-tabs">
            {VOUCHER_TYPES.map((type) => {
              const count = type === "Tất cả" ? vouchers.length : vouchers.filter((v) => v.voucherType === type).length;
              return (
                <button
                  key={type}
                  className={`status-tab ${typeFilter === type ? "active" : ""}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type === "Tất cả" ? "Tất cả" : type === "PRODUCT_DISCOUNT" ? "Giảm sản phẩm" : "Phí vận chuyển"}
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {notice && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${notice.type === "error" ? "rgba(248,113,113,.25)" : "rgba(52,211,153,.25)"}`,
              background: notice.type === "error" ? "rgba(248,113,113,.08)" : "rgba(52,211,153,.08)",
              color: notice.type === "error" ? "#fecaca" : "#bbf7d0",
              fontSize: "0.85rem",
            }}
          >
            {notice.text}
          </div>
        )}
      </div>

      <div className="admin-card table-card voucher-table-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <p>Đang tải voucher...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#e74c3c" }}>
            <p>{error}</p>
          </div>
        ) : (
          <div className="voucher-table-scroll">
          <table className="admin-table voucher-admin-table">
            <thead>
              <tr>
                <th>Mã</th><th>Loại Voucher</th><th>Giảm giá</th><th>Đơn TT</th>
                <th>Giới hạn lượt dùng</th><th>Đã dùng</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="tp-product-cell">
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--accent)" }}>{v.code}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.description || "Chưa có mô tả"}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-voucher-badge ${v.voucherType === "PRODUCT_DISCOUNT" ? "type-product" : "type-shipping"}`}>
                        <VoucherIcon name="ticket" size={14} />
                        {v.voucherType === "PRODUCT_DISCOUNT" ? "SẢN PHẨM" : "VẬN CHUYỂN"}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 700 }}>
                        {v.discountType === "percent" ? `${v.discountValue}%` : (v.discountType === "free_shipping" ? "Miễn phí VC" : formatCurrency(v.discountValue))}
                      </p>
                      {v.maxDiscountAmount && v.discountType === "percent" && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tối đa {formatCurrency(v.maxDiscountAmount)}</p>
                      )}
                    </td>
                    <td>{formatCurrency(v.minOrder)}</td>
                    <td>
                      {v.maxUses ? `${v.maxUses} lượt` : "Không giới hạn"} <br/>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.perUserLimit} lần / user</span>
                    </td>
                    <td><span className="sold-badge">{v.usedCount}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn edit" onClick={() => openEdit(v)}>
                          <VoucherIcon name="edit" size={14} /> Sửa
                        </button>
                        {isAdmin && (
                          <button className="action-btn del" onClick={() => setDeleteId(v.id)} aria-label={`Xóa voucher ${v.code}`}>
                            <VoucherIcon name="trash" size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <div className="voucher-empty">
              <VoucherIcon name="ticket" size={28} />
              <strong>Không tìm thấy voucher</strong>
              <span>Thử đổi từ khóa hoặc bộ lọc đang chọn.</span>
            </div>
          )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box voucher-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editVoucher ? "Chỉnh sửa voucher" : "Tạo voucher mới"}</h2>
                <p className="voucher-modal-subtitle">Thiết lập mã, giá trị ưu đãi và thời gian sử dụng.</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Đóng">
                <VoucherIcon name="close" size={16} />
              </button>
            </div>
            <div className="modal-body voucher-modal-body">
              <div className="voucher-form-split">
                <div className="voucher-form-column">
                  <section className="voucher-section-card">
                    <div className="voucher-section-heading">
                      <span className="voucher-section-index">01</span>
                      <div>
                        <h3 className="voucher-section-title">Thông tin voucher</h3>
                        <p>Mã khách hàng nhìn thấy và phạm vi áp dụng.</p>
                      </div>
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="voucher-code">Mã voucher</label>
                      <div className="voucher-input-shell code-field">
                        <span className="prefix">#</span>
                        <input
                          id="voucher-code"
                          className="modal-input"
                          placeholder="VD: SALE10"
                          value={form.code}
                          onChange={(e) => setForm(c => ({...c, code: e.target.value.toUpperCase()}))}
                        />
                      </div>
                      <span className="voucher-field-help">Chỉ nên dùng chữ in hoa và số, không có khoảng trắng.</span>
                    </div>
                    
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="voucher-description">Mô tả ngắn</label>
                      <input
                        id="voucher-description"
                        className="modal-input"
                        placeholder="VD: Giảm 50.000đ cho đơn từ 200.000đ"
                        value={form.description}
                        onChange={(e) => setForm(c => ({...c, description: e.target.value}))}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="voucher-type">Áp dụng cho</label>
                      <select
                        id="voucher-type"
                        className="modal-input"
                        value={form.voucherType}
                        onChange={(e) => setForm(c => ({...c, voucherType: e.target.value}))}
                      >
                        <option value="PRODUCT_DISCOUNT">Tổng tiền sản phẩm</option>
                        <option value="FREE_SHIPPING">Phí vận chuyển</option>
                      </select>
                    </div>
                  </section>

                  <section className="voucher-section-card">
                    <div className="voucher-section-heading">
                      <span className="voucher-section-index">02</span>
                      <div>
                        <h3 className="voucher-section-title">Giá trị ưu đãi</h3>
                        <p>Chọn cách tính và mức giảm tối đa.</p>
                      </div>
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="discount-type">Cách tính</label>
                      <select
                        id="discount-type"
                        className="modal-input"
                        value={form.discountType}
                        onChange={(e) => setForm(c => ({...c, discountType: e.target.value}))}
                      >
                        <option value="percent">Giảm theo phần trăm</option>
                        <option value="fixed">Giảm số tiền cố định</option>
                        <option value="free_shipping">Miễn phí vận chuyển</option>
                      </select>
                    </div>

                    <div className="voucher-input-row">
                      <div className="modal-form-group">
                        <label className="modal-label" htmlFor="discount-value">Mức giảm</label>
                        <div className="voucher-input-shell">
                          <input id="discount-value" className="modal-input" type="number" min="0" placeholder="0" value={form.discountValue} onChange={(e) => setForm(c => ({...c, discountValue: e.target.value}))} />
                          <span className="suffix">{form.discountType === "percent" ? "%" : "đ"}</span>
                        </div>
                      </div>

                      <div className="modal-form-group">
                        <label className="modal-label" htmlFor="max-discount">Giảm tối đa</label>
                        <div className="voucher-input-shell">
                          <input id="max-discount" className="modal-input" type="number" min="0" placeholder="Không giới hạn" value={form.maxDiscountAmount} onChange={(e) => setForm(c => ({...c, maxDiscountAmount: e.target.value}))} />
                          <span className="suffix">đ</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="voucher-form-column">
                  <section className="voucher-section-card">
                    <div className="voucher-section-heading">
                      <span className="voucher-section-index">03</span>
                      <div>
                        <h3 className="voucher-section-title">Điều kiện sử dụng</h3>
                        <p>Giới hạn giá trị đơn và số lần sử dụng.</p>
                      </div>
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="min-order">Giá trị đơn tối thiểu</label>
                      <div className="voucher-input-shell">
                        <input id="min-order" className="modal-input" type="number" min="0" placeholder="0" value={form.minOrder} onChange={(e) => setForm(c => ({...c, minOrder: e.target.value}))} />
                        <span className="suffix">đ</span>
                      </div>
                      <span className="voucher-field-help">Nhập 0 nếu áp dụng cho mọi đơn hàng.</span>
                    </div>

                    <div className="voucher-input-row">
                      <div className="modal-form-group">
                        <label className="modal-label" htmlFor="max-uses">Tổng lượt dùng</label>
                        <div className="voucher-input-shell">
                          <input id="max-uses" className="modal-input" type="number" min="1" placeholder="Không giới hạn" value={form.maxUses} onChange={(e) => setForm(c => ({...c, maxUses: e.target.value}))} />
                          <span className="suffix">lượt</span>
                        </div>
                      </div>

                      <div className="modal-form-group">
                        <label className="modal-label" htmlFor="user-limit">Mỗi khách hàng</label>
                        <div className="voucher-input-shell">
                          <input id="user-limit" className="modal-input" type="number" min="1" placeholder="1" value={form.perUserLimit} onChange={(e) => setForm(c => ({...c, perUserLimit: e.target.value}))} />
                          <span className="suffix">lần</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="voucher-section-card">
                    <div className="voucher-section-heading">
                      <span className="voucher-section-index">04</span>
                      <div>
                        <h3 className="voucher-section-title">Thời gian và trạng thái</h3>
                        <p>Khoảng thời gian voucher được phép sử dụng.</p>
                      </div>
                    </div>
                    
                    <div className="voucher-input-row voucher-date-row">
                      <div className="modal-form-group">
                        <label className="modal-label" htmlFor="start-at">Bắt đầu</label>
                        <div className="voucher-input-shell date-field">
                          <VoucherIcon name="calendar" size={16} className="field-icon" />
                          <input id="start-at" className="modal-input" type="datetime-local" value={form.startAt} onChange={(e) => setForm(c => ({...c, startAt: e.target.value}))} />
                        </div>
                      </div>

                      <div className="modal-form-group">
                        <label className="modal-label" htmlFor="expires-at">Kết thúc</label>
                        <div className="voucher-input-shell date-field">
                          <VoucherIcon name="calendar" size={16} className="field-icon" />
                          <input id="expires-at" className="modal-input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm(c => ({...c, expiresAt: e.target.value}))} />
                        </div>
                      </div>
                    </div>

                    <div className="voucher-status-control">
                      <div>
                        <strong>Kích hoạt voucher</strong>
                        <span>{form.isActive ? "Khách hàng có thể sử dụng mã này." : "Voucher đang tạm dừng."}</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.isActive}
                        className={`voucher-switch ${form.isActive ? "active" : ""}`}
                        onClick={() => setForm(c => ({ ...c, isActive: !c.isActive }))}
                      >
                        <span />
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <div className="modal-footer voucher-modal-footer">
              <button className="voucher-btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
              <button className="voucher-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : editVoucher ? "Lưu thay đổi" : "Tạo voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box small voucher-delete-modal" onClick={(e) => e.stopPropagation()}>
            <span className="voucher-delete-icon"><VoucherIcon name="trash" size={22} /></span>
            <h2>Xóa voucher?</h2>
            <p>Voucher sau khi xóa sẽ không thể tiếp tục được sử dụng.</p>
            <div className="voucher-delete-actions">
              <button className="voucher-btn-secondary" onClick={() => setDeleteId(null)} disabled={saving}>Hủy</button>
              <button className="voucher-btn-danger" onClick={handleDelete} disabled={saving}>{saving ? "Đang xóa..." : "Xóa voucher"}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

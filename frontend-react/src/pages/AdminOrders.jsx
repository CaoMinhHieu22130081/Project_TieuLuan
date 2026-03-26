import { useState } from "react";
import { ALL_PRODUCTS } from "../data/Products";
import { AdminLayout } from "./Adminheader";
import "./css/Admin.css";
import { ORDERS_DATA, STATUS_MAP, STATUS_TABS } from "../data/AdminOrdersData";

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

export default function AdminOrders() {
  const [orders,    setOrders]    = useState(ORDERS_DATA);
  const [tabFilter, setTabFilter] = useState("Tất cả");
  const [search,    setSearch]    = useState("");
  const [detail,    setDetail]    = useState(null);

  const displayed = orders.filter((o) => {
    const matchTab    = tabFilter === "Tất cả" || o.status === tabFilter;
    const matchSearch = o.id.includes(search.toUpperCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const advanceStatus = (id) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const next = STATUS_MAP[o.status]?.next;
      return next ? { ...o, status: next } : o;
    }));
    if (detail?.id === id) {
      const next = STATUS_MAP[detail.status]?.next;
      if (next) setDetail((d) => ({ ...d, status: next }));
    }
  };

  const cancelOrder = (id) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" } : o));
    if (detail?.id === id) setDetail((d) => ({ ...d, status: "cancelled" }));
  };

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      subtitle={`${orders.length} đơn hàng tổng cộng`}
    >
      {/* Tabs */}
      <div className="admin-card toolbar-card">
        <div className="status-tabs">
          {STATUS_TABS.map((t) => {
            const count = t === "Tất cả" ? orders.length : orders.filter((o) => o.status === t).length;
            return (
              <button key={t} className={`status-tab ${tabFilter === t ? "active" : ""}`}
                onClick={() => setTabFilter(t)}>
                {t === "Tất cả" ? "Tất cả" : STATUS_MAP[t].label}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="search-input-wrap" style={{ marginTop: 14 }}>
          <span className="search-ico">🔍</span>
          <input className="admin-search-input" placeholder="Tìm mã đơn, tên khách…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="admin-card table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th>
              <th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((o) => (
              <tr key={o.id}>
                <td>
                  <span className="order-id-link" onClick={() => setDetail(o)}>#{o.id}</span>
                </td>
                <td>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{o.customer}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{o.phone}</p>
                </td>
                <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{o.date}</td>
                <td><span style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(o.total)}</span></td>
                <td><span className="pay-badge">{o.payment}</span></td>
                <td>
                  <span className={`omr-status ${STATUS_MAP[o.status].cls}`}>
                    {STATUS_MAP[o.status].label}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn edit" onClick={() => setDetail(o)}>👁 Chi tiết</button>
                    {STATUS_MAP[o.status].next && (
                      <button className="action-btn next" onClick={() => advanceStatus(o.id)}>
                        → {STATUS_MAP[STATUS_MAP[o.status].next].label}
                      </button>
                    )}
                    {o.status !== "cancelled" && o.status !== "delivered" && (
                      <button className="action-btn del" onClick={() => cancelOrder(o.id)}>✕</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Đơn hàng #{detail.id}</h2>
                <span className={`omr-status ${STATUS_MAP[detail.status].cls}`}
                  style={{ marginTop: 6, display: "inline-block" }}>
                  {STATUS_MAP[detail.status].label}
                </span>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body order-detail-body">
              {/* Thông tin khách */}
              <div className="detail-section">
                <p className="detail-section-title">📋 Thông tin khách hàng</p>
                <div className="detail-info-grid">
                  <div><span className="di-label">Họ tên</span><span>{detail.customer}</span></div>
                  <div><span className="di-label">SĐT</span><span>{detail.phone}</span></div>
                  <div><span className="di-label">Email</span><span>{detail.email}</span></div>
                  <div><span className="di-label">Địa chỉ</span><span>{detail.address}</span></div>
                  <div><span className="di-label">Ngày đặt</span><span>{detail.date}</span></div>
                  <div><span className="di-label">Thanh toán</span><span>{detail.payment}</span></div>
                </div>
              </div>
              {/* Sản phẩm */}
              <div className="detail-section">
                <p className="detail-section-title">🛍️ Sản phẩm đặt mua</p>
                {detail.items.map(({ productId, qty, size, color }, i) => {
                  const p = ALL_PRODUCTS.find((x) => x.id === productId);
                  if (!p) return null;
                  const img = Array.isArray(p.images) ? p.images[0] : p.image;
                  return (
                    <div key={i} className="detail-item-row">
                      <img src={img} alt={p.name} className="detail-item-img" />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600 }}>{p.name}</p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {color} · Size {size} · x{qty}
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(p.price * qty)}</span>
                    </div>
                  );
                })}
                <div className="detail-total-row">
                  <span>Phí vận chuyển:</span>
                  <span>{detail.shipping === 0 ? "Miễn phí" : fmt(detail.shipping)}</span>
                </div>
                <div className="detail-total-row bold">
                  <span>Tổng cộng:</span>
                  <span style={{ color: "var(--accent)" }}>{fmt(detail.total)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDetail(null)}>Đóng</button>
              {STATUS_MAP[detail.status].next && (
                <button className="modal-btn save" onClick={() => advanceStatus(detail.id)}>
                  → {STATUS_MAP[STATUS_MAP[detail.status].next].label}
                </button>
              )}
              {detail.status !== "cancelled" && detail.status !== "delivered" && (
                <button className="modal-btn del" onClick={() => cancelOrder(detail.id)}>Hủy đơn</button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
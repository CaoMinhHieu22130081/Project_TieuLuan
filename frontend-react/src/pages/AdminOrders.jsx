import { useState, useEffect, useCallback } from "react";
import { adminAPI, orderAPI } from "../services/api";
import { AdminLayout } from "./Adminheader";
import { recordAdminActivity } from "../utils/adminActivity";
import "./css/Admin.css";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", cls: "st-pending", next: "processing" },
  processing: { label: "Đang xử lý", cls: "st-processing", next: "shipping" },
  shipping: { label: "Đang giao", cls: "st-shipping", next: "delivered" },
  delivered: { label: "Đã giao", cls: "st-delivered", next: null },
  cancelled: { label: "Đã hủy", cls: "st-cancelled", next: null },
};

const STATUS_TABS = ["Tất cả", "pending", "processing", "shipping", "delivered", "cancelled"];

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

const normalizeStatus = (status) => String(status || "").toLowerCase();

const getOrderStatusMeta = (status) =>
  STATUS_MAP[normalizeStatus(status)] || {
    label: status || "Không rõ",
    cls: "st-pending",
    next: null,
  };

const normalizeOrder = (order) => ({
  ...order,
  status: normalizeStatus(order.status),
  orderCode: order.orderCode || order.code || order.id || "",
  customerName: order.customerName || order.customer || "Khách hàng",
  customerPhone: order.customerPhone || order.phone || "",
  customerEmail: order.customerEmail || order.email || "",
  address: order.address || "",
  shippingFee: Number(order.shippingFee ?? order.shipping ?? 0),
  subtotal: Number(order.subtotal ?? 0),
  total: Number(order.total ?? order.totalPrice ?? 0),
  createdAt: order.createdAt || order.createdDate || null,
  items: Array.isArray(order.items) ? order.items : [],
});

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("vi-VN");
};

const sameOrderId = (left, right) => String(left) === String(right);

export default function AdminOrders() {
  const [orders,    setOrders]       = useState([]);
  const [loading,   setLoading]      = useState(true);
  const [error,     setError]        = useState(null);
  const [tabFilter, setTabFilter]    = useState("Tất cả");
  const [search,    setSearch]       = useState("");
  const [detail,    setDetail]       = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getAllOrders();
      const normalized = Array.isArray(data) ? data.map(normalizeOrder) : [];
      normalized.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
      setOrders(normalized);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const displayed = orders.filter((order) => {
    const orderStatus = normalizeStatus(order.status);
    const query = search.trim().toLowerCase();
    const matchTab = tabFilter === "Tất cả" || orderStatus === normalizeStatus(tabFilter);
    const matchSearch =
      !query ||
      [order.orderCode, order.customerName, order.customerPhone, order.customerEmail]
        .some((value) => String(value || "").toLowerCase().includes(query));
    return matchTab && matchSearch;
  });

  const syncOrderStatus = async (order, nextStatus) => {
    if (!nextStatus) return;

    try {
      const currentStatus = normalizeStatus(order.status);
      setUpdatingOrderId(order.id);
      setError(null);
      const updatedOrder = await orderAPI.updateOrderStatus(order.id, nextStatus);
      const orderLabel = updatedOrder?.orderCode || updatedOrder?.id || order.orderCode || order.id;
      if (updatedOrder) {
        const normalizedOrder = normalizeOrder(updatedOrder);
        setOrders((prev) => prev.map((item) => (sameOrderId(item.id, normalizedOrder.id) ? normalizedOrder : item)));
        setDetail((prev) => (prev && sameOrderId(prev.id, normalizedOrder.id) ? normalizedOrder : prev));
        recordAdminActivity({
          type: "order",
          icon: "📦",
          text: nextStatus === "cancelled"
            ? `Đã hủy đơn #${orderLabel}`
            : `Đã chuyển đơn #${orderLabel} từ ${getOrderStatusMeta(currentStatus).label} sang ${getOrderStatusMeta(nextStatus).label}`,
          unread: true,
        });
      } else {
        await loadOrders();
        recordAdminActivity({
          type: "order",
          icon: "📦",
          text: nextStatus === "cancelled"
            ? `Đã hủy đơn #${orderLabel}`
            : `Đã cập nhật đơn #${orderLabel} sang ${getOrderStatusMeta(nextStatus).label}`,
          unread: true,
        });
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(err.message || "Lỗi cập nhật trạng thái đơn hàng");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const advanceStatus = (order) => {
    const next = STATUS_MAP[normalizeStatus(order.status)]?.next;
    if (next) {
      void syncOrderStatus(order, next);
    }
  };

  const cancelOrder = (order) => {
    if (!window.confirm(`Hủy đơn hàng #${order.orderCode || order.id}?`)) return;
    void syncOrderStatus(order, "cancelled");
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

      {loading && <div className="admin-card" style={{ textAlign: "center", padding: "20px" }}>⏳ Đang tải đơn hàng...</div>}
      {error && <div className="admin-card" style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>}
      {!loading && !error && (
        displayed.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th>
                <th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((o) => {
                const statusMeta = getOrderStatusMeta(o.status);
                const isUpdating = updatingOrderId === o.id;

                return (
                  <tr key={o.id}>
                    <td>
                      <span className="order-id-link" onClick={() => setDetail(o)}>#{o.orderCode || o.id}</span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{o.customerName}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{o.customerPhone}</p>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {formatDate(o.createdAt)}
                    </td>
                    <td><span style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(Number(o.total))}</span></td>
                    <td><span className="pay-badge">{o.paymentMethod || "—"}</span></td>
                    <td>
                      <span className={`omr-status ${statusMeta.cls}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn edit" onClick={() => setDetail(o)}>👁 Chi tiết</button>
                        {statusMeta.next && (
                          <button className="action-btn next" disabled={isUpdating} onClick={() => advanceStatus(o)}>
                            {isUpdating ? "Đang cập nhật..." : `→ ${STATUS_MAP[statusMeta.next].label}`}
                          </button>
                        )}
                        {o.status !== "cancelled" && o.status !== "delivered" && (
                          <button className="action-btn del" disabled={isUpdating} onClick={() => cancelOrder(o)}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-card" style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
            Không tìm thấy đơn hàng phù hợp
          </div>
        )
      )}

      {/* Order Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Đơn hàng #{detail.orderCode || detail.id}</h2>
                <span className={`omr-status ${getOrderStatusMeta(detail.status).cls}`}
                  style={{ marginTop: 6, display: "inline-block" }}>
                  {getOrderStatusMeta(detail.status).label}
                </span>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body order-detail-body">
              {/* Thông tin khách */}
              <div className="detail-section">
                <p className="detail-section-title">📋 Thông tin khách hàng</p>
                <div className="detail-info-grid">
                  <div><span className="di-label">Họ tên</span><span>{detail.customerName}</span></div>
                  <div><span className="di-label">SĐT</span><span>{detail.customerPhone}</span></div>
                  <div><span className="di-label">Email</span><span>{detail.customerEmail}</span></div>
                  <div><span className="di-label">Địa chỉ</span><span>{detail.address}</span></div>
                  <div><span className="di-label">Ngày đặt</span><span>{formatDate(detail.createdAt)}</span></div>
                  <div><span className="di-label">Thanh toán</span><span>{detail.paymentMethod || "—"}</span></div>
                </div>
              </div>
              {/* Sản phẩm */}
              <div className="detail-section">
                <p className="detail-section-title">🛍️ Sản phẩm đặt mua</p>
                {detail.items && detail.items.length > 0 ? (
                  detail.items.map((item, i) => (
                    <div key={i} className="detail-item-row">
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600 }}>{item.productName || item.name || `Sản phẩm #${item.productId || i + 1}`}</p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {item.color} · Size {item.size} · x{item.qty}
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(Number(item.subtotal || 0))}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Không có sản phẩm</p>
                )}
                <div className="detail-total-row">
                  <span>Phí vận chuyển:</span>
                  <span>{Number(detail.shippingFee || 0) === 0 ? "Miễn phí" : fmt(Number(detail.shippingFee || 0))}</span>
                </div>
                <div className="detail-total-row bold">
                  <span>Tổng cộng:</span>
                  <span style={{ color: "var(--accent)" }}>{fmt(Number(detail.total || 0))}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDetail(null)}>Đóng</button>
              {getOrderStatusMeta(detail.status).next && (
                <button className="modal-btn save" onClick={() => advanceStatus(detail)}>
                  → {STATUS_MAP[getOrderStatusMeta(detail.status).next].label}
                </button>
              )}
              {detail.status !== "cancelled" && detail.status !== "delivered" && (
                <button className="modal-btn del" onClick={() => cancelOrder(detail)}>Hủy đơn</button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
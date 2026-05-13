import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./Adminheader";
import { adminAPI, productAPI } from "../services/api";
import { buildDashboardNotifications, recordAdminActivity, mergeNotifications } from "../utils/adminActivity";
import "./css/Admin.css";

function Sparkline({ data, color = "var(--accent)" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 120, h = 40, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data, labels }) {
  const max = Math.max(...data, 0) || 1;
  return (
    <div className="bar-chart">
      {data.map((v, i) => (
        <div key={i} className="bar-col">
          <div className="bar-fill" style={{ height: `${(v / max) * 100}%` }} />
          <span className="bar-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

const DASH_STATUS_MAP = {
  delivered: { label: "Đã giao", cls: "st-delivered" },
  shipping: { label: "Đang giao", cls: "st-shipping" },
  processing: { label: "Xử lý", cls: "st-processing" },
  cancelled: { label: "Đã hủy", cls: "st-cancelled" },
  pending: { label: "Chờ xác nhận", cls: "st-pending" },
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getProductImage = (product) => {
  const image = Array.isArray(product?.images) ? product.images[0] : product?.image;
  if (typeof image === "string") return image;
  return image?.url || image?.src || image?.image || "https://via.placeholder.com/50";
};

const getCategoryBreakdown = (products, type) => {
  const counts = new Map();

  products
    .filter((product) => String(product?.type || "").trim() === type)
    .forEach((product) => {
      const category = String(product?.category || "Khác").trim() || "Khác";
      counts.set(category, (counts.get(category) || 0) + 1);
    });

  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category, "vi"));
};

const buildMonthlyRevenue = (orders) => {
  const currentYear = new Date().getFullYear();
  const labels = Array.from({ length: 12 }, (_, index) => `T${index + 1}`);
  const data = Array(12).fill(0);

  orders.forEach((order) => {
    const parsed = new Date(order?.createdAt || order?.createdDate || order?.date || 0);
    if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== currentYear) return;

    const totalValue = Number(order?.total ?? order?.totalAmount ?? order?.totalPrice ?? 0);
    data[parsed.getMonth()] += Number.isFinite(totalValue) ? totalValue : 0;
  });

  return { year: String(currentYear), labels, data };
};

const getDashboardStatusMeta = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();
  return DASH_STATUS_MAP[normalizedStatus] || DASH_STATUS_MAP.pending;
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const downloadWordReport = (filename, html) => {
  const blob = new Blob(["\uFEFF", html], { type: "application/msword;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const buildWordReportHtml = ({
  generatedAt,
  stats,
  totalRevenue,
  shirtCategories,
  pantCategories,
  topProducts,
  recentOrders,
  products,
}) => {
  const summaryRows = [
    ["Tổng đơn hàng", stats.orders ?? recentOrders.length, "Tổng hợp từ dữ liệu hiện có"],
    ["Tổng sản phẩm", products.length, "Danh sách hàng hóa trong hệ thống"],
    ["Tổng doanh thu", formatCurrency(totalRevenue), "Tính từ tất cả đơn hàng"],
    ["Tài khoản admin", stats.adminUsers ?? 0, "Phân quyền hệ thống"],
    ["Tài khoản staff", stats.staffUsers ?? 0, "Phân quyền hệ thống"],
    ["Khách hàng", stats.customerUsers ?? 0, "Phân quyền hệ thống"],
  ];

  const categoryRows = [
    ...shirtCategories.map(({ category, count }) => ["Áo", category, count]),
    ...pantCategories.map(({ category, count }) => ["Quần", category, count]),
  ];

  const topProductRows = topProducts.map((product, index) => [
    index + 1,
    product.name,
    product.type,
    product.sold,
    product.revenue,
  ]);

  const recentOrderRows = recentOrders.map((order) => [
    `#${order.id}`,
    order.customer,
    order.total,
    getDashboardStatusMeta(order.status).label,
  ]);

  const renderTableRow = (cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Báo cáo quản trị UniqTee</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #111827; line-height: 1.5; }
    h1 { margin: 0 0 6px; font-size: 26px; }
    h2 { margin: 24px 0 10px; font-size: 18px; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .summary-card { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; }
    .summary-label { font-size: 12px; color: #6b7280; }
    .summary-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    .muted { color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Báo cáo quản trị UniqTee</h1>
  <div class="meta">Xuất lúc ${escapeHtml(generatedAt)}</div>

  <h2>Tổng quan</h2>
  <table>
    <thead>
      <tr><th>Chỉ số</th><th>Giá trị</th><th>Ghi chú</th></tr>
    </thead>
    <tbody>
      ${summaryRows.map((row) => renderTableRow(row.map(escapeHtml))).join("")}
    </tbody>
  </table>

  <h2>Danh mục sản phẩm</h2>
  <table>
    <thead>
      <tr><th>Loại</th><th>Danh mục</th><th>Số lượng</th></tr>
    </thead>
    <tbody>
      ${categoryRows.length > 0
        ? categoryRows.map((row) => renderTableRow(row.map(escapeHtml))).join("")
        : '<tr><td colspan="3" class="muted">Chưa có dữ liệu danh mục</td></tr>'}
    </tbody>
  </table>

  <h2>Sản phẩm bán chạy</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Tên sản phẩm</th><th>Loại</th><th>Đã bán</th><th>Doanh thu</th></tr>
    </thead>
    <tbody>
      ${topProductRows.length > 0
        ? topProductRows.map((row) => renderTableRow(row.map(escapeHtml))).join("")
        : '<tr><td colspan="5" class="muted">Chưa có sản phẩm bán chạy để thống kê</td></tr>'}
    </tbody>
  </table>

  <h2>Đơn hàng gần đây</h2>
  <table>
    <thead>
      <tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr>
    </thead>
    <tbody>
      ${recentOrderRows.length > 0
        ? recentOrderRows.map((row) => renderTableRow(row.map(escapeHtml))).join("")
        : '<tr><td colspan="4" class="muted">Chưa có đơn hàng gần đây để hiển thị</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [serverNotifications, setServerNotifications] = useState([]);

  // Fetch data từ MySQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, ordersData, statsData, notificationsData] = await Promise.all([
          productAPI.getAllProducts(),
          adminAPI.getAllOrders(),
          adminAPI.getDashboardStats(),
          adminAPI.getNotifications(),
        ]);
        setProducts(productsData || []);
        setOrders(ordersData || []);
        setStats(statsData || {});
        setServerNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu dashboard:", err);
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute stats
  const totalAo   = products.filter((p) => p.type === "Áo").length;
  const totalQuan = products.filter((p) => p.type === "Quần").length;
  const shirtCategories = getCategoryBreakdown(products, "Áo");
  const pantCategories = getCategoryBreakdown(products, "Quần");
  const monthlyRevenue = buildMonthlyRevenue(orders);
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order?.total ?? order?.totalAmount ?? order?.totalPrice ?? 0),
    0,
  );

  const recentOrders = [...(orders || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      customer: o.customerName || "—",
      total: formatCurrency(Number(o.total ?? o.totalAmount ?? o.totalPrice ?? 0)),
      status: String(o.status || "pending").toLowerCase(),
    }));

  const dashboardNotifications = buildDashboardNotifications({ products, orders });
  const combinedNotifications = mergeNotifications(dashboardNotifications, serverNotifications || []);

  // Get top 5 products by sold
  const topProducts = [...products]
    .filter(p => p.sold > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      img: getProductImage(p),
      type: p.type || "Khác",
      sold: p.sold || 0,
      revenueValue: Number(p.sold || 0) * Number(p.price || 0),
      revenue: formatCurrency((Number(p.sold || 0) * Number(p.price || 0))),
    }));

  const handleExportReport = () => {
    const reportDate = new Date();
    const fileName = `UniqTee-admin-report-${reportDate.toISOString().slice(0, 10)}.doc`;
    const html = buildWordReportHtml({
      generatedAt: reportDate.toLocaleString("vi-VN"),
      stats,
      totalRevenue,
      shirtCategories,
      pantCategories,
      topProducts,
      recentOrders,
      products,
    });

    downloadWordReport(fileName, html);
    recordAdminActivity({
      type: "system",
      icon: "📄",
      text: "Đã xuất báo cáo Word từ dashboard",
      unread: true,
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Đang tải...">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <p>Đang tải dữ liệu dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard" subtitle="Lỗi">
        <div style={{ padding: "40px", textAlign: "center", color: "#e74c3c" }}>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard"
      subtitle={`${new Date().toLocaleDateString("vi-VN")} · ${stats.orders ?? orders.length} đơn hàng · ${stats.users ?? 0} người dùng`}
      actions={<button type="button" className="topbar-btn accent" onClick={handleExportReport}>Xuất Word</button>}
      notifications={combinedNotifications}
    >
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ "--card-accent": "var(--accent)" }}>
          <div className="stat-top">
            <div>
              <p className="stat-label">Tổng đơn hàng</p>
              <p className="stat-value">{stats.orders ?? orders.length}</p>
            </div>
          </div>
          <p className="stat-change up">↑ Đang hoạt động</p>
        </div>
        <div className="stat-card" style={{ "--card-accent": "#34d399" }}>
          <div className="stat-top">
            <div>
              <p className="stat-label">Tổng sản phẩm</p>
              <p className="stat-value">{products.length}</p>
            </div>
          </div>
          <p className="stat-change up">↑ {totalAo} áo, {totalQuan} quần</p>
        </div>
        <div className="stat-card" style={{ "--card-accent": "#60a5fa" }}>
          <div className="stat-top">
            <div>
              <p className="stat-label">Tổng doanh thu</p>
              <p className="stat-value">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <p className="stat-change up">↑ Từ tất cả đơn hàng</p>
        </div>
      </div>

      {/* Phân loại Áo / Quần */}
      <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="admin-card" style={{ borderTop: "2px solid #ff5fa3" }}>
          <div className="card-header">
            <p className="card-title">👕 Áo thun</p>
            <span className="card-tag">{totalAo} sản phẩm</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {shirtCategories.length > 0 ? shirtCategories.map(({ category, count }) => (
              <div key={category} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--accent)" }}>
                  {count}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{category}</p>
              </div>
            )) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có dữ liệu áo</p>
            )}
          </div>
        </div>
        <div className="admin-card" style={{ borderTop: "2px solid #60a5fa" }}>
          <div className="card-header">
            <p className="card-title">👖 Quần</p>
            <span className="card-tag" style={{ color: "#60a5fa", background: "rgba(96,165,250,.12)", border: "1px solid rgba(96,165,250,.2)" }}>
              {totalQuan} sản phẩm
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {pantCategories.length > 0 ? pantCategories.map(({ category, count }) => (
              <div key={category} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#60a5fa" }}>
                  {count}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{category}</p>
              </div>
            )) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chưa có dữ liệu quần</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue + Orders */}
      <div className="dashboard-grid">
        <div className="admin-card">
          <div className="card-header">
            <p className="card-title">Doanh thu theo tháng</p>
            <span className="card-tag">{monthlyRevenue.year}</span>
          </div>
          <BarChart data={monthlyRevenue.data} labels={monthlyRevenue.labels} />
        </div>
        <div className="admin-card">
          <div className="card-header">
            <p className="card-title">Đơn hàng gần đây</p>
            <Link to="/admin/orders" className="card-link">Xem tất cả →</Link>
          </div>
          <div className="order-mini-list">
            {recentOrders.length > 0 ? recentOrders.map((o) => (
              <div key={o.id} className="order-mini-row">
                <div>
                  <p className="omr-id">#{o.id}</p>
                  <p className="omr-name">{o.customer}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="omr-total">{o.total}</p>
                  <span className={`omr-status ${getDashboardStatusMeta(o.status).cls || "status-pending"}`}>
                    {getDashboardStatusMeta(o.status).label || o.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="admin-empty-state">Chưa có đơn hàng gần đây để hiển thị.</div>
            )}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="admin-card">
        <div className="card-header">
          <p className="card-title">Sản phẩm bán chạy</p>
          <Link to="/admin/products" className="card-link">Quản lý →</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>Sản phẩm</th><th>Loại</th><th>Đã bán</th><th>Doanh thu</th><th>Xếp hạng</th></tr>
          </thead>
          <tbody>
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <tr key={i}>
                <td>
                  <div className="tp-product-cell">
                    <img src={p.img} alt={p.name} className="tp-img" />
                    <span>{p.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${p.type === "Quần" ? "role-staff" : "role-customer"}`}>
                    {p.type === "Áo" ? "👕" : "👖"} {p.type}
                  </span>
                </td>
                <td><span className="tp-sold">{p.sold}</span></td>
                <td><span className="tp-revenue">{p.revenue}</span></td>
                <td>
                  <div className="tp-rank-bar">
                    <div className="tp-rank-fill" style={{ width: `${topProducts.length > 0 ? (p.sold / topProducts[0].sold) * 100 : 0}%` }} />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5">
                  <div className="admin-empty-state compact">Chưa có sản phẩm bán chạy để thống kê.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./Adminheader";
import { adminAPI, productAPI } from "../services/api";
import "./css/Admin.css";
import {
  DASHBOARD_STATS,
  MONTHLY_REVENUE,
  SHIRT_CATEGORIES,
  PANTS_CATEGORIES,
  getCategoryCount,
  DASH_STATUS_MAP,
} from "../data/AdminDashboardData";

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
  const max = Math.max(...data);
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});

  // Fetch data từ MySQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, ordersData, statsData] = await Promise.all([
          productAPI.getAllProducts(),
          adminAPI.getAllOrders(),
          adminAPI.getDashboardStats(),
        ]);
        setProducts(productsData || []);
        setOrders(ordersData || []);
        setStats(statsData || {});
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

  // Get top 5 products by sold
  const topProducts = [...products]
    .filter(p => p.sold > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      img: p.images && p.images.length > 0 ? p.images[0].url : 'https://via.placeholder.com/50',
      type: p.type,
      sold: p.sold || 0,
      revenue: `${((p.sold || 0) * p.price).toLocaleString("vi-VN")}đ`,
    }));

  // Get recent 5 orders
  const recentOrders = (orders || [])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      customer: o.customerName || "—",
      total: `${o.total?.toLocaleString("vi-VN") || 0}đ`,
      status: o.status || "pending",
    }));

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
      subtitle={`${new Date().toLocaleDateString("vi-VN")} · Chào mừng trở lại!`}
      actions={<button className="topbar-btn">↓ Xuất báo cáo</button>}
    >
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ "--card-accent": "var(--accent)" }}>
          <div className="stat-top">
            <div>
              <p className="stat-label">Tổng đơn hàng</p>
              <p className="stat-value">{orders.length}</p>
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
              <p className="stat-value">{(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)).toLocaleString("vi-VN")}đ</p>
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
            {SHIRT_CATEGORIES.map((cat) => (
              <div key={cat} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--accent)" }}>
                  {getCategoryCount(cat)}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{cat}</p>
              </div>
            ))}
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
            {PANTS_CATEGORIES.map((cat) => (
              <div key={cat} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#60a5fa" }}>
                  {getCategoryCount(cat)}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue + Orders */}
      <div className="dashboard-grid">
        <div className="admin-card">
          <div className="card-header">
            <p className="card-title">Doanh thu theo tháng</p>
            <span className="card-tag">{MONTHLY_REVENUE.year}</span>
          </div>
          <BarChart data={MONTHLY_REVENUE.data} labels={MONTHLY_REVENUE.labels} />
        </div>
        <div className="admin-card">
          <div className="card-header">
            <p className="card-title">Đơn hàng gần đây</p>
            <Link to="/admin/orders" className="card-link">Xem tất cả →</Link>
          </div>
          <div className="order-mini-list">
            {recentOrders.map((o) => (
              <div key={o.id} className="order-mini-row">
                <div>
                  <p className="omr-id">#{o.id}</p>
                  <p className="omr-name">{o.customer}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="omr-total">{o.total}</p>
                  <span className={`omr-status ${DASH_STATUS_MAP[o.status]?.cls || "status-pending"}`}>
                    {DASH_STATUS_MAP[o.status]?.label || o.status}
                  </span>
                </div>
              </div>
            ))}
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
            {topProducts.map((p, i) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
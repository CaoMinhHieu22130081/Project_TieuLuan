import { Link } from "react-router-dom";
import { AdminLayout } from "./Adminheader";
import "./css/Admin.css";
import {
  DASHBOARD_STATS,
  MONTHLY_REVENUE,
  RECENT_ORDERS,
  getTopProducts,
  SHIRT_CATEGORIES,
  PANTS_CATEGORIES,
  getCategoryCount,
  DASH_STATUS_MAP,
} from "../data/AdminDashboardData";
import { ALL_PRODUCTS } from "../data/Products";

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
  const topProducts = getTopProducts(5);
  const totalAo   = ALL_PRODUCTS.filter((p) => p.type === "Áo").length;
  const totalQuan = ALL_PRODUCTS.filter((p) => p.type === "Quần").length;

  const resolvedStats = DASHBOARD_STATS.map((s) => {
    if (s.getValue) {
      const { display, spark } = s.getValue();
      return { ...s, value: display, spark };
    }
    return s;
  });

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Thứ 6, 20/03/2026 · Chào mừng trở lại!"
      actions={<button className="topbar-btn">↓ Xuất báo cáo</button>}
    >
      {/* Stats */}
      <div className="stats-grid">
        {resolvedStats.map((s, i) => (
          <div key={i} className="stat-card" style={{ "--card-accent": s.color }}>
            <div className="stat-top">
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.value}</p>
              </div>
              <Sparkline data={s.spark} color={s.color} />
            </div>
            <p className={`stat-change ${s.up ? "up" : "down"}`}>
              {s.up ? "↑" : "↓"} {s.change} so với tháng trước
            </p>
          </div>
        ))}
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
            {RECENT_ORDERS.map((o) => (
              <div key={o.id} className="order-mini-row">
                <div>
                  <p className="omr-id">#{o.id}</p>
                  <p className="omr-name">{o.customer}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="omr-total">{o.total}</p>
                  <span className={`omr-status ${DASH_STATUS_MAP[o.status].cls}`}>
                    {DASH_STATUS_MAP[o.status].label}
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
                    <div className="tp-rank-fill" style={{ width: `${(p.sold / topProducts[0].sold) * 100}%` }} />
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
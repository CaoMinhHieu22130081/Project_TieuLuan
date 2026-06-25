import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  LayoutDashboard,
  Box,
  ShoppingBag,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Heart,
  Archive,
  User,
  Package,
  ClipboardList,
  Shirt,
  Layers,
  ChevronRight
} from "lucide-react";
import { AdminLayout } from "./Adminheader";
import { adminAPI, productAPI } from "../services/api";
import { buildDashboardNotifications, recordAdminActivity, mergeNotifications } from "../utils/adminActivity";
import "./css/Admin.css";
import "./css/AdminDashboard.css";

/* ── Utility ─────────────────────────────────────────────────── */
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getProductImage = (product) => {
  const image = Array.isArray(product?.images) ? product.images[0] : product?.image;
  if (typeof image === "string") return image;
  return image?.url || image?.src || image?.image || "https://via.placeholder.com/50";
};

const getCategoryBreakdown = (products, type) => {
  const counts = new Map();
  products
    .filter((p) => String(p?.type || "").trim() === type)
    .forEach((p) => {
      // category có thể là string hoặc object {name, categoryName, ...}
      const rawCat = p?.category;
      let catStr;
      if (!rawCat) {
        catStr = "Khác";
      } else if (typeof rawCat === "string") {
        catStr = rawCat.trim() || "Khác";
      } else if (typeof rawCat === "object") {
        catStr = String(rawCat?.name || rawCat?.categoryName || rawCat?.label || "Khác").trim() || "Khác";
      } else {
        catStr = String(rawCat).trim() || "Khác";
      }
      counts.set(catStr, (counts.get(catStr) || 0) + 1);
    });
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
};

const buildMonthlyRevenue = (orders) => {
  const currentYear = new Date().getFullYear();
  const labels = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
  const data = Array(12).fill(0);
  orders.forEach((order) => {
    const parsed = new Date(order?.createdAt || order?.createdDate || 0);
    if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== currentYear) return;
    const v = Number(order?.total ?? order?.totalAmount ?? 0);
    data[parsed.getMonth()] += Number.isFinite(v) ? v : 0;
  });
  return { year: String(currentYear), labels, data };
};

const DASH_STATUS_MAP = {
  delivered:  { label: "Đã giao",       cls: "st-delivered" },
  shipping:   { label: "Đang giao",     cls: "st-shipping" },
  processing: { label: "Xử lý",         cls: "st-processing" },
  cancelled:  { label: "Đã hủy",        cls: "st-cancelled" },
  pending:    { label: "Chờ xác nhận",  cls: "st-pending" },
};
const getDashboardStatusMeta = (status) => {
  const s = String(status || "pending").toLowerCase();
  return DASH_STATUS_MAP[s] || DASH_STATUS_MAP.pending;
};

const escapeHtml = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");

/* ── Animated Counter Hook ───────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    let start = null;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * ease));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

/* ── Donut Chart (SVG) ───────────────────────────────────────── */
function DonutChart({ segments, size = 160, thickness = 28 }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2,#26262d)" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap  = circ - dash;
        const el = (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-(offset * circ / total) + circ * 0.25}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }}
          />
        );
        offset += seg.value;
        return el;
      })}
    </svg>
  );
}

/* ── Sparkline ───────────────────────────────────────────────── */
function Sparkline({ data, color = "var(--accent)", height = 48 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 140;
  const h = height;
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const areaPath = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(" ") + ` L ${w - pad},${h} L ${pad},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,"")})`}/>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1].split(",")[0]} cy={pts[pts.length-1].split(",")[1]} r="3" fill={color}/>
    </svg>
  );
}

/* ── Animated Bar Chart ──────────────────────────────────────── */
function AnimatedBarChart({ data, labels, color = "var(--accent)" }) {
  const max = Math.max(...data, 0) || 1;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);
  return (
    <div className="adb-chart-wrap">
      <div className="adb-y-axis">
        {[100, 75, 50, 25, 0].map((pct) => (
          <span key={pct} className="adb-y-label">{pct === 0 ? "" : `${Math.round((pct/100)*max/1_000_000 * 10)/10}M`}</span>
        ))}
      </div>
      <div className="adb-bars">
        {data.map((v, i) => {
          const pct = (v / max) * 100;
          const isMax = v === max;
          return (
            <div key={i} className="adb-col">
              <div className="adb-bar-container">
                {isMax && <div className="adb-bar-peak-label">{formatCurrency(v)}</div>}
                <div
                  className={`adb-bar-fill ${isMax ? "peak" : ""}`}
                  style={{
                    height: mounted ? `${Math.max(pct, 2)}%` : "0%",
                    background: isMax
                      ? `linear-gradient(180deg, ${color}, rgba(255,95,163,.5))`
                      : `linear-gradient(180deg, rgba(255,95,163,.55), rgba(255,95,163,.15))`,
                    transitionDelay: `${i * 40}ms`,
                  }}
                />
              </div>
              <span className="adb-x-label">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, accentColor, sparkData, icon, animate = true }) {
  const numVal = typeof value === "number" ? value : 0;
  const counted = useCountUp(animate ? numVal : 0);
  const displayValue = typeof value === "string" ? value : counted.toLocaleString("vi-VN");

  return (
    <div className="adb-kpi" style={{ "--kpi-accent": accentColor }}>
      <div className="adb-kpi-top">
        <div>
          <p className="adb-kpi-label">{label}</p>
          <p className="adb-kpi-value">{displayValue}</p>
          {sub && <p className="adb-kpi-sub">{sub}</p>}
        </div>
        <div className="adb-kpi-icon">{icon}</div>
      </div>
      {sparkData && (
        <div className="adb-kpi-spark">
          <Sparkline data={sparkData} color={accentColor} height={44}/>
        </div>
      )}
    </div>
  );
}

/* ── Word report export ───────────────────────────────────────── */
const downloadWordReport = (filename, html) => {
  const blob = new Blob(["\uFEFF", html], { type: "application/msword;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.URL.revokeObjectURL(url);
};

const buildWordReportHtml = ({ generatedAt, stats, totalRevenue, shirtCategories, pantCategories, topProducts, recentOrders, products }) => {
  const summaryRows = [
    ["Tổng đơn hàng", stats.orders ?? recentOrders.length, "Tổng hợp từ dữ liệu hiện có"],
    ["Tổng sản phẩm", products.length, "Danh sách hàng hóa"],
    ["Tổng doanh thu", formatCurrency(totalRevenue), "Tính từ tất cả đơn hàng"],
    ["Admin", stats.adminUsers ?? 0, "Phân quyền"],
    ["Staff", stats.staffUsers ?? 0, "Phân quyền"],
    ["Khách hàng", stats.customerUsers ?? 0, "Phân quyền"],
  ];
  const renderRow = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Báo cáo UniqTee</title>
  <style>body{font-family:'Be Vietnam Pro',sans-serif;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d1d5db;padding:8px}th{background:#f3f4f6}</style>
  </head><body><h1>Báo cáo quản trị UniqTee</h1><p>${escapeHtml(generatedAt)}</p>
  <h2>Tổng quan</h2><table><thead><tr><th>Chỉ số</th><th>Giá trị</th><th>Ghi chú</th></tr></thead><tbody>${summaryRows.map((r) => renderRow(r.map(escapeHtml))).join("")}</tbody></table>
  <h2>Sản phẩm bán chạy</h2><table><thead><tr><th>#</th><th>Sản phẩm</th><th>Loại</th><th>Đã bán</th><th>Doanh thu</th></tr></thead>
  <tbody>${topProducts.map((p, i) => renderRow([i+1, p.name, p.type, p.sold, p.revenue].map(escapeHtml))).join("")}</tbody></table>
  <h2>Đơn hàng gần đây</h2><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
  <tbody>${recentOrders.map((o) => renderRow([`#${o.id}`, o.customer, o.total, getDashboardStatusMeta(o.status).label].map(escapeHtml))).join("")}</tbody></table>
  </body></html>`;
};

/* ═══════════════════════════════════════════════════════════════
   Main Dashboard Component
   ═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [stats, setStats]       = useState({});
  const [serverNotifications, setServerNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [pd, od, sd, nd] = await Promise.all([
          productAPI.getAllProducts(),
          adminAPI.getAllOrders(),
          adminAPI.getDashboardStats(),
          adminAPI.getNotifications(),
        ]);
        setProducts(pd || []);
        setOrders(od   || []);
        setStats(sd    || {});
        setServerNotifications(Array.isArray(nd) ? nd : []);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Derived data ─────────────────────────────────────────── */
  const totalAo   = products.filter((p) => p.type === "Áo").length;
  const totalQuan = products.filter((p) => p.type === "Quần").length;
  const shirtCats = getCategoryBreakdown(products, "Áo");
  const pantCats  = getCategoryBreakdown(products, "Quần");
  const monthly   = buildMonthlyRevenue(orders);

  const totalRevenue = orders.reduce(
    (s, o) => s + Number(o?.total ?? o?.totalAmount ?? 0), 0,
  );

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6)
    .map((o) => ({
      id: o.id,
      customer: o.customerName || "—",
      total: formatCurrency(Number(o.total ?? o.totalAmount ?? 0)),
      status: String(o.status || "pending").toLowerCase(),
    }));

  const topProducts = [...products]
    .filter((p) => p.sold > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      img: getProductImage(p),
      type: p.type || "Khác",
      sold: p.sold || 0,
      revenueValue: Number(p.sold||0) * Number(p.price||0),
      revenue: formatCurrency(Number(p.sold||0) * Number(p.price||0)),
    }));

  // Status distribution for donut
  const statusCounts = orders.reduce((acc, o) => {
    const s = String(o.status || "pending").toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const donutSegments = [
    { label: "Đã giao",   value: statusCounts.delivered  || 0, color: "#34d399" },
    { label: "Đang giao", value: statusCounts.shipping   || 0, color: "#fbbf24" },
    { label: "Xử lý",     value: statusCounts.processing || 0, color: "#ff5fa3" },
    { label: "Đã hủy",    value: statusCounts.cancelled  || 0, color: "#f87171" },
    { label: "Chờ xác nhận", value: statusCounts.pending || 0, color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  // Spark data — last 7 months revenue
  const sparkRevenue = monthly.data.filter((_, i) => i >= monthly.data.length - 7);

  const notifications  = buildDashboardNotifications({ products, orders });
  const combinedNotifs = mergeNotifications(notifications, serverNotifications);

  const handleExportReport = () => {
    const now = new Date();
    downloadWordReport(
      `UniqTee-report-${now.toISOString().slice(0,10)}.doc`,
      buildWordReportHtml({ generatedAt: now.toLocaleString("vi-VN"), stats, totalRevenue, shirtCategories: shirtCats, pantCategories: pantCats, topProducts, recentOrders, products }),
    );
    recordAdminActivity({ type: "system", icon: <FileText size={16}/>, text: "Đã xuất báo cáo Word", unread: true });
  };

  /* ── Loading / Error ─────────────────────────────────────── */
  if (loading) return (
    <AdminLayout title="Dashboard" subtitle="Đang tải...">
      <div className="adb-loader">
        <div className="adb-spinner"/>
        <p>Đang tải dữ liệu...</p>
      </div>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout title="Dashboard" subtitle="Lỗi">
      <div className="adb-error"><p>{error}</p></div>
    </AdminLayout>
  );

  const totalUsers = (stats.adminUsers || 0) + (stats.staffUsers || 0) + (stats.customerUsers || 0);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <AdminLayout
      title="Dashboard"
      subtitle={`${new Date().toLocaleDateString("vi-VN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}`}
      actions={
        <button type="button" className="topbar-btn accent" onClick={handleExportReport}>
          <FileText size={14} style={{ marginRight: 6 }} />
          Xuất báo cáo
        </button>
      }
      notifications={combinedNotifs}
    >

      {/* ── Section: Welcome banner ─────────────────────────── */}
      <div className="adb-welcome">
        <div className="adb-welcome-text">
          <h2 className="adb-welcome-title">Tổng quan hệ thống</h2>
          <p className="adb-welcome-sub">Xem nhanh hiệu suất cửa hàng trong thời gian thực</p>
        </div>
        <div className="adb-welcome-badge">
          <span className="adb-live-dot"/>
          <span>Live</span>
        </div>
      </div>

      {/* ── Section: KPI Cards ─────────────────────────────── */}
      <div className="adb-kpi-grid">
        <KpiCard
          label="Tổng đơn hàng"
          value={stats.orders ?? orders.length}
          sub={`${statusCounts.delivered || 0} đã giao thành công`}
          accentColor="#ff5fa3"
          sparkData={monthly.data.slice(-7)}
          icon={<ClipboardList size={22} color="currentColor" strokeWidth={1.8} />}
        />
        <KpiCard
          label="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          sub="Từ tất cả đơn hàng"
          accentColor="#34d399"
          sparkData={monthly.data.slice(-7).map((v) => v / 1_000)}
          animate={false}
          icon={<DollarSign size={22} color="currentColor" strokeWidth={1.8} />}
        />
        <KpiCard
          label="Sản phẩm"
          value={products.length}
          sub={`${totalAo} áo · ${totalQuan} quần`}
          accentColor="#60a5fa"
          sparkData={null}
          icon={<Package size={22} color="currentColor" strokeWidth={1.8} />}
        />
        <KpiCard
          label="Người dùng"
          value={totalUsers || stats.users || 0}
          sub={`${stats.customerUsers || 0} khách · ${stats.staffUsers || 0} staff`}
          accentColor="#a78bfa"
          sparkData={null}
          icon={<Users size={22} color="currentColor" strokeWidth={1.8} />}
        />
      </div>

      {/* ── Section: Revenue chart + Order status ─────────── */}
      <div className="adb-mid-grid">
        {/* Revenue bar chart */}
        <div className="admin-card adb-revenue-card">
          <div className="card-header">
            <div>
              <p className="card-title">Doanh thu theo tháng</p>
              <p style={{ fontSize:".75rem", color:"var(--text-muted)", marginTop:2 }}>Năm {monthly.year}</p>
            </div>
            <div className="adb-revenue-total">
              <span className="adb-revenue-num">{formatCurrency(totalRevenue)}</span>
              <span className="adb-revenue-lbl">Tổng cộng</span>
            </div>
          </div>
          <AnimatedBarChart data={monthly.data} labels={monthly.labels} />
        </div>

        {/* Order status donut */}
        <div className="admin-card adb-donut-card">
          <div className="card-header">
            <p className="card-title">Trạng thái đơn hàng</p>
            <span className="card-tag">{orders.length} đơn</span>
          </div>
          {donutSegments.length > 0 ? (
            <div className="adb-donut-wrap">
              <div className="adb-donut-chart">
                <DonutChart segments={donutSegments} size={160} thickness={26}/>
                <div className="adb-donut-center">
                  <span className="adb-donut-num">{orders.length}</span>
                  <span className="adb-donut-lbl">đơn</span>
                </div>
              </div>
              <div className="adb-donut-legend">
                {donutSegments.map((seg) => (
                  <div key={seg.label} className="adb-legend-row">
                    <span className="adb-legend-dot" style={{ background: seg.color }}/>
                    <span className="adb-legend-label">{seg.label}</span>
                    <span className="adb-legend-val">{seg.value}</span>
                    <span className="adb-legend-pct">
                      {Math.round((seg.value / orders.length) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">Chưa có dữ liệu đơn hàng</div>
          )}
        </div>
      </div>

      {/* ── Section: Top products + Recent orders ─────────── */}
      <div className="adb-bot-grid">
        {/* Top selling products */}
        <div className="admin-card">
          <div className="card-header">
            <div>
              <p className="card-title">Sản phẩm bán chạy</p>
              <p style={{ fontSize:".75rem", color:"var(--text-muted)", marginTop:2 }}>Top 5 theo số lượng bán</p>
            </div>
            <Link to="/admin/products" className="card-link">Quản lý <ChevronRight size={14} /></Link>
          </div>
          {topProducts.length > 0 ? (
            <div className="adb-top-list">
              {topProducts.map((p, i) => {
                const pct = (p.sold / topProducts[0].sold) * 100;
                return (
                  <div key={i} className="adb-top-row">
                    <div className="adb-top-rank">{i + 1}</div>
                    <img src={p.img} alt={p.name} className="adb-top-img"/>
                    <div className="adb-top-info">
                      <p className="adb-top-name">{p.name}</p>
                      <div className="adb-top-bar-wrap">
                        <div className="adb-top-bar" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                    <div className="adb-top-meta">
                      <span className="adb-top-sold">{p.sold} sold</span>
                      <span className="adb-top-rev">{p.revenue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state">Chưa có sản phẩm bán chạy.</div>
          )}
        </div>

        {/* Recent orders */}
        <div className="admin-card">
          <div className="card-header">
            <div>
              <p className="card-title">Đơn hàng gần đây</p>
              <p style={{ fontSize:".75rem", color:"var(--text-muted)", marginTop:2 }}>6 đơn mới nhất</p>
            </div>
            <Link to="/admin/orders" className="card-link">Xem tất cả <ChevronRight size={14} /></Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="adb-order-list">
              {recentOrders.map((o) => {
                const meta = getDashboardStatusMeta(o.status);
                return (
                  <div key={o.id} className="adb-order-row">
                    <div className="adb-order-avatar">
                      {o.customer.charAt(0).toUpperCase()}
                    </div>
                    <div className="adb-order-info">
                      <p className="adb-order-name">{o.customer}</p>
                      <p className="adb-order-id">#{o.id}</p>
                    </div>
                    <div className="adb-order-right">
                      <p className="adb-order-total">{o.total}</p>
                      <span className={`omr-status ${meta.cls}`}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state">Chưa có đơn hàng gần đây.</div>
          )}
        </div>
      </div>

      {/* ── Section: Product category breakdown ───────────── */}
      <div className="adb-cat-grid">
        <div className="admin-card" style={{ borderTop: "2px solid #ff5fa3" }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div className="adb-cat-ico" style={{ background:"rgba(255,95,163,.12)", color:"#ff5fa3" }}>
                <Shirt size={16} strokeWidth={2} />
              </div>
              <p className="card-title">Phân loại Áo</p>
            </div>
            <span className="card-tag" style={{ color:"#ff5fa3", background:"rgba(255,95,163,.1)", border:"1px solid rgba(255,95,163,.2)" }}>
              {totalAo} sản phẩm
            </span>
          </div>
          {shirtCats.length > 0 ? (
            <div className="adb-cat-list">
              {shirtCats.map(({ category, count }) => {
                const pct = (count / totalAo) * 100;
                return (
                  <div key={category} className="adb-cat-row">
                    <span className="adb-cat-name">{category}</span>
                    <div className="adb-cat-bar-wrap">
                      <div className="adb-cat-bar" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#ff5fa3,rgba(255,95,163,.3))" }}/>
                    </div>
                    <span className="adb-cat-count">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color:"var(--text-muted)", fontSize:".85rem" }}>Chưa có dữ liệu</p>
          )}
        </div>

        <div className="admin-card" style={{ borderTop: "2px solid #60a5fa" }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div className="adb-cat-ico" style={{ background:"rgba(96,165,250,.12)", color:"#60a5fa" }}>
                <Layers size={16} strokeWidth={2} />
              </div>
              <p className="card-title">Phân loại Quần</p>
            </div>
            <span className="card-tag" style={{ color:"#60a5fa", background:"rgba(96,165,250,.1)", border:"1px solid rgba(96,165,250,.2)" }}>
              {totalQuan} sản phẩm
            </span>
          </div>
          {pantCats.length > 0 ? (
            <div className="adb-cat-list">
              {pantCats.map(({ category, count }) => {
                const pct = (count / totalQuan) * 100;
                return (
                  <div key={category} className="adb-cat-row">
                    <span className="adb-cat-name">{category}</span>
                    <div className="adb-cat-bar-wrap">
                      <div className="adb-cat-bar" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#60a5fa,rgba(96,165,250,.3))" }}/>
                    </div>
                    <span className="adb-cat-count">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color:"var(--text-muted)", fontSize:".85rem" }}>Chưa có dữ liệu</p>
          )}
        </div>

        {/* User distribution */}
        <div className="admin-card" style={{ borderTop: "2px solid #a78bfa" }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div className="adb-cat-ico" style={{ background:"rgba(167,139,250,.12)", color:"#a78bfa" }}>
                <User size={16} strokeWidth={2} />
              </div>
              <p className="card-title">Phân quyền người dùng</p>
            </div>
            <span className="card-tag" style={{ color:"#a78bfa", background:"rgba(167,139,250,.1)", border:"1px solid rgba(167,139,250,.2)" }}>
              {totalUsers} tài khoản
            </span>
          </div>
          <div className="adb-cat-list">
            {[
              { label:"Admin", val: stats.adminUsers || 0, color:"#ff5fa3" },
              { label:"Staff", val: stats.staffUsers || 0, color:"#60a5fa" },
              { label:"Khách hàng", val: stats.customerUsers || 0, color:"#a78bfa" },
            ].map(({ label, val, color }) => {
              const pct = totalUsers > 0 ? (val / totalUsers) * 100 : 0;
              return (
                <div key={label} className="adb-cat-row">
                  <span className="adb-cat-name">{label}</span>
                  <div className="adb-cat-bar-wrap">
                    <div className="adb-cat-bar" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}55)` }}/>
                  </div>
                  <span className="adb-cat-count">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}

import { Link } from "react-router-dom";
import { ALL_PRODUCTS } from "../data/Products";
import { AdminLayout } from "./Adminheader";
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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
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
          <div className="bar-fill" style={{ height:`${(v/max)*100}%` }} />
          <span className="bar-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const stats = [
    { label:"Doanh thu tháng", value:"48.350.000đ", change:"+12.4%", up:true,  spark:[28,35,30,42,38,45,48],           color:"var(--accent)" },
    { label:"Đơn hàng mới",   value:"134",          change:"+8.1%",  up:true,  spark:[80,95,88,110,102,120,134],        color:"#60a5fa"       },
    { label:"Sản phẩm",       value:ALL_PRODUCTS.length, change:"0%", up:true, spark:[6,6,7,7,8,8,ALL_PRODUCTS.length], color:"#a78bfa"       },
    { label:"Khách hàng",     value:"1.024",         change:"+5.3%", up:true,  spark:[600,700,750,820,880,960,1024],     color:"#34d399"       },
  ];

  const recentOrders = [
    { id:"UNQ7F3K2", customer:"Nguyễn Thị Lan",  total:"648.000đ",   status:"delivered",  date:"15/03" },
    { id:"UNQ2M9P1", customer:"Trần Quốc Bảo",   total:"379.000đ",   status:"shipping",   date:"14/03" },
    { id:"UNQ5X8Q4", customer:"Lê Mỹ Duyên",     total:"1.278.000đ", status:"processing", date:"14/03" },
    { id:"UNQ9R1Z7", customer:"Phạm Minh Tuấn",  total:"299.000đ",   status:"delivered",  date:"13/03" },
    { id:"UNQ4K2W3", customer:"Hoàng Thu Hương",  total:"697.000đ",   status:"cancelled",  date:"12/03" },
  ];

  const topProducts = ALL_PRODUCTS.slice(0,5).map((p) => ({
    name:p.name, sold:p.sold,
    revenue:(p.price * p.sold).toLocaleString("vi-VN")+"đ",
    img:Array.isArray(p.images) ? p.images[0] : p.image,
  }));

  const STATUS_MAP = {
    delivered:  { label:"Đã giao",   cls:"st-delivered"  },
    shipping:   { label:"Đang giao", cls:"st-shipping"   },
    processing: { label:"Xử lý",     cls:"st-processing" },
    cancelled:  { label:"Đã hủy",    cls:"st-cancelled"  },
  };

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Thứ 6, 20/03/2026 · Chào mừng trở lại!"
      actions={<button className="topbar-btn">↓ Xuất báo cáo</button>}
    >
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s,i) => (
          <div key={i} className="stat-card" style={{"--card-accent":s.color}}>
            <div className="stat-top">
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.value}</p>
              </div>
              <Sparkline data={s.spark} color={s.color} />
            </div>
            <p className={`stat-change ${s.up?"up":"down"}`}>
              {s.up?"↑":"↓"} {s.change} so với tháng trước
            </p>
          </div>
        ))}
      </div>

      {/* Revenue + Orders */}
      <div className="dashboard-grid">
        <div className="admin-card">
          <div className="card-header">
            <p className="card-title">Doanh thu theo tháng</p>
            <span className="card-tag">2025</span>
          </div>
          <BarChart data={[18,22,19,28,24,32,29,38,34,42,39,48]}
            labels={["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"]} />
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
                <div style={{textAlign:"right"}}>
                  <p className="omr-total">{o.total}</p>
                  <span className={`omr-status ${STATUS_MAP[o.status].cls}`}>
                    {STATUS_MAP[o.status].label}
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
          <thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th><th>Xếp hạng</th></tr></thead>
          <tbody>
            {topProducts.map((p,i) => (
              <tr key={i}>
                <td><div className="tp-product-cell"><img src={p.img} alt={p.name} className="tp-img"/><span>{p.name}</span></div></td>
                <td><span className="tp-sold">{p.sold}</span></td>
                <td><span className="tp-revenue">{p.revenue}</span></td>
                <td><div className="tp-rank-bar"><div className="tp-rank-fill" style={{width:`${(p.sold/topProducts[0].sold)*100}%`}}/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
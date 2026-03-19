import { useState } from "react";
import { AdminLayout } from "./Adminheader";
import "./css/Admin.css";

const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

const USERS_DATA = [
  { id:1,  name:"Nguyễn Thị Lan",    email:"lan.nguyen@email.com",    phone:"0901 234 567", role:"customer", status:"active",   joined:"10/01/2025", orders:5, spent:1840000, avatar:"N" },
  { id:2,  name:"Trần Quốc Bảo",     email:"bao.tran@email.com",      phone:"0912 345 678", role:"customer", status:"active",   joined:"15/01/2025", orders:3, spent:920000,  avatar:"T" },
  { id:3,  name:"Lê Mỹ Duyên",       email:"duyen.le@email.com",      phone:"0987 654 321", role:"customer", status:"active",   joined:"20/01/2025", orders:7, spent:2610000, avatar:"L" },
  { id:4,  name:"Phạm Minh Tuấn",    email:"tuan.pham@email.com",     phone:"0932 111 222", role:"customer", status:"inactive", joined:"05/02/2025", orders:1, spent:299000,  avatar:"P" },
  { id:5,  name:"Hoàng Thu Hương",   email:"huong.hoang@email.com",   phone:"0908 888 999", role:"customer", status:"active",   joined:"12/02/2025", orders:4, spent:1340000, avatar:"H" },
  { id:6,  name:"Vũ Thanh Long",     email:"long.vu@email.com",       phone:"0971 222 333", role:"customer", status:"blocked",  joined:"18/02/2025", orders:2, spent:678000,  avatar:"V" },
  { id:7,  name:"Đinh Thị Mai",      email:"mai.dinh@email.com",      phone:"0965 444 555", role:"customer", status:"active",   joined:"01/03/2025", orders:6, spent:1987000, avatar:"Đ" },
  { id:8,  name:"Cao Minh Hiếu",     email:"22130081@st.hcmuaf.edu.vn",phone:"0854 553 708", role:"admin",   status:"active",   joined:"01/01/2025", orders:0, spent:0,       avatar:"C" },
  { id:9,  name:"Ngô Bảo Long",      email:"long.ngo@email.com",      phone:"0945 333 666", role:"customer", status:"active",   joined:"08/03/2025", orders:2, spent:728000,  avatar:"N" },
  { id:10, name:"Phan Thúy Hằng",    email:"hang.phan@email.com",     phone:"0933 777 444", role:"staff",    status:"active",   joined:"01/02/2025", orders:0, spent:0,       avatar:"P" },
];

const ROLE_MAP   = { admin:"role-admin", staff:"role-staff", customer:"role-customer" };
const ROLE_LABEL = { admin:"Admin", staff:"Nhân viên", customer:"Khách hàng" };
const STATUS_MAP = { active:{label:"Hoạt động",cls:"st-delivered"}, inactive:{label:"Không HĐ",cls:"st-processing"}, blocked:{label:"Đã khóa",cls:"st-cancelled"} };

export default function AdminUsers() {
  const [users,    setUsers]    = useState(USERS_DATA);
  const [search,   setSearch]   = useState("");
  const [roleTab,  setRoleTab]  = useState("Tất cả");
  const [detail,   setDetail]   = useState(null);
  const [editRole, setEditRole] = useState(null);

  const displayed = users.filter((u) => {
    const matchS = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchR = roleTab==="Tất cả" || u.role===roleTab;
    return matchS && matchR;
  });

  const toggleStatus = (id) =>
    setUsers((prev) => prev.map((u) => u.id!==id ? u : {...u, status:u.status==="active"?"blocked":"active"}));

  const saveRole = () => {
    if (!editRole) return;
    setUsers((prev) => prev.map((u) => u.id===editRole.userId ? {...u,role:editRole.role} : u));
    setEditRole(null);
  };

  return (
    <AdminLayout
      title="Quản lý người dùng"
      subtitle={`${users.length} tài khoản · ${users.filter((u)=>u.status==="active").length} đang hoạt động`}
    >
      {/* Toolbar */}
      <div className="admin-card toolbar-card">
        <div className="status-tabs">
          {["Tất cả","admin","staff","customer"].map((t) => {
            const count = t==="Tất cả" ? users.length : users.filter((u)=>u.role===t).length;
            return (
              <button key={t} className={`status-tab ${roleTab===t?"active":""}`} onClick={() => setRoleTab(t)}>
                {t==="Tất cả" ? "Tất cả" : ROLE_LABEL[t]}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="search-input-wrap" style={{marginTop:14}}>
          <span className="search-ico">🔍</span>
          <input className="admin-search-input" placeholder="Tìm tên, email…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats */}
      <div className="users-stats-row">
        {[
          {label:"Tổng tài khoản",  value:users.length,                                 color:"var(--accent)"},
          {label:"Đang hoạt động",  value:users.filter((u)=>u.status==="active").length,  color:"#34d399"},
          {label:"Đã khóa",         value:users.filter((u)=>u.status==="blocked").length, color:"#f87171"},
          {label:"Khách hàng",      value:users.filter((u)=>u.role==="customer").length,  color:"#60a5fa"},
        ].map((s,i) => (
          <div key={i} className="users-stat-card" style={{"--uc":s.color}}>
            <p className="uc-value" style={{color:s.color}}>{s.value}</p>
            <p className="uc-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-card table-card">
        <table className="admin-table">
          <thead>
            <tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th>Đơn hàng</th><th>Chi tiêu</th><th>Tham gia</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {displayed.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar" style={{"--ua-color":u.role==="admin"?"var(--accent)":u.role==="staff"?"#60a5fa":"#a78bfa"}}>
                      {u.avatar}
                    </div>
                    <div>
                      <p style={{fontWeight:600,fontSize:"0.875rem"}}>{u.name}</p>
                      <p style={{fontSize:"0.72rem",color:"var(--text-muted)"}}>ID #{u.id}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p style={{fontSize:"0.82rem"}}>{u.email}</p>
                  <p style={{fontSize:"0.75rem",color:"var(--text-muted)"}}>{u.phone}</p>
                </td>
                <td><span className={`role-badge ${ROLE_MAP[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                <td><span className={`omr-status ${STATUS_MAP[u.status].cls}`}>{STATUS_MAP[u.status].label}</span></td>
                <td style={{textAlign:"center",fontFamily:"var(--font-mono)",fontSize:"0.85rem"}}>{u.orders}</td>
                <td><span style={{color:"var(--accent)",fontWeight:600,fontSize:"0.85rem"}}>{u.spent>0?fmt(u.spent):"—"}</span></td>
                <td style={{fontSize:"0.82rem",color:"var(--text-secondary)"}}>{u.joined}</td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn edit" onClick={() => setDetail(u)}>👁</button>
                    <button className="action-btn edit" onClick={() => setEditRole({userId:u.id,role:u.role})}>🔑</button>
                    {u.role!=="admin" && (
                      <button className={`action-btn ${u.status==="active"?"del":"next"}`} onClick={() => toggleStatus(u.id)}>
                        {u.status==="active"?"🔒":"🔓"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chi tiết tài khoản</h2>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
                <div className="user-avatar lg" style={{"--ua-color":detail.role==="admin"?"var(--accent)":"#a78bfa"}}>{detail.avatar}</div>
                <div>
                  <p style={{fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.1rem"}}>{detail.name}</p>
                  <span className={`role-badge ${ROLE_MAP[detail.role]}`}>{ROLE_LABEL[detail.role]}</span>
                  <span className={`omr-status ${STATUS_MAP[detail.status].cls}`} style={{marginLeft:8}}>{STATUS_MAP[detail.status].label}</span>
                </div>
              </div>
              <div className="detail-info-grid">
                <div><span className="di-label">Email</span><span>{detail.email}</span></div>
                <div><span className="di-label">Điện thoại</span><span>{detail.phone}</span></div>
                <div><span className="di-label">Tham gia</span><span>{detail.joined}</span></div>
                <div><span className="di-label">Đơn hàng</span><span>{detail.orders}</span></div>
                <div><span className="di-label">Tổng chi tiêu</span>
                  <span style={{color:"var(--accent)",fontWeight:700}}>{detail.spent>0?fmt(detail.spent):"Chưa mua hàng"}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role */}
      {editRole && (
        <div className="modal-overlay" onClick={() => setEditRole(null)}>
          <div className="modal-box small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Đổi vai trò</h2>
              <button className="modal-close" onClick={() => setEditRole(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{marginBottom:16,color:"var(--text-secondary)"}}>Chọn vai trò mới:</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {["admin","staff","customer"].map((r) => (
                  <label key={r} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"10px 14px",borderRadius:10,
                    background:editRole.role===r?"var(--accent-dim)":"var(--surface)",
                    border:`1px solid ${editRole.role===r?"rgba(var(--accent-rgb),.3)":"var(--border)"}`,transition:"all .2s"}}>
                    <input type="radio" name="role" value={r} checked={editRole.role===r}
                      onChange={() => setEditRole((e) => ({...e,role:r}))} style={{accentColor:"var(--accent)"}} />
                    <span className={`role-badge ${ROLE_MAP[r]}`}>{ROLE_LABEL[r]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setEditRole(null)}>Hủy</button>
              <button className="modal-btn save" onClick={saveRole}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
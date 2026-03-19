import { useState } from "react";
import { ALL_PRODUCTS } from "../data/Products";
import "./css/ProfilePage.css";

// Lấy ảnh thumbnail từ sản phẩm (hỗ trợ cả images[] lẫn image)
const getThumb = (p) => (Array.isArray(p.images) ? p.images[0] : p.image);

// Đơn hàng giả lập — ảnh lấy từ ALL_PRODUCTS
const ORDERS = [
  {
    id: "UNQ7F3K2", date: "15/03/2025", status: "delivered",
    items: [
      { image: getThumb(ALL_PRODUCTS[0]) },
      { image: getThumb(ALL_PRODUCTS[1]) },
    ],
    total: ALL_PRODUCTS[0].price + ALL_PRODUCTS[1].price + ALL_PRODUCTS[2].price,
    itemCount: 3,
  },
  {
    id: "UNQ2M9P1", date: "08/03/2025", status: "shipping",
    items: [
      { image: getThumb(ALL_PRODUCTS[2]) },
    ],
    total: ALL_PRODUCTS[2].price,
    itemCount: 1,
  },
  {
    id: "UNQ5X8Q4", date: "01/03/2025", status: "processing",
    items: [
      { image: getThumb(ALL_PRODUCTS[3]) },
      { image: getThumb(ALL_PRODUCTS[4]) },
      { image: getThumb(ALL_PRODUCTS[5]) },
    ],
    total: ALL_PRODUCTS[3].price + ALL_PRODUCTS[4].price + ALL_PRODUCTS[5].price + ALL_PRODUCTS[6].price,
    itemCount: 4,
  },
];

// Danh sách yêu thích — lấy từ ALL_PRODUCTS (sản phẩm 6, 5, 7)
const WISHLIST = ALL_PRODUCTS.filter((p) => [6, 5, 7].includes(p.id)).map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: getThumb(p),
}));

const STATUS_MAP = {
  delivered: { label: "Đã giao hàng", cls: "status-delivered" },
  shipping: { label: "Đang giao", cls: "status-shipping" },
  processing: { label: "Đang xử lý", cls: "status-processing" },
  cancelled: { label: "Đã hủy", cls: "status-cancelled" },
};

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Nguyễn Thị Lan",
    email: "lan.nguyen@email.com",
    phone: "0901 234 567",
    dob: "1998-04-15",
    gender: "female",
    address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM",
  });

  const filteredOrders = orderFilter === "all" ? ORDERS : ORDERS.filter((o) => o.status === orderFilter);

  const NavItem = ({ tabKey, icon, label }) => (
    <div className={`profile-nav-item ${activeTab === tabKey ? "active" : ""}`} onClick={() => setActiveTab(tabKey)}>
      {icon}
      {label}
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-inner">
        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{profile.fullName[0]}</div>
            <div className="profile-avatar-edit">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="white" strokeWidth="2"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profile.fullName}</h1>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-badges">
              <span className="profile-badge badge-member">🌸 Thành viên</span>
              <span className="profile-badge badge-verified">✓ Đã xác minh</span>
            </div>
          </div>
          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-num">{ORDERS.length}</span>
              <span className="profile-stat-label">Đơn hàng</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-num">{WISHLIST.length}</span>
              <span className="profile-stat-label">Yêu thích</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-num">4.9★</span>
              <span className="profile-stat-label">Đánh giá</span>
            </div>
          </div>
        </div>

        <div className="profile-layout">
          {/* Nav */}
          <nav className="profile-nav">
            <NavItem tabKey="orders" label="Đơn hàng" icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            } />
            <NavItem tabKey="wishlist" label="Yêu thích" icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            } />
            <NavItem tabKey="info" label="Thông tin cá nhân" icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            } />
            <NavItem tabKey="security" label="Bảo mật" icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            } />
            <div className="profile-nav-divider" />
            <div className="profile-nav-logout">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Đăng xuất
            </div>
          </nav>

          {/* Content */}
          <div className="profile-content">
            {/* Orders */}
            {activeTab === "orders" && (
              <div className="profile-section">
                <p className="profile-section-title">
                  <span className="section-title-dot" />
                  Lịch sử đơn hàng
                </p>
                <div className="orders-filter-bar">
                  {[["all","Tất cả"], ["processing","Đang xử lý"], ["shipping","Đang giao"], ["delivered","Đã giao"], ["cancelled","Đã hủy"]].map(([key, label]) => (
                    <button key={key} className={`order-filter-btn ${orderFilter === key ? "active" : ""}`} onClick={() => setOrderFilter(key)}>
                      {label}
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    <p style={{ fontSize: "2rem", marginBottom: 12 }}>📦</p>
                    <p>Không có đơn hàng nào</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <p className="order-id">#{order.id}</p>
                          <p className="order-date">{order.date}</p>
                        </div>
                        <span className={`order-status ${STATUS_MAP[order.status].cls}`}>
                          {STATUS_MAP[order.status].label}
                        </span>
                      </div>
                      <div className="order-items-preview">
                        {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="order-item-thumb">
                            <img src={item.image} alt="" />
                          </div>
                        ))}
                        {order.itemCount > 3 && (
                          <div className="order-more-items">+{order.itemCount - 3}</div>
                        )}
                      </div>
                      <div className="order-card-footer">
                        <span className="order-total">{formatPrice(order.total)}</span>
                        <div className="order-actions">
                          <button className="order-action-btn">Xem chi tiết</button>
                          {order.status === "delivered" && (
                            <button className="order-action-btn primary">Mua lại</button>
                          )}
                          {order.status === "processing" && (
                            <button className="order-action-btn">Hủy đơn</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Wishlist */}
            {activeTab === "wishlist" && (
              <div className="profile-section">
                <p className="profile-section-title">
                  <span className="section-title-dot" />
                  Sản phẩm yêu thích ({WISHLIST.length})
                </p>
                <div className="wishlist-grid">
                  {WISHLIST.map((item) => (
                    <div key={item.id} className="wishlist-card">
                      <div className="wishlist-img">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="wishlist-info">
                        <p className="wishlist-name">{item.name}</p>
                        <p className="wishlist-price">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            {activeTab === "info" && (
              <div className="profile-section">
                <p className="profile-section-title">
                  <span className="section-title-dot" />
                  Thông tin cá nhân
                  <button
                    className="order-action-btn"
                    style={{ marginLeft: "auto" }}
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? "Hủy" : "✏️ Chỉnh sửa"}
                  </button>
                </p>

                {editMode ? (
                  <>
                    <div className="edit-form-grid">
                      {[
                        { label: "Họ và tên", key: "fullName", type: "text", full: false },
                        { label: "Số điện thoại", key: "phone", type: "tel", full: false },
                        { label: "Email", key: "email", type: "email", full: true },
                        { label: "Ngày sinh", key: "dob", type: "date", full: false },
                        { label: "Địa chỉ", key: "address", type: "text", full: true },
                      ].map(({ label, key, type, full }) => (
                        <div key={key} className={`edit-form-group ${full ? "full" : ""}`}>
                          <label className="edit-form-label">{label}</label>
                          <input
                            className="edit-form-input"
                            type={type}
                            value={profile[key]}
                            onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
                          />
                        </div>
                      ))}
                      <div className="edit-form-group">
                        <label className="edit-form-label">Giới tính</label>
                        <select
                          className="edit-form-input"
                          value={profile.gender}
                          onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}
                          style={{ cursor: "pointer" }}
                        >
                          <option value="female">Nữ</option>
                          <option value="male">Nam</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                    <div className="edit-form-actions">
                      <button className="btn-primary" onClick={() => setEditMode(false)}>Lưu thay đổi</button>
                      <button className="btn-secondary" onClick={() => setEditMode(false)}>Hủy</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Họ và tên", value: profile.fullName, icon: "👤" },
                      { label: "Email", value: profile.email, icon: "✉️" },
                      { label: "Số điện thoại", value: profile.phone, icon: "📞" },
                      { label: "Ngày sinh", value: profile.dob, icon: "🎂" },
                      { label: "Giới tính", value: { female: "Nữ", male: "Nam", other: "Khác" }[profile.gender], icon: "🌸" },
                      { label: "Địa chỉ", value: profile.address, icon: "📍" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{icon}</span>
                        <div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: "0.9rem" }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="profile-section">
                <p className="profile-section-title">
                  <span className="section-title-dot" />
                  Bảo mật tài khoản
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { title: "Đổi mật khẩu", sub: "Cập nhật mật khẩu định kỳ để bảo mật tài khoản", btn: "Đổi ngay" },
                    { title: "Xác thực 2 bước", sub: "Tăng cường bảo mật với xác thực qua điện thoại", btn: "Kích hoạt" },
                    { title: "Thiết bị đã đăng nhập", sub: "Quản lý các thiết bị đang truy cập tài khoản", btn: "Xem" },
                  ].map((s) => (
                    <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, marginBottom: 2 }}>{s.title}</p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{s.sub}</p>
                      </div>
                      <button className="order-action-btn">{s.btn}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
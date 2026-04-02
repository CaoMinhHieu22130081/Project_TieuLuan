import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ALL_PRODUCTS } from "../data/Products";
import { userAPI, orderAPI } from "../services/api";
import "./css/ProfilePage.css";

// Lấy ảnh thumbnail từ sản phẩm (hỗ trợ cả images[] lẫn image)
const getThumb = (p) => (Array.isArray(p.images) ? p.images[0] : p.image);

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho profile
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
  });

  // State cho orders
  const [orders, setOrders] = useState([]);

  // Tải dữ liệu profile và orders khi component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Lấy userId từ localStorage
        const userId = localStorage.getItem('userId');
        
        // Nếu không có userId, chuyển hướng về login
        if (!userId) {
          navigate('/login');
          return;
        }
        
        // CÁCH 1: Lấy userData từ localStorage trước (hiển thị ngay)
        const cachedUserData = localStorage.getItem('userData');
        if (cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData);
            setProfile({
              fullName: userData.name || userData.fullName || "",
              email: userData.email || "",
              phone: userData.phone || "",
              dob: userData.dob || userData.dateOfBirth || "",
              gender: userData.gender || "",
              address: userData.address || "",
            });
          } catch (e) {
            console.warn('Failed to parse cached userData:', e);
          }
        }
        
        // CÁCH 2: Gọi API để lấy/sync dữ liệu mới nhất
        try {
          const profileData = await userAPI.getProfile(userId);
          
          // Cập nhật profile state với dữ liệu từ API
          setProfile({
            fullName: profileData.name || profileData.fullName || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            dob: profileData.dateOfBirth || profileData.dob || "",
            gender: profileData.gender || "",
            address: profileData.address || "",
          });
          
          // Cập nhật lại localStorage với dữ liệu mới
          localStorage.setItem('userData', JSON.stringify(profileData));
        } catch (err) {
          console.error('Error syncing profile from API:', err);
          // Nếu API fail, vẫn dùng cached data nếu có
        }
        
        // Tải đơn hàng của user
        try {
          const ordersData = await orderAPI.getUserOrders(userId);
          
          // Xử lý dữ liệu orders - chuyển đổi để phù hợp với UI
          if (ordersData && Array.isArray(ordersData)) {
            const formattedOrders = ordersData.map((order) => ({
              id: order.id || order.orderId,
              date: order.createdDate ? new Date(order.createdDate).toLocaleDateString('vi-VN') : "",
              status: order.status ? order.status.toLowerCase() : "processing",
              items: order.items && Array.isArray(order.items) ? order.items.map(item => ({
                image: item.productImage || getThumb(ALL_PRODUCTS[0])
              })) : [],
              total: order.totalPrice || order.total || 0,
              itemCount: order.items?.length || 0,
            }));
            setOrders(formattedOrders);
          }
        } catch (err) {
          console.error('Error fetching orders:', err);
          // Orders fail không ảnh hưởng đến profile
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, user]);

  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  // Xử lý logout
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Xử lý lưu thay đổi profile
  const handleSaveProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Không tìm thấy user ID');
        return;
      }

      // Cập nhật profile trên server
      await userAPI.updateProfile(userId, {
        name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.dob,
        gender: profile.gender,
        address: profile.address,
      });

      setEditMode(false);
      setError(null);
      alert('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  const NavItem = ({ tabKey, icon, label }) => (
    <div className={`profile-nav-item ${activeTab === tabKey ? "active" : ""}`} onClick={() => setActiveTab(tabKey)}>
      {icon}
      {label}
    </div>
  );

  // Hiển thị loading state
  if (loading && !profile.email) {
    return (
      <div className="profile-page">
        <div className="profile-inner" style={{ textAlign: "center", padding: "40px" }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Hiển thị error state
  if (error && !profile.email) {
    return (
      <div className="profile-page">
        <div className="profile-inner" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "red" }}>Lỗi: {error}</p>
          <button onClick={() => navigate('/login')} style={{ marginTop: "20px" }}>Quay lại đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Admin/Staff back button */}
      {isAdmin && (
        <div style={{
          padding: "16px",
          background: "linear-gradient(135deg, #ff5fa3 0%, #ff7fb8 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px"
        }}>
          <Link 
            to={user?.role === "admin" ? "/admin" : "/admin/orders"}
            style={{
              padding: "10px 24px",
              background: "white",
              color: "#ff5fa3",
              textDecoration: "none",
              borderRadius: "25px",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
              cursor: "pointer",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(255, 95, 163, 0.3)",
              textAlign: "center"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(255, 95, 163, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(255, 95, 163, 0.3)";
            }}
          >
            ← Quay lại {user?.role === "admin" ? "Admin" : "Staff"}
          </Link>
        </div>
      )}
      <div className="profile-inner">
        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{profile.fullName?.[0]?.toUpperCase() || "U"}</div>
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
              <span className="profile-badge badge-member">
                {user?.role === "admin" ? "👑 Quản trị viên" : user?.role === "staff" ? "👨‍💼 Nhân viên" : "🌸 Thành viên"}
              </span>
              <span className="profile-badge badge-verified">✓ Đã xác minh</span>
            </div>
          </div>
          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-num">{orders.length}</span>
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
            <div className="profile-nav-logout" onClick={handleLogout}>
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
                      <button className="btn-primary" onClick={handleSaveProfile}>Lưu thay đổi</button>
                      <button className="btn-secondary" onClick={() => setEditMode(false)}>Hủy</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Họ và tên", value: profile.fullName || "Chưa cập nhật", icon: "👤" },
                      { label: "Email", value: profile.email || "Chưa cập nhật", icon: "✉️" },
                      { label: "Số điện thoại", value: profile.phone || "Chưa cập nhật", icon: "📞" },
                      { label: "Ngày sinh", value: profile.dob || "Chưa cập nhật", icon: "🎂" },
                      { label: "Giới tính", value: { female: "Nữ", male: "Nam", other: "Khác" }[profile.gender] || "Chưa cập nhật", icon: "🌸" },
                      { label: "Địa chỉ", value: profile.address || "Chưa cập nhật", icon: "📍" },
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
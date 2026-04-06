import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { ALL_PRODUCTS } from "../data/Products";
import { userAPI, orderAPI } from "../services/api";
import "./css/ProfilePage.css";

// Lấy ảnh thumbnail từ sản phẩm (hỗ trợ cả images[] lẫn image)
const getThumb = (p) => (Array.isArray(p.images) ? p.images[0] : p.image);

const STATUS_MAP = {
  delivered: { label: "Đã giao hàng", cls: "status-delivered" },
  shipping: { label: "Đang giao", cls: "status-shipping" },
  processing: { label: "Đang xử lý", cls: "status-processing" },
  cancelled: { label: "Đã hủy", cls: "status-cancelled" },
};

const formatPrice = (p) => p.toLocaleString("vi-VN") + "đ";

// Password Strength Checker Component
function PasswordStrengthChecker({ password }) {
  const checks = [
    { label: "Ít nhất 8 ký tự", ok: password.length >= 8 },
    { label: "Có chữ hoa", ok: /[A-Z]/.test(password) },
    { label: "Có số", ok: /[0-9]/.test(password) },
    { label: "Có ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const levels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
  const colors = ["", "#f87171", "#fbbf24", "#60a5fa", "#c8ff57"];

  if (!password) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {/* Strength bars */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= score ? colors[score] : "var(--border)",
              transition: "background 0.2s"
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.8rem", color: colors[score], fontWeight: 600 }}>
        {levels[score]}
      </span>

      {/* Checks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        {checks.map((c) => (
          <div
            key={c.label}
            style={{
              fontSize: "0.78rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: c.ok ? "var(--text-secondary)" : "var(--text-muted)",
              opacity: c.ok ? 1 : 0.6
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>{c.ok ? "✓" : "○"}</span>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // State để hiển thị/ẩn mật khẩu
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State cho avatar upload
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

  // State cho profile
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    avatar: "",
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
              avatar: userData.avatar || "",
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
            avatar: profileData.avatar || "",
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

  // Xử lý đổi mật khẩu
  const handleChangePassword = async () => {
    try {
      // Validate
      if (!passwordForm.oldPassword) {
        setPasswordError('Vui lòng nhập mật khẩu cũ');
        return;
      }
      if (!passwordForm.newPassword) {
        setPasswordError('Vui lòng nhập mật khẩu mới');
        return;
      }
      if (!passwordForm.confirmPassword) {
        setPasswordError('Vui lòng xác nhận mật khẩu mới');
        return;
      }

      // Validate new password strength
      const passErrors = [];
      if (passwordForm.newPassword.length < 8) passErrors.push("Ít nhất 8 ký tự");
      if (!/[A-Z]/.test(passwordForm.newPassword)) passErrors.push("Ít nhất 1 chữ hoa");
      if (!/[0-9]/.test(passwordForm.newPassword)) passErrors.push("Ít nhất 1 số");
      if (!/[^A-Za-z0-9]/.test(passwordForm.newPassword)) passErrors.push("Ít nhất 1 ký tự đặc biệt");
      
      if (passErrors.length > 0) {
        setPasswordError(`Mật khẩu phải có: ${passErrors.join(", ")}`);
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('Mật khẩu mới và xác nhận không khớp');
        return;
      }

      setPasswordError(null);
      setPasswordLoading(true);

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setPasswordError('Không tìm thấy user ID');
        return;
      }

      const response = await userAPI.changePassword(
        userId,
        passwordForm.oldPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );

      setPasswordSuccess(true);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowChangePassword(false);
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Xử lý upload avatar
  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAvatarMessage('error: Vui lòng chọn tệp hình ảnh');
        setTimeout(() => setAvatarMessage(''), 3000);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAvatarMessage('error: Kích thước hình ảnh không được vượt quá 5MB');
        setTimeout(() => setAvatarMessage(''), 3000);
        return;
      }

      setAvatarLoading(true);
      setAvatarMessage('');

      // Convert file to Base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imageBase64 = event.target?.result;
          
          const userId = localStorage.getItem('userId');
          if (!userId) {
            setAvatarMessage('error: Không tìm thấy user ID');
            setAvatarLoading(false);
            return;
          }

          const response = await userAPI.uploadAvatar(userId, imageBase64);
          
          // Update localStorage with new user data
          if (response.user) {
            localStorage.setItem('userData', JSON.stringify(response.user));
            // Update profile state with new avatar
            setProfile(prev => ({
              ...prev,
              avatar: response.user.avatar || ""
            }));
          }

          setAvatarMessage('success: Cập nhật ảnh đại diện thành công');
          
          setTimeout(() => setAvatarMessage(''), 3000);
        } catch (err) {
          console.error('Error uploading avatar:', err);
          setAvatarMessage('error: ' + (err.message || 'Cập nhật ảnh đại diện thất bại'));
          setTimeout(() => setAvatarMessage(''), 3000);
        } finally {
          setAvatarLoading(false);
          // Reset file input
          if (e.target) e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error in handleAvatarUpload:', err);
      setAvatarMessage('error: ' + (err.message || 'Có lỗi xảy ra'));
      setAvatarLoading(false);
      setTimeout(() => setAvatarMessage(''), 3000);
    }
  };

  const NavItem = ({ tabKey, icon, label, badge }) => (
    <div className={`profile-nav-item ${activeTab === tabKey ? "active" : ""}`} onClick={() => setActiveTab(tabKey)}>
      {icon}
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {label}
        {badge !== undefined && badge > 0 && (
          <span
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 600,
              marginLeft: "4px",
            }}
          >
            {badge}
          </span>
        )}
      </span>
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
          <div 
            className="profile-avatar-wrap" 
            style={{ position: "relative" }}
            title={avatarLoading ? "Đang tải..." : "Nhấp để thay đổi ảnh đại diện"}
          >
            {profile.avatar ? (
              <img
                src={`data:image/png;base64,${profile.avatar}`}
                alt="User Avatar"
                title="Nhấp để thay đổi ảnh đại diện"
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  border: "3px solid rgba(var(--accent-rgb), 0.4)",
                  objectFit: "cover",
                  objectPosition: "center",
                  opacity: avatarLoading ? 0.6 : 1,
                  cursor: avatarLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={() => {
                  if (!avatarLoading) {
                    document.getElementById('avatarFileInput')?.click();
                  }
                }}
                onMouseEnter={(e) => {
                  if (!avatarLoading) {
                    e.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.style.transform = "scale(1)";
                }}
              />
            ) : (
              <div 
                className="profile-avatar"
                style={{
                  opacity: avatarLoading ? 0.6 : 1,
                  cursor: avatarLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={() => {
                  if (!avatarLoading) {
                    document.getElementById('avatarFileInput')?.click();
                  }
                }}
                onMouseEnter={(e) => {
                  if (!avatarLoading) {
                    e.target.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                }}
              >
                {profile.fullName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            
            {/* Upload input */}
            <input
              id="avatarFileInput"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
              disabled={avatarLoading}
            />

            {/* Edit icon */}
            <div 
              className="profile-avatar-edit"
              style={{ opacity: avatarLoading ? 0.5 : 1 }}
              onClick={() => !avatarLoading && document.getElementById('avatarFileInput')?.click()}
            >
              {avatarLoading ? (
                <span style={{ fontSize: "14px" }}>⟳</span>
              ) : (
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="white" strokeWidth="2"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2"/>
                </svg>
              )}
            </div>

            {/* Avatar upload message */}
            {avatarMessage && (
              <div style={{
                position: "absolute",
                top: "-30px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: "0.75rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                background: avatarMessage.startsWith('error') ? "rgba(255, 107, 107, 0.9)" : "rgba(62, 207, 142, 0.9)",
                color: "white",
                zIndex: 1000,
                animation: "slideDown 0.3s ease"
              }}>
                {avatarMessage.replace('error: ', '').replace('success: ', '')}
              </div>
            )}
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
              <span className="profile-stat-num">{wishlist.length}</span>
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
            <NavItem tabKey="orders" label="Đơn hàng" badge={orders.length} icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            } />
            <NavItem tabKey="wishlist" label="Yêu thích" badge={wishlist.length} icon={
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
                  Sản phẩm yêu thích ({wishlist.length})
                </p>
                {wishlist.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    <p style={{ fontSize: "2rem", marginBottom: "16px" }}>💔</p>
                    <p>Bạn chưa có sản phẩm yêu thích nào</p>
                  </div>
                ) : (
                  <div className="wishlist-grid">
                    {wishlist.map((item) => (
                      <div key={item.id} style={{ position: "relative" }}>
                        <Link 
                          to={`/products/${item.id}`}
                          className="wishlist-card"
                          style={{ textDecoration: "none" }}
                        >
                          <div 
                            className="wishlist-img"
                            style={{ position: "relative" }}
                          >
                            <img 
                              src={Array.isArray(item.images) && item.images.length > 0 ? item.images[0].url : item.image} 
                              alt={item.name} 
                            />
                          </div>
                          <div className="wishlist-info">
                            <p className="wishlist-name">{item.name}</p>
                            <p className="wishlist-price">{formatPrice(item.price)}</p>
                          </div>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeFromWishlist(item.id);
                          }}
                          style={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            background: "rgba(0, 0, 0, 0.7)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            transition: "all 0.2s ease",
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          title="Xóa khỏi yêu thích"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

                {/* Change Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 16,
                    background: showChangePassword ? "var(--accent-dim)" : "var(--surface)",
                    borderRadius: 12,
                    border: "1px solid " + (showChangePassword ? "var(--accent)" : "var(--border)")
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, marginBottom: 2 }}>🔐 Đổi mật khẩu</p>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {showChangePassword ? "Nhập mật khẩu cũ và mật khẩu mới" : "Cập nhật mật khẩu định kỳ để bảo mật tài khoản"}
                      </p>
                    </div>
                    {!showChangePassword && (
                      <button className="order-action-btn" onClick={() => setShowChangePassword(true)}>
                        Đổi ngay
                      </button>
                    )}
                  </div>

                  {/* Change Password Form */}
                  {showChangePassword && (
                    <div style={{
                      padding: 20,
                      background: "var(--surface)",
                      borderRadius: 12,
                      border: "1px solid var(--border)"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Old Password */}
                        <div>
                          <label style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            marginBottom: 6,
                            display: "block",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontFamily: "var(--font-mono)",
                          }}>
                            Mật khẩu cũ
                          </label>
                          <div style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center"
                          }}>
                            <input
                              type={showOldPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu cũ"
                              value={passwordForm.oldPassword}
                              onChange={(e) => {
                                setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }));
                                setPasswordError(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                paddingRight: "40px",
                                background: "var(--bg-2)",
                                border: "1px solid var(--border-2)",
                                borderRadius: 8,
                                color: "var(--text-primary)",
                                fontSize: "0.9rem",
                                fontFamily: "var(--font-body)",
                                outline: "none",
                                boxSizing: "border-box",
                                transition: "border-color 0.2s"
                              }}
                              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                              onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              style={{
                                position: "absolute",
                                right: 10,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                color: "var(--text-secondary)",
                                transition: "color 0.2s"
                              }}
                              onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                              onMouseLeave={(e) => e.target.style.color = "var(--text-secondary)"}
                              title={showOldPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showOldPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            marginBottom: 6,
                            display: "block",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontFamily: "var(--font-mono)",
                          }}>
                            Mật khẩu mới
                          </label>
                          <div style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center"
                          }}>
                            <input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu mới"
                              value={passwordForm.newPassword}
                              onChange={(e) => {
                                setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                                setPasswordError(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                paddingRight: "40px",
                                background: "var(--bg-2)",
                                border: "1px solid var(--border-2)",
                                borderRadius: 8,
                                color: "var(--text-primary)",
                                fontSize: "0.9rem",
                                fontFamily: "var(--font-body)",
                                outline: "none",
                                boxSizing: "border-box",
                                transition: "border-color 0.2s"
                              }}
                              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                              onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              style={{
                                position: "absolute",
                                right: 10,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                color: "var(--text-secondary)",
                                transition: "color 0.2s"
                              }}
                              onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                              onMouseLeave={(e) => e.target.style.color = "var(--text-secondary)"}
                              title={showNewPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showNewPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        {/* Password Strength Indicator */}
                        {passwordForm.newPassword && (
                          <PasswordStrengthChecker password={passwordForm.newPassword} />
                        )}

                        {/* Confirm Password */}
                        <div>
                          <label style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            marginBottom: 6,
                            display: "block",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontFamily: "var(--font-mono)",
                          }}>
                            Xác nhận mật khẩu mới
                          </label>
                          <div style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center"
                          }}>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Nhập lại mật khẩu mới"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => {
                                setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                                setPasswordError(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                paddingRight: "40px",
                                background: "var(--bg-2)",
                                border: "1px solid var(--border-2)",
                                borderRadius: 8,
                                color: "var(--text-primary)",
                                fontSize: "0.9rem",
                                fontFamily: "var(--font-body)",
                                outline: "none",
                                boxSizing: "border-box",
                                transition: "border-color 0.2s"
                              }}
                              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                              onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: "absolute",
                                right: 10,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                color: "var(--text-secondary)",
                                transition: "color 0.2s"
                              }}
                              onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                              onMouseLeave={(e) => e.target.style.color = "var(--text-secondary)"}
                              title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        {/* Error Message */}
                        {passwordError && (
                          <div style={{
                            padding: 10,
                            background: "rgba(255, 107, 107, 0.1)",
                            border: "1px solid rgba(255, 107, 107, 0.3)",
                            borderRadius: 8,
                            color: "#ff6b6b",
                            fontSize: "0.85rem"
                          }}>
                            ❌ {passwordError}
                          </div>
                        )}

                        {/* Success Message */}
                        {passwordSuccess && (
                          <div style={{
                            padding: 10,
                            background: "rgba(62, 207, 142, 0.1)",
                            border: "1px solid rgba(62, 207, 142, 0.3)",
                            borderRadius: 8,
                            color: "#3ecf8e",
                            fontSize: "0.85rem"
                          }}>
                            ✓ Mật khẩu đã được thay đổi thành công
                          </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <button
                            className="btn-primary"
                            onClick={handleChangePassword}
                            disabled={passwordLoading}
                            style={{
                              opacity: passwordLoading ? 0.6 : 1,
                              cursor: passwordLoading ? "not-allowed" : "pointer"
                            }}
                          >
                            {passwordLoading ? "Đang xử lý..." : "💾 Lưu mật khẩu mới"}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setShowChangePassword(false);
                              setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                              setPasswordError(null);
                              setPasswordSuccess(false);
                            }}
                            disabled={passwordLoading}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
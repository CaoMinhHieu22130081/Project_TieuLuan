import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { productAPI, userAPI, orderAPI, reviewAPI } from "../services/api";
import "./css/Profilepage.css";

// Lấy ảnh thumbnail từ sản phẩm (hỗ trợ cả images[] lẫn image)
const getThumb = (p) => {
  const image = Array.isArray(p?.images) ? p.images[0] : p?.image;
  if (typeof image === "string") return image;
  return image?.url || image?.src || image?.image || "";
};

const getAvatarMimeType = (value) => {
  if (value.startsWith("iVBORw0KGgo")) return "image/png";
  if (value.startsWith("/9j/")) return "image/jpeg";
  if (value.startsWith("R0lGOD")) return "image/gif";
  if (value.startsWith("UklGR")) return "image/webp";
  return "image/png";
};

const resolveAvatarSrc = (avatar) => {
  if (!avatar) return "";
  const value = String(avatar).trim();
  if (!value) return "";

  if (/^data:image\//i.test(value) || /^https?:\/\//i.test(value) || /^blob:/i.test(value)) {
    return value;
  }

  const compactValue = value.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(compactValue) && compactValue.length > 32) {
    return `data:${getAvatarMimeType(compactValue)};base64,${compactValue}`;
  }

  return "";
};

const formatOrderDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("vi-VN");
};

const normalizeOrderItem = (item, index, productImageMap = {}) => {
  const qtyValue = Number(item?.qty ?? item?.quantity ?? 1);
  const qty = Number.isFinite(qtyValue) && qtyValue > 0 ? qtyValue : 1;
  const unitPriceValue = Number(item?.unitPrice ?? 0);
  const unitPrice = Number.isFinite(unitPriceValue) ? unitPriceValue : 0;
  const subtotalValue = Number(item?.subtotal);
  const subtotal = Number.isFinite(subtotalValue) ? subtotalValue : unitPrice * qty;
  const productId = Number(item?.productId ?? item?.id);

  return {
    id: item?.id ?? item?.productId ?? `item-${index}`,
    productId: Number.isFinite(productId) ? productId : null,
    productName: item?.productName || item?.name || "Sản phẩm",
    productSku: item?.productSku || item?.sku || "",
    color: item?.color || "",
    size: item?.size || "",
    qty,
    unitPrice,
    subtotal,
    image: item?.image || item?.productImage || (Number.isFinite(productId) ? productImageMap[productId] : "") || "https://via.placeholder.com/120?text=UniqTee",
  };
};

const normalizeOrder = (order, index = 0, productImageMap = {}) => {
  const items = Array.isArray(order?.items)
    ? order.items.map((item, itemIndex) => normalizeOrderItem(item, itemIndex, productImageMap))
    : [];

  const shippingFeeValue = Number(order?.shippingFee ?? order?.shipping ?? 0);
  const shippingFee = Number.isFinite(shippingFeeValue) ? shippingFeeValue : 0;
  const subtotalValue = Number(order?.subtotal);
  const subtotal = Number.isFinite(subtotalValue)
    ? subtotalValue
    : items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const totalValue = Number(order?.total ?? order?.totalPrice);
  const total = Number.isFinite(totalValue) ? totalValue : subtotal + shippingFee;
  const createdAt = order?.createdAt || order?.createdDate || order?.date || "";

  return {
    id: order?.id ?? order?.orderId ?? `order-${index}`,
    orderCode: order?.orderCode || order?.code || order?.order_code || `${order?.id ?? index}`,
    date: formatOrderDate(createdAt),
    createdAt,
    status: String(order?.status || "processing").toLowerCase(),
    paymentMethod: order?.paymentMethod || order?.payment || "—",
    customerName: order?.customerName || order?.customer || "",
    customerPhone: order?.customerPhone || order?.phone || "",
    customerEmail: order?.customerEmail || order?.email || "",
    address: order?.address || "",
    shippingFee,
    subtotal,
    total,
    items,
    itemCount: Number.isFinite(Number(order?.itemCount)) ? Number(order.itemCount) : items.length,
  };
};

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", cls: "status-processing" },
  delivered: { label: "Đã giao hàng", cls: "status-delivered" },
  shipping: { label: "Đang giao", cls: "status-shipping" },
  processing: { label: "Đang xử lý", cls: "status-processing" },
  cancelled: { label: "Đã hủy", cls: "status-cancelled" },
};

const getOrderStatusMeta = (status) => {
  const normalizedStatus = String(status || "processing").toLowerCase();
  return STATUS_MAP[normalizedStatus] || STATUS_MAP.processing;
};

const formatPrice = (p) => Number(p || 0).toLocaleString("vi-VN") + "đ";

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
  const { addToast } = useToast();
  const currentUserId = user?.id || localStorage.getItem("userId");
  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    reviewerName: "",
    rating: 5,
    content: "",
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

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
        
        // Lấy userId từ auth context hoặc localStorage
        const userId = currentUserId;
        
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
          const orderList = Array.isArray(ordersData)
            ? ordersData
            : Array.isArray(ordersData?.content)
              ? ordersData.content
              : [];

          const productIds = Array.from(
            new Set(
              orderList
                .flatMap((order) => (Array.isArray(order?.items) ? order.items : []))
                .map((item) => Number(item?.productId))
                .filter((productId) => Number.isFinite(productId) && productId > 0)
            )
          );

          const productImagePairs = await Promise.all(
            productIds.map(async (productId) => {
              try {
                const product = await productAPI.getProductById(productId);
                return [productId, getThumb(product) || ""];
              } catch (productError) {
                return [productId, ""];
              }
            })
          );

          const productImageMap = Object.fromEntries(
            productImagePairs.filter(([, image]) => Boolean(image))
          );

          const formattedOrders = orderList
            .map((order, index) => normalizeOrder(order, index, productImageMap))
            .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

          setOrders(formattedOrders);
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

  const normalizedOrderFilter = String(orderFilter || "all").toLowerCase();
  const filteredOrders = normalizedOrderFilter === "all"
    ? orders
    : orders.filter((o) => String(o.status || "").toLowerCase() === normalizedOrderFilter);

  // Xử lý logout
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Xử lý lưu thay đổi profile
  const handleSaveProfile = async () => {
    try {
      const userId = currentUserId;
      if (!userId) {
        setError('Không tìm thấy user ID');
        return;
      }

      // Cập nhật profile trên server
      await userAPI.updateProfile(userId, {
        name: profile.fullName,
        phone: profile.phone,
        dob: profile.dob,
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

      const userId = currentUserId;
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
          
          const userId = currentUserId;
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

  const openReviewForm = (order, item) => {
    const productId = Number(item?.productId);
    if (!Number.isFinite(productId)) {
      return;
    }

    setReviewTarget({
      orderId: order.id,
      orderCode: order.orderCode,
      productId,
      productName: item.productName || "Sản phẩm",
    });
    setReviewForm({
      reviewerName: profile.fullName || user?.name || "",
      rating: 5,
      content: "",
    });
    setReviewError("");
    setSelectedOrderId(order.id);
  };

  const closeReviewForm = () => {
    setReviewTarget(null);
    setReviewError("");
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) {
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError("");

      const payload = {
        productId: reviewTarget.productId,
        rating: Number(reviewForm.rating) || 5,
        reviewerName: reviewForm.reviewerName?.trim() || profile.fullName || user?.name || "Khách hàng",
        content: reviewForm.content?.trim() || "",
      };

      await reviewAPI.createReview(payload);
      addToast("Gửi đánh giá thành công", "success", 3000);
      setReviewTarget(null);
      setReviewForm({
        reviewerName: profile.fullName || user?.name || "",
        rating: 5,
        content: "",
      });
    } catch (err) {
      const message = err.message || "Không thể gửi đánh giá";
      setReviewError(message);
      addToast(message, "error", 4000);
    } finally {
      setReviewLoading(false);
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

  const avatarSrc = resolveAvatarSrc(profile.avatar);
  const avatarFallback = profile.fullName?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U";

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
        <div className="profile-admin-banner">
          <Link 
            to={user?.role === "admin" ? "/admin" : "/admin/orders"}
            className="profile-admin-banner-link"
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
            {avatarSrc ? (
              <img
                src={avatarSrc}
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
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
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
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {avatarFallback}
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
                     {[["all", "Tất cả"], ["pending", "Chờ xác nhận"], ["processing", "Đang xử lý"], ["shipping", "Đang giao"], ["delivered", "Đã giao"], ["cancelled", "Đã hủy"]].map(([key, label]) => (
                    <button key={key} className={`order-filter-btn ${orderFilter === key ? "active" : ""}`} onClick={() => setOrderFilter(key)}>
                      {label}
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="profile-empty-state">
                    <p className="profile-empty-state-icon">📦</p>
                    <p className="profile-empty-state-title">Không có đơn hàng nào</p>
                    <p className="profile-empty-state-subtitle">Khi bạn đặt hàng, toàn bộ trạng thái và chi tiết sẽ hiển thị tại đây.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const normalizedStatus = String(order.status || "processing").toLowerCase();
                    const statusMeta = getOrderStatusMeta(normalizedStatus);
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const itemCount = Number.isFinite(Number(order.itemCount)) ? Number(order.itemCount) : orderItems.length;

                    return (
                      <div key={order.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <p className="order-id">#{order.id}</p>
                            <p className="order-date">{order.date}</p>
                          </div>
                          <span className={`order-status ${statusMeta.cls}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="order-items-preview">
                          {orderItems.slice(0, 3).map((item, i) => (
                            <div key={i} className="order-item-thumb">
                              <img src={item.image} alt={item.productName || "Sản phẩm"} />
                            </div>
                          ))}
                          {itemCount > 3 && (
                            <div className="order-more-items">+{itemCount - 3}</div>
                          )}
                        </div>
                        {orderItems.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                            {orderItems.slice(0, 2).map((item, index) => (
                              <p
                                key={`${order.id}-${item.id ?? index}`}
                                style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}
                              >
                                {item.productName} · x{item.qty}
                              </p>
                            ))}
                            {orderItems.length > 2 && (
                              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                +{orderItems.length - 2} sản phẩm khác
                              </p>
                            )}
                          </div>
                        )}
                        <div className="order-card-footer">
                          <span className="order-total">{formatPrice(order.total)}</span>
                          <div className="order-actions">
                            <button
                              className="order-action-btn"
                              onClick={() => setSelectedOrderId((prev) => (prev === order.id ? null : order.id))}
                            >
                              {selectedOrderId === order.id ? "Ẩn chi tiết" : "Xem chi tiết"}
                            </button>
                            {normalizedStatus === "delivered" && (
                              <button className="order-action-btn primary">Mua lại</button>
                            )}
                            {normalizedStatus === "processing" && (
                              <button className="order-action-btn">Hủy đơn</button>
                            )}
                          </div>
                        </div>

                        {selectedOrderId === order.id && (
                          <div style={{
                            marginTop: 14,
                            padding: 14,
                            borderRadius: 14,
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}>
                              Sản phẩm trong đơn
                            </p>
                            {orderItems.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {orderItems.map((item) => (
                                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <img
                                      src={item.image}
                                      alt={item.productName}
                                      style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontWeight: 600, margin: 0 }}>{item.productName}</p>
                                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                                        {item.color || "—"} · Size {item.size || "—"} · x{item.qty}
                                      </p>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                      <span style={{ fontWeight: 700, color: "var(--accent)" }}>{formatPrice(item.subtotal)}</span>
                                      {normalizedStatus === "delivered" && Number.isFinite(Number(item.productId)) && (
                                        <button
                                          type="button"
                                          className="order-action-btn primary"
                                          onClick={() => openReviewForm(order, item)}
                                        >
                                          Đánh giá
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ margin: 0, color: "var(--text-muted)" }}>Không có sản phẩm</p>
                            )}

                            {reviewTarget && reviewTarget.orderId === order.id && (
                              <div
                                className="review-compose-card"
                                style={{
                                  marginTop: 18,
                                  padding: 20,
                                  borderRadius: 24,
                                  border: "1px solid rgba(var(--accent-rgb), 0.18)",
                                  background:
                                    "linear-gradient(180deg, rgba(var(--accent-rgb), 0.09) 0%, rgba(17,17,20,0.98) 28%, rgba(17,17,20,0.98) 100%)",
                                  boxShadow: "0 20px 48px rgba(0, 0, 0, 0.22)",
                                }}
                              >
                                <div
                                  className="review-compose-header"
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    marginBottom: 16,
                                  }}
                                >
                                  <div style={{ minWidth: 0 }}>
                                    <p
                                      className="review-compose-title"
                                      style={{
                                        margin: 0,
                                        fontFamily: "var(--font-display)",
                                        fontSize: "1.05rem",
                                        fontWeight: 800,
                                        color: "var(--text-primary)",
                                      }}
                                    >
                                      Đánh giá {reviewTarget.productName}
                                    </p>
                                    <p
                                      className="review-compose-subtitle"
                                      style={{
                                        margin: "6px 0 0",
                                        color: "var(--text-secondary)",
                                        fontSize: "0.86rem",
                                        lineHeight: 1.55,
                                        maxWidth: 680,
                                      }}
                                    >
                                      Chỉ gửi sau khi đơn đã được giao. Hệ thống sẽ đối chiếu nội dung với số sao bạn chọn.
                                    </p>
                                  </div>
                                  <button type="button" className="order-action-btn" onClick={closeReviewForm}>
                                    Đóng
                                  </button>
                                </div>

                                {reviewError && (
                                  <div
                                    className="review-compose-error"
                                    style={{
                                      marginBottom: 14,
                                      padding: "11px 14px",
                                      borderRadius: 14,
                                      border: "1px solid rgba(255, 107, 107, 0.24)",
                                      background: "rgba(255, 107, 107, 0.08)",
                                      color: "#ff9a9a",
                                      fontSize: "0.88rem",
                                    }}
                                  >
                                    {reviewError}
                                  </div>
                                )}

                                <div
                                  className="review-compose-grid"
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                    gap: 14,
                                  }}
                                >
                                  <div className="review-compose-field" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <span
                                      className="review-compose-label"
                                      style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      Tên hiển thị
                                    </span>
                                    <input
                                      type="text"
                                      className="review-compose-input"
                                      value={reviewForm.reviewerName}
                                      onChange={(e) => setReviewForm((prev) => ({ ...prev, reviewerName: e.target.value }))}
                                      placeholder="Ví dụ: Minh Anh"
                                      style={{
                                        width: "100%",
                                        minHeight: 48,
                                        padding: "12px 14px",
                                        borderRadius: 16,
                                        border: "1px solid var(--border-2)",
                                        background: "rgba(255, 255, 255, 0.04)",
                                        color: "var(--text-primary)",
                                        fontSize: "0.95rem",
                                        outline: "none",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                                      }}
                                    />
                                  </div>

                                  <div className="review-compose-field" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <span
                                      className="review-compose-label"
                                      style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      Số sao
                                    </span>
                                    <div
                                      className="review-star-picker"
                                      style={{
                                        display: "flex",
                                        gap: 10,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                      }}
                                    >
                                      {[1, 2, 3, 4, 5].map((star) => {
                                        const active = Number(reviewForm.rating) === star;
                                        return (
                                          <button
                                            key={star}
                                            type="button"
                                            className={`review-star-btn ${active ? "active" : ""}`}
                                            onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                                            style={{
                                              width: 48,
                                              height: 48,
                                              borderRadius: 16,
                                              border: active ? "1px solid rgba(var(--accent-rgb), 0.45)" : "1px solid var(--border-2)",
                                              background: active
                                                ? "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)"
                                                : "rgba(255, 255, 255, 0.04)",
                                              color: active ? "#fff" : "var(--text-muted)",
                                              fontSize: "1.05rem",
                                              fontWeight: 800,
                                              boxShadow: active ? "0 12px 24px rgba(var(--accent-rgb), 0.26)" : "none",
                                              transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease",
                                            }}
                                          >
                                            ★
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div
                                    className="review-compose-field"
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 8,
                                      gridColumn: "1 / -1",
                                    }}
                                  >
                                    <span
                                      className="review-compose-label"
                                      style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      Bình luận
                                    </span>
                                    <textarea
                                      className="review-compose-textarea"
                                      rows={4}
                                      value={reviewForm.content}
                                      onChange={(e) => setReviewForm((prev) => ({ ...prev, content: e.target.value }))}
                                      placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm"
                                      style={{
                                        width: "100%",
                                        minHeight: 128,
                                        padding: "14px 16px",
                                        borderRadius: 18,
                                        border: "1px solid var(--border-2)",
                                        background: "rgba(255, 255, 255, 0.04)",
                                        color: "var(--text-primary)",
                                        fontSize: "0.95rem",
                                        lineHeight: 1.65,
                                        resize: "vertical",
                                        outline: "none",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                                      }}
                                    />
                                  </div>
                                </div>

                                <div
                                  className="review-compose-actions"
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    marginTop: 16,
                                  }}
                                >
                                  <button type="button" className="btn-secondary" onClick={closeReviewForm}>
                                    Hủy
                                  </button>
                                  <button type="button" className="btn-primary" onClick={handleSubmitReview} disabled={reviewLoading}>
                                    {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              <span>Phí vận chuyển</span>
                              <span>{Number(order.shippingFee || 0) === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                              <span>Tổng cộng</span>
                              <span style={{ color: "var(--accent)" }}>{formatPrice(order.total)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
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
                  <div className="profile-empty-state">
                    <p className="profile-empty-state-icon">💔</p>
                    <p className="profile-empty-state-title">Bạn chưa có sản phẩm yêu thích nào</p>
                    <p className="profile-empty-state-subtitle">Lưu lại các mẫu bạn thích để quay lại mua nhanh hơn.</p>
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
                              src={getThumb(item) || item.image || "https://via.placeholder.com/120?text=UniqTee"} 
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
                            readOnly={key === "email"}
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
                  <div className="profile-detail-list">
                    {[
                      { label: "Họ và tên", value: profile.fullName || "Chưa cập nhật", icon: "👤" },
                      { label: "Email", value: profile.email || "Chưa cập nhật", icon: "✉️" },
                      { label: "Số điện thoại", value: profile.phone || "Chưa cập nhật", icon: "📞" },
                      { label: "Ngày sinh", value: profile.dob || "Chưa cập nhật", icon: "🎂" },
                      { label: "Giới tính", value: { female: "Nữ", male: "Nam", other: "Khác" }[profile.gender] || "Chưa cập nhật", icon: "🌸" },
                      { label: "Địa chỉ", value: profile.address || "Chưa cập nhật", icon: "📍" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="profile-detail-row">
                        <span className="profile-detail-icon">{icon}</span>
                        <div className="profile-detail-copy">
                          <p className="profile-detail-label">{label}</p>
                          <p className="profile-detail-value">{value}</p>
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

                <div className="security-stack">
                  <div className={`security-callout ${showChangePassword ? "active" : ""}`}>
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

                  {showChangePassword && (
                    <div className="security-form">
                      <div className="security-fields">
                        <div className="security-field">
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
                          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <input
                              type={showOldPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu cũ"
                              value={passwordForm.oldPassword}
                              onChange={(e) => {
                                setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }));
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
                              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "var(--border-2)"; }}
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
                              onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; }}
                              onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; }}
                              title={showOldPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showOldPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        <div className="security-field">
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
                          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu mới"
                              value={passwordForm.newPassword}
                              onChange={(e) => {
                                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
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
                              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "var(--border-2)"; }}
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
                              onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; }}
                              onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; }}
                              title={showNewPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showNewPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        {passwordForm.newPassword && (
                          <PasswordStrengthChecker password={passwordForm.newPassword} />
                        )}

                        <div className="security-field">
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
                          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Nhập lại mật khẩu mới"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => {
                                setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
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
                              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "var(--border-2)"; }}
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
                              onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; }}
                              onMouseLeave={(e) => { e.target.style.color = "var(--text-secondary)"; }}
                              title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        {passwordError && (
                          <div className="security-message error">❌ {passwordError}</div>
                        )}

                        {passwordSuccess && (
                          <div className="security-message success">✓ Mật khẩu đã được thay đổi thành công</div>
                        )}

                        <div className="security-actions">
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
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquareDiff,
  Users,
  Star,
  Headset,
  LogOut,
  Store,
  Bell,
  Menu
} from "lucide-react";
import {
  ADMIN_ACTIVITY_EVENT,
  formatRelativeTime,
  filterNotificationsWithinHours,
  markAdminActivitiesRead,
  mergeNotifications,
  readAdminActivityLog,
} from "../utils/adminActivity";

/* ════════════════════════════════════════════════════════════════
   AdminHeader.jsx  —  Header + Sidebar dùng chung cho Admin pages
   ════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  {
    to: "/admin",
    label: "Dashboard",
    roles: ["admin"],
    icon: <LayoutDashboard size={18} strokeWidth={2} />,
  },
  {
    to: "/admin/products",
    label: "Sản phẩm",
    roles: ["admin", "staff"],
    icon: <Package size={18} strokeWidth={2} />,
  },
  {
    to: "/admin/orders",
    label: "Đơn hàng",
    roles: ["admin", "staff"],
    icon: <ShoppingCart size={18} strokeWidth={2} />,
  },
  {
    to: "/admin/chat",
    label: "Hỗ trợ chat",
    roles: ["admin", "staff"],
    icon: <MessageSquareDiff size={18} strokeWidth={2} />,
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    roles: ["admin"],
    icon: <Users size={18} strokeWidth={2} />,
  },
  {
    to: "/admin/reviews",
    label: "Đánh giá",
    roles: ["admin"],
    icon: <Star size={18} strokeWidth={2} />,
  },
  {
    to: "/admin/contacts",
    label: "Liên hệ",
    roles: ["admin", "staff"],
    icon: <Headset size={18} strokeWidth={2} />,
  },
];

/* ── Sidebar (desktop) ───────────────────────────────────────── */
export function AdminSidebar({ mobileOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const displayName = user?.name || user?.email || "Admin";
  const roleLabel = isAdmin ? "Admin" : role === "staff" ? "Staff" : "Customer";

  const filteredNavLinks = NAV_LINKS.filter((link) => (link.roles || ["admin"]).includes(role));

  const handleLogout = () => {
    logout();
    onClose?.(); // Close sidebar if on mobile
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* mobile overlay */}
      {mobileOpen && (
        <div className="ah-mobile-overlay" onClick={onClose} />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div className="ah-brand">
          <div className="ah-brand-logo">
            <span className="ah-logo-mark">U</span>
            <div>
              <p className="ah-logo-text">UNIQ<em>TEE</em></p>
              <p className="ah-logo-sub">Admin Panel</p>
            </div>
          </div>
          <button className="ah-sidebar-close" onClick={onClose}>✕</button>
        </div>

        {/* Admin info card */}
        <div className="ah-admin-card">
          <div className="ah-admin-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <p className="ah-admin-name">{displayName}</p>
            <p className="ah-admin-role">{roleLabel}</p>
          </div>
          <span className="ah-online-dot" />
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          <p className="ah-nav-section-label">Menu chính</p>
          {filteredNavLinks.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="admin-nav-icon">{l.icon}</span>
                <span className="ah-nav-label">{l.label}</span>
                {l.badge && <span className="ah-nav-badge">{l.badge}</span>}
                {isActive && <span className="ah-nav-active-dot" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <Link to="/" className="ah-store-link">
            <Store size={14} strokeWidth={2} style={{ marginRight: 6 }} />
            Xem trang cửa hàng
          </Link>
          <button className="ah-logout-btn" onClick={handleLogout}>
            <LogOut size={14} strokeWidth={2} style={{ marginRight: 6 }} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Top Header bar (mobile + breadcrumb + actions) ─────────── */
export function AdminHeader({ title, subtitle, actions, onMenuOpen, notifications = [] }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [activityNotifications, setActivityNotifications] = useState(() => readAdminActivityLog());
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const homePath = role === "staff" ? "/admin/orders" : "/admin";
  const avatarLabel = (user?.name || user?.email || "A").charAt(0).toUpperCase();

  useEffect(() => {
    const syncNotifications = () => {
      setActivityNotifications(readAdminActivityLog());
    };

    syncNotifications();
    window.addEventListener(ADMIN_ACTIVITY_EVENT, syncNotifications);
    window.addEventListener("storage", syncNotifications);

    return () => {
      window.removeEventListener(ADMIN_ACTIVITY_EVENT, syncNotifications);
      window.removeEventListener("storage", syncNotifications);
    };
  }, []);

  const mergedNotifications = mergeNotifications(notifications, activityNotifications);
  const recentNotifications = filterNotificationsWithinHours(mergedNotifications, 24);
  const unreadCount = recentNotifications.filter((notification) => notification.unread !== false).length;
  const visibleNotifications = showAllNotifications
    ? recentNotifications
    : recentNotifications.slice(0, 5);
  const hasMoreNotifications = recentNotifications.length > 5;

  const handleNotifToggle = () => {
    setNotifOpen((current) => {
      if (!current) {
        markAdminActivitiesRead();
      } else {
        setShowAllNotifications(false);
      }

      return !current;
    });
  };

  return (
    <header className="ah-topbar">
      {/* Left: hamburger + breadcrumb */}
      <div className="ah-topbar-left">
        <button className="ah-hamburger" onClick={onMenuOpen} aria-label="Menu">
          <Menu size={20} strokeWidth={2} />
        </button>
        <div className="ah-breadcrumb">
          <Link to={homePath} className="ah-breadcrumb-home">
            <Store size={14} strokeWidth={2} />
          </Link>
          {title && (
            <>
              <span className="ah-breadcrumb-sep">/</span>
              <span className="ah-breadcrumb-current">{title}</span>
            </>
          )}
        </div>
      </div>

      {/* Center: page title (desktop) */}
      <div className="ah-topbar-center">
        <h1 className="ah-page-title">{title}</h1>
        {subtitle && <p className="ah-page-sub">{subtitle}</p>}
      </div>

      {/* Right: actions + notif + avatar */}
      <div className="ah-topbar-right">
        {actions}

        {/* Notification bell */}
        <div className="ah-notif-wrap">
          <button
            className="ah-icon-btn"
            onClick={handleNotifToggle}
            aria-label="Thông báo"
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="ah-notif-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="ah-notif-overlay" onClick={() => setNotifOpen(false)} />
              <div className="ah-notif-dropdown">
                <div className="ah-notif-header">
                  <p className="ah-notif-title">Thông báo</p>
                  <span className="ah-notif-count">{unreadCount} mới</span>
                </div>
                  <div className="ah-notif-list">
                    {visibleNotifications.length > 0 ? visibleNotifications.map((notification) => (
                      <div key={notification.id} className={`ah-notif-item ${notification.unread ? "unread" : ""}`}>
                        <span className="ah-notif-icon">{notification.icon}</span>
                        <div className="ah-notif-body">
                          <p className="ah-notif-text">{notification.text}</p>
                          <p className="ah-notif-time">{formatRelativeTime(notification.createdAt)}</p>
                        </div>
                        {notification.unread && <span className="ah-unread-dot" />}
                      </div>
                    )) : (
                      <div className="ah-notif-item">
                        <div className="ah-notif-body">
                          <p className="ah-notif-text">Chưa có thông báo mới</p>
                          <p className="ah-notif-time">Khi bạn thao tác trong admin, thông báo sẽ xuất hiện ở đây.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {hasMoreNotifications && (
                    <button
                      type="button"
                      className="ah-notif-footer"
                      onClick={() => setShowAllNotifications((current) => !current)}
                    >
                      {showAllNotifications
                        ? "Thu gọn thông báo"
                        : `Xem thêm ${recentNotifications.length - 5} thông báo`}
                    </button>
                  )}
              </div>
            </>
          )}
        </div>

        {/* Admin avatar */}
        <div className="ah-avatar-btn">
          <div className="ah-topbar-avatar">{avatarLabel}</div>
        </div>
      </div>
    </header>
  );
}

/* ── Admin Layout wrapper — dùng thay thế cho admin-page div ── */
export function AdminLayout({ children, title, subtitle, actions, notifications }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // close sidebar on route change
  const location = useLocation();
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="admin-layout">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin-body">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          notifications={notifications}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
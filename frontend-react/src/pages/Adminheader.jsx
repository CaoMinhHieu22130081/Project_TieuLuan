import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    to: "/admin/products",
    label: "Sản phẩm",
    roles: ["admin", "staff"],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: "/admin/orders",
    label: "Đơn hàng",
    roles: ["admin", "staff"],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: "/admin/chat",
    label: "Hỗ trợ chat",
    roles: ["admin", "staff"],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: "/admin/reviews",
    label: "Đánh giá",
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M12 3l2.92 5.92L21 9.84l-4.5 4.39 1.06 6.22L12 17.37l-5.56 3.08 1.06-6.22L3 9.84l6.08-.92L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    to: "/admin/contacts",
    label: "Liên hệ",
    roles: ["admin", "staff"],
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
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
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            Xem trang cửa hàng
          </Link>
          <button className="ah-logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="ah-breadcrumb">
          <Link to={homePath} className="ah-breadcrumb-home">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2"/>
            </svg>
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
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
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
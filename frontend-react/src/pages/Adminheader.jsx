import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

/* ════════════════════════════════════════════════════════════════
   AdminHeader.jsx  —  Header + Sidebar dùng chung cho Admin pages
   ════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  {
    to: "/admin",
    label: "Dashboard",
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
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    badge: 3,
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

/* ── Sidebar (desktop) ───────────────────────────────────────── */
export function AdminSidebar({ mobileOpen, onClose }) {
  const location = useLocation();

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
          <div className="ah-admin-avatar">C</div>
          <div>
            <p className="ah-admin-name">Cao Minh Hiếu</p>
            <p className="ah-admin-role">Super Admin</p>
          </div>
          <span className="ah-online-dot" />
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          <p className="ah-nav-section-label">Menu chính</p>
          {NAV_LINKS.map((l) => {
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
          <button className="ah-logout-btn">
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
export function AdminHeader({ title, subtitle, actions, onMenuOpen }) {
  const [notifOpen, setNotifOpen] = useState(false);

  const NOTIFS = [
    { icon: "🛍️", text: "Đơn hàng #UNQ6L8M2 cần xác nhận",  time: "2 phút trước",  unread: true  },
    { icon: "👤", text: "Người dùng mới đăng ký: Vũ Thanh Long", time: "15 phút trước", unread: true  },
    { icon: "📦", text: "Sản phẩm Stripe Nautical sắp hết hàng", time: "1 giờ trước",  unread: true  },
    { icon: "✅", text: "Đơn hàng #UNQ7F3K2 đã giao thành công", time: "3 giờ trước",  unread: false },
  ];

  const unreadCount = NOTIFS.filter((n) => n.unread).length;

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
          <Link to="/admin" className="ah-breadcrumb-home">
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
            onClick={() => setNotifOpen((v) => !v)}
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
                {NOTIFS.map((n, i) => (
                  <div key={i} className={`ah-notif-item ${n.unread ? "unread" : ""}`}>
                    <span className="ah-notif-icon">{n.icon}</span>
                    <div className="ah-notif-body">
                      <p className="ah-notif-text">{n.text}</p>
                      <p className="ah-notif-time">{n.time}</p>
                    </div>
                    {n.unread && <span className="ah-unread-dot" />}
                  </div>
                ))}
                <div className="ah-notif-footer">Xem tất cả thông báo</div>
              </div>
            </>
          )}
        </div>

        {/* Admin avatar */}
        <div className="ah-avatar-btn">
          <div className="ah-topbar-avatar">C</div>
        </div>
      </div>
    </header>
  );
}

/* ── Admin Layout wrapper — dùng thay thế cho admin-page div ── */
export function AdminLayout({ children, title, subtitle, actions }) {
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
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
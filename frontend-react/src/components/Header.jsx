import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  ShoppingBag,
  User,
  Minus,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SearchBar from './SearchBar';
import '../pages/css/Header.css';

function HeaderSearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  return (
    <>
      <div className="header-search-overlay" onClick={onClose} />
      <div className="header-search-panel">
        <div className="header-search-inner">
           <div className="header-search-top">
             <span className="header-search-label"><Search size={16} style={{ marginRight: 8 }} /> Tìm kiếm</span>
             <button className="header-search-close" onClick={onClose}>
               <X size={20} />
             </button>
           </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Tìm tên sản phẩm, phong cách, màu sắc…"
            onSearch={handleSearch}
            showSuggestions={true}
            autoFocus={true}
            enableAutoSearch={true}
          />
        </div>
      </div>
    </>
  );
}

function MiniCart({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQty } = useCart();
  const navigate = useNavigate();

  const fmt = (p) => p.toLocaleString("vi-VN") + "đ";

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: 70,
          right: 20,
          width: 360,
          maxHeight: 500,
          background: "var(--surface)",
          border: "1px solid var(--border-2)",
          borderRadius: 12,
          zIndex: 999,
          boxShadow: "0 22px 56px rgba(15, 23, 42, 0.16)",
          display: "flex",
          flexDirection: "column",
          animation: "slideDown 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => {}}
        onMouseLeave={onClose}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Giỏ hàng
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 12,
          }}
        >
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>Giỏ hàng trống</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 6,
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {item.color} · {item.size}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        onClick={() =>
                          updateQty(
                            item.cartItemId,
                            Math.max(1, item.qty - 1)
                          )
                        }
                        style={{
                          width: 20,
                          height: 20,
                          border: "1px solid var(--border-2)",
                          background: "var(--surface-2)",
                          color: "var(--text-primary)",
                          borderRadius: 3,
                          cursor: "pointer",
                          fontSize: "0.7rem",
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(item.cartItemId, item.qty + 1)
                        }
                        style={{
                          width: 20,
                          height: 20,
                          border: "1px solid var(--border-2)",
                          background: "var(--surface-2)",
                          color: "var(--text-primary)",
                          borderRadius: 3,
                          cursor: "pointer",
                          fontSize: "0.7rem",
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {fmt(item.price * item.qty)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          padding: 0,
                          marginTop: 2,
                        }}
                      >
                        <Trash2 size={14} style={{ marginRight: 4 }} /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            style={{
              padding: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Tổng cộng:</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {fmt(subtotal)}
              </span>
            </div>
            <button
              onClick={() => {
                navigate("/cart");
                onClose();
              }}
              style={{
                width: "100%",
                padding: 10,
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Xem giỏ hàng
            </button>
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);

  const cartCount = getTotalItems();
  const isProductsPage = location.pathname === '/products';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {searchOpen && <HeaderSearchOverlay onClose={() => setSearchOpen(false)} />}

      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <span className="logo-mark">U</span>
            <span className="logo-text">UNIQ<em>TEE</em></span>
          </a>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="/" className="nav-link">Trang chủ</a>
            <a href="/products" className="nav-link">Sản phẩm</a>
            <a href="/#ai-search" className="nav-link ai-link">
              <span className="pulse-dot" /> Tìm bằng ảnh
            </a>
            <a href="/about" className="nav-link">Giới thiệu</a>
            <a href="/faq" className="nav-link">Hỏi đáp</a>
            <a href="/contact" className="nav-link">Liên hệ</a>
          </nav>

          <div className="nav-actions">
            {!user ? (
              <>
                <a href="/login" className="nav-btn-link nav-btn-login">Đăng nhập</a>
                <a href="/register" className="nav-btn-link nav-btn-register">Đăng ký</a>
              </>
            ) : (
              <button onClick={handleLogout} className="nav-btn-link nav-btn-register">
                Đăng xuất
              </button>
            )}
            {isProductsPage && (
              <button className="nav-icon-btn" aria-label="search" onClick={() => setSearchOpen(true)}>
                <Search size={20} />
              </button>
            )}
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setCartDropdownOpen(true)}
              onMouseLeave={() => setCartDropdownOpen(false)}
            >
              <button
                className="nav-icon-btn"
                onClick={() => navigate('/cart')}
                style={{ textDecoration: "none", position: "relative" }}
                aria-label="cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              {cartDropdownOpen && <MiniCart isOpen={cartDropdownOpen} onClose={() => setCartDropdownOpen(false)} />}
            </div>
            <a href="/profile" className="nav-icon-btn" style={{ textDecoration: "none" }} aria-label="user">
              <User size={20} />
            </a>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
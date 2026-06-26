import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  ShoppingBag,
  User,
  Minus,
  Plus,
  Trash2,
  Globe2,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageContext';
import { headerTranslations, LANGUAGES } from '../i18n/translations';
import { formatCurrency } from '../utils/i18nFormat';
import SearchBar from './SearchBar';
import '../pages/css/Header.css';

function HeaderSearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const copy = headerTranslations.nav;

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
             <span className="header-search-label"><Search size={16} style={{ marginRight: 8 }} /> {t(copy.search)}</span>
             <button className="header-search-close" onClick={onClose}>
               <X size={20} />
             </button>
           </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={t(copy.searchPlaceholder)}
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
  const { language, t } = useLanguage();
  const copy = headerTranslations.nav;

  const fmt = (p) => formatCurrency(p, language);

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
            {t(copy.cart)}
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
              <p style={{ fontSize: "0.9rem", margin: 0 }}>{t(copy.emptyCart)}</p>
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
                        <Trash2 size={14} style={{ marginRight: 4 }} /> {t(copy.remove)}
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
              <span style={{ color: "var(--text-secondary)" }}>{t(copy.subtotal)}</span>
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
              {t(copy.viewCart)}
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
  const { language, currentLanguage, setLanguage, t } = useLanguage();
  const copy = headerTranslations.nav;
  const languageMenuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const cartCount = getTotalItems();
  const isProductsPage = location.pathname === '/products';
  const canSwitchLanguage = !['admin', 'staff'].includes(user?.role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!languageMenuOpen) return undefined;

    const onPointerDown = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [languageMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleLanguageSelect = (nextLanguage) => {
    setLanguage(nextLanguage);
    setLanguageMenuOpen(false);
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
            <a href="/" className="nav-link">{t(copy.home)}</a>
            <a href="/products" className="nav-link">{t(copy.products)}</a>
            <a href="/#ai-search" className="nav-link ai-link">
              <span className="pulse-dot" /> {t(copy.aiSearch)}
            </a>
            <a href="/about" className="nav-link">{t(copy.about)}</a>
            <a href="/faq" className="nav-link">{t(copy.faq)}</a>
            <a href="/contact" className="nav-link">{t(copy.contact)}</a>
          </nav>

          <div className="nav-actions">
            {canSwitchLanguage && (
              <div className="language-menu-wrap" ref={languageMenuRef}>
                <button
                  type="button"
                  className={`language-switcher ${languageMenuOpen ? 'open' : ''}`}
                  onClick={() => setLanguageMenuOpen((open) => !open)}
                  aria-label={t(copy.languageTitle)}
                  aria-haspopup="listbox"
                  aria-expanded={languageMenuOpen}
                  title={t(copy.languageTitle)}
                >
                  <Globe2 size={16} />
                  <span>{currentLanguage.shortLabel}</span>
                  <ChevronDown size={14} className="language-chevron" />
                </button>
                {languageMenuOpen && (
                  <div className="language-dropdown" role="listbox" aria-label={t(copy.languageTitle)}>
                    {Object.values(LANGUAGES).map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={`language-option ${language === option.code ? 'active' : ''}`}
                        role="option"
                        aria-selected={language === option.code}
                        onClick={() => handleLanguageSelect(option.code)}
                      >
                        <span className="language-option-code">{option.shortLabel}</span>
                        <span className="language-option-label">{option.label}</span>
                        {language === option.code && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!user ? (
              <>
                <a href="/login" className="nav-btn-link nav-btn-login">{t(copy.login)}</a>
                <a href="/register" className="nav-btn-link nav-btn-register">{t(copy.register)}</a>
              </>
            ) : (
              <button onClick={handleLogout} className="nav-btn-link nav-btn-register">
                {t(copy.logout)}
              </button>
            )}
            {isProductsPage && (
              <button className="nav-icon-btn" aria-label={t(copy.search)} onClick={() => setSearchOpen(true)}>
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
                aria-label={t(copy.cart)}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              {cartDropdownOpen && <MiniCart isOpen={cartDropdownOpen} onClose={() => setCartDropdownOpen(false)} />}
            </div>
            <a href="/profile" className="nav-icon-btn" style={{ textDecoration: "none" }} aria-label={t({ vi: "Tài khoản", en: "Account" })}>
              <User size={20} />
            </a>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label={t({ vi: "Mở menu", en: "Open menu" })}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';

const SEARCH_HINTS = ["Oversized", "Graphic", "Vintage", "Áo trắng", "Sale"];
const SUGGESTIONS = [
  { id: 1, name: 'Oversized Tee' },
  { id: 2, name: 'Basic White Tee' },
  { id: 3, name: 'Urban Minimal Tee' },
  { id: 4, name: 'Acid Wash Street' },
];

/* ── Inline styles for header (pink theme) ── */
const css = `
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 68px;
    transition: background 0.28s ease, border-color 0.28s ease, backdrop-filter 0.28s ease;
    border-bottom: 1px solid transparent;
  }
  .navbar.scrolled {
    background: rgba(10, 10, 12, 0.88);
    border-color: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 32px;
  }
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    text-decoration: none;
  }
  .logo-mark {
    width: 32px; height: 32px;
    background: var(--accent);
    color: #fff;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-weight: 800; font-size: 1rem;
  }
  .logo-text {
    font-family: var(--font-display);
    font-weight: 800; font-size: 1.05rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-primary);
  }
  .logo-text em { font-style: normal; color: var(--accent); }
  .nav-links {
    display: flex; align-items: center; gap: 4px; margin-left: auto;
  }
  .nav-link {
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: color 0.28s, background 0.28s;
    text-decoration: none;
  }
  .nav-link:hover, .nav-link.active {
    color: var(--text-primary);
    background: rgba(255,255,255,0.05);
  }
  .nav-link.ai-link {
    display: flex; align-items: center; gap: 7px;
    color: var(--accent);
  }
  .nav-link.ai-link:hover { background: var(--accent-dim); color: var(--accent); }
  .pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent);
    animation: pulseDot 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulseDot {
    0%, 100% { opacity:1; transform:scale(1); }
    50% { opacity:0.5; transform:scale(0.7); }
  }
  .nav-actions { display: flex; align-items: center; gap: 6px; }
  .nav-btn-link {
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    font-family: var(--font-body);
    text-decoration: none;
    transition: all 0.28s;
    cursor: pointer;
    border: none;
  }
  .nav-btn-login {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
    color: var(--text-secondary);
  }
  .nav-btn-login:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
  .nav-btn-register {
    background: var(--accent);
    color: #fff;
    border: 1px solid transparent;
  }
  .nav-btn-register:hover { background: var(--accent-2); box-shadow: 0 0 16px rgba(var(--accent-rgb),0.4); }
  .nav-icon-btn {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px;
    color: var(--text-secondary);
    transition: color 0.28s, background 0.28s;
    position: relative;
    background: none; border: none; cursor: pointer;
  }
  .nav-icon-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.07); }
  .cart-badge {
    position: absolute; top: 4px; right: 4px;
    min-width: 16px; height: 16px;
    padding: 0 4px;
    background: var(--accent); color: #fff;
    border-radius: 8px; font-size: 0.6rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono);
  }
  .hamburger {
    display: none; flex-direction: column; gap: 5px; padding: 8px;
    width: 38px; height: 38px; align-items: center; justify-content: center;
    border-radius: 10px; transition: background 0.28s;
    background: none; border: none; cursor: pointer;
  }
  .hamburger:hover { background: rgba(255,255,255,0.07); }
  .hamburger span {
    display: block; width: 18px; height: 2px;
    background: var(--text-secondary); border-radius: 2px;
  }
  .header-search-overlay {
    position: fixed; inset: 0; z-index: 900;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    animation: fadeOverlay 0.2s ease;
  }
  @keyframes fadeOverlay { from {opacity:0} to {opacity:1} }
  .header-search-panel {
    position: fixed; top: 0; left: 0; right: 0; z-index: 901;
    background: rgba(18,18,22,0.97);
    border-bottom: 1px solid rgba(255,255,255,0.14);
    backdrop-filter: blur(24px);
    padding: 18px 24px 22px;
    animation: slidePanel 0.22s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
  }
  @keyframes slidePanel {
    from { opacity:0; transform:translateY(-16px); }
    to { opacity:1; transform:translateY(0); }
  }
  .header-search-inner {
    max-width: 680px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 14px;
  }
  .header-search-top {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .header-search-label {
    font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--accent); font-family: var(--font-mono);
  }
  .header-search-close {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-secondary); cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .header-search-close:hover {
    background: rgba(255,95,163,0.1);
    color: var(--accent);
    border-color: rgba(255,95,163,0.3);
  }
  .header-search-hint { display: flex; gap: 8px; flex-wrap: wrap; }
  .search-hint-tag {
    font-size: 0.75rem; padding: 4px 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--text-muted); cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    font-family: var(--font-body); background: none;
  }
  .search-hint-tag:hover {
    background: rgba(255,95,163,0.08);
    border-color: rgba(255,95,163,0.25);
    color: var(--accent);
  }
  @media (max-width: 768px) {
    .nav-links {
      display: none; position: fixed;
      top: 68px; left: 0; right: 0;
      flex-direction: column; padding: 24px;
      background: var(--bg-2);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      gap: 4px; align-items: stretch;
    }
    .nav-links.open { display: flex; }
    .hamburger { display: flex; }
    .nav-btn-login, .nav-btn-register { display: none; }
  }
`;

function HeaderSearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="header-search-overlay" onClick={onClose} />
      <div className="header-search-panel">
        <div className="header-search-inner">
          <div className="header-search-top">
            <span className="header-search-label">🔍 Tìm kiếm</span>
            <button className="header-search-close" onClick={onClose}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Tìm tên sản phẩm, phong cách, màu sắc…"
            suggestions={SUGGESTIONS}
            onSearch={(val) => { setQuery(val); onClose(); }}
            showSuggestions={true}
            autoFocus={true}
          />
          <div className="header-search-hint">
            {SEARCH_HINTS.map((hint) => (
              <button key={hint} className="search-hint-tag" onClick={() => setQuery(hint)}>
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Header({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{css}</style>
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
            <a href="/#categories" className="nav-link">Danh mục</a>
            <a href="/profile" className="nav-link">Tài khoản</a>
          </nav>

          <div className="nav-actions">
            <a href="/login" className="nav-btn-link nav-btn-login">Đăng nhập</a>
            <a href="/register" className="nav-btn-link nav-btn-register">Đăng ký</a>
            <button className="nav-icon-btn" aria-label="search" onClick={() => setSearchOpen(true)}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <a href="/cart" className="nav-icon-btn" style={{ textDecoration: "none" }} aria-label="cart">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </a>
            <a href="/profile" className="nav-icon-btn" style={{ textDecoration: "none" }} aria-label="user">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
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
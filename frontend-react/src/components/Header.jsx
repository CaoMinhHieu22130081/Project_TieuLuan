import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import '../pages/css/Header.css';

const SEARCH_HINTS = ["Oversized", "Graphic", "Vintage", "Áo trắng", "Sale"];
const SUGGESTIONS = [
  { id: 1, name: 'Oversized Tee' },
  { id: 2, name: 'Basic White Tee' },
  { id: 3, name: 'Urban Minimal Tee' },
  { id: 4, name: 'Acid Wash Street' },
];

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
            <a href="/#categories" className="nav-link">Danh mục</a>
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
import React, { useState, useRef, useEffect } from 'react';
import { productAPI } from '../services/api';
import '../pages/css/SearchBar.css';

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="suggestion-mark">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SearchBar({
  value = '',
  onChange,
  placeholder = 'Tìm kiếm sản phẩm…',
  suggestions = [],
  onSearch,
  showSuggestions = true,
  autoFocus = false,
  enableAutoSearch = false, // Nếu true, sẽ gọi API search thay vì dùng suggestions
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Use API results nếu enableAutoSearch, không thì dùng suggestions
  const filtered = enableAutoSearch ? searchResults : (
    value.trim().length > 0
      ? suggestions.filter((s) =>
          s.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 6)
      : []
  );

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Auto search khi enableAutoSearch = true
  useEffect(() => {
    if (!enableAutoSearch || !value.trim()) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await productAPI.searchProducts(value);
        setSearchResults(Array.isArray(results) ? results.slice(0, 6) : []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, enableAutoSearch]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    setOpen(val.trim().length > 0);
  };

  const handleSelect = (name) => {
    if (onChange) onChange(name);
    setOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpen(false);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    if (onChange) onChange('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const formatPrice = (p) => p.toLocaleString('vi-VN') + 'đ';

  return (
    <div className={`searchbar-wrap ${focused ? 'focused' : ''}`} ref={wrapRef}>
      <form className="searchbar-form" onSubmit={handleSubmit}>
        <span className="searchbar-icon">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => { setFocused(true); if (value.trim()) setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Tìm kiếm sản phẩm"
          className="searchbar-input"
        />

        {value && (
          <button
            type="button"
            className="searchbar-clear"
            onClick={handleClear}
            aria-label="Xoá tìm kiếm"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </form>

      {open && showSuggestions && filtered.length > 0 && (
        <ul className="searchbar-dropdown" role="listbox">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="searchbar-suggestion"
              role="option"
              onMouseDown={() => handleSelect(item.name)}
            >
              {(item.image || item.images?.[0]?.url) && (
                <img 
                  src={item.image || item.images?.[0]?.url} 
                  alt={item.name} 
                  className="suggestion-img" 
                />
              )}
              <div className="suggestion-info">
                <span className="suggestion-name">
                  {highlightMatch(item.name, value)}
                </span>
                {item.price != null && (
                  <span className="suggestion-price">{formatPrice(item.price)}</span>
                )}
              </div>
              <span className="suggestion-arrow">→</span>
            </li>
          ))}

          <li className="searchbar-footer" onMouseDown={handleSubmit}>
            <span>🔍</span>
            <span>Tìm tất cả kết quả cho "<strong>{value}</strong>"</span>
            {searching && <span className="search-loading">⏳</span>}
          </li>
        </ul>
      )}

      {open && showSuggestions && value.trim().length > 0 && filtered.length === 0 && (
        <div className="searchbar-empty">
          <span>{searching ? '⏳' : '😔'}</span>
          <p>{searching ? 'Đang tìm kiếm...' : `Không tìm thấy sản phẩm nào cho "${value}"`}</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
import React, { useState, useRef, useEffect } from 'react';
import { productAPI } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { formatCurrency } from '../utils/i18nFormat';
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
  placeholder,
  suggestions = [],
  onSearch,
  showSuggestions = true,
  autoFocus = false,
  enableAutoSearch = false, // Nếu true, sẽ gọi API search thay vì dùng suggestions
}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onSearchRef = useRef(onSearch);

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
    onChangeRef.current = onChange;
    onSearchRef.current = onSearch;
  }, [onChange, onSearch]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (!transcript) return;

      if (onChangeRef.current) onChangeRef.current(transcript);
      setOpen(true);

      const isFinal = Array.from(event.results).some((result) => result.isFinal);
      if (isFinal && onSearchRef.current) {
        setOpen(false);
        onSearchRef.current(transcript);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language]);

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

  const handleVoiceToggle = () => {
    if (!speechSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      return;
    }

    try {
      inputRef.current?.focus();
      recognition.start();
    } catch (error) {
      console.warn('Voice search start failed:', error);
    }
  };

  const resolvedPlaceholder = placeholder || t({ vi: "Tìm kiếm sản phẩm...", en: "Search products..." });
  const formatPrice = (p) => formatCurrency(p, language);

  const hasClear = Boolean(value);
  const voiceTitle = !speechSupported
    ? t({ vi: "Trình duyệt không hỗ trợ tìm kiếm bằng giọng nói", en: "Your browser does not support voice search" })
    : listening
      ? t({ vi: "Dừng ghi âm", en: "Stop recording" })
      : t({ vi: "Tìm kiếm bằng giọng nói", en: "Voice search" });

  return (
    <div className={`searchbar-wrap ${focused ? 'focused' : ''}`} ref={wrapRef}>
      <form className={`searchbar-form ${hasClear ? 'has-clear' : ''}`} onSubmit={handleSubmit}>
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
          placeholder={resolvedPlaceholder}
          autoComplete="off"
          aria-label={t({ vi: "Tìm kiếm sản phẩm", en: "Search products" })}
          className="searchbar-input"
        />

        <button
          type="button"
          className={`searchbar-voice ${listening ? 'listening' : ''}`}
          onClick={handleVoiceToggle}
          aria-label={voiceTitle}
          aria-pressed={listening}
          disabled={!speechSupported}
          title={voiceTitle}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {value && (
          <button
            type="button"
            className="searchbar-clear"
            onClick={handleClear}
            aria-label={t({ vi: "Xóa tìm kiếm", en: "Clear search" })}
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
            <span>{t({ vi: "Tìm tất cả kết quả cho", en: "Search all results for" })} "<strong>{value}</strong>"</span>
            {searching && <span className="search-loading">⏳</span>}
          </li>
        </ul>
      )}

      {open && showSuggestions && value.trim().length > 0 && filtered.length === 0 && (
        <div className="searchbar-empty">
          <span>{searching ? '⏳' : '😔'}</span>
          <p>
            {searching
              ? t({ vi: "Đang tìm kiếm...", en: "Searching..." })
              : t({ vi: `Không tìm thấy sản phẩm nào cho "${value}"`, en: `No products found for "${value}"` })}
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;

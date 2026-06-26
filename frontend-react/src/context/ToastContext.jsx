import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const ToastContext = createContext();

const TOAST_LIMIT = 5;

const TOAST_STYLES = {
  success: { background: '#047857', icon: 'OK' },
  error: { background: '#dc2626', icon: '!' },
  info: { background: '#2563eb', icon: 'i' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const nextIdRef = useRef(1);

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    if (!message) return null;

    const id = `${Date.now()}-${nextIdRef.current}`;
    nextIdRef.current += 1;

    setToasts((prev) => [...prev, { id, message, type }].slice(-TOAST_LIMIT));

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
  }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);
  const { t } = useLanguage();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 'min(360px, calc(100vw - 32px))',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

        return (
          <div
            key={toast.id}
            role="status"
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: style.background,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              animation: 'slideInRight 0.3s ease-out',
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.7)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                lineHeight: 1,
              }}
            >
              {style.icon}
            </span>
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{t(toast.message)}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label={t({ vi: "Đóng thông báo", en: "Close notification" })}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 2px',
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

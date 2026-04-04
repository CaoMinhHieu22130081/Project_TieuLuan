import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm lấy storage key theo user
  const getStorageKey = () => {
    if (user?.id) {
      return `wishlist_${user.id}`;
    }
    return null; // Không lưu nếu chưa đăng nhập
  };

  // Load wishlist từ localStorage khi component mount hoặc user thay đổi
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setWishlist(JSON.parse(saved));
        } else {
          setWishlist([]);
        }
      } else {
        // Nếu chưa đăng nhập, xóa wishlist (session only)
        setWishlist([]);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Save wishlist vào localStorage khi thay đổi (chỉ cho user đã đăng nhập)
  useEffect(() => {
    if (!loading) {
      try {
        const storageKey = getStorageKey();
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(wishlist));
        }
        // Nếu không có storageKey, không lưu vào localStorage
      } catch (err) {
        console.error('Failed to save wishlist:', err);
      }
    }
  }, [wishlist, loading, user?.id]);

  // Thêm sản phẩm vào wishlist
  const addToWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });
  };

  // Xóa sản phẩm khỏi wishlist
  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  };

  // Toggle wishlist
  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  // Kiểm tra sản phẩm có trong wishlist không
  const isInWishlist = (productId) => {
    return wishlist.some((p) => p.id === productId);
  };

  // Clear wishlist
  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}

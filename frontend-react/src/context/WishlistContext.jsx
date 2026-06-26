import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';

const WishlistContext = createContext();

const normalizeWishlistItem = (item) => {
  const product = item?.product || item;
  if (!product?.id) return null;
  return product;
};

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const authenticated = isAuthenticated();
  const userId = user?.id;
  const wishlistScope = authenticated && userId ? `user:${userId}` : 'guest';
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  // Load wishlist từ Database khi component mount hoặc user thay đổi
  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const fetchWishlist = async () => {
      setLoading(true);
      if (authenticated && userId) {
        try {
          const savedWishlist = await wishlistAPI.getUserWishlist(userId);
          if (!cancelled && requestIdRef.current === requestId && wishlistScope === `user:${userId}`) {
            setWishlist((Array.isArray(savedWishlist) ? savedWishlist : [])
              .map(normalizeWishlistItem)
              .filter(Boolean));
          }
        } catch (err) {
          console.error('Failed to load wishlist from DB:', err);
          if (!cancelled && requestIdRef.current === requestId) setWishlist([]);
        }
      } else {
        if (!cancelled && requestIdRef.current === requestId && wishlistScope === 'guest') {
          setWishlist([]);
        }
      }
      if (!cancelled && requestIdRef.current === requestId) setLoading(false);
    };

    fetchWishlist();
    
    return () => {
      cancelled = true;
    };
  }, [authenticated, userId, wishlistScope]);

  // Thêm sản phẩm vào wishlist
  const addToWishlist = useCallback(async (product) => {
    if (!product?.id || !authenticated || !userId) return;
    
    // Optimistic update
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });

    try {
      await wishlistAPI.addToWishlist(userId, product.id);
    } catch (err) {
      console.error('Failed to save wishlist item to DB:', err);
      setWishlist((prev) => prev.filter((p) => p.id !== product.id));
    }
  }, [authenticated, userId]);

  // Xóa sản phẩm khỏi wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    if (!productId || !authenticated || !userId) return;
    const numericProductId = Number(productId);
    const previousWishlist = wishlist;

    setWishlist((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    
    try {
      await wishlistAPI.removeFromWishlist(userId, Number.isFinite(numericProductId) ? numericProductId : productId);
    } catch (err) {
      console.error('Failed to remove wishlist item from DB:', err);
      setWishlist(previousWishlist);
    }
  }, [authenticated, userId, wishlist]);

  // Kiểm tra sản phẩm có trong wishlist không
  const isInWishlist = useCallback((productId) => {
    return wishlist.some((p) => String(p.id) === String(productId));
  }, [wishlist]);

  // Toggle wishlist
  const toggleWishlist = useCallback((product) => {
    if (!product?.id) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }, [addToWishlist, isInWishlist, removeFromWishlist]);

  // Clear wishlist
  const clearWishlist = useCallback(async () => {
    if (!authenticated || !userId) {
      setWishlist([]);
      return;
    }
    const previousWishlist = wishlist;
    setWishlist([]);
    try {
      await wishlistAPI.clearWishlist(userId);
    } catch (err) {
      console.error('Failed to clear wishlist in DB:', err);
      setWishlist(previousWishlist);
    }
  }, [authenticated, userId, wishlist]);

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

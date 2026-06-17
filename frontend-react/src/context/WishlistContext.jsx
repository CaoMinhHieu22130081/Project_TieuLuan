import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist từ Database khi component mount hoặc user thay đổi
  useEffect(() => {
    let isMounted = true;
    const fetchWishlist = async () => {
      setLoading(true);
      if (isAuthenticated() && user?.id) {
        try {
          // wishlist data from backend has shapes { id, userId, productId, product }
          // Or we might just receive [{productId: 1, product: {id: 1, name: '...'}}] 
          // So let's map it back to just an array of products for the frontend
          const savedWishlist = await wishlistAPI.getUserWishlist(user.id);
          if (isMounted) {
             // Assuming the backend returns list of Wishlist entity, which includes the product object
             setWishlist(savedWishlist.map(w => w.product || w).filter(Boolean));
          }
        } catch (err) {
          console.error('Failed to load wishlist from DB:', err);
          if (isMounted) setWishlist([]);
        }
      } else {
        if (isMounted) setWishlist([]);
      }
      if (isMounted) setLoading(false);
    };

    fetchWishlist();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, isAuthenticated]);

  // Thêm sản phẩm vào wishlist
  const addToWishlist = async (product) => {
    if (!product || !product.id) return;
    
    // Optimistic update
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });

    if (isAuthenticated() && user?.id) {
      try {
        await wishlistAPI.addToWishlist(user.id, product.id);
      } catch (err) {
        console.error('Failed to save wishlist item to DB:', err);
        // Rollback on failure could be implemented here
      }
    }
  };

  // Xóa sản phẩm khỏi wishlist
  const removeFromWishlist = async (productId) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
    
    if (isAuthenticated() && user?.id) {
      try {
        await wishlistAPI.removeFromWishlist(user.id, productId);
      } catch (err) {
        console.error('Failed to remove wishlist item from DB:', err);
      }
    }
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
  const clearWishlist = async () => {
    setWishlist([]);
    if (isAuthenticated() && user?.id) {
      try {
        await wishlistAPI.clearWishlist(user.id);
      } catch (err) {
        console.error('Failed to clear wishlist in DB:', err);
      }
    }
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

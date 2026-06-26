import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';

const CartContext = createContext();

const GUEST_CART_KEY = 'guestCart';

// Khởi tạo BroadcastChannel để đồng bộ giữa các tab
const cartChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cart_sync_channel') : null;

const readGuestCart = () => {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read guest cart:', error);
    localStorage.removeItem(GUEST_CART_KEY);
    return [];
  }
};

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const authenticated = isAuthenticated();
  const authCartScope = authenticated && user?.id ? `user:${user.id}` : 'guest';
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tránh vòng lặp gọi lại fetch do broadcast message
  const triggerBroadcast = useRef(false);
  const previousCartScopeRef = useRef(authCartScope);
  const cartRequestIdRef = useRef(0);
  const skipNextGuestPersistRef = useRef(false);

  // Tạo unique ID cho guest cart item (product id + color + size)
  const generateCartItemId = (productId, colorObj, size) => {
    return `guest-${productId}-${colorObj?.hex || 'default'}-${size || 'default'}`;
  };

  // Convert DB item to common format
  const normalizeDbCartItem = (dbItem) => {
    const product = dbItem.product;
    if (!product) return null;
    return {
      cartItemId: dbItem.id, // Id của row database
      productId: product.id,
      sku: product.sku || '',
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images && product.images.length > 0 ? product.images[0].url : product.image,
      color: dbItem.color || 'Mặc định',
      colorHex: dbItem.colorHex || '#1a1a1a',
      size: dbItem.size || 'Mặc định',
      qty: dbItem.qty,
    };
  };

  const notifyOtherTabs = useCallback(() => {
    if (cartChannel && authenticated && user?.id) {
      cartChannel.postMessage({ type: 'SYNC_CART', userId: user.id });
    }
  }, [authenticated, user?.id]);

  const loadBackendCart = useCallback(async (isBackgroundSync = false, targetUserId = user?.id, requestId = cartRequestIdRef.current) => {
    if (!targetUserId) return;
    if (!isBackgroundSync) setLoading(true);
    
    try {
      const dbCart = await cartAPI.getUserCart(targetUserId);
      const normalized = dbCart.map(normalizeDbCartItem).filter(Boolean);
      if (cartRequestIdRef.current === requestId && authCartScope === `user:${targetUserId}`) {
        setCart(normalized);
      }
    } catch (err) {
      console.error('Failed to load DB cart:', err);
      // Nếu load lỗi, có thể thử load local storage để fallback hoặc để trống
    } finally {
      if (!isBackgroundSync && cartRequestIdRef.current === requestId) setLoading(false);
    }
  }, [authCartScope, user?.id]);

  // Handle cross-tab messages
  useEffect(() => {
    if (!cartChannel) return;
    const handleMessage = (event) => {
      if (event.data?.type === 'SYNC_CART' && authenticated && event.data.userId === user?.id) {
        // Tab khác vừa thay đổi cart, fetch lại từ DB
        loadBackendCart(true);
      }
    };
    cartChannel.addEventListener('message', handleMessage);
    return () => cartChannel.removeEventListener('message', handleMessage);
  }, [authenticated, user?.id, loadBackendCart]);

  useEffect(() => {
    const previousScope = previousCartScopeRef.current;
    if (previousScope !== authCartScope) {
      cartRequestIdRef.current += 1;
      setCart([]);
      setLoading(true);
    }

    if (previousScope.startsWith('user:') && authCartScope === 'guest') {
      skipNextGuestPersistRef.current = true;
      localStorage.removeItem(GUEST_CART_KEY);
      setLoading(false);
    }
    previousCartScopeRef.current = authCartScope;
  }, [authCartScope]);

  // Load cart khi mount hoặc Auth state thay đổi
  useEffect(() => {
    let cancelled = false;
    const requestId = cartRequestIdRef.current + 1;
    cartRequestIdRef.current = requestId;

    const fetchAndMergeCart = async () => {
      setLoading(true);
      if (authenticated && user?.id) {
        try {
          // Xem thử guestCart có gì không, nếu có merge lên server 1 lần
          const guestItems = readGuestCart();
          if (guestItems.length > 0) {
            const mergePayload = guestItems.map(item => ({
              productId: item.productId,
              color: item.color,
              colorHex: item.colorHex,
              size: item.size,
              qty: item.qty
            }));
            await cartAPI.mergeCart(mergePayload);
            if (cancelled || cartRequestIdRef.current !== requestId) return;
            // Merge xong thì xóa guest cart cũ
            localStorage.removeItem(GUEST_CART_KEY);
          }
          await loadBackendCart(false, user.id, requestId);
        } catch (error) {
           console.error("Cart init error", error);
           if (!cancelled && cartRequestIdRef.current === requestId) setLoading(false);
        }
      } else {
        // Chưa đăng nhập -> Load guest cart
        if (!cancelled && cartRequestIdRef.current === requestId && authCartScope === 'guest') {
          setCart(readGuestCart());
          setLoading(false);
        }
      }
    };
    fetchAndMergeCart();
    return () => {
      cancelled = true;
    };
  }, [authenticated, authCartScope, user?.id, loadBackendCart]);

  // Save guest cart vào localStorage nếu chưa đăng nhập
  useEffect(() => {
    if (!loading && !authenticated) {
      if (skipNextGuestPersistRef.current) {
        skipNextGuestPersistRef.current = false;
        return;
      }
      try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to save guest cart:', err);
      }
    }
  }, [authenticated, cart, loading]);

  // Add to Cart
  const addToCart = async (product, color, size, qty = 1) => {
    if (authenticated && user?.id) {
      // API call
      try {
        const payload = {
          userId: user.id,
          productId: product.id,
          color: color?.name || 'Mặc định',
          colorHex: color?.hex || '#1a1a1a',
          size: size || 'Mặc định',
          qty
        };
        await cartAPI.addToCart(payload);
        triggerBroadcast.current = true;
        await loadBackendCart(true);
        notifyOtherTabs();
      } catch (err) {
        console.error("Add to cart error:", err);
      }
    } else {
      // Guest mode
      setCart((prev) => {
        const cartItemId = generateCartItemId(product.id, color, size);
        const existingItem = prev.find((item) => item.cartItemId === cartItemId);
        if (existingItem) {
          return prev.map((item) =>
            item.cartItemId === cartItemId ? { ...item, qty: item.qty + qty } : item
          );
        } else {
          return [...prev, {
            cartItemId,
            productId: product.id,
            sku: product.sku || '',
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.images && product.images.length > 0 ? product.images[0].url : product.image,
            color: color?.name || 'Mặc định',
            colorHex: color?.hex || '#1a1a1a',
            size: size || 'Mặc định',
            qty,
          }];
        }
      });
    }
  };

  // Remove from Cart
  const removeFromCart = async (cartItemId) => {
    const isGuestId = String(cartItemId).startsWith('guest-');
    if (authenticated && !isGuestId) { // cartItemId là DB id
      try {
        await cartAPI.removeFromCart(cartItemId);
        setCart(prev => prev.filter(c => c.cartItemId != cartItemId));
        notifyOtherTabs();
      } catch (err) {
        console.error("Remove err:", err);
      }
    } else {
      // Guest mode string ID
      setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    }
  };

  // Update Qty
  const updateQty = async (cartItemId, qty) => {
    if (qty <= 0) {
      return removeFromCart(cartItemId);
    }
    
    const isGuestId = String(cartItemId).startsWith('guest-');
    if (authenticated && !isGuestId) {
      try {
        await cartAPI.updateQty(cartItemId, qty);
        // Optimistic
        setCart(prev => prev.map(c => c.cartItemId == cartItemId ? { ...c, qty } : c));
        notifyOtherTabs();
      } catch (err) {
        console.error("Update qty err:", err);
        // Fetch to sync if fail
        loadBackendCart(true); 
      }
    } else {
      // Guest mode
      setCart((prev) => prev.map((item) => item.cartItemId === cartItemId ? { ...item, qty } : item));
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (authenticated && user?.id) {
      try {
        await cartAPI.clearCart(user.id);
        setCart([]);
        notifyOtherTabs();
      } catch (err) {
        console.error("Clear err:", err);
      }
    } else {
      setCart([]);
      localStorage.removeItem(GUEST_CART_KEY);
    }
  };

  // Tổng SL
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.qty, 0);

  // Tổng $
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

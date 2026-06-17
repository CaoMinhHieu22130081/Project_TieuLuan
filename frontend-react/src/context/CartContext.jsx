import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';

const CartContext = createContext();

const GUEST_CART_KEY = 'guestCart';

// Khởi tạo BroadcastChannel để đồng bộ giữa các tab
const cartChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cart_sync_channel') : null;

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tránh vòng lặp gọi lại fetch do broadcast message
  const triggerBroadcast = useRef(false);

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
    if (cartChannel && isAuthenticated()) {
      cartChannel.postMessage({ type: 'SYNC_CART', userId: user.id });
    }
  }, [user, isAuthenticated]);

  const loadBackendCart = useCallback(async (isBackgroundSync = false) => {
    if (!user?.id) return;
    if (!isBackgroundSync) setLoading(true);
    
    try {
      const dbCart = await cartAPI.getUserCart(user.id);
      const normalized = dbCart.map(normalizeDbCartItem).filter(Boolean);
      setCart(normalized);
    } catch (err) {
      console.error('Failed to load DB cart:', err);
      // Nếu load lỗi, có thể thử load local storage để fallback hoặc để trống
    } finally {
      if (!isBackgroundSync) setLoading(false);
    }
  }, [user?.id]);

  // Handle cross-tab messages
  useEffect(() => {
    if (!cartChannel) return;
    const handleMessage = (event) => {
      if (event.data?.type === 'SYNC_CART' && isAuthenticated() && event.data.userId === user?.id) {
        // Tab khác vừa thay đổi cart, fetch lại từ DB
        loadBackendCart(true);
      }
    };
    cartChannel.addEventListener('message', handleMessage);
    return () => cartChannel.removeEventListener('message', handleMessage);
  }, [isAuthenticated, user?.id, loadBackendCart]);

  // Load cart khi mount hoặc Auth state thay đổi
  useEffect(() => {
    const fetchAndMergeCart = async () => {
      setLoading(true);
      if (isAuthenticated() && user?.id) {
        try {
          // Xem thử guestCart có gì không, nếu có merge lên server 1 lần
          const guestSaved = localStorage.getItem(GUEST_CART_KEY);
          if (guestSaved) {
            const guestItems = JSON.parse(guestSaved);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              const mergePayload = guestItems.map(item => ({
                productId: item.productId,
                color: item.color,
                colorHex: item.colorHex,
                size: item.size,
                qty: item.qty
              }));
              await cartAPI.mergeCart(mergePayload);
              // Merge xong thì xóa guest cart cũ
              localStorage.removeItem(GUEST_CART_KEY);
            }
          }
          await loadBackendCart();
        } catch (error) {
           console.error("Cart init error", error);
           setLoading(false);
        }
      } else {
        // Chưa đăng nhập -> Load guest cart
        const savedGuestCart = localStorage.getItem(GUEST_CART_KEY);
        setCart(savedGuestCart ? JSON.parse(savedGuestCart) : []);
        setLoading(false);
      }
    };
    fetchAndMergeCart();
  }, [isAuthenticated, user?.id, loadBackendCart]);

  // Save guest cart vào localStorage nếu chưa đăng nhập
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to save guest cart:', err);
      }
    }
  }, [cart, loading, isAuthenticated]);

  // Add to Cart
  const addToCart = async (product, color, size, qty = 1) => {
    if (isAuthenticated() && user?.id) {
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
    if (isAuthenticated() && !isGuestId) { // cartItemId là DB id
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
    if (isAuthenticated() && !isGuestId) {
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
    if (isAuthenticated() && user?.id) {
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

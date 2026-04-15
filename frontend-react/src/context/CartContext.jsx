import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'guestCart';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tạo storage key dựa trên user ID
  const getStorageKey = () => {
    if (user && user.id) {
      return `cart_${user.id}`;
    }
    return GUEST_CART_KEY;
  };

  const mergeCartItems = (primaryCart, secondaryCart) => {
    const merged = [...primaryCart];

    secondaryCart.forEach((incomingItem) => {
      const existingItemIndex = merged.findIndex((item) => item.cartItemId === incomingItem.cartItemId);
      if (existingItemIndex >= 0) {
        merged[existingItemIndex] = {
          ...merged[existingItemIndex],
          qty: merged[existingItemIndex].qty + incomingItem.qty,
        };
      } else {
        merged.push(incomingItem);
      }
    });

    return merged;
  };

  // Load cart từ localStorage khi component mount hoặc user thay đổi
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      if (user && user.id) {
        // User đã đăng nhập - gộp giỏ khách với giỏ đã lưu của user
        const savedUserCart = localStorage.getItem(storageKey);
        const savedGuestCart = localStorage.getItem(GUEST_CART_KEY);
        const userCart = savedUserCart ? JSON.parse(savedUserCart) : [];
        const guestCart = savedGuestCart ? JSON.parse(savedGuestCart) : [];
        const mergedCart = mergeCartItems(userCart, guestCart);
        setCart(mergedCart);
        localStorage.setItem(storageKey, JSON.stringify(mergedCart));
        localStorage.removeItem(GUEST_CART_KEY);
      } else {
        // Chưa đăng nhập - tiếp tục dùng giỏ khách
        const savedGuestCart = localStorage.getItem(storageKey);
        setCart(savedGuestCart ? JSON.parse(savedGuestCart) : []);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save cart vào localStorage khi thay đổi
  useEffect(() => {
    if (!loading) {
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to save cart:', err);
      }
    }
  }, [cart, loading, user]);

  // Tạo unique ID cho cart item (product id + color + size)
  const generateCartItemId = (productId, color, size) => {
    return `${productId}-${color?.hex || 'default'}-${size || 'default'}`;
  };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product, color, size, qty = 1) => {
    setCart((prev) => {
      const cartItemId = generateCartItemId(product.id, color, size);
      const existingItem = prev.find((item) => item.cartItemId === cartItemId);

      if (existingItem) {
        // Nếu sản phẩm này đã có trong giỏ, tăng số lượng
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        // Thêm sản phẩm mới
        return [
          ...prev,
          {
            cartItemId,
            productId: product.id,
            sku: product.sku || '',
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.images && product.images.length > 0 
              ? product.images[0].url 
              : product.image,
            color: color?.name || 'Mặc định',
            colorHex: color?.hex || '#1a1a1a',
            size: size || 'Mặc định',
            qty,
          },
        ];
      }
    });
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Cập nhật số lượng
  const updateQty = (cartItemId, qty) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, qty } : item
        )
      );
    }
  };

  // Clear giỏ hàng
  const clearCart = () => {
    setCart([]);
  };

  // Lấy tổng số sản phẩm trong giỏ
  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  };

  // Lấy tổng giá
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  };

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

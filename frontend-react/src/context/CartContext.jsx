import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tạo storage key dựa trên user ID
  const getStorageKey = () => {
    if (user && user.id) {
      return `cart_${user.id}`;
    }
    return null; // Không lưu localStorage nếu chưa đăng nhập
  };

  // Load cart từ localStorage khi component mount hoặc user thay đổi
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      if (storageKey) {
        // User đã đăng nhập - load cart của user này
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setCart(JSON.parse(saved));
        } else {
          setCart([]);
        }
      } else {
        // Chưa đăng nhập - reset giỏ hàng (session only)
        setCart([]);
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
        if (storageKey) {
          // User đã đăng nhập - lưu vào localStorage với key theo user
          localStorage.setItem(storageKey, JSON.stringify(cart));
        }
        // Nếu chưa đăng nhập, không lưu vào localStorage
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

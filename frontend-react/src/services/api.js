// API service for communicating with Spring Boot backend

const API_BASE_URL = 'http://localhost:8080/api';

// ============ AUTH UTILITIES ============

/**
 * Lưu token vào localStorage
 */
export const saveToken = (token) => {
  localStorage.setItem('authToken', token);
};

/**
 * Lấy token từ localStorage
 */
export const getToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Xóa token khỏi localStorage (logout)
 */
export const removeToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userData');
  localStorage.removeItem('user'); // Remove old key if exists
};

/**
 * Lấy headers với token nếu có
 */
const getAuthHeaders = (includeContentType = true) => {
  const headers = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const requestJson = async (url, options = {}, fallbackMessage = 'Request failed') => {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || fallbackMessage;
    } catch (parseError) {
      try {
        const text = await response.text();
        message = text || fallbackMessage;
      } catch (textError) {
        message = fallbackMessage;
      }
    }

    if (response.status === 423) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.assign('/login?reason=locked');
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
};

// ============ PRODUCTS API ============

export const productAPI = {
  // Get all products
  getAllProducts: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/products`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch products');
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      return await requestJson(`${API_BASE_URL}/products/${id}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch product');
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (category) => {
    try {
      return await requestJson(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch products');
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (keyword) => {
    try {
      return await requestJson(`${API_BASE_URL}/products/search?keyword=${encodeURIComponent(keyword)}`, {
        headers: getAuthHeaders(),
      }, 'Failed to search products');
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Create new product (Admin only)
  createProduct: async (productData) => {
    try {
      return await requestJson(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      }, 'Failed to create product');
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product (Admin only)
  updateProduct: async (id, productData) => {
    try {
      return await requestJson(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      }, 'Failed to update product');
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product (Admin only)
  deleteProduct: async (id) => {
    try {
      await requestJson(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }, 'Failed to delete product');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};

export const aiAPI = {
  searchProductsByImage: async (file, limit = 5, type = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('limit', String(limit));
      if (type) {
        formData.append('type', type);
      }

      return await requestJson(`${API_BASE_URL}/ai/image-search`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
      }, 'Failed to search products by image');
    } catch (error) {
      console.error('Error searching products by image:', error);
      throw error;
    }
  },
};

export const categoryAPI = {
  // Get all categories
  getAllCategories: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/categories`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get categories by type
  getCategoriesByType: async (type) => {
    try {
      return await requestJson(`${API_BASE_URL}/categories/type/${encodeURIComponent(type)}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch categories');
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      throw error;
    }
  },
};

// ============ SHIPPING API ============

export const shippingAPI = {
  // Get GHN configuration state
  getGhnConfiguration: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/shipping/ghn/configured`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch GHN configuration');
    } catch (error) {
      console.error('Error fetching GHN configuration:', error);
      throw error;
    }
  },

  // Get GHN provinces
  getGhnProvinces: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/shipping/ghn/provinces`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch GHN provinces');
    } catch (error) {
      console.error('Error fetching GHN provinces:', error);
      throw error;
    }
  },

  // Get GHN districts
  getGhnDistricts: async (provinceId) => {
    try {
      return await requestJson(`${API_BASE_URL}/shipping/ghn/districts?provinceId=${encodeURIComponent(provinceId)}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch GHN districts');
    } catch (error) {
      console.error('Error fetching GHN districts:', error);
      throw error;
    }
  },

  // Get GHN wards
  getGhnWards: async (districtId) => {
    try {
      return await requestJson(`${API_BASE_URL}/shipping/ghn/wards?districtId=${encodeURIComponent(districtId)}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch GHN wards');
    } catch (error) {
      console.error('Error fetching GHN wards:', error);
      throw error;
    }
  },

  // Quote GHN shipping fee
  quoteGhnFee: async (quoteData) => {
    try {
      return await requestJson(`${API_BASE_URL}/shipping/ghn/quote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(quoteData),
      }, 'Failed to quote GHN shipping fee');
    } catch (error) {
      console.error('Error quoting GHN shipping fee:', error);
      throw error;
    }
  },
};

// ============ USERS API ============

export const userAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Save token and essential user info (exclude avatar to avoid quota exceeded)
      if (data.token && data.user) {
        saveToken(data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        
        // Save only essential user data (without avatar or large fields)
        const essentialUserData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          status: data.user.status,
          phone: data.user.phone,
          gender: data.user.gender,
          address: data.user.address,
        };
        localStorage.setItem('userData', JSON.stringify(essentialUserData));
      }
      
      return data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Save token and essential user info (exclude avatar to avoid quota exceeded)
      if (data.token && data.user) {
        saveToken(data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        
        // Save only essential user data (without avatar or large fields)
        const essentialUserData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          status: data.user.status,
          phone: data.user.phone,
          gender: data.user.gender,
          address: data.user.address,
        };
        localStorage.setItem('userData', JSON.stringify(essentialUserData));
      }
      
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    removeToken();
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      return await requestJson(`${API_BASE_URL}/users/${userId}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch profile');
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, userData) => {
    try {
      return await requestJson(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      }, 'Failed to update profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Forgot password - request reset token
  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request password reset');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  // Reset password - verify token and set new password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return getToken() !== null;
  },

  // Get current user info
  getCurrentUser: () => {
    return {
      id: localStorage.getItem('userId'),
      email: localStorage.getItem('userEmail'),
      name: localStorage.getItem('userName'),
    };
  },

  // Change password for logged-in user
  changePassword: async (userId, oldPassword, newPassword, confirmPassword) => {
    try {
      return await requestJson(`${API_BASE_URL}/users/${userId}/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      }, 'Failed to change password');
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Upload/Update user avatar
  uploadAvatar: async (userId, imageBase64) => {
    try {
      return await requestJson(`${API_BASE_URL}/users/${userId}/upload-avatar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ imageBase64 }),
      }, 'Failed to upload avatar');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },
};

// ============ ORDERS API ============

export const orderAPI = {
  // Get all orders for user
  getUserOrders: async (userId) => {
    try {
      return await requestJson(`${API_BASE_URL}/orders/user/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }, 'Failed to fetch orders');
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get purchase-based recommendations for user
  getPurchaseRecommendations: async (userId, limit = 8) => {
    try {
      return await requestJson(
        `${API_BASE_URL}/orders/user/${userId}/recommendations?limit=${encodeURIComponent(limit)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        'Failed to fetch purchase recommendations'
      );
    } catch (error) {
      console.error('Error fetching purchase recommendations:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      return await requestJson(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }, 'Failed to fetch order');
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Get order by order code
  getOrderByCode: async (orderCode) => {
    try {
      return await requestJson(`${API_BASE_URL}/orders/code/${encodeURIComponent(orderCode)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }, 'Failed to fetch order');
    } catch (error) {
      console.error('Error fetching order by code:', error);
      throw error;
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      return await requestJson(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      }, 'Failed to create order');
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update order status (Admin only)
  updateOrderStatus: async (orderId, status) => {
    try {
      return await requestJson(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }, 'Failed to update order status');
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },
  // Cancel order (User request)
  cancelOrder: async (orderId, payload) => {
    try {
      return await requestJson(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }, 'Failed to cancel order');
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },
};

// ============ PAYMENTS API ============

export const paymentAPI = {
  // Create VNPay payment URL for an existing order
  createVnpayPayment: async (orderCode) => {
    try {
      return await requestJson(`${API_BASE_URL}/payments/vnpay/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderCode }),
      }, 'Failed to create VNPay payment');
    } catch (error) {
      console.error('Error creating VNPay payment:', error);
      throw error;
    }
  },

  // Check whether VNPay credentials are available on the backend
  getVnpayConfiguration: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/payments/vnpay/configured`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }, 'Failed to check VNPay configuration');
    } catch (error) {
      console.error('Error checking VNPay configuration:', error);
      throw error;
    }
  },
};

// ============ ADMIN API ============

export const adminAPI = {
  // Get all users
  getAllUsers: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch user');
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      }, 'Failed to update user role');
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }, 'Failed to update user status');
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Delete user account
  deleteUser: async (userId) => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }, 'Failed to delete user');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get all orders
  getAllOrders: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/orders`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch orders');
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch statistics');
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },
  // Get admin notifications (server-side)
  getNotifications: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/admin/notifications`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch admin notifications');
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw error;
    }
  },
};

// ============ REVIEWS API ============

export const reviewAPI = {
  // Get all reviews (Admin only)
  getAllReviews: async () => {
    try {
      return await requestJson(`${API_BASE_URL}/reviews`, {
        headers: getAuthHeaders(),
      }, 'Failed to fetch reviews');
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      throw error;
    }
  },

  // Get reviews by product ID
  getReviewsByProductId: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // Get review by ID
  getReviewById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${id}`);
      if (!response.ok) throw new Error('Failed to fetch review');
      return await response.json();
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  },

  // Create review
  createReview: async (reviewData) => {
    try {
      return await requestJson(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      }, 'Failed to create review');
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Update review
  updateReview: async (id, reviewData) => {
    try {
      return await requestJson(`${API_BASE_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      }, 'Failed to update review');
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete review
  deleteReview: async (id) => {
    try {
      await requestJson(`${API_BASE_URL}/reviews/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }, 'Failed to delete review');
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // Get top rated reviews
  getTopRatedReviews: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}/top`);
      if (!response.ok) throw new Error('Failed to fetch top reviews');
      return await response.json();
    } catch (error) {
      console.error('Error fetching top reviews:', error);
      throw error;
    }
  },
};

export default {
  productAPI,
  categoryAPI,
  userAPI,
  orderAPI,
  adminAPI,
  reviewAPI,
};

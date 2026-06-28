import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './Index.css';
import Header from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import PublicI18nSync from './i18n/PublicI18nSync';
import HomePage from './pages/Homepage';
import ProductsPage from './pages/Productspage';
import ProductDetailPage from './pages/Productdetailpage';
import LoginPage from './pages/Loginpage';
import RegisterPage from './pages/Registerpage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';
import CartPage from './pages/Cartpage';
import CheckoutPage from './pages/Checkoutpage';
import ProfilePage from './pages/Profilepage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminReviews from './pages/AdminReviews';
import AdminVouchers from './pages/AdminVouchers';
import AdminChat from './pages/AdminChat';
import AdminContacts from './pages/AdminContacts';
import ChatWidget from './components/chat/ChatWidget';
import { ChatProvider } from './context/ChatContext';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <PublicI18nSync disabled={isAdmin} />
      {!isAdmin && <Header />}
      <main style={{ paddingTop: isAdmin ? 0 : 68 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2-callback" element={<OAuth2CallbackPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRoles={["admin"]} />} />
          <Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} requiredRoles={["admin", "staff"]} />} />
          <Route path="/admin/orders" element={<ProtectedRoute element={<AdminOrders />} requiredRoles={["admin", "staff"]} />} />
          <Route path="/admin/users" element={<ProtectedRoute element={<AdminUsers />} requiredRoles={["admin"]} />} />
          <Route path="/admin/reviews" element={<ProtectedRoute element={<AdminReviews />} requiredRoles={["admin"]} />} />
          <Route path="/admin/vouchers" element={<ProtectedRoute element={<AdminVouchers />} requiredRoles={["admin", "staff"]} />} />
          <Route path="/admin/chat" element={<ProtectedRoute element={<AdminChat />} requiredRoles={["admin", "staff"]} />} />
          <Route path="/admin/contacts" element={<ProtectedRoute element={<AdminContacts />} requiredRoles={["admin", "staff"]} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
        {!isAdmin && <ChatWidget />}
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <ToastProvider>
                  <ChatProvider>
                    <AppContent />
                  </ChatProvider>
                </ToastProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

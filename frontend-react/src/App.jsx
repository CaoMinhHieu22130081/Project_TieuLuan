import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './Index.css';
import Header from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
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

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      <main style={{ paddingTop: isAdmin ? 0 : 68 }}>
        <Routes>
          <Route path="/"               element={<HomePage />} />
          <Route path="/products"       element={<ProductsPage />} />
          <Route path="/products/:id"   element={<ProductDetailPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2-callback" element={<OAuth2CallbackPage />} />
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/checkout"       element={<CheckoutPage />} />
          <Route path="/profile"        element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path="/admin"          element={<ProtectedRoute element={<AdminDashboard />} requiredRoles={["admin"]} />} />
          <Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} requiredRoles={["admin"]} />} />
          <Route path="/admin/orders"   element={<ProtectedRoute element={<AdminOrders />} requiredRoles={["admin", "staff"]} />} />
          <Route path="/admin/users"    element={<ProtectedRoute element={<AdminUsers />} requiredRoles={["admin"]} />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
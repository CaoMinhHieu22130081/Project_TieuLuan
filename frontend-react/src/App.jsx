import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './Index.css';
import Header from './components/Header';
import HomePage from './pages/Homepage';
import ProductsPage from './pages/Productspage';
import ProductDetailPage from './pages/Productdetailpage';
import LoginPage from './pages/Loginpage';
import RegisterPage from './pages/Registerpage';
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
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/checkout"       element={<CheckoutPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          <Route path="/admin"          element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders"   element={<AdminOrders />} />
          <Route path="/admin/users"    element={<AdminUsers />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
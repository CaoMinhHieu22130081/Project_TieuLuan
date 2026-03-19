import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import Loginpage from './pages/Loginpage';
import Registerpage from './pages/Registerpage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Header cartCount={2} />
      <main style={{ paddingTop: 68 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Loginpage />} />
          <Route path="/register" element={<Registerpage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
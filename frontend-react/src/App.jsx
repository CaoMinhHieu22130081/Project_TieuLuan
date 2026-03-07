import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import Loginpage from './pages/Loginpage';
import Registerpage from './pages/Registerpage';

function App() {
  return (
    <Router>
      <Header />
      <main style={{ paddingTop: 84 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Loginpage />} />
          <Route path="/register" element={<Registerpage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

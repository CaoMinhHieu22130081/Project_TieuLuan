import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component - Bảo vệ routes dựa trên role
 * 
 * Cách sử dụng:
 * <ProtectedRoute element={<AdminPage />} requiredRoles={["admin"]} />
 * <ProtectedRoute element={<StaffPage />} requiredRoles={["admin", "staff"]} />
 */
export const ProtectedRoute = ({ element, requiredRoles = [] }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Nếu không đăng nhập, redirect về login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có yêu cầu role, kiểm tra user có role đó không
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2>❌ Truy cập bị từ chối</h2>
        <p>Bạn không có quyền truy cập trang này. Vai trò của bạn: {user.role}</p>
        <p>Yêu cầu vai trò: {requiredRoles.join(', ')}</p>
        <a href="/" style={{ color: '#ff5fa3', textDecoration: 'none', fontWeight: 'bold' }}>← Về trang chủ</a>
      </div>
    );
  }

  return element;
};

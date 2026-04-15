import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/css/RouteGuard.css';

/**
 * ProtectedRoute Component - Bảo vệ routes dựa trên role
 * 
 * Cách sử dụng:
 * <ProtectedRoute element={<AdminPage />} requiredRoles={["admin"]} />
 * <ProtectedRoute element={<StaffPage />} requiredRoles={["admin", "staff"]} />
 */
export const ProtectedRoute = ({ element, requiredRoles = [] }) => {
  const { user, loading, hasRole } = useAuth();
  const currentRole = String(user?.role || '').toLowerCase();
  const roleLabels = {
    admin: 'Admin',
    staff: 'Staff',
    customer: 'Khách hàng',
  };
  const fallbackPath = currentRole === 'staff' ? '/admin/orders' : currentRole === 'admin' ? '/admin' : '/';

  if (loading) {
    return (
      <div className="route-guard-shell">
        <div className="route-guard-card">
          <div className="route-guard-icon">⏳</div>
          <h2 className="route-guard-title">Đang xác thực quyền truy cập</h2>
          <p className="route-guard-text">Vui lòng chờ trong giây lát để hệ thống kiểm tra phiên đăng nhập của bạn.</p>
        </div>
      </div>
    );
  }

  // Nếu không đăng nhập, redirect về login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có yêu cầu role, kiểm tra user có role đó không
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    const requiredRoleLabel = requiredRoles.map((role) => roleLabels[role] || role).join(', ');

    return (
      <div className="route-guard-shell">
        <div className="route-guard-card denied">
          <div className="route-guard-icon">⛔</div>
          <h2 className="route-guard-title">Bạn không có quyền truy cập</h2>
          <p className="route-guard-text">
            Trang này chỉ dành cho nhóm quyền phù hợp. Tài khoản hiện tại của bạn không đáp ứng yêu cầu truy cập.
          </p>
          <div className="route-guard-meta">
            <div className="route-guard-meta-row">
              <span className="route-guard-meta-label">Vai trò hiện tại</span>
              <span className="route-guard-meta-value">{roleLabels[currentRole] || currentRole || 'Chưa đăng nhập'}</span>
            </div>
            <div className="route-guard-meta-row">
              <span className="route-guard-meta-label">Vai trò yêu cầu</span>
              <span className="route-guard-meta-value">{requiredRoleLabel || 'Không xác định'}</span>
            </div>
          </div>
          <div className="route-guard-actions">
            <Link to={fallbackPath} className="route-guard-btn primary">
              Về khu vực phù hợp
            </Link>
            <Link to="/" className="route-guard-btn secondary">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return element;
};

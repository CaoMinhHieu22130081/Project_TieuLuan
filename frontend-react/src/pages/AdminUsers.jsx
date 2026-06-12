import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Key,
  Lock,
  Unlock,
  Trash2,
  X,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import { AdminLayout } from "./Adminheader";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import "./css/Admin.css";

const ROLE_LABEL = {
  admin: "Admin",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

const ROLE_MAP = {
  admin: "role-admin",
  staff: "role-staff",
  customer: "role-customer",
};

const USER_STATUS_MAP = {
  active: { label: "Hoạt động", cls: "st-delivered" },
  inactive: { label: "Không HĐ", cls: "st-processing" },
  blocked: { label: "Đã khóa", cls: "st-cancelled" },
};

const ROLE_TABS = ["Tất cả", "admin", "staff", "customer"];
const ROLE_OPTIONS = ["admin", "staff", "customer"];

const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const numericValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatMoney = (value) => `${parseAmount(value).toLocaleString("vi-VN")}đ`;

const formatJoinedAt = (value) => {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("vi-VN");
};

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  const role = (user.role || "customer").toLowerCase();
  const status = (user.status || "active").toLowerCase();

  return {
    ...user,
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role,
    status,
    orders: Number(user.orders ?? user.orderCount ?? 0),
    spent: parseAmount(user.spent),
    createdAt: user.createdAt || user.joinedAt || user.joined || null,
  };
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState("Tất cả");
  const [detail, setDetail] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await adminAPI.getAllUsers();
      const normalizedUsers = (Array.isArray(data) ? data : [])
        .map(normalizeUser)
        .filter(Boolean);
      setUsers(normalizedUsers);
    } catch (err) {
      console.error("Lỗi tải người dùng:", err);
      setError("Không thể tải dữ liệu người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const replaceUserInState = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    if (!normalizedUser) {
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === normalizedUser.id ? normalizedUser : user))
    );
    setDetail((current) =>
      current && current.id === normalizedUser.id ? normalizedUser : current
    );
  };

  const handleViewDetail = async (user) => {
    setDetail(user);

    try {
      const freshUser = await adminAPI.getUserById(user.id);
      replaceUserInState(freshUser);
    } catch (err) {
      console.error("Lỗi tải chi tiết người dùng:", err);
    }
  };

  const handleSaveRole = async () => {
    if (!editRole) {
      return;
    }

    try {
      setSavingUserId(editRole.userId);
      const updatedUser = await adminAPI.updateUserRole(
        editRole.userId,
        editRole.role
      );
      replaceUserInState(updatedUser);
      setEditRole(null);
    } catch (err) {
      console.error("Lỗi cập nhật vai trò:", err);
      alert(err.message || "Không thể cập nhật vai trò người dùng");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "active" ? "blocked" : "active";

    try {
      setSavingUserId(user.id);
      const updatedUser = await adminAPI.updateUserStatus(user.id, nextStatus);
      replaceUserInState(updatedUser);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      alert(err.message || "Không thể cập nhật trạng thái người dùng");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (Number(currentUser?.id) === Number(user.id)) {
      alert("Không thể xóa tài khoản đang đăng nhập.");
      return;
    }

    const confirmed = window.confirm(
      `Xóa tài khoản ${user.name || user.email || `#${user.id}`}? Thao tác này không thể hoàn tác.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingUserId(user.id);
      await adminAPI.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setDetail((current) => (current && current.id === user.id ? null : current));
    } catch (err) {
      console.error("Lỗi xóa người dùng:", err);
      alert(err.message || "Không thể xóa tài khoản người dùng");
    } finally {
      setSavingUserId(null);
    }
  };

  const displayed = users.filter((user) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      (user.name || "").toLowerCase().includes(keyword) ||
      (user.email || "").toLowerCase().includes(keyword);
    const matchRole = roleTab === "Tất cả" || user.role === roleTab;
    return matchSearch && matchRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const blockedUsers = users.filter((user) => user.status === "blocked").length;
  const customerUsers = users.filter((user) => user.role === "customer").length;

  return (
    <AdminLayout
      title="Quản lý người dùng"
      subtitle={`${totalUsers} tài khoản · ${activeUsers} đang hoạt động`}
    >
      <div className="admin-card toolbar-card">
        <div className="status-tabs">
          {ROLE_TABS.map((tab) => {
            const count =
              tab === "Tất cả"
                ? totalUsers
                : users.filter((user) => user.role === tab).length;

            return (
              <button
                key={tab}
                className={`status-tab ${roleTab === tab ? "active" : ""}`}
                onClick={() => setRoleTab(tab)}
              >
                {tab === "Tất cả" ? "Tất cả" : ROLE_LABEL[tab]}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="search-input-wrap" style={{ marginTop: 14 }}>
          <span className="search-ico"><Search size={18} /></span>
          <input
            className="admin-search-input"
            placeholder="Tìm tên, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="users-stats-row">
        {[
          { label: "Tổng tài khoản", value: totalUsers, color: "var(--accent)" },
          { label: "Đang hoạt động", value: activeUsers, color: "#34d399" },
          { label: "Đã khóa", value: blockedUsers, color: "#f87171" },
          { label: "Khách hàng", value: customerUsers, color: "#60a5fa" },
        ].map((stat, index) => (
          <div key={index} className="users-stat-card" style={{ "--uc": stat.color }}>
            <p className="uc-value" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="uc-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-card table-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <p>Đang tải người dùng...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#e74c3c" }}>
            <p>{error}</p>
          </div>
        ) : (
          <table className="admin-table users-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đơn hàng</th>
                <th>Chi tiêu</th>
                <th>Tham gia</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "28px 14px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Không tìm thấy người dùng phù hợp
                  </td>
                </tr>
              ) : (
                displayed.map((user) => {
                  const initial = (user.name || "User").charAt(0);
                  const status = user.status || "active";
                  const isSaving = savingUserId === user.id;
                  const isCurrentUser = Number(currentUser?.id) === Number(user.id);

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div
                            className="user-avatar"
                            style={{
                              "--ua-color":
                                user.role === "admin"
                                  ? "var(--accent)"
                                  : user.role === "staff"
                                    ? "#60a5fa"
                                    : "#a78bfa",
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                              {user.name || "N/A"}
                            </p>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              ID #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p style={{ fontSize: "0.82rem" }}>{user.email || "N/A"}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {user.phone || "—"}
                        </p>
                      </td>
                      <td className="users-role-cell">
                        <span className={`role-badge ${ROLE_MAP[user.role] || "role-customer"}`}>
                          {ROLE_LABEL[user.role] || user.role}
                        </span>
                      </td>
                      <td className="users-status-cell">
                        <span
                          className={`omr-status ${USER_STATUS_MAP[status]?.cls || "status-active"}`}
                        >
                          {USER_STATUS_MAP[status]?.label || status}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {user.orders || 0}
                      </td>
                      <td>
                        <span style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.85rem" }}>
                          {parseAmount(user.spent) > 0 ? formatMoney(user.spent) : "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {formatJoinedAt(user.createdAt)}
                      </td>
                      <td className="users-actions-cell">
                        <div className="action-btns">
                          <button
                            className="action-btn edit"
                            onClick={() => handleViewDetail(user)}
                            disabled={isSaving}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => setEditRole({ userId: user.id, role: user.role })}
                            disabled={isSaving}
                          >
                            <Key size={14} />
                          </button>
                          {user.role !== "admin" && (
                            <button
                              className={`action-btn ${status === "active" ? "del" : "next"}`}
                              onClick={() => handleToggleStatus(user)}
                              disabled={isSaving}
                            >
                              {status === "active" ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          )}
                          <button
                            className="action-btn del"
                            onClick={() => handleDeleteUser(user)}
                            disabled={isSaving || isCurrentUser}
                            title={isCurrentUser ? "Không thể xóa tài khoản đang đăng nhập" : "Xóa tài khoản"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chi tiết tài khoản</h2>
              <button className="modal-close" onClick={() => setDetail(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div
                  className="user-avatar lg"
                  style={{
                    "--ua-color":
                      detail.role === "admin"
                        ? "var(--accent)"
                        : detail.role === "staff"
                          ? "#60a5fa"
                          : "#a78bfa",
                  }}
                >
                  {(detail.name || "User").charAt(0)}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {detail.name || "N/A"}
                  </p>
                  <span className={`role-badge ${ROLE_MAP[detail.role] || "role-customer"}`}>
                    {ROLE_LABEL[detail.role] || detail.role}
                  </span>
                  <span
                    className={`omr-status ${USER_STATUS_MAP[detail.status || "active"]?.cls || "status-active"}`}
                    style={{ marginLeft: 8 }}
                  >
                    {USER_STATUS_MAP[detail.status || "active"]?.label || "Active"}
                  </span>
                </div>
              </div>
              <div className="detail-info-grid">
                <div>
                  <span className="di-label">Email</span>
                  <span>{detail.email || "N/A"}</span>
                </div>
                <div>
                  <span className="di-label">Điện thoại</span>
                  <span>{detail.phone || "—"}</span>
                </div>
                <div>
                  <span className="di-label">Tham gia</span>
                  <span>{formatJoinedAt(detail.createdAt)}</span>
                </div>
                <div>
                  <span className="di-label">Đơn hàng</span>
                  <span>{detail.orders || 0}</span>
                </div>
                <div>
                  <span className="di-label">Tổng chi tiêu</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                    {parseAmount(detail.spent) > 0
                      ? formatMoney(detail.spent)
                      : "Chưa mua hàng"}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDetail(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {editRole && (
        <div className="modal-overlay" onClick={() => setEditRole(null)}>
          <div className="modal-box small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Đổi vai trò</h2>
              <button className="modal-close" onClick={() => setEditRole(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
                Chọn vai trò mới:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: editRole.role === role ? "var(--accent-dim)" : "var(--surface)",
                      border: `1px solid ${
                        editRole.role === role
                          ? "rgba(var(--accent-rgb),.3)"
                          : "var(--border)"
                      }`,
                      transition: "all .2s",
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={editRole.role === role}
                      onChange={() => setEditRole((current) => ({ ...current, role }))}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span className={`role-badge ${ROLE_MAP[role]}`}>
                      {ROLE_LABEL[role]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setEditRole(null)}>
                Hủy
              </button>
              <button
                className="modal-btn save"
                onClick={handleSaveRole}
                disabled={savingUserId === editRole.userId}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
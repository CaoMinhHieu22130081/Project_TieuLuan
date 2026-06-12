import React, { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  CheckCircle2,
  Calendar,
  Search,
  Inbox,
  Eye,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';
import { contactAPI } from '../services/api';
import { AdminLayout } from './Adminheader';
import { useAuth } from '../context/AuthContext';
import './css/Admin.css';
import './css/AdminContacts.css';

const AdminContacts = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await contactAPI.getAdminMessages();
      setMessages(data);
    } catch (err) {
      setError('Không thể tải danh sách tin nhắn.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await contactAPI.markAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      if (selected?.id === id) setSelected(prev => ({ ...prev, isRead: true }));
    } catch {
      alert('Lỗi khi cập nhật trạng thái tin nhắn.');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này không?')) return;
    setDeletingId(id);
    try {
      await contactAPI.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      alert('Lỗi khi xóa tin nhắn.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = (msg) => {
    setSelected(msg);
    if (!msg.isRead) handleMarkAsRead(msg.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateFull = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getInitials = (name = '') =>
    name.trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  const avatarColors = [
    '#ec4899','#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#84cc16'
  ];
  const getColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];

  const filtered = messages.filter(m => {
    const matchFilter = filter === 'all' || (filter === 'unread' ? !m.isRead : m.isRead);
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.message?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;
  const readCount = messages.filter(m => m.isRead).length;

  if (loading) {
    return (
      <AdminLayout title="Quản lý Liên hệ" subtitle="Đang tải...">
        <div className="contacts-loading">
          <div className="contacts-spinner" />
          <p>Đang tải tin nhắn...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Quản lý Liên hệ" subtitle="Lỗi">
        <div className="contacts-error">
          <AlertTriangle size={48} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: 16 }} />
          <p>{error}</p>
          <button className="contacts-retry-btn" onClick={fetchMessages}>Thử lại</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Quản lý Liên hệ"
      subtitle={unreadCount > 0 ? `${unreadCount} tin nhắn mới chưa đọc` : 'Tất cả đã đọc'}
    >
      {/* Stats row */}
      <div className="contacts-stats-row">
        <div className="contacts-stat-card">
          <div className="csc-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
            <Mail size={20} />
          </div>
          <div className="csc-info">
            <div className="csc-value">{messages.length}</div>
            <div className="csc-label">Tổng tin nhắn</div>
          </div>
        </div>
        <div className="contacts-stat-card">
          <div className="csc-icon" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>
            <Bell size={20} />
          </div>
          <div className="csc-info">
            <div className="csc-value" style={{ color: '#ec4899' }}>{unreadCount}</div>
            <div className="csc-label">Chưa đọc</div>
          </div>
        </div>
        <div className="contacts-stat-card">
          <div className="csc-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="csc-info">
            <div className="csc-value" style={{ color: '#34d399' }}>{readCount}</div>
            <div className="csc-label">Đã đọc</div>
          </div>
        </div>
        <div className="contacts-stat-card">
          <div className="csc-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
            <Calendar size={20} />
          </div>
          <div className="csc-info">
            <div className="csc-value">
              {messages.filter(m => {
                const d = new Date(m.createdAt);
                const now = new Date();
                return d.toDateString() === now.toDateString();
              }).length}
            </div>
            <div className="csc-label">Hôm nay</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="contacts-toolbar admin-card">
        <div className="contacts-search-wrap">
          <span className="contacts-search-ico"><Search size={18} /></span>
          <input
            className="contacts-search-input"
            type="text"
            placeholder="Tìm kiếm theo tên, email, nội dung..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="contacts-search-clear" onClick={() => setSearch('')}><X size={16} /></button>
          )}
        </div>
        <div className="contacts-filter-tabs">
          {[
            { key: 'all', label: 'Tất cả', count: messages.length },
            { key: 'unread', label: 'Chưa đọc', count: unreadCount },
            { key: 'read', label: 'Đã đọc', count: readCount },
          ].map(tab => (
            <button
              key={tab.key}
              className={`contacts-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="contacts-tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className={`contacts-layout ${selected ? 'has-detail' : ''}`}>
        {/* Message list */}
        <div className="contacts-list admin-card">
          {filtered.length === 0 ? (
            <div className="contacts-empty">
              <div className="contacts-empty-icon"><Inbox size={48} strokeWidth={1} style={{ opacity: 0.3 }} /></div>
              <p className="contacts-empty-title">Không có tin nhắn nào</p>
              <p className="contacts-empty-sub">
                {search ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có tin nhắn liên hệ'}
              </p>
            </div>
          ) : (
            <div className="contacts-msg-list">
              {filtered.map((m, idx) => (
                <div
                  key={m.id}
                  className={`contacts-msg-item ${!m.isRead ? 'unread' : ''} ${selected?.id === m.id ? 'active' : ''} ${deletingId === m.id ? 'deleting' : ''}`}
                  onClick={() => handleOpen(m)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {!m.isRead && <div className="contacts-unread-dot" />}
                  <div
                    className="contacts-avatar"
                    style={{ background: getColor(m.name) + '22', color: getColor(m.name), borderColor: getColor(m.name) + '44' }}
                  >
                    {getInitials(m.name)}
                  </div>
                  <div className="contacts-msg-content">
                    <div className="contacts-msg-header-row">
                      <span className="contacts-msg-name">{m.name}</span>
                      <span className="contacts-msg-time">{formatDate(m.createdAt)}</span>
                    </div>
                    <div className="contacts-msg-email">{m.email}</div>
                    <div className="contacts-msg-preview">{m.message}</div>
                  </div>
                  <div className="contacts-msg-actions" onClick={e => e.stopPropagation()}>
                    {!m.isRead && (
                      <button
                        className="contacts-action-btn read"
                        onClick={(e) => handleMarkAsRead(m.id, e)}
                        title="Đánh dấu đã đọc"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="contacts-action-btn delete"
                        onClick={(e) => handleDelete(m.id, e)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="contacts-detail admin-card">
            <div className="contacts-detail-header">
              <div
                className="contacts-detail-avatar"
                style={{ background: getColor(selected.name) + '20', color: getColor(selected.name), borderColor: getColor(selected.name) + '55' }}
              >
                {getInitials(selected.name)}
              </div>
              <div className="contacts-detail-info">
                <div className="contacts-detail-name">{selected.name}</div>
                <a href={`mailto:${selected.email}`} className="contacts-detail-email">
                  {selected.email}
                </a>
                <div className="contacts-detail-time">
                  <Calendar size={14} style={{ marginRight: 6 }} /> {formatDateFull(selected.createdAt)}
                </div>
              </div>
              <button className="contacts-detail-close" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>

            <div className="contacts-detail-status-row">
              <span className={`contacts-status-badge ${selected.isRead ? 'read' : 'unread'}`}>
                {selected.isRead ? (
                  <><CheckCircle2 size={14} style={{ marginRight: 6 }} /> Đã đọc</>
                ) : (
                  <><Bell size={14} style={{ marginRight: 6 }} /> Chưa đọc</>
                )}
              </span>
              {!selected.isRead && (
                <button
                  className="contacts-detail-action-btn read"
                  onClick={() => handleMarkAsRead(selected.id)}
                >
                  <Eye size={14} style={{ marginRight: 6 }} /> Đánh dấu đã đọc
                </button>
              )}
              {isAdmin && (
                <button
                  className="contacts-detail-action-btn delete"
                  onClick={(e) => handleDelete(selected.id, e)}
                >
                  <Trash2 size={14} style={{ marginRight: 6 }} /> Xóa tin nhắn
                </button>
              )}
            </div>

            <div className="contacts-detail-divider" />

            <div className="contacts-detail-label">Nội dung tin nhắn</div>
            <div className="contacts-detail-body">
              {selected.message}
            </div>

            <div className="contacts-detail-reply">
              <a
                href={`mailto:${selected.email}?subject=Re: Liên hệ từ UniqTee`}
                className="contacts-reply-btn"
              >
                <Mail size={16} style={{ marginRight: 8 }} /> Trả lời qua Email
              </a>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContacts;

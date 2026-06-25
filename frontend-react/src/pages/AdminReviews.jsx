import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Trash2,
  X,
  Star,
  ClipboardList,
  MessageSquareText
} from "lucide-react";
import { AdminLayout } from "./Adminheader";
import { reviewAPI } from "../services/api";
import "./css/Admin.css";

const RATING_TABS = ["Tất cả", 5, 4, 3, 2, 1];

const normalizeRating = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(5, numericValue));
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("vi-VN");
};

const normalizeReview = (review) => {
  const product = review?.product || {};
  const user = review?.user || {};

  return {
    id: review?.id,
    productId: product?.id ?? review?.productId ?? null,
    productName: product?.name || review?.productName || `Sản phẩm #${product?.id ?? review?.productId ?? "?"}`,
    reviewerName: review?.reviewerName || user?.name || review?.userName || "Khách hàng",
    reviewerEmail: user?.email || review?.userEmail || "",
    rating: normalizeRating(review?.rating),
    content: review?.content || "",
    adminReply: review?.adminReply || "",
    createdAt: review?.createdAt || review?.createdDate || null,
  };
};

const renderStars = (rating) => {
  const fullStars = Math.round(normalizeRating(rating));
  return "★".repeat(fullStars) + "☆".repeat(Math.max(0, 5 - fullStars));
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [ratingTab, setRatingTab] = useState("Tất cả");
  const [detail, setDetail] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewAPI.getAllReviews();
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeReview)
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
      setReviews(normalized);
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
      setError(err.message || "Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleDelete = async (review) => {
    if (!window.confirm(`Xóa đánh giá #${review.id} cho ${review.productName}?`)) {
      return;
    }

    try {
      setSavingId(review.id);
      await reviewAPI.deleteReview(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setDetail((current) => (current && current.id === review.id ? null : current));
    } catch (err) {
      console.error("Lỗi xóa đánh giá:", err);
      alert(err.message || "Không thể xóa đánh giá");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveReply = async () => {
    if (!detail) return;
    try {
      setIsSavingReply(true);
      const updatedReview = await reviewAPI.updateReview(detail.id, {
        adminReply: replyText
      });
      // Cập nhật reviews state
      setReviews(current => current.map(r => r.id === detail.id ? normalizeReview(updatedReview) : r));
      setDetail(normalizeReview(updatedReview));
      alert("Đã lưu phản hồi thành công!");
    } catch (err) {
      console.error("Lỗi lưu phản hồi:", err);
      alert(err.message || "Không thể lưu phản hồi");
    } finally {
      setIsSavingReply(false);
    }
  };

  const openDetail = (review) => {
    setDetail(review);
    setReplyText(review.adminReply || "");
  };

  const filteredReviews = reviews.filter((review) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      [review.productName, review.reviewerName, review.reviewerEmail, review.content]
        .some((value) => String(value || "").toLowerCase().includes(query));
    const matchRating = ratingTab === "Tất cả" || normalizeRating(review.rating) === Number(ratingTab);
    return matchSearch && matchRating;
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, review) => sum + normalizeRating(review.rating), 0) / totalReviews).toFixed(1)
    : "0.0";
  const fiveStarReviews = reviews.filter((review) => normalizeRating(review.rating) === 5).length;
  const lowStarReviews = reviews.filter((review) => normalizeRating(review.rating) > 0 && normalizeRating(review.rating) <= 2).length;

  return (
    <AdminLayout
      title="Quản lý đánh giá"
      subtitle={`${totalReviews} đánh giá · ${averageRating}/5 sao trung bình`}
    >
      <div className="admin-card toolbar-card">
        <div className="status-tabs">
          {RATING_TABS.map((tab) => {
            const count = tab === "Tất cả"
              ? totalReviews
              : reviews.filter((review) => normalizeRating(review.rating) === tab).length;

            return (
              <button
                key={tab}
                type="button"
                className={`status-tab ${ratingTab === tab ? "active" : ""}`}
                onClick={() => setRatingTab(tab)}
              >
                {tab === "Tất cả" ? "Tất cả" : `${tab} sao`}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="search-input-wrap" style={{ marginTop: 14 }}>
          <span className="search-ico"><Search size={18} /></span>
          <input
            className="admin-search-input"
            placeholder="Tìm theo sản phẩm, người đánh giá, nội dung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="users-stats-row">
        {[
          { label: "Tổng đánh giá", value: totalReviews, color: "var(--accent)" },
          { label: "Điểm trung bình", value: averageRating, color: "#b45309" },
          { label: "5 sao", value: fiveStarReviews, color: "#047857" },
          { label: "1-2 sao", value: lowStarReviews, color: "#dc2626" },
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
            <p>Đang tải đánh giá...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#e74c3c" }}>
            <p>{error}</p>
          </div>
        ) : (
          <table className="admin-table reviews-table">
            <thead>
              <tr>
                <th>Người đánh giá</th>
                <th>Sản phẩm</th>
                <th>Rating</th>
                <th>Nội dung</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "28px 14px" }}>
                    <div className="admin-empty-state compact">Không tìm thấy đánh giá phù hợp</div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const rating = normalizeRating(review.rating);
                  const contentPreview = review.content.length > 160
                    ? `${review.content.slice(0, 160).trimEnd()}…`
                    : review.content;

                  return (
                    <tr key={review.id}>
                      <td>
                        <div className="review-summary">
                          <strong>{review.reviewerName}</strong>
                          <span>{review.reviewerEmail || `#${review.id}`}</span>
                        </div>
                      </td>
                      <td>
                        <span className="review-product-name">{review.productName}</span>
                      </td>
                      <td>
                        <span className="review-stars" data-rating={rating}>
                          {renderStars(rating)} <strong>{rating.toFixed(1)}</strong>
                        </span>
                      </td>
                      <td>
                        <p className="review-content-preview" title={review.content}>
                          {contentPreview || "—"}
                        </p>
                        {review.adminReply && (
                          <div style={{ marginTop: 6, padding: '6px 10px', background: 'var(--surface-2)', borderLeft: '2px solid var(--accent)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Phản hồi: </span>
                            <span title={review.adminReply}>
                              {review.adminReply.length > 80 ? `${review.adminReply.slice(0, 80)}…` : review.adminReply}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        {formatDate(review.createdAt)}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            type="button"
                            className="action-btn edit"
                            onClick={() => openDetail(review)}
                          >
                            <Eye size={14} style={{ marginRight: 4 }} /> Chi tiết
                          </button>
                          <button
                            type="button"
                            className="action-btn del"
                            disabled={savingId === review.id}
                            onClick={() => handleDelete(review)}
                          >
                            {savingId === review.id ? "Đang xóa..." : <><Trash2 size={14} style={{ marginRight: 4 }} /> Xóa</>}
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
          <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Đánh giá #{detail.id}</h2>
                <span className="review-stars" style={{ marginTop: 6, display: "inline-flex" }}>
                  {renderStars(detail.rating)} <strong>{normalizeRating(detail.rating).toFixed(1)}</strong>
                </span>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body order-detail-body">
              <div className="detail-section">
                <p className="detail-section-title"><ClipboardList size={16} style={{ marginRight: 8, display: 'inline' }} /> Thông tin đánh giá</p>
                <div className="detail-info-grid">
                  <div>
                    <span className="di-label">Người đánh giá</span>
                    <span>{detail.reviewerName}</span>
                  </div>
                  <div>
                    <span className="di-label">Email</span>
                    <span>{detail.reviewerEmail || "—"}</span>
                  </div>
                  <div>
                    <span className="di-label">Sản phẩm</span>
                    <span>{detail.productName}</span>
                  </div>
                  <div>
                    <span className="di-label">Ngày tạo</span>
                    <span>{formatDate(detail.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <p className="detail-section-title"><MessageSquareText size={16} style={{ marginRight: 8, display: 'inline' }} /> Nội dung</p>
                <div className="review-chat-bubble user">
                  <p className="rc-content">{detail.content || "Không có nội dung."}</p>
                  <span className="rc-time">{formatDate(detail.createdAt)}</span>
                </div>
              </div>

              <div className="detail-section">
                <p className="detail-section-title"><MessageSquareText size={16} style={{ marginRight: 8, display: 'inline', color: 'var(--accent)' }} /> Phản hồi của bạn</p>
                {detail.adminReply ? (
                  <div className="review-chat-bubble admin">
                     <p className="rc-content">{detail.adminReply}</p>
                     <span className="rc-time">Phản hồi từ Admin</span>
                  </div>
                ) : null}
                
                <div className="reply-editor">
                  <textarea
                    className="reply-textarea"
                    placeholder="Nhập nội dung phản hồi cho đánh giá này..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                  <div className="reply-actions">
                    <button 
                      className={`btn-save-reply ${detail.adminReply === replyText ? 'disabled' : ''}`}
                      disabled={isSavingReply || detail.adminReply === replyText}
                      onClick={handleSaveReply}
                    >
                      {isSavingReply ? "Đang lưu..." : "Lưu phản hồi"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setDetail(null)}>
                Đóng
              </button>
              <button
                className="modal-btn del"
                onClick={() => {
                  const current = detail;
                  setDetail(null);
                  void handleDelete(current);
                }}
                disabled={savingId === detail.id}
              >
                {savingId === detail.id ? "Đang xóa..." : "Xóa đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
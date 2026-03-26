// ── data/AdminDashboardData.js ───────────────────────────────────
// Dữ liệu thống kê, biểu đồ, đơn hàng gần đây dùng cho Dashboard

import { ALL_PRODUCTS } from "./Products";

/* ── Thống kê tổng quan ── */
export const DASHBOARD_STATS = [
  {
    label:  "Doanh thu tháng",
    value:  "68.450.000đ",
    change: "+18.2%",
    up:     true,
    spark:  [38, 45, 42, 55, 50, 62, 68],
    color:  "var(--accent)",
  },
  {
    label:  "Đơn hàng mới",
    value:  "187",
    change: "+14.3%",
    up:     true,
    spark:  [90, 110, 98, 130, 118, 155, 187],
    color:  "#60a5fa",
  },
  {
    label:  "Sản phẩm",
    getValue: () => {
      const total = ALL_PRODUCTS.length;
      const ao    = ALL_PRODUCTS.filter((p) => p.type === "Áo").length;
      const quan  = ALL_PRODUCTS.filter((p) => p.type === "Quần").length;
      return { display: `${total} (${ao}A·${quan}Q)`, spark: [6, 6, 7, 8, 8, 10, total] };
    },
    change: "+2 quần",
    up:     true,
    color:  "#a78bfa",
  },
  {
    label:  "Khách hàng",
    value:  "1.248",
    change: "+9.1%",
    up:     true,
    spark:  [700, 820, 880, 960, 1050, 1180, 1248],
    color:  "#34d399",
  },
];

/* ── Doanh thu 12 tháng ── */
export const MONTHLY_REVENUE = {
  data:   [22, 28, 25, 35, 32, 42, 38, 50, 45, 58, 52, 68],
  labels: ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"],
  year:   "2025",
};

/* ── Đơn hàng gần đây ── */
export const RECENT_ORDERS = [
  { id: "UNQ7F3K2", customer: "Nguyễn Thị Lan",  total: "648.000đ",   status: "delivered",  date: "15/03" },
  { id: "UNQ2M9P1", customer: "Trần Quốc Bảo",   total: "879.000đ",   status: "shipping",   date: "14/03" },
  { id: "UNQ5X8Q4", customer: "Lê Mỹ Duyên",     total: "1.578.000đ", status: "processing", date: "14/03" },
  { id: "UNQ9R1Z7", customer: "Phạm Minh Tuấn",  total: "499.000đ",   status: "delivered",  date: "13/03" },
  { id: "UNQ4K2W3", customer: "Hoàng Thu Hương",  total: "987.000đ",   status: "cancelled",  date: "12/03" },
];

/* ── Top sản phẩm bán chạy (lấy từ ALL_PRODUCTS) ── */
export const getTopProducts = (limit = 5) =>
  [...ALL_PRODUCTS]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, limit)
    .map((p) => ({
      name:    p.name,
      type:    p.type,
      sold:    p.sold,
      revenue: (p.price * p.sold).toLocaleString("vi-VN") + "đ",
      img:     Array.isArray(p.images) ? p.images[0] : p.image,
    }));

/* ── Phân loại Áo / Quần ── */
export const SHIRT_CATEGORIES = [
  "Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ",
];

export const PANTS_CATEGORIES = [
  "Jeans", "Jogger", "Cargo", "Shorts", "Kaki",
];

export const getCategoryCount = (cat) =>
  ALL_PRODUCTS.filter((p) => p.category === cat).length;

/* ── Status map dùng chung ── */
export const DASH_STATUS_MAP = {
  delivered:  { label: "Đã giao",   cls: "st-delivered"  },
  shipping:   { label: "Đang giao", cls: "st-shipping"   },
  processing: { label: "Xử lý",     cls: "st-processing" },
  cancelled:  { label: "Đã hủy",    cls: "st-cancelled"  },
};
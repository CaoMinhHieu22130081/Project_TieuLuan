// ── data/AdminOrdersData.js ──────────────────────────────────────
// Dữ liệu đơn hàng dùng cho trang Admin

import { ALL_PRODUCTS } from "./Products";

const RAW_ORDERS = [
  {
    id: "UNQ7F3K2",
    customer: "Nguyễn Thị Lan",
    phone: "0901 234 567",
    email: "lan@email.com",
    address: "123 Nguyễn Huệ, Q.1, TP.HCM",
    date: "15/03/2025",
    status: "delivered",
    items: [
      { productId: 1, qty: 1, size: "M",  color: "Đen" },
      { productId: 2, qty: 2, size: "L",  color: "Tím" },
    ],
    payment: "MoMo",
    shipping: 0,
  },
  {
    id: "UNQ2M9P1",
    customer: "Trần Quốc Bảo",
    phone: "0912 345 678",
    email: "bao@email.com",
    address: "45 Lê Lợi, Q.1, TP.HCM",
    date: "14/03/2025",
    status: "shipping",
    items: [
      { productId: 3, qty: 1, size: "XL", color: "Xám đậm" },
    ],
    payment: "COD",
    shipping: 30000,
  },
  {
    id: "UNQ5X8Q4",
    customer: "Lê Mỹ Duyên",
    phone: "0987 654 321",
    email: "duyen@email.com",
    address: "78 Trần Hưng Đạo, Q.5, TP.HCM",
    date: "14/03/2025",
    status: "processing",
    items: [
      { productId: 4, qty: 2, size: "S",  color: "Trắng"   },
      { productId: 5, qty: 1, size: "XS", color: "Nâu đất" },
      { productId: 6, qty: 1, size: "M",  color: "Đỏ"      },
    ],
    payment: "VNPAY",
    shipping: 0,
  },
  {
    id: "UNQ9R1Z7",
    customer: "Phạm Minh Tuấn",
    phone: "0932 111 222",
    email: "tuan@email.com",
    address: "12 Võ Văn Tần, Q.3, TP.HCM",
    date: "13/03/2025",
    status: "delivered",
    items: [
      { productId: 1, qty: 1, size: "L", color: "Xanh biển" },
    ],
    payment: "MoMo",
    shipping: 0,
  },
  {
    id: "UNQ4K2W3",
    customer: "Hoàng Thu Hương",
    phone: "0908 888 999",
    email: "huong@email.com",
    address: "90 Đinh Tiên Hoàng, Q.Bình Thạnh",
    date: "12/03/2025",
    status: "cancelled",
    items: [
      { productId: 7, qty: 2, size: "M", color: "Đen"        },
      { productId: 8, qty: 1, size: "S", color: "Xanh trắng" },
    ],
    payment: "Card",
    shipping: 0,
  },
  {
    id: "UNQ6L8M2",
    customer: "Vũ Thanh Long",
    phone: "0971 222 333",
    email: "long@email.com",
    address: "55 Cách Mạng T8, Q.10, TP.HCM",
    date: "11/03/2025",
    status: "pending",
    items: [
      { productId: 2, qty: 1, size: "M", color: "Kem" },
    ],
    payment: "COD",
    shipping: 30000,
  },
  {
    id: "UNQ3T9N5",
    customer: "Đinh Thị Mai",
    phone: "0965 444 555",
    email: "mai@email.com",
    address: "33 Phan Xích Long, Q.Phú Nhuận",
    date: "10/03/2025",
    status: "processing",
    items: [
      { productId: 3, qty: 1, size: "L", color: "Kem vàng"  },
      { productId: 4, qty: 1, size: "M", color: "Xanh mint" },
    ],
    payment: "VNPAY",
    shipping: 0,
  },
];

/* Tự tính tổng tiền từ Products data */
export const ORDERS_DATA = RAW_ORDERS.map((o) => {
  const itemsTotal = o.items.reduce((sum, { productId, qty }) => {
    const p = ALL_PRODUCTS.find((x) => x.id === productId);
    return sum + (p ? p.price * qty : 0);
  }, 0);
  return { ...o, total: itemsTotal + o.shipping };
});

export const STATUS_MAP = {
  pending:    { label: "Chờ xác nhận", cls: "st-pending",    next: "processing" },
  processing: { label: "Đang xử lý",   cls: "st-processing", next: "shipping"   },
  shipping:   { label: "Đang giao",    cls: "st-shipping",   next: "delivered"  },
  delivered:  { label: "Đã giao",      cls: "st-delivered",  next: null         },
  cancelled:  { label: "Đã hủy",       cls: "st-cancelled",  next: null         },
};

export const STATUS_TABS = [
  "Tất cả", "pending", "processing", "shipping", "delivered", "cancelled",
];
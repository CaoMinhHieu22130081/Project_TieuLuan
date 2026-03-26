// ── data/AdminUsersData.js ───────────────────────────────────────
// Dữ liệu người dùng dùng cho trang Admin

export const USERS_DATA = [
  { id: 1,  name: "Nguyễn Thị Lan",   email: "lan.nguyen@email.com",      phone: "0901 234 567", role: "customer", status: "active",   joined: "10/01/2025", orders: 5, spent: 1840000, avatar: "N" },
  { id: 2,  name: "Trần Quốc Bảo",    email: "bao.tran@email.com",        phone: "0912 345 678", role: "customer", status: "active",   joined: "15/01/2025", orders: 3, spent: 920000,  avatar: "T" },
  { id: 3,  name: "Lê Mỹ Duyên",      email: "duyen.le@email.com",        phone: "0987 654 321", role: "customer", status: "active",   joined: "20/01/2025", orders: 7, spent: 2610000, avatar: "L" },
  { id: 4,  name: "Phạm Minh Tuấn",   email: "tuan.pham@email.com",       phone: "0932 111 222", role: "customer", status: "inactive", joined: "05/02/2025", orders: 1, spent: 299000,  avatar: "P" },
  { id: 5,  name: "Hoàng Thu Hương",  email: "huong.hoang@email.com",     phone: "0908 888 999", role: "customer", status: "active",   joined: "12/02/2025", orders: 4, spent: 1340000, avatar: "H" },
  { id: 6,  name: "Vũ Thanh Long",    email: "long.vu@email.com",         phone: "0971 222 333", role: "customer", status: "blocked",  joined: "18/02/2025", orders: 2, spent: 678000,  avatar: "V" },
  { id: 7,  name: "Đinh Thị Mai",     email: "mai.dinh@email.com",        phone: "0965 444 555", role: "customer", status: "active",   joined: "01/03/2025", orders: 6, spent: 1987000, avatar: "Đ" },
  { id: 8,  name: "Cao Minh Hiếu",    email: "22130081@st.hcmuaf.edu.vn", phone: "0854 553 708", role: "admin",    status: "active",   joined: "01/01/2025", orders: 0, spent: 0,       avatar: "C" },
  { id: 9,  name: "Ngô Bảo Long",     email: "long.ngo@email.com",        phone: "0945 333 666", role: "customer", status: "active",   joined: "08/03/2025", orders: 2, spent: 728000,  avatar: "N" },
  { id: 10, name: "Phan Thúy Hằng",   email: "hang.phan@email.com",       phone: "0933 777 444", role: "staff",    status: "active",   joined: "01/02/2025", orders: 0, spent: 0,       avatar: "P" },
];

export const ROLE_MAP = {
  admin:    "role-admin",
  staff:    "role-staff",
  customer: "role-customer",
};

export const ROLE_LABEL = {
  admin:    "Admin",
  staff:    "Nhân viên",
  customer: "Khách hàng",
};

export const USER_STATUS_MAP = {
  active:   { label: "Hoạt động", cls: "st-delivered"  },
  inactive: { label: "Không HĐ",  cls: "st-processing" },
  blocked:  { label: "Đã khóa",   cls: "st-cancelled"  },
};
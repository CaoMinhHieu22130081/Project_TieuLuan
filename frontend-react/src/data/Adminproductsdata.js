// ── data/AdminProductsData.js ────────────────────────────────────
// Hằng số filter, category dùng cho trang Quản lý sản phẩm

export const PRODUCT_TYPES = ["Tất cả", "Áo", "Quần"];

export const CATEGORIES_AO = [
  "Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ",
];

export const CATEGORIES_QUAN = [
  "Jeans", "Jogger", "Cargo", "Shorts", "Kaki",
];

export const ALL_CATEGORIES = [
  "Tất cả", ...CATEGORIES_AO, ...CATEGORIES_QUAN,
];

export const TAG_OPTIONS = [
  { value: "",         label: "Không có"  },
  { value: "Mới",      label: "Mới"       },
  { value: "Bán chạy", label: "Bán chạy"  },
  { value: "Sale",     label: "Sale"      },
];

export const TAG_CSS = {
  "Bán chạy": "tag-hot",
  "Mới":      "tag-new",
  "Sale":     "tag-sale",
};

export const SORT_OPTIONS = [
  { value: "id",         label: "Mặc định"      },
  { value: "price_asc",  label: "Giá tăng dần"  },
  { value: "price_desc", label: "Giá giảm dần"  },
  { value: "sold",       label: "Bán chạy nhất" },
];

/* Blank form dùng khi thêm mới */
export const BLANK_PRODUCT_FORM = {
  type:          "Áo",
  name:          "",
  price:         "",
  originalPrice: "",
  category:      "Cơ bản",
  tag:           "",
  sku:           "",
  material:      "",
  description:   "",
};

/* Ảnh mặc định khi thêm sản phẩm mới */
export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop";
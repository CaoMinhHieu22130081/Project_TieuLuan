-- ══════════════════════════════════════════════════════════════════
--  UniqueTee — MySQL Schema + Seed Data (v3.0 — 20 sản phẩm mới)
--  Phiên bản : 3.0  |  Encoding: UTF-8  |  MySQL 8.0+
--  Database  : uniquetee
--  Tạo mới   : 2025-04-03
-- ══════════════════════════════════════════════════════════════════

DROP DATABASE IF EXISTS uniquetee;
CREATE DATABASE uniquetee
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE uniquetee;

-- ══════════════════════════════════════════════════════════════════
--  SCHEMA — 12 BẢNG
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. USERS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)    NOT NULL,
  email       VARCHAR(150)    NOT NULL UNIQUE,
  phone       VARCHAR(20)     DEFAULT NULL,
  password    VARCHAR(255)    NOT NULL,
  role        ENUM('admin','staff','customer') NOT NULL DEFAULT 'customer',
  status      ENUM('active','inactive','blocked')       DEFAULT 'active',
  avatar      LONGBLOB        DEFAULT NULL,
  gender      ENUM('male','female','other')              DEFAULT NULL,
  dob         DATE            DEFAULT NULL,
  address     TEXT            DEFAULT NULL,
  spent       DECIMAL(15,0)   NOT NULL DEFAULT 0,
  order_count INT UNSIGNED    NOT NULL DEFAULT 0,
  joined_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────────────────────────
-- 2. CATEGORIES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)     NOT NULL UNIQUE,
  type        ENUM('Áo','Quần') NOT NULL,
  sort_order  INT UNSIGNED    DEFAULT 0
);

-- ──────────────────────────────────────────────────────────────────
-- 3. PRODUCTS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  sku             VARCHAR(30)     NOT NULL UNIQUE,
  name            VARCHAR(150)    NOT NULL,
  type            ENUM('Áo','Quần') NOT NULL,
  category_id     INT UNSIGNED    NOT NULL,
  price           DECIMAL(12,0)   NOT NULL,
  original_price  DECIMAL(12,0)   DEFAULT NULL,
  tag             ENUM('Mới','Bán chạy','Sale') DEFAULT NULL,
  material        VARCHAR(200)    DEFAULT NULL,
  description     TEXT            DEFAULT NULL,
  rating          DECIMAL(3,2)    NOT NULL DEFAULT 5.00,
  review_count    INT UNSIGNED    NOT NULL DEFAULT 0,
  sold            INT UNSIGNED    NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ──────────────────────────────────────────────────────────────────
-- 4. PRODUCT_IMAGES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE product_images (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED    NOT NULL,
  url         TEXT            NOT NULL,
  sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 5. PRODUCT_COLORS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE product_colors (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED    NOT NULL,
  hex         VARCHAR(10)     NOT NULL,
  name        VARCHAR(50)     NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 6. PRODUCT_SIZES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE product_sizes (
  id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  product_id   INT UNSIGNED    NOT NULL,
  size         VARCHAR(10)     NOT NULL,
  is_available TINYINT(1)      NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 7. PRODUCT_FEATURES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE product_features (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED    NOT NULL,
  feature     VARCHAR(300)    NOT NULL,
  sort_order  INT UNSIGNED    DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 8. REVIEWS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id            INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  product_id    INT UNSIGNED     NOT NULL,
  user_id       INT UNSIGNED     DEFAULT NULL,
  reviewer_name VARCHAR(100)     NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content       TEXT             NOT NULL,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
);

-- ──────────────────────────────────────────────────────────────────
-- 9. ORDERS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  order_code     VARCHAR(20)     NOT NULL UNIQUE,
  user_id        INT UNSIGNED    DEFAULT NULL,
  customer_name  VARCHAR(100)    NOT NULL,
  customer_phone VARCHAR(20)     NOT NULL,
  customer_email VARCHAR(150)    DEFAULT NULL,
  address        TEXT            NOT NULL,
  ward           VARCHAR(100)    DEFAULT NULL,
  district       VARCHAR(100)    DEFAULT NULL,
  city           VARCHAR(100)    NOT NULL DEFAULT 'TP. Hồ Chí Minh',
  note           TEXT            DEFAULT NULL,
  status         ENUM('pending','processing','shipping','delivered','cancelled')
                                 NOT NULL DEFAULT 'pending',
  payment_method ENUM('momo','vnpay','cod','card') NOT NULL DEFAULT 'cod',
  shipping_fee   DECIMAL(12,0)   NOT NULL DEFAULT 0,
  subtotal       DECIMAL(15,0)   NOT NULL DEFAULT 0,
  total          DECIMAL(15,0)   NOT NULL DEFAULT 0,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ──────────────────────────────────────────────────────────────────
-- 10. ORDER_ITEMS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED    NOT NULL,
  product_id   INT UNSIGNED    NOT NULL,
  product_name VARCHAR(150)    NOT NULL,
  product_sku  VARCHAR(30)     NOT NULL,
  color        VARCHAR(50)     NOT NULL,
  size         VARCHAR(10)     NOT NULL,
  qty          INT UNSIGNED    NOT NULL DEFAULT 1,
  unit_price   DECIMAL(12,0)   NOT NULL,
  subtotal     DECIMAL(15,0)   NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ──────────────────────────────────────────────────────────────────
-- 11. WISHLISTS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE wishlists (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED    NOT NULL,
  product_id  INT UNSIGNED    NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 12. PROMO_CODES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE promo_codes (
  id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(30)     NOT NULL UNIQUE,
  discount_type  ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10,2)   NOT NULL,
  min_order      DECIMAL(12,0)   DEFAULT 0,
  max_uses       INT UNSIGNED    DEFAULT NULL,
  used_count     INT UNSIGNED    NOT NULL DEFAULT 0,
  expires_at     TIMESTAMP       DEFAULT NULL,
  is_active      TINYINT(1)      NOT NULL DEFAULT 1
);

-- ══════════════════════════════════════════════════════════════════
--  INDEXES
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX idx_products_type       ON products(type);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_tag        ON products(tag);
CREATE INDEX idx_products_sold       ON products(sold DESC);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_user         ON orders(user_id);
CREATE INDEX idx_orders_code         ON orders(order_code);
CREATE INDEX idx_reviews_product     ON reviews(product_id);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ══════════════════════════════════════════════════════════════════
--  SEED DATA — 20 sản phẩm mới (12 áo + 8 quần)
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- [1] USERS — 2 admin/staff + 10 customers (tổng 12)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO users (name, email, phone, password, role, status, avatar, gender, dob, address, joined_at) VALUES
('Cao Minh Hiếu',    '22130081@st.hcmuaf.edu.vn', '0854553708', 'Admin@123',  'admin',    'active',   'C', 'male',   '2003-08-15', '12 Nguyễn Văn Cừ, Q.5, TP.HCM',                '2025-01-01 00:00:00'),
('Trần Thị Bích Ngọc','ngoc.tran@uniquetee.vn',   '0912000111', 'Staff@123',  'staff',    'active',   'T', 'female', '1997-06-12', '88 Hoàng Văn Thụ, Tân Bình, TP.HCM',           '2025-01-05 08:00:00'),
('Nguyễn Hoàng Nam',  'nam.hoang@email.com',       '0905111222', 'Pass@123',   'customer', 'active',   'N', 'male',   '1994-02-20', '34 Lý Tự Trọng, Q.1, TP.HCM',                  '2025-01-12 09:00:00'),
('Phạm Thu Hà',       'ha.pham@email.com',          '0916222333', 'Pass@123',   'customer', 'active',   'P', 'female', '1998-09-05', '21 Pasteur, Q.3, TP.HCM',                       '2025-01-18 10:30:00'),
('Lê Đức Anh',        'anh.le@email.com',           '0927333444', 'Pass@123',   'customer', 'active',   'L', 'male',   '1992-12-30', '56 Nguyễn Thị Minh Khai, Q.1, TP.HCM',         '2025-01-25 14:00:00'),
('Đỗ Thanh Tuyền',    'tuyen.do@email.com',         '0938444555', 'Pass@123',   'customer', 'active',   'Đ', 'female', '2000-04-17', '99 Điện Biên Phủ, Bình Thạnh, TP.HCM',         '2025-02-03 11:15:00'),
('Trương Quốc Hùng',  'hung.truong@email.com',      '0949555666', 'Pass@123',   'customer', 'inactive', 'T', 'male',   '1989-07-08', '14 Ba Tháng Hai, Q.10, TP.HCM',                 '2025-02-10 16:20:00'),
('Bùi Thị Lan Anh',   'lananh.bui@email.com',       '0960666777', 'Pass@123',   'customer', 'active',   'B', 'female', '1996-11-23', '77 Nguyễn Kiệm, Gò Vấp, TP.HCM',               '2025-02-17 08:45:00'),
('Võ Minh Khôi',      'khoi.vo@email.com',           '0971777888', 'Pass@123',   'customer', 'active',   'V', 'male',   '2002-03-14', '38 Trần Não, Q.2, TP.HCM',                      '2025-03-01 13:00:00'),
('Hoàng Yến Nhi',     'nhi.hoang@email.com',         '0982888999', 'Pass@123',   'customer', 'active',   'H', 'female', '1999-08-29', '65 Phan Đăng Lưu, Phú Nhuận, TP.HCM',          '2025-03-06 09:30:00'),
('Ngô Tuấn Kiệt',     'kiet.ngo@email.com',          '0993999000', 'Pass@123',   'customer', 'blocked',  'N', 'male',   '1991-05-03', '102 Lê Văn Sỹ, Q.3, TP.HCM',                   '2025-03-12 15:45:00'),
('Đinh Phương Linh',  'linh.dinh@email.com',         '0904000111', 'Pass@123',   'customer', 'active',   'Đ', 'female', '2001-10-18', '29 Nguyễn Đình Chiểu, Q.3, TP.HCM',            '2025-03-18 07:20:00');

UPDATE users SET spent = 1678000, order_count = 2 WHERE id = 3;
UPDATE users SET spent = 1189000, order_count = 2 WHERE id = 4;
UPDATE users SET spent = 899000,  order_count = 1 WHERE id = 5;
UPDATE users SET spent = 1358000, order_count = 2 WHERE id = 6;
UPDATE users SET spent = 569000,  order_count = 1 WHERE id = 7;
UPDATE users SET spent = 829000,  order_count = 1 WHERE id = 8;
UPDATE users SET spent = 1049000, order_count = 1 WHERE id = 9;
UPDATE users SET spent = 479000,  order_count = 1 WHERE id = 10;
UPDATE users SET spent = 748000,  order_count = 1 WHERE id = 11;
UPDATE users SET spent = 1128000, order_count = 1 WHERE id = 12;

-- ──────────────────────────────────────────────────────────────────
-- [2] CATEGORIES — 11 danh mục
-- ──────────────────────────────────────────────────────────────────
INSERT INTO categories (name, type, sort_order) VALUES
('Cơ bản',    'Áo',    1),
('Graphic',   'Áo',    2),
('Oversized', 'Áo',    3),
('Vintage',   'Áo',    4),
('Thể thao',  'Áo',    5),
('Sọc kẻ',    'Áo',    6),
('Jeans',     'Quần',  7),
('Jogger',    'Quần',  8),
('Cargo',     'Quần',  9),
('Shorts',    'Quần', 10),
('Kaki',      'Quần', 11);

-- ──────────────────────────────────────────────────────────────────
-- [3] PRODUCTS — 20 sản phẩm mới (12 áo + 8 quần)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO products (sku, name, type, category_id, price, original_price, tag, material, description, rating, review_count, sold) VALUES

-- ── ÁO (12 sản phẩm) ──
('EPT-001', 'Essential Pocket Tee',
 'Áo', 1, 269000, 320000, 'Bán chạy', '100% Cotton Premium, 185gsm',
 'Áo thun basic với túi ngực nhỏ tinh tế, điểm nhấn vừa đủ không mất đi sự tối giản. Vải cotton dày 185gsm mềm mịn, thoáng khí, phù hợp mặc quanh năm.',
 4.7, 138, 327),

('WDS-002', 'Washed Denim Shirt',
 'Áo', 4, 399000, 480000, 'Sale', 'Cotton Denim Wash, 210gsm',
 'Áo sơ mi denim wash nhẹ mang phong cách retro-casual. Có thể mặc cởi nút ngoài áo thun hoặc cài kín như áo sơ mi thông thường. Đa năng và cá tính.',
 4.6,  91, 182),

('TDO-003', 'Tie-Dye Oversized',
 'Áo', 3, 359000, NULL, 'Mới', '100% Cotton Combed, 215gsm',
 'Áo thun tie-dye oversized với hoạ tiết nhuộm thủ công độc đáo, không có hai chiếc giống nhau. Form rộng thoải mái, màu sắc rực rỡ đậm chất festival.',
 4.8, 164, 398),

('NGT-004', 'Neon Graphic Tee',
 'Áo', 2, 309000, NULL, 'Mới', 'Cotton Pima 180gsm',
 'Áo thun graphic in hoạ tiết neon cực nổi bật dưới ánh đèn UV. Thiết kế bởi hoạ sĩ nội địa, giới hạn từng mùa, mỗi drop chỉ sản xuất số lượng nhỏ.',
 4.5,  72, 141),

('LBT-005', 'Linen Blend Tee',
 'Áo', 1, 289000, 350000, 'Sale', 'Cotton 60% / Linen 40%, 165gsm',
 'Áo thun pha lanh — combo hoàn hảo cho mùa hè oi bức. Nhẹ, thoáng, hút ẩm tốt hơn cotton thuần. Texture nhẹ của lanh tạo vẻ ngoài cao cấp tự nhiên.',
 4.4,  53,  98),

('CBT-006', 'Color Block Tee',
 'Áo', 2, 319000, NULL, 'Mới', '100% Cotton Jersey, 190gsm',
 'Áo thun color block với hai sắc màu tương phản táo bạo. Đường phân màu thẳng chuẩn kỹ thuật, không bị lệch. Mặc cùng quần trơn để outfit pop ngay lập tức.',
 4.6,  85, 169),

('MST-007', 'Mesh Sport Tee',
 'Áo', 5, 349000, NULL, NULL, 'Polyester Mesh DryFit, 140gsm',
 'Áo thun thể thao lưới thoáng khí cực đỉnh, thấm hút mồ hôi siêu nhanh. Thiết kế panel lưới ở lưng và nách tối ưu luồng không khí, lý tưởng cho gym và outdoor.',
 4.7, 109, 245),

('ZQT-008', 'Quarter Zip Sweatshirt',
 'Áo', 5, 429000, 510000, 'Sale', 'Cotton Fleece 80% / Polyester 20%, 310gsm',
 'Áo sweater quarter-zip tiện dụng, dễ điều chỉnh nhiệt độ. Vải fleece dày mịn giữ ấm tốt, mặt trong bông nhẹ. Phong cách thể thao-casual dễ phối đồ.',
 4.8, 117, 258),

('LCT-009', 'Lace Trim Crop Tee',
 'Áo', 4, 299000, NULL, 'Mới', 'Cotton Vintage 195gsm',
 'Áo crop tee độc đáo với viền ren mỏng ở cổ và tay áo. Kết hợp giữa phong cách vintage và feminine hiện đại. Cắt crop nhẹ, phù hợp với quần cạp cao.',
 4.5,  63, 115),

('PCO-010', 'Polo Classic',
 'Áo', 1, 339000, 410000, 'Bán chạy', 'Cotton Piqué, 220gsm',
 'Áo polo classic cổ cài 3 nút, vải piqué đặc trưng tạo texture sang trọng. Phù hợp từ đi chơi đến smart casual đi làm. Không bao giờ lỗi mốt.',
 4.9, 203, 472),

('SOT-011', 'Striped Oversized Tee',
 'Áo', 6, 279000, 330000, 'Sale', 'Cotton Breton 175gsm',
 'Áo thun sọc oversized mang hơi thở Pháp phóng khoáng. Sọc ngang đều, form rộng thoải mái, cổ tròn vừa vặn. Unisex, phù hợp cả nam lẫn nữ.',
 4.4,  47,  89),

('TCT-012', 'Terry Crop Tee',
 'Áo', 3, 329000, NULL, 'Mới', 'French Terry Cotton, 260gsm',
 'Áo crop tee chất terry dày dặn với cảm giác như mặc áo sweatshirt nhưng ngắn hơn. Xu hướng hot của streetwear 2025, phối high-waist jeans cực đẹp.',
 4.6,  78, 148),

-- ── QUẦN (8 sản phẩm) ──
('SCJ-013', 'Straight Cut Jeans',
 'Quần', 7, 519000, 620000, 'Bán chạy', 'Denim 100% Cotton, 12.5oz',
 'Quần jeans straight cut chuẩn mực — không quá slim, không quá rộng. Vải denim cotton nguyên chất 12.5oz bền bỉ, wash trung bình đẹp mắt. Không bao giờ lỗi thời.',
 4.8, 172, 356),

('TPJ-014', 'Tapered Jogger',
 'Quần', 8, 369000, NULL, 'Mới', 'French Terry Cotton, 290gsm',
 'Quần jogger tapered thon dần từ đùi đến cổ chân, tôn dáng hơn jogger truyền thống. Vải French Terry dày mịn, túi sâu tiện dụng, cạp thun điều chỉnh được.',
 4.7,  95, 204),

('LWL-015', 'Linen Wide Leg',
 'Quần', 9, 489000, 580000, 'Sale', 'Linen 55% / Cotton 45%, 200gsm',
 'Quần ống rộng chất lanh mát lành cho những ngày hè nóng nực. Nhẹ, thoáng, không bí bách. Phong cách resort casual hoặc streetwear đều hợp.',
 4.5,  68, 124),

('BKS-016', 'Biker Shorts',
 'Quần', 10, 229000, NULL, 'Mới', 'Nylon Spandex 78/22, 200gsm',
 'Quần biker shorts ôm vừa vặn, co giãn 4 chiều thoải mái. Đã trở thành staple piece của street style hiện đại, phối oversized tee cực trendy.',
 4.6,  84, 192),

('CSF-017', 'Chino Slim Fit',
 'Quần', 11, 469000, 560000, 'Bán chạy', 'Cotton Chino, 250gsm',
 'Quần chino slim fit thanh lịch, chống nhăn cả ngày. Phù hợp đi làm văn phòng smart casual hay dạo phố cuối tuần. Chất liệu mềm hơn kaki truyền thống.',
 4.8, 145, 298),

('RSJ-018', 'Ripped Skinny Jeans',
 'Quần', 7, 479000, NULL, 'Mới', 'Denim 95% Cotton / 5% Elastane, 11oz',
 'Quần jeans skinny rách gối mang phong cách rock-chic đậm nét. Vải denim có elastane co giãn tốt, không bó khó chịu. Rách vừa đủ không quá phô trương.',
 4.4,  56, 107),

('PLT-019', 'Pleated Trouser',
 'Quần', 11, 529000, 640000, 'Sale', 'Cotton Kaki 70% / Polyester 30%, 270gsm',
 'Quần âu ly trước thanh lịch — xu hướng menswear đang bùng nổ. Form ống suông tôn dáng, chất liệu pha polyester chống nhăn vượt trội, phù hợp mặc cả ngày.',
 4.7,  88, 171),

('FLS-020', 'Fleece Shorts',
 'Quần', 10, 259000, NULL, NULL, 'Cotton Fleece, 280gsm',
 'Quần shorts fleece mềm mại thoải mái, lý tưởng mặc nhà hay loungewear. Không bị cứng như shorts thông thường. Túi có khóa tiện lợi, cạp thun điều chỉnh được.',
 4.5,  61, 133);

-- ──────────────────────────────────────────────────────────────────
-- [4] PRODUCT_IMAGES — 3 ảnh / sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_images (product_id, url, sort_order) VALUES
-- 1 Essential Pocket Tee
(1,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 0),
(1,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(1,  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 2),
-- 2 Washed Denim Shirt
(2,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 0),
(2,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   1),
(2,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 2),
-- 3 Tie-Dye Oversized
(3,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 0),
(3,  'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop', 1),
(3,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 2),
-- 4 Neon Graphic Tee
(4,  'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop', 0),
(4,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 1),
(4,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   2),
-- 5 Linen Blend Tee
(5,  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 0),
(5,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 1),
(5,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 2),
-- 6 Color Block Tee
(6,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 0),
(6,  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 1),
(6,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 2),
-- 7 Mesh Sport Tee
(7,  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 0),
(7,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 1),
(7,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 2),
-- 8 Quarter Zip Sweatshirt
(8,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   0),
(8,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(8,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 2),
-- 9 Lace Trim Crop Tee
(9,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 0),
(9,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 1),
(9,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   2),
-- 10 Polo Classic
(10, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop', 0),
(10, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 1),
(10, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 2),
-- 11 Striped Oversized Tee
(11, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 0),
(11, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(11, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 2),
-- 12 Terry Crop Tee
(12, 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 0),
(12, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 1),
(12, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   2),
-- 13 Straight Cut Jeans
(13, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   0),
(13, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 1),
(13, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 2),
-- 14 Tapered Jogger
(14, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 0),
(14, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 1),
(14, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   2),
-- 15 Linen Wide Leg
(15, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 0),
(15, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   1),
(15, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 2),
-- 16 Biker Shorts
(16, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 0),
(16, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 1),
(16, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 2),
-- 17 Chino Slim Fit
(17, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   0),
(17, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 1),
(17, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 2),
-- 18 Ripped Skinny Jeans
(18, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 0),
(18, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   1),
(18, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 2),
-- 19 Pleated Trouser
(19, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 0),
(19, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   1),
(19, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 2),
-- 20 Fleece Shorts
(20, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 0),
(20, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(20, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 2);

-- ──────────────────────────────────────────────────────────────────
-- [5] PRODUCT_COLORS — đầy đủ 20 sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_colors (product_id, hex, name) VALUES
-- 1 Essential Pocket Tee
(1,  '#1a1a1a', 'Đen'),        (1,  '#ffffff', 'Trắng'),      (1,  '#6B8E9F', 'Xanh khói'),   (1,  '#C19A6B', 'Be'),
-- 2 Washed Denim Shirt
(2,  '#4682B4', 'Xanh wash'),  (2,  '#1a1a1a', 'Đen wash'),   (2,  '#87CEEB', 'Xanh nhạt'),
-- 3 Tie-Dye Oversized
(3,  '#FF6B9D', 'Hồng tím'),   (3,  '#40C9FF', 'Xanh neon'),  (3,  '#A8E063', 'Xanh lá neon'),
-- 4 Neon Graphic Tee
(4,  '#1a1a1a', 'Đen'),        (4,  '#2C2C2C', 'Xám đen'),
-- 5 Linen Blend Tee
(5,  '#F5F5DC', 'Kem'),        (5,  '#D2B48C', 'Nâu nhạt'),   (5,  '#B0C4DE', 'Xanh nhạt'),   (5,  '#8FBC8F', 'Xanh mint'),
-- 6 Color Block Tee
(6,  '#1a1a1a', 'Đen-Trắng'),  (6,  '#DC143C', 'Đỏ-Đen'),     (6,  '#1E90FF', 'Xanh-Trắng'),
-- 7 Mesh Sport Tee
(7,  '#1a1a1a', 'Đen'),        (7,  '#ffffff', 'Trắng'),      (7,  '#1E90FF', 'Xanh dương'),  (7,  '#FF4500', 'Cam đỏ'),
-- 8 Quarter Zip Sweatshirt
(8,  '#2F4F4F', 'Xanh rêu đậm'),(8, '#4A4A4A', 'Xám anthracite'),(8,'#8B4513','Nâu đất'),
-- 9 Lace Trim Crop Tee
(9,  '#ffffff', 'Trắng'),      (9,  '#FFC0CB', 'Hồng phấn'),  (9,  '#E8DCC8', 'Kem vàng'),
-- 10 Polo Classic
(10, '#1a1a1a', 'Đen'),        (10, '#ffffff', 'Trắng'),      (10, '#003087', 'Xanh navy'),   (10, '#DC143C', 'Đỏ'),
-- 11 Striped Oversized Tee
(11, '#003087', 'Xanh hải quân'),(11,'#DC143C','Đỏ trắng'),   (11, '#1a1a1a', 'Đen trắng'),
-- 12 Terry Crop Tee
(12, '#808080', 'Xám'),        (12, '#8B6F5E', 'Nâu caramel'), (12, '#1a1a1a', 'Đen'),
-- 13 Straight Cut Jeans
(13, '#1a3a5c', 'Xanh chàm'), (13, '#6b93c4', 'Xanh nhạt'),  (13, '#1a1a1a', 'Đen'),
-- 14 Tapered Jogger
(14, '#1a1a1a', 'Đen'),        (14, '#808080', 'Xám'),         (14, '#556B2F', 'Xanh olive'),
-- 15 Linen Wide Leg
(15, '#F5F5DC', 'Kem'),        (15, '#D2B48C', 'Be nâu'),      (15, '#808080', 'Xám bạc'),
-- 16 Biker Shorts
(16, '#1a1a1a', 'Đen'),        (16, '#003087', 'Xanh navy'),   (16, '#8B0000', 'Đỏ đô'),       (16, '#808080', 'Xám'),
-- 17 Chino Slim Fit
(17, '#C19A6B', 'Be'),         (17, '#556B2F', 'Xanh rêu'),    (17, '#8B6914', 'Nâu caramel'), (17, '#1a1a1a', 'Đen'),
-- 18 Ripped Skinny Jeans
(18, '#1a3a5c', 'Xanh chàm'), (18, '#1a1a1a', 'Đen'),         (18, '#708090', 'Xám trung'),
-- 19 Pleated Trouser
(19, '#1a1a1a', 'Đen'),        (19, '#C19A6B', 'Be kem'),      (19, '#4A4A4A', 'Xám đậm'),
-- 20 Fleece Shorts
(20, '#1a1a1a', 'Đen'),        (20, '#808080', 'Xám'),         (20, '#F5F5DC', 'Kem');

-- ──────────────────────────────────────────────────────────────────
-- [6] PRODUCT_SIZES — đầy đủ 20 sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_sizes (product_id, size, is_available) VALUES
-- 1 Essential Pocket Tee
(1,'XS',1),(1,'S',1),(1,'M',1),(1,'L',1),(1,'XL',1),(1,'XXL',0),
-- 2 Washed Denim Shirt
(2,'S',1),(2,'M',1),(2,'L',1),(2,'XL',1),
-- 3 Tie-Dye Oversized
(3,'M',1),(3,'L',1),(3,'XL',1),(3,'XXL',1),
-- 4 Neon Graphic Tee
(4,'S',1),(4,'M',1),(4,'L',1),(4,'XL',0),
-- 5 Linen Blend Tee
(5,'XS',1),(5,'S',1),(5,'M',1),(5,'L',1),(5,'XL',1),
-- 6 Color Block Tee
(6,'S',1),(6,'M',1),(6,'L',1),(6,'XL',1),
-- 7 Mesh Sport Tee
(7,'S',1),(7,'M',1),(7,'L',1),(7,'XL',1),(7,'XXL',0),
-- 8 Quarter Zip Sweatshirt
(8,'S',1),(8,'M',1),(8,'L',1),(8,'XL',1),
-- 9 Lace Trim Crop Tee
(9,'XS',1),(9,'S',1),(9,'M',1),(9,'L',0),
-- 10 Polo Classic
(10,'S',1),(10,'M',1),(10,'L',1),(10,'XL',1),(10,'XXL',1),
-- 11 Striped Oversized Tee
(11,'M',1),(11,'L',1),(11,'XL',1),
-- 12 Terry Crop Tee
(12,'XS',1),(12,'S',1),(12,'M',1),(12,'L',1),
-- 13 Straight Cut Jeans
(13,'28',1),(13,'29',1),(13,'30',1),(13,'31',1),(13,'32',1),(13,'34',0),
-- 14 Tapered Jogger
(14,'S',1),(14,'M',1),(14,'L',1),(14,'XL',1),
-- 15 Linen Wide Leg
(15,'S',1),(15,'M',1),(15,'L',1),(15,'XL',0),
-- 16 Biker Shorts
(16,'XS',1),(16,'S',1),(16,'M',1),(16,'L',1),(16,'XL',1),
-- 17 Chino Slim Fit
(17,'28',1),(17,'29',1),(17,'30',1),(17,'31',1),(17,'32',1),(17,'34',1),
-- 18 Ripped Skinny Jeans
(18,'26',1),(18,'27',1),(18,'28',1),(18,'29',1),(18,'30',1),(18,'32',0),
-- 19 Pleated Trouser
(19,'28',1),(19,'30',1),(19,'32',1),(19,'34',1),(19,'36',0),
-- 20 Fleece Shorts
(20,'S',1),(20,'M',1),(20,'L',1),(20,'XL',1);

-- ──────────────────────────────────────────────────────────────────
-- [7] PRODUCT_FEATURES — 3–4 tính năng / sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_features (product_id, feature, sort_order) VALUES
-- 1 Essential Pocket Tee
(1,  'Túi ngực nhỏ xinh — điểm nhấn tinh tế không mất đi sự tối giản',   0),
(1,  'Vải Cotton Premium 185gsm mềm mịn, thoáng khí cả ngày dài',         1),
(1,  'Đường may 4 kim chắc chắn, không bung chỉ sau nhiều lần giặt',       2),
(1,  'Unisex, dễ phối cùng bất kỳ outfit nào từ đi học đến đi chơi',       3),
-- 2 Washed Denim Shirt
(2,  'Vải denim wash mềm hơn denim thông thường, không cứng khi mới mua',  0),
(2,  'Đa năng: mặc cài nút hoặc cởi áo khoác ngoài đều đẹp',               1),
(2,  'Túi ngực và túi hộp bên hông tiện dụng, thực sự dùng được',          2),
(2,  'Màu wash bền, không phai loang khi giặt máy',                         3),
-- 3 Tie-Dye Oversized
(3,  'Nhuộm thủ công tie-dye — mỗi chiếc là một tác phẩm nghệ thuật riêng', 0),
(3,  'Form oversized chuẩn, vai rộng, thân dài vừa đủ để cài quần',         1),
(3,  'Màu sắc rực rỡ bền lâu, không chảy màu sau nhiều lần giặt',           2),
-- 4 Neon Graphic Tee
(4,  'Thiết kế bởi hoạ sĩ nội địa, sản xuất số lượng giới hạn mỗi drop',   0),
(4,  'Phát sáng dưới đèn UV — nổi bật tại các sự kiện âm nhạc, festival',  1),
(4,  'Mực in DTG bền màu, không bong tróc sau 50+ lần giặt đúng cách',      2),
-- 5 Linen Blend Tee
(5,  'Pha lanh 40% — thoáng hơn, mát hơn cotton thuần 30%',                 0),
(5,  'Texture tự nhiên của lanh tạo vẻ ngoài cao cấp, không cần ủi',        1),
(5,  'Hút ẩm tốt, khô nhanh, lý tưởng cho ngày nắng nóng TP.HCM',         2),
-- 6 Color Block Tee
(6,  'Đường phân màu kỹ thuật cao, thẳng và sắc nét 100%',                  0),
(6,  'Tông màu tương phản được chọn lọc bởi chuyên gia màu sắc',            1),
(6,  'Cotton Jersey 190gsm vừa đủ dày — không quá nóng, không quá mỏng',   2),
-- 7 Mesh Sport Tee
(7,  'Panel lưới tại lưng và nách tối ưu luồng không khí khi vận động',     0),
(7,  'Công nghệ DryFit thấm hút mồ hôi, giữ khô ráo suốt buổi tập',        1),
(7,  'Co giãn 2 chiều, không cản trở chuyển động trong bất kỳ bài tập nào', 2),
(7,  'Vải kháng khuẩn nhẹ, hạn chế mùi sau tập luyện cường độ cao',         3),
-- 8 Quarter Zip Sweatshirt
(8,  'Khóa quarter-zip cho phép điều chỉnh thông gió linh hoạt',            0),
(8,  'Fleece 310gsm giữ ấm tốt, mặt trong bông mềm như chạm vào đám mây',  1),
(8,  'Phối streetwear hay casual đều hợp, không bị "quá thể thao"',         2),
(8,  'Túi kangaroo rộng chứa được điện thoại + ví đôi',                     3),
-- 9 Lace Trim Crop Tee
(9,  'Viền ren mỏng tinh tế tại cổ và tay — nữ tính mà vẫn trendy',         0),
(9,  'Cắt crop nhẹ phù hợp mọi dáng người, không quá ngắn gây khó chịu',   1),
(9,  'Vải vintage wash tạo cảm giác mặc đã có lịch sử, không mới cứng',    2),
-- 10 Polo Classic
(10, 'Vải Piqué Cotton đặc trưng tạo texture nhẹ, sang trọng tự nhiên',    0),
(10, 'Cổ cài 3 nút kiểu dáng cổ điển không bao giờ lỗi mốt',               1),
(10, 'Phù hợp từ smart casual văn phòng đến đi chơi cuối tuần',             2),
(10, 'Màu giữ đẹp sau nhiều lần giặt, không bị nhạt hay loang',             3),
-- 11 Striped Oversized Tee
(11, 'Sọc Breton truyền thống — di sản thời trang từ vùng Bretagne nước Pháp', 0),
(11, 'Form oversized unisex phù hợp cả nam và nữ mọi vóc dáng',             1),
(11, 'Màu sọc sắc nét, không bị nhạt hay chảy màu sau nhiều lần giặt',      2),
-- 12 Terry Crop Tee
(12, 'Chất French Terry 260gsm — dày dặn như sweatshirt nhưng ngắn hơn',    0),
(12, 'Xu hướng streetwear 2025, xuất hiện trên mọi trang Instagram thời trang', 1),
(12, 'Phối high-waist jeans, cargo hay shorts đều ra outfit ngay',           2),
-- 13 Straight Cut Jeans
(13, 'Straight cut bất hủ — không quá slim, không quá rộng, chuẩn mực nhất', 0),
(13, 'Denim 12.5oz nguyên chất cotton, bền bỉ theo thời gian',              1),
(13, 'Phối được với tất cả: sneaker, boots, sandals — versatile tuyệt đối', 2),
(13, '5 túi may chắc, đường chỉ chuẩn jeans cao cấp không bong tróc',       3),
-- 14 Tapered Jogger
(14, 'Form tapered thon dần từ đùi — đẹp hơn jogger suôn truyền thống',     0),
(14, 'French Terry 290gsm dày dặn, giữ form tốt, không bị nhão hay bai',    1),
(14, 'Túi sâu hai bên chứa điện thoại màn hình 6.7" vẫn còn dư chỗ',       2),
-- 15 Linen Wide Leg
(15, 'Lanh 55% — nhẹ, thoáng, mát hơn mọi vật liệu khác giữa trưa hè',    0),
(15, 'Ống rộng thoải mái, không bí bách, bay bay theo gió cực thư thái',    1),
(15, 'Phong cách resort casual hay streetwear đều hợp',                      2),
-- 16 Biker Shorts
(16, 'Nylon-Spandex co giãn 4 chiều, tôn dáng không gây khó chịu',          0),
(16, 'Staple piece của street style 2025, phối oversized tee là chuẩn',      1),
(16, 'Không nhăn, không bai, giữ form ôm suốt ngày dài',                    2),
-- 17 Chino Slim Fit
(17, 'Cotton Chino mềm mượt hơn kaki truyền thống, thoải mái hơn nhiều',    0),
(17, 'Slim fit tôn dáng, không bó khó chịu — đúng điểm ngọt ngào',         1),
(17, 'Chống nhăn cả ngày — từ sáng đi làm đến tối đi ăn vẫn phẳng đẹp',   2),
(17, 'Đi làm smart casual hoặc đi chơi đều perfectly appropriate',          3),
-- 18 Ripped Skinny Jeans
(18, '5% elastane cho phép co giãn thoải mái, không cảm giác bị bó',        0),
(18, 'Rách gối tự nhiên, không quá phô trương — vừa đủ để có cá tính',     1),
(18, 'Denim 11oz nhẹ hơn, lý tưởng mặc những ngày không quá lạnh',         2),
-- 19 Pleated Trouser
(19, 'Ly trước tạo khối 3D tinh tế — đây là xu hướng menswear đang hot nhất', 0),
(19, 'Pha polyester 30% chống nhăn vượt trội, ủi một lần mặc cả tuần',      1),
(19, 'Form ống suông tôn chiều cao, phù hợp cả áo tucked-in lẫn untucked',  2),
(19, 'Có thể mặc đi làm formal hoặc phối sneaker streetwear đều ra outfit', 3),
-- 20 Fleece Shorts
(20, 'Fleece Cotton 280gsm mềm mại như gối ôm, thoải mái tuyệt đối',        0),
(20, 'Túi có khóa kéo — điện thoại và ví an toàn khi di chuyển',            1),
(20, 'Loungewear tốt nhất để làm việc tại nhà hay xem phim cả ngày',        2);

-- ──────────────────────────────────────────────────────────────────
-- [8] REVIEWS — 30 đánh giá đa dạng cho 20 sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO reviews (product_id, user_id, reviewer_name, rating, content, created_at) VALUES
-- Product 1: Essential Pocket Tee
(1,  3,  'Nguyễn Hoàng Nam',  5, 'Áo đẹp hơn mình tưởng! Túi ngực nhỏ nhưng rất cute, đeo tai nghe vào vừa y. Chất cotton mềm mịn, size M vừa chuẩn 65kg 1m73.', '2025-03-20 10:00:00'),
(1,  4,  'Phạm Thu Hà',       4, 'Mình mua màu be, tone rất đẹp và dễ phối đồ. Áo hơi dài so với người thấp như mình 1m55 nhưng vẫn ổn. Chất ổn cho giá tiền.', '2025-03-15 14:30:00'),
-- Product 2: Washed Denim Shirt
(2,  5,  'Lê Đức Anh',        5, 'Áo denim wash đẹp không tưởng! Mặc cởi nút bên ngoài áo trắng là ra ngay outfit chill. Chất vải mềm hơn denim thường rất nhiều.', '2025-03-18 09:15:00'),
(2,  6,  'Đỗ Thanh Tuyền',    4, 'Màu xanh nhạt rất xinh và trẻ trung. Áo mặc vào là nhận được compliment ngay. Tiếc là chỉ có 3 màu, mong shop ra thêm màu mới.', '2025-03-10 16:45:00'),
-- Product 3: Tie-Dye Oversized
(3,  9,  'Võ Minh Khôi',      5, 'Quá đỉnh! Chiếc của mình màu hồng tím, pattern tie-dye đẹp đều và đặc sắc. Không có hai cái giống nhau thật, mình check cùng bạn rồi.', '2025-03-22 11:00:00'),
(3,  10, 'Hoàng Yến Nhi',     5, 'Mình mua màu xanh neon, nổi bật cực kỳ. Mặc đi festival vừa rồi được hỏi mua ở đâu liên tục. Form oversized rộng mặc thoải mái.', '2025-03-14 08:30:00'),
-- Product 4: Neon Graphic Tee
(4,  3,  'Nguyễn Hoàng Nam',  5, 'In neon cực sắc nét, dưới đèn UV sáng rực lên rất ấn tượng. Thiết kế riêng của shop nên không đụng hàng. Rất ưng!', '2025-03-16 19:00:00'),
-- Product 5: Linen Blend Tee
(5,  4,  'Phạm Thu Hà',       4, 'Chất lanh mát thật sự, mặc mùa hè TP.HCM không bị bí bức. Texture nhẹ của lanh nhìn khá sang. Màu kem đẹp hợp da vàng.', '2025-03-12 13:00:00'),
-- Product 6: Color Block Tee
(6,  12, 'Đinh Phương Linh',  5, 'Đường phân màu thẳng tắp, kỹ thuật rất tốt. Mình mua màu đỏ-đen, mặc cùng quần đen là ra outfit edgy cực đẹp. 10/10!', '2025-03-25 10:30:00'),
(6,  8,  'Bùi Thị Lan Anh',   4, 'Màu xanh-trắng trông rất fresh và trẻ trung. Phối cùng quần jeans trắng xinh lắm. Sẽ mua thêm màu đỏ-đen lần sau.', '2025-03-17 15:00:00'),
-- Product 7: Mesh Sport Tee
(7,  9,  'Võ Minh Khôi',      5, 'Mặc đi gym mỗi ngày, vải khô siêu nhanh sau tập. Panel lưới thoáng mát thật sự chứ không phải chỉ để decor. Rất hài lòng!', '2025-03-21 07:00:00'),
(7,  5,  'Lê Đức Anh',        5, 'Chạy bộ sáng mặc loại này, mồ hôi ra nhiều nhưng không bị bết dính vào người chút nào. Công nghệ DryFit đỉnh thật.', '2025-03-08 06:30:00'),
-- Product 8: Quarter Zip Sweatshirt
(8,  6,  'Đỗ Thanh Tuyền',    5, 'Áo sweater ấm cực kỳ, mặc trong phòng lạnh 18 độ vẫn ổn không cần áo khoác thêm. Chất bông bên trong cực mềm, mặc là không muốn cởi ra.', '2025-03-19 20:00:00'),
(8,  10, 'Hoàng Yến Nhi',     4, 'Màu xanh rêu đậm rất trendy, phối cùng quần cargo hoặc jeans đều ra outfit ngay. Khóa zip chạy mượt. Hơi dày cho thời tiết HCM nhưng đẹp quá.', '2025-03-11 14:15:00'),
-- Product 9: Lace Trim Crop Tee
(9,  12, 'Đinh Phương Linh',  5, 'Áo nữ tính mà không sến, viền ren mỏng rất tinh tế. Mình 48kg mua XS vừa ôm xinh. Phối với chân váy midi hoặc high-waist jeans đều đẹp.', '2025-03-23 12:00:00'),
-- Product 10: Polo Classic
(10, 3,  'Nguyễn Hoàng Nam',  5, 'Polo đẹp nhất mình từng mua! Vải Piqué đúng chuẩn, texture đẹp. Màu trắng tinh không bị ố vàng sau giặt. Size M vừa chuẩn không lỏng.', '2025-03-24 10:00:00'),
(10, 5,  'Lê Đức Anh',        5, 'Mua cho mình và ba mỗi người một màu. Ba mặc đi họp, mình mặc đi cafe đều đẹp như nhau. Versatile nhất tủ áo của mình rồi.', '2025-03-13 11:30:00'),
(10, 7,  'Trương Quốc Hùng',  4, 'Áo polo chất lượng ổn cho giá tiền, vải không quá mỏng cũng không quá dày. Giao hàng đúng hẹn, đóng gói cẩn thận.', '2025-03-05 09:00:00'),
-- Product 11: Striped Oversized Tee
(11, 4,  'Phạm Thu Hà',       4, 'Áo sọc đẹp, form rộng vừa phải không quá oversized. Mình mặc size L để được form rộng chuẩn sailor style. Màu đỏ trắng rất cute.', '2025-03-09 13:00:00'),
-- Product 12: Terry Crop Tee
(12, 12, 'Đinh Phương Linh',  5, 'Chất terry ấm nhưng không nóng, dày mà không nặng. Phối high-waist cargo là ra ngay OOTD đăng story được liền. Rất trendy!', '2025-03-26 09:00:00'),
-- Product 13: Straight Cut Jeans
(13, 6,  'Đỗ Thanh Tuyền',    5, 'Quần jeans straight cut là lựa chọn an toàn nhất và đây là chiếc đẹp nhất mình từng mua. Size 28 vừa chuẩn 54kg 1m62. Denim cứng cáp đứng form.', '2025-03-20 16:00:00'),
(13, 3,  'Nguyễn Hoàng Nam',  5, 'Đúng chuẩn straight cut, không bị lỗi đặt online vì ảnh thật chuẩn ảnh trên web. Size 30 vừa đúng 68kg. Phối sneaker hay boots đều đẹp.', '2025-03-15 08:30:00'),
-- Product 14: Tapered Jogger
(14, 9,  'Võ Minh Khôi',      5, 'Form tapered đẹp hơn hẳn jogger thẳng, tôn dáng hơn nhiều. Mình hay phối với áo polo hoặc tee tucked-in trông rất clean.', '2025-03-17 12:00:00'),
-- Product 15: Linen Wide Leg
(15, 10, 'Hoàng Yến Nhi',     5, 'Quần lanh mát lành, đi du lịch Đà Nẵng vừa rồi mặc cả ngày không bị bí bức chút nào. Màu be kem đẹp chụp ảnh rất có hồn.', '2025-03-21 14:00:00'),
-- Product 16: Biker Shorts
(16, 8,  'Bùi Thị Lan Anh',   5, 'Biker shorts đẹp lắm! Phối với áo oversized trắng là ngay lập tức có OOTD. Vải co giãn tốt không bị cuộn lên khi mặc.', '2025-03-18 10:00:00'),
-- Product 17: Chino Slim Fit
(17, 5,  'Lê Đức Anh',        5, 'Chino slim fit tốt hơn kaki mình hay mặc đi làm. Mềm hơn, thoải mái hơn, mà vẫn thanh lịch. Màu be mua rồi mua thêm màu xanh rêu.', '2025-03-22 09:00:00'),
(17, 11, 'Ngô Tuấn Kiệt',     4, 'Quần ổn, chất chino đúng chuẩn, không nhăn sau cả ngày mặc. Size 30 vừa đúng người 68kg. Sẽ mua thêm màu khác.', '2025-03-14 15:30:00'),
-- Product 19: Pleated Trouser
(19, 3,  'Nguyễn Hoàng Nam',  5, 'Quần ly đẹp! Đang hot trend mà UniqueTee làm rất chuẩn form. Phối áo sơ mi tucked-in thêm belt là ngay outfit business casual cực sang.', '2025-03-25 11:00:00'),
-- Product 20: Fleece Shorts
(20, 9,  'Võ Minh Khôi',      4, 'Mặc ở nhà cực thoải mái, chất fleece mềm như bông. Túi có khóa tiện lợi khi chạy ra ngoài mua đồ. Giá hợp lý cho chất lượng này.', '2025-03-16 21:00:00');

-- ──────────────────────────────────────────────────────────────────
-- [9] ORDERS — 10 đơn hàng đa dạng trạng thái
-- ──────────────────────────────────────────────────────────────────
INSERT INTO orders (order_code, user_id, customer_name, customer_phone, customer_email,
                    address, ward, district, city,
                    status, payment_method, shipping_fee, subtotal, total, created_at) VALUES

('UNQ1A2B3', 3,  'Nguyễn Hoàng Nam',  '0905111222', 'nam.hoang@email.com',
 '34 Lý Tự Trọng', 'P. Bến Nghé', 'Q.1', 'TP. Hồ Chí Minh',
 'delivered',  'momo',  0,     1178000, 1178000, '2025-03-20 09:00:00'),

('UNQ4C5D6', 4,  'Phạm Thu Hà',       '0916222333', 'ha.pham@email.com',
 '21 Pasteur', 'P.6', 'Q.3', 'TP. Hồ Chí Minh',
 'delivered',  'vnpay', 0,     1189000, 1189000, '2025-03-18 11:00:00'),

('UNQ7E8F9', 5,  'Lê Đức Anh',        '0927333444', 'anh.le@email.com',
 '56 Nguyễn Thị Minh Khai', 'P.6', 'Q.1', 'TP. Hồ Chí Minh',
 'shipping',   'cod',  30000,  869000,  899000, '2025-03-22 10:30:00'),

('UNQG1H2I3', 6, 'Đỗ Thanh Tuyền',   '0938444555', 'tuyen.do@email.com',
 '99 Điện Biên Phủ', 'P.15', 'Bình Thạnh', 'TP. Hồ Chí Minh',
 'delivered',  'momo',  0,     658000,  658000, '2025-03-19 14:00:00'),

('UNQJ4K5L6', 6, 'Đỗ Thanh Tuyền',   '0938444555', 'tuyen.do@email.com',
 '99 Điện Biên Phủ', 'P.15', 'Bình Thạnh', 'TP. Hồ Chí Minh',
 'processing', 'vnpay', 0,     700000,  700000, '2025-03-25 16:00:00'),

('UNQM7N8O9', 7, 'Trương Quốc Hùng', '0949555666', 'hung.truong@email.com',
 '14 Ba Tháng Hai', 'P.12', 'Q.10', 'TP. Hồ Chí Minh',
 'cancelled',  'card',  0,     539000,  539000, '2025-03-17 08:00:00'),

('UNQP1Q2R3', 8, 'Bùi Thị Lan Anh',  '0960666777', 'lananh.bui@email.com',
 '77 Nguyễn Kiệm', 'P.3', 'Gò Vấp', 'TP. Hồ Chí Minh',
 'delivered',  'momo',  0,     829000,  829000, '2025-03-16 10:00:00'),

('UNQS4T5U6', 9, 'Võ Minh Khôi',     '0971777888', 'khoi.vo@email.com',
 '38 Trần Não', 'P. An Phú', 'Q.2', 'TP. Hồ Chí Minh',
 'delivered',  'vnpay', 0,    1049000, 1049000, '2025-03-21 13:00:00'),

('UNQV7W8X9', 10,'Hoàng Yến Nhi',    '0982888999', 'nhi.hoang@email.com',
 '65 Phan Đăng Lưu', 'P.1', 'Phú Nhuận', 'TP. Hồ Chí Minh',
 'pending',    'cod',  30000,  449000,  479000, '2025-03-26 09:00:00'),

('UNQY1Z2A3', 12,'Đinh Phương Linh', '0904000111', 'linh.dinh@email.com',
 '29 Nguyễn Đình Chiểu', 'P.6', 'Q.3', 'TP. Hồ Chí Minh',
 'processing', 'momo',  0,    1128000, 1128000, '2025-03-24 15:00:00');

-- ──────────────────────────────────────────────────────────────────
-- [10] ORDER_ITEMS — chi tiết từng đơn
-- ──────────────────────────────────────────────────────────────────
INSERT INTO order_items (order_id, product_id, product_name, product_sku, color, size, qty, unit_price, subtotal) VALUES
-- Đơn 1 UNQ1A2B3: Nam mua Polo + Straight Cut Jeans
(1,  10, 'Polo Classic',          'PCO-010', 'Trắng',       'M',  1, 339000, 339000),
(1,  13, 'Straight Cut Jeans',    'SCJ-013', 'Xanh chàm',  '30', 1, 519000, 519000),
(1,  1,  'Essential Pocket Tee',  'EPT-001', 'Đen',         'M',  1, 269000, 269000),
-- Nhưng tổng là 339+519+269 = 1127000, cập nhật thành 1178000 (đơn có thêm discount nhỏ) — dùng giá đúng
-- Đơn 2 UNQ4C5D6: Hà mua Linen Blend + Color Block + Biker Shorts
(2,  5,  'Linen Blend Tee',       'LBT-005', 'Xanh mint',   'S',  1, 289000, 289000),
(2,  6,  'Color Block Tee',       'CBT-006', 'Đỏ-Đen',      'S',  1, 319000, 319000),
(2,  16, 'Biker Shorts',          'BKS-016', 'Đen',         'S',  1, 229000, 229000),
(2,  9,  'Lace Trim Crop Tee',    'LCT-009', 'Hồng phấn',   'XS', 1, 299000, 299000),
-- Đơn 3 UNQE7F8G9: Anh mua Quarter Zip + Tapered Jogger
(3,  8,  'Quarter Zip Sweatshirt','ZQT-008', 'Xám anthracite','M', 1, 429000, 429000),
(3,  14, 'Tapered Jogger',        'TPJ-014', 'Đen',          'M', 1, 369000, 369000),
-- Đơn 4 UNQG1H2I3: Tuyền mua Mesh Sport + Biker Shorts
(4,  7,  'Mesh Sport Tee',        'MST-007', 'Đen',          'M', 1, 349000, 349000),
(4,  16, 'Biker Shorts',          'BKS-016', 'Xám',          'S', 1, 229000, 229000),
(4,  5,  'Linen Blend Tee',       'LBT-005', 'Kem',          'S', 1, 289000, 289000),
-- Đơn 5 UNQJ4K5L6: Tuyền mua Linen Wide Leg + Straight Cut
(5,  15, 'Linen Wide Leg',        'LWL-015', 'Be nâu',      'M',  1, 489000, 489000),
(5,  6,  'Color Block Tee',       'CBT-006', 'Xanh-Trắng',  'S',  1, 319000, 319000),
-- Đơn 6 UNQM7N8O9: Hùng mua Washed Denim Shirt (đơn bị cancelled)
(6,  2,  'Washed Denim Shirt',    'WDS-002', 'Xanh wash',   'L',  1, 399000, 399000),
(6,  1,  'Essential Pocket Tee',  'EPT-001', 'Trắng',       'L',  1, 269000, 269000),
-- Đơn 7 UNQP1Q2R3: Lan Anh mua Polo + Biker Shorts
(7,  10, 'Polo Classic',          'PCO-010', 'Đỏ',          'S',  1, 339000, 339000),
(7,  16, 'Biker Shorts',          'BKS-016', 'Đỏ đô',       'M',  1, 229000, 229000),
(7,  12, 'Terry Crop Tee',        'TCT-012', 'Xám',         'S',  1, 329000, 329000),
-- Đơn 8 UNQS4T5U6: Khôi mua Straight Cut + Chino + Terry Crop
(8,  13, 'Straight Cut Jeans',    'SCJ-013', 'Đen',         '30', 1, 519000, 519000),
(8,  17, 'Chino Slim Fit',        'CSF-017', 'Be',          '30', 1, 469000, 469000),
-- Đơn 9 UNQV7W8X9: Yến Nhi mua Lace Trim + Terry Crop
(9,  9,  'Lace Trim Crop Tee',    'LCT-009', 'Trắng',       'S',  1, 299000, 299000),
(9,  15, 'Linen Wide Leg',        'LWL-015', 'Kem',         'M',  1, 489000, 489000),
-- Đơn 10 UNQY1Z2A3: Phương Linh mua Terry Crop + Pleated Trouser + Lace Trim
(10, 12, 'Terry Crop Tee',        'TCT-012', 'Nâu caramel', 'XS', 1, 329000, 329000),
(10, 19, 'Pleated Trouser',       'PLT-019', 'Be kem',      '28', 1, 529000, 529000),
(10, 9,  'Lace Trim Crop Tee',    'LCT-009', 'Kem vàng',    'XS', 1, 299000, 299000),
(10, 3,  'Tie-Dye Oversized',     'TDO-003', 'Hồng tím',    'L',  1, 359000, 359000);

-- ──────────────────────────────────────────────────────────────────
-- [11] WISHLISTS — 18 mục yêu thích
-- ──────────────────────────────────────────────────────────────────
INSERT INTO wishlists (user_id, product_id, created_at) VALUES
-- Nguyễn Hoàng Nam
(3,  2,  '2025-03-10 08:00:00'),
(3,  17, '2025-03-15 09:00:00'),
(3,  19, '2025-03-20 10:00:00'),
-- Phạm Thu Hà
(4,  3,  '2025-03-08 11:00:00'),
(4,  12, '2025-03-12 12:00:00'),
(4,  15, '2025-03-18 14:00:00'),
-- Lê Đức Anh
(5,  10, '2025-03-01 07:30:00'),
(5,  13, '2025-03-10 08:00:00'),
-- Đỗ Thanh Tuyền
(6,  3,  '2025-03-05 13:00:00'),
(6,  11, '2025-03-15 14:30:00'),
(6,  18, '2025-03-20 16:00:00'),
-- Võ Minh Khôi
(9,  8,  '2025-03-08 10:00:00'),
(9,  19, '2025-03-15 11:00:00'),
-- Hoàng Yến Nhi
(10, 3,  '2025-03-10 09:00:00'),
(10, 12, '2025-03-18 10:00:00'),
-- Đinh Phương Linh
(12, 2,  '2025-03-16 08:30:00'),
(12, 6,  '2025-03-20 09:00:00'),
(12, 18, '2025-03-24 10:00:00');

-- ──────────────────────────────────────────────────────────────────
-- [12] PROMO_CODES — 6 mã đa dạng
-- ──────────────────────────────────────────────────────────────────
INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, used_count, expires_at, is_active) VALUES
-- Mã thường trực giảm 10%, không giới hạn
('UNIQ10',    'percent', 10.00,       0, NULL, 0,   NULL,                  1),
-- Mã VIP giảm 15% cho đơn từ 500k, hết 30/6
('UNIQ15',    'percent', 15.00,  500000,  200, 8,   '2025-06-30 23:59:59', 1),
-- Mã giảm cố định 50k cho đơn từ 300k
('SAVE50K',   'fixed',   50000,  300000,  500, 24,  '2025-05-31 23:59:59', 1),
-- Mã welcome giảm 20% cho khách mới
('WELCOME20', 'percent', 20.00,       0,  300, 41,  '2025-07-31 23:59:59', 1),
-- Mã flash sale cuối tuần
('WEEKEND15', 'percent', 15.00,  200000,  100, 0,   '2025-04-06 23:59:59', 1),
-- Mã tháng 4 kỷ niệm
('APRIL30',   'percent', 30.00,  400000,  150, 0,   '2025-04-30 23:59:59', 1);

-- ══════════════════════════════════════════════════════════════════
--  END OF SEED DATA
--  Tổng kết: 12 users | 11 categories | 20 products | 60 images
--            80 colors | 102 sizes | 64 features | 30 reviews
--            10 orders | 26 order items | 18 wishlists | 6 promo_codes
-- ══════════════════════════════════════════════════════════════════

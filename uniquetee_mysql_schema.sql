-- ══════════════════════════════════════════════════════════════════
--  UniqueTee — MySQL Schema
--  Phiên bản : 2.0  |  Encoding: UTF-8  |  MySQL 8.0+
--  Database  : uniquetee
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
  password    VARCHAR(255)    NOT NULL,                  -- bcrypt hash
  role        ENUM('admin','staff','customer') NOT NULL DEFAULT 'customer',
  status      ENUM('active','inactive','blocked')       DEFAULT 'active',
  avatar      VARCHAR(10)     DEFAULT NULL,              -- chữ cái đầu tên
  gender      ENUM('male','female','other')              DEFAULT NULL,
  dob         DATE            DEFAULT NULL,
  address     TEXT            DEFAULT NULL,
  spent       DECIMAL(15,0)   NOT NULL DEFAULT 0,        -- tổng chi tiêu (đ)
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
  sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,        -- 0 = ảnh đại diện
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 5. PRODUCT_COLORS
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE product_colors (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED    NOT NULL,
  hex         VARCHAR(10)     NOT NULL,                  -- "#1a1a1a"
  name        VARCHAR(50)     NOT NULL,                  -- "Đen"
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────────
-- 6. PRODUCT_SIZES
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE product_sizes (
  id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  product_id   INT UNSIGNED    NOT NULL,
  size         VARCHAR(10)     NOT NULL,                 -- "S","M","L","30","32"...
  is_available TINYINT(1)      NOT NULL DEFAULT 1,       -- 0 = hết hàng
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
  user_id       INT UNSIGNED     DEFAULT NULL,           -- NULL = khách vãng lai
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
  order_code     VARCHAR(20)     NOT NULL UNIQUE,        -- "UNQ7F3K2"
  user_id        INT UNSIGNED    DEFAULT NULL,           -- NULL = khách vãng lai
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
  product_name VARCHAR(150)    NOT NULL,                 -- snapshot tên lúc đặt
  product_sku  VARCHAR(30)     NOT NULL,
  color        VARCHAR(50)     NOT NULL,
  size         VARCHAR(10)     NOT NULL,
  qty          INT UNSIGNED    NOT NULL DEFAULT 1,
  unit_price   DECIMAL(12,0)   NOT NULL,                 -- giá lúc đặt (snapshot)
  subtotal     DECIMAL(15,0)   NOT NULL,                 -- qty × unit_price
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
  discount_value DECIMAL(10,2)   NOT NULL,               -- 10 = 10%
  min_order      DECIMAL(12,0)   DEFAULT 0,
  max_uses       INT UNSIGNED    DEFAULT NULL,            -- NULL = vô hạn
  used_count     INT UNSIGNED    NOT NULL DEFAULT 0,
  expires_at     TIMESTAMP       DEFAULT NULL,            -- NULL = không hết hạn
  is_active      TINYINT(1)      NOT NULL DEFAULT 1
);

-- ══════════════════════════════════════════════════════════════════
--  INDEXES — Tối ưu truy vấn
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
--  SEED DATA — Dữ liệu mẫu đầy đủ cho cả 12 bảng
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- [1] USERS  — 2 admin/staff + 8 customers
-- NOTE: password đang là plain text để test; dùng bcrypt hash ở production
-- ──────────────────────────────────────────────────────────────────
INSERT INTO users (name, email, phone, password, role, status, avatar, gender, dob, address, joined_at) VALUES
('Cao Minh Hiếu',   '22130081@st.hcmuaf.edu.vn', '0854553708', 'Admin@123', 'admin',    'active',   'C', 'male',   '2003-08-15', '12 Nguyễn Văn Cừ, Q.5, TP.HCM',           '2025-01-01 00:00:00'),
('Phan Thúy Hằng',  'hang.phan@email.com',        '0933777444', 'Staff@123', 'staff',    'active',   'P', 'female', '1998-04-20', '45 Lê Đức Thọ, Gò Vấp, TP.HCM',           '2025-02-01 00:00:00'),
('Nguyễn Thị Lan',  'lan.nguyen@email.com',        '0901234567', 'Pass@123',  'customer', 'active',   'N', 'female', '1995-03-12', '123 Nguyễn Huệ, Q.1, TP.HCM',             '2025-01-10 08:30:00'),
('Trần Quốc Bảo',   'bao.tran@email.com',           '0912345678', 'Pass@123',  'customer', 'active',   'T', 'male',   '1993-07-25', '45 Lê Lợi, Q.1, TP.HCM',                  '2025-01-15 10:15:00'),
('Lê Mỹ Duyên',     'duyen.le@email.com',           '0987654321', 'Pass@123',  'customer', 'active',   'L', 'female', '1997-11-08', '78 Trần Hưng Đạo, Q.5, TP.HCM',           '2025-01-20 14:00:00'),
('Phạm Minh Tuấn',  'tuan.pham@email.com',          '0932111222', 'Pass@123',  'customer', 'inactive', 'P', 'male',   '1990-02-14', '12 Võ Văn Tần, Q.3, TP.HCM',              '2025-02-05 09:45:00'),
('Hoàng Thu Hương', 'huong.hoang@email.com',        '0908888999', 'Pass@123',  'customer', 'active',   'H', 'female', '1996-09-30', '90 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM',  '2025-02-12 16:20:00'),
('Vũ Thanh Long',   'long.vu@email.com',            '0971222333', 'Pass@123',  'customer', 'blocked',  'V', 'male',   '1988-06-18', '55 CMT8, Q.10, TP.HCM',                    '2025-02-18 11:30:00'),
('Đinh Thị Mai',    'mai.dinh@email.com',           '0965444555', 'Pass@123',  'customer', 'active',   'Đ', 'female', '1999-01-22', '34 Phan Xích Long, Phú Nhuận, TP.HCM',     '2025-03-01 07:50:00'),
('Ngô Bảo Long',    'long.ngo@email.com',           '0945333666', 'Pass@123',  'customer', 'active',   'N', 'male',   '2001-05-17', '67 Hoàng Diệu, Q.4, TP.HCM',              '2025-03-08 13:10:00');

UPDATE users SET spent = 1595000, order_count = 2 WHERE id = 3;
UPDATE users SET spent = 908000,  order_count = 2 WHERE id = 4;
UPDATE users SET spent = 1028000, order_count = 1 WHERE id = 5;
UPDATE users SET spent = 499000,  order_count = 1 WHERE id = 6;
UPDATE users SET spent = 987000,  order_count = 1 WHERE id = 7;
UPDATE users SET spent = 349000,  order_count = 1 WHERE id = 8;
UPDATE users SET spent = 828000,  order_count = 1 WHERE id = 9;
UPDATE users SET spent = 778000,  order_count = 1 WHERE id = 10;

-- ──────────────────────────────────────────────────────────────────
-- [2] CATEGORIES  — 11 danh mục
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
-- [3] PRODUCTS  — 14 sản phẩm (8 áo + 6 quần)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO products (sku, name, type, category_id, price, original_price, tag, material, description, rating, review_count, sold) VALUES
('UMT-001', 'Urban Minimal Tee',
 'Áo',  1, 299000, 399000, 'Bán chạy', '100% Cotton Premium, 180gsm',
 'Áo thun Urban Minimal Tee với thiết kế tối giản hiện đại. Đường cắt may chuẩn form, cổ tròn vừa vặn, phù hợp mọi hoàn cảnh từ đi học đến đi chơi.',
 4.8, 124, 312),

('AWS-002', 'Acid Wash Street',
 'Áo',  2, 349000, NULL,   'Mới',      'Cotton 65% / Polyester 35%, 200gsm',
 'Phong cách acid wash độc đáo, mang hơi thở đường phố thập niên 90. Mỗi chiếc áo có vân wash khác nhau, tạo nét riêng độc nhất vô nhị.',
 4.6,  89, 178),

('OGT-003', 'Oversized Graphic Tee',
 'Áo',  3, 379000, 450000, 'Sale',     '100% Cotton Combed, 220gsm',
 'Áo thun oversized với họa tiết graphic bold statement. Form rộng thoải mái, vải dày dặn, in chất lượng cao không bong tróc sau nhiều lần giặt.',
 4.9, 201, 445),

('CLU-004', 'Clean Line Unisex',
 'Áo',  1, 259000, NULL,   NULL,       'Cotton Jersey, 160gsm',
 'Thiết kế tối giản với đường may sạch sẽ, không hoạ tiết, không logo. Phù hợp mặc trong lẫn ngoài, dễ phối đồ với bất kỳ trang phục nào.',
 4.7,  67, 134),

('VWC-005', 'Vintage Wash Crop',
 'Áo',  4, 319000, 380000, 'Sale',     'Cotton Vintage Wash, 190gsm',
 'Áo thun crop vintage wash mang phong cách retro đậm chất thập niên 80. Cắt crop nhẹ ở phần thân dưới, tôn vóc dáng, hợp với quần cạp cao.',
 4.5,  58,  97),

('BPT-006', 'Bold Print Tee',
 'Áo',  2, 289000, NULL,   'Mới',      'Cotton Pima, 175gsm',
 'In họa tiết đậm nét, táo bạo dành cho những ai yêu thích sự nổi bật. Sử dụng mực in DTG (Direct-to-Garment) bền màu, sắc nét.',
 4.4,  43,  76),

('SPT-007', 'Sport Performance Tee',
 'Áo',  5, 369000, NULL,   NULL,       'Polyester DryFit, 150gsm',
 'Áo thun thể thao công nghệ DryFit, thấm hút mồ hôi siêu nhanh, khô thoáng trong suốt buổi tập. Vải nhẹ, co giãn 4 chiều, không bí.',
 4.6,  92, 210),

('SNT-008', 'Stripe Nautical Tee',
 'Áo',  6, 279000, 329000, 'Sale',     'Cotton Breton, 180gsm',
 'Áo thun kẻ sọc nautical lấy cảm hứng từ thời trang hải quân Pháp. Sọc ngang đều nhau, màu sắc tươi sáng, phong cách clean classic.',
 4.3,  31,  55),

('SFJ-009', 'Slim Fit Jeans',
 'Quần', 7, 499000, 620000, 'Bán chạy', 'Denim Cotton 98% / Elastane 2%, 12oz',
 'Quần jeans slim fit tôn dáng, vải denim cao cấp 12oz. Có độ co giãn nhẹ 2% elastane, thoải mái vận động cả ngày. Wash đậm chuẩn jeans cổ điển.',
 4.8, 156, 289),

('JSW-010', 'Jogger Streetwear',
 'Quần', 8, 389000, NULL,   'Mới',      'French Terry Cotton, 280gsm',
 'Quần jogger streetwear với túi hộp tiện dụng 2 bên hông. Vải French Terry dày dặn, mềm mại, giữ form tốt sau nhiều lần giặt.',
 4.7,  98, 187),

('WLC-011', 'Wide Leg Cargo',
 'Quần', 9, 549000, 649000, 'Sale',     'Cotton Twill, 240gsm',
 'Quần cargo wide leg phong cách Y2K với 6 túi thực dụng. Ống quần rộng, chất twill dày, giữ form đứng cả ngày. Hot trend 2025.',
 4.6,  73, 142),

('STD-012', 'Shorts Thể Thao DryFit',
 'Quần',10, 249000, NULL,   NULL,       'Polyester DryFit, 130gsm',
 'Quần shorts thể thao DryFit nhẹ như không, lót lưới thoáng mát bên trong. Dây rút điều chỉnh, phù hợp gym, chạy bộ, đi biển.',
 4.5,  61, 119),

('KSF-013', 'Kaki Straight Fit',
 'Quần',11, 459000, 530000, 'Bán chạy', 'Cotton Kaki, 260gsm',
 'Quần kaki straight fit thanh lịch, chống nhăn tốt, giữ form suốt cả ngày. Phù hợp đi làm, đi chơi, hợp nhiều style từ smart casual đến streetwear.',
 4.7,  84, 163),

('DBY-014', 'Denim Baggy Y2K',
 'Quần', 7, 529000, NULL,   'Mới',      'Denim Cotton 100%, 14oz',
 'Quần jeans baggy Y2K ống siêu rộng, wash vintage phai màu đặc trưng. Denim 14oz dày dặn, đứng form, càng mặc nhiều càng đẹp.',
 4.5,  47,  89);

-- ──────────────────────────────────────────────────────────────────
-- [4] PRODUCT_IMAGES  — 3–4 ảnh / sản phẩm, đủ 14 sp
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_images (product_id, url, sort_order) VALUES
-- 1 Urban Minimal Tee
(1,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 0),
(1,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(1,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 2),
(1,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   3),
-- 2 Acid Wash Street
(2,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 0),
(2,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 1),
(2,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 2),
-- 3 Oversized Graphic Tee
(3,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 0),
(3,  'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop', 1),
(3,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   2),
(3,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 3),
-- 4 Clean Line Unisex
(4,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   0),
(4,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 1),
(4,  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 2),
-- 5 Vintage Wash Crop
(5,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 0),
(5,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(5,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 2),
-- 6 Bold Print Tee
(6,  'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop', 0),
(6,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 1),
(6,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   2),
-- 7 Sport Performance Tee
(7,  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 0),
(7,  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 1),
(7,  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 2),
-- 8 Stripe Nautical Tee
(8,  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop', 0),
(8,  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop',   1),
(8,  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop', 2),
-- 9 Slim Fit Jeans
(9,  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   0),
(9,  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 1),
(9,  'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 2),
(9,  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   3),
-- 10 Jogger Streetwear
(10, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop', 0),
(10, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 1),
(10, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 2),
-- 11 Wide Leg Cargo
(11, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 0),
(11, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   1),
(11, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 2),
-- 12 Shorts Thể Thao
(12, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop', 0),
(12, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop', 1),
(12, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop', 2),
-- 13 Kaki Straight Fit
(13, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 0),
(13, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   1),
(13, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 2),
-- 14 Denim Baggy Y2K
(14, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop',   0),
(14, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop', 1),
(14, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop', 2);

-- ──────────────────────────────────────────────────────────────────
-- [5] PRODUCT_COLORS  — đầy đủ 14 sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_colors (product_id, hex, name) VALUES
(1,  '#1a1a1a', 'Đen'),       (1,  '#f0f0f2', 'Trắng'),     (1,  '#4A90E2', 'Xanh biển'), (1,  '#ff5fa3', 'Hồng'),
(2,  '#7B68EE', 'Tím'),       (2,  '#F5F5DC', 'Kem'),        (2,  '#2C2C2C', 'Xám đen'),
(3,  '#2C2C2C', 'Xám đậm'),   (3,  '#E8DCC8', 'Kem vàng'),   (3,  '#ffffff', 'Trắng'),
(4,  '#1a1a1a', 'Đen'),       (4,  '#ffffff', 'Trắng'),      (4,  '#c8c8c8', 'Xám'),       (4,  '#a8c5e0', 'Xanh nhạt'),
(5,  '#8B6F5E', 'Nâu đất'),   (5,  '#A8B5A0', 'Xanh rêu'),   (5,  '#D4A0A0', 'Hồng đất'),
(6,  '#ffffff', 'Trắng'),     (6,  '#1a1a1a', 'Đen'),        (6,  '#DC143C', 'Đỏ'),
(7,  '#1a1a1a', 'Đen'),       (7,  '#ffffff', 'Trắng'),      (7,  '#1E90FF', 'Xanh dương'),(7,  '#32CD32', 'Xanh lá'),
(8,  '#003087', 'Xanh hải quân'), (8, '#DC143C', 'Đỏ trắng'),
(9,  '#1a3a5c', 'Xanh chàm'), (9,  '#1a1a1a', 'Đen'),        (9,  '#6b93c4', 'Xanh nhạt'),
(10, '#1a1a1a', 'Đen'),       (10, '#808080', 'Xám'),         (10, '#F5F5DC', 'Kem'),
(11, '#556B2F', 'Xanh olive'),(11, '#1a1a1a', 'Đen'),         (11, '#C19A6B', 'Be'),
(12, '#1a1a1a', 'Đen'),       (12, '#1E90FF', 'Xanh dương'), (12, '#DC143C', 'Đỏ'),       (12, '#808080', 'Xám'),
(13, '#C19A6B', 'Be'),        (13, '#556B2F', 'Xanh olive'),  (13, '#8B6914', 'Nâu vàng'),
(14, '#4682B4', 'Xanh wash'), (14, '#1a1a1a', 'Đen wash'),   (14, '#87CEEB', 'Xanh nhạt');

-- ──────────────────────────────────────────────────────────────────
-- [6] PRODUCT_SIZES  — đầy đủ 14 sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_sizes (product_id, size, is_available) VALUES
-- 1 Urban Minimal Tee
(1,  'XS', 0), (1,  'S', 1), (1,  'M', 1), (1,  'L', 1), (1,  'XL', 1),
-- 2 Acid Wash Street
(2,  'S',  1), (2,  'M', 1), (2,  'L', 1), (2,  'XL', 0),
-- 3 Oversized Graphic Tee
(3,  'M',  1), (3,  'L', 1), (3,  'XL', 1),(3,  'XXL', 1),
-- 4 Clean Line Unisex
(4,  'XS', 1), (4,  'S', 1), (4,  'M', 1), (4,  'L', 1), (4,  'XL', 1),
-- 5 Vintage Wash Crop
(5,  'XS', 1), (5,  'S', 1), (5,  'M', 1), (5,  'L', 0),
-- 6 Bold Print Tee
(6,  'S',  1), (6,  'M', 1), (6,  'L', 1), (6,  'XL', 1),
-- 7 Sport Performance Tee
(7,  'S',  1), (7,  'M', 1), (7,  'L', 1), (7,  'XL', 1), (7,  'XXL', 0),
-- 8 Stripe Nautical Tee
(8,  'S',  1), (8,  'M', 1), (8,  'L', 0),
-- 9 Slim Fit Jeans
(9,  '28', 1), (9,  '29', 1),(9,  '30', 1),(9,  '31', 1),(9,  '32', 1),(9,  '34', 0),
-- 10 Jogger Streetwear
(10, 'S',  1), (10, 'M', 1), (10, 'L', 1), (10, 'XL', 1),
-- 11 Wide Leg Cargo
(11, 'S',  1), (11, 'M', 1), (11, 'L', 1), (11, 'XL', 0),
-- 12 Shorts Thể Thao
(12, 'S',  1), (12, 'M', 1), (12, 'L', 1), (12, 'XL', 1),
-- 13 Kaki Straight Fit
(13, '28', 1), (13, '29', 1),(13, '30', 1),(13, '31', 1),(13, '32', 1),(13, '34', 1),
-- 14 Denim Baggy Y2K
(14, '28', 1), (14, '29', 1),(14, '30', 1),(14, '32', 1),(14, '34', 0);

-- ──────────────────────────────────────────────────────────────────
-- [7] PRODUCT_FEATURES  — 3–4 tính năng / sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO product_features (product_id, feature, sort_order) VALUES
(1,  'Vải Cotton Premium 180gsm mềm mại, thoáng mát',              0),
(1,  'Đường may 4 kim chắc chắn, không bung chỉ',                  1),
(1,  'Cổ tròn co giãn tốt, giữ form sau nhiều lần giặt',           2),
(1,  'Phù hợp mặc cả ngày: đi học, đi làm, đi chơi',              3),
(2,  'Mỗi chiếc áo có vân wash độc đáo, không chiếc nào giống nhau', 0),
(2,  'Kỹ thuật nhuộm acid wash thủ công chất lượng cao',           1),
(2,  'Vải dày 200gsm, không bị mỏng hay lộ trong',                 2),
(2,  'Màu sắc bền, không phai sau nhiều lần giặt máy',             3),
(3,  'Form oversized trendy, vai rộng, thân dài vừa đủ',           0),
(3,  'In DTG độ phân giải cao, màu sắc sắc nét và bền lâu',       1),
(3,  'Vải Cotton Combed 220gsm cao cấp, mềm mại đặc trưng',       2),
(3,  'Phối đồ đa dạng: jeans, shorts, jogger đều hợp',            3),
(4,  'Thiết kế unisex phù hợp cả nam và nữ',                       0),
(4,  'Không logo, không hoạ tiết — dễ phối mọi outfit',           1),
(4,  'Vải jersey mỏng nhẹ 160gsm, lý tưởng cho thời tiết nóng',   2),
(5,  'Cắt crop nhẹ tôn eo, hợp với quần cạp cao',                  0),
(5,  'Hiệu ứng vintage wash tạo cảm giác áo đã có "lịch sử"',     1),
(5,  'Vải dày 190gsm, không xuyên thấu kể cả màu sáng',           2),
(6,  'In DTG phủ toàn thân, hoạ tiết lớn táo bạo',                0),
(6,  'Mực in không bong tróc sau 50+ lần giặt đúng cách',         1),
(6,  'Vải Pima Cotton cao cấp mềm hơn cotton thông thường',        2),
(7,  'Công nghệ DryFit thấm hút mồ hôi cực nhanh',                0),
(7,  'Co giãn 4 chiều, không cản trở vận động',                    1),
(7,  'Vải kháng khuẩn, khử mùi tự nhiên',                          2),
(7,  'Thích hợp: gym, chạy bộ, đạp xe, yoga, cầu lông',           3),
(8,  'Sọc ngang đều nhau chuẩn Breton stripe truyền thống',        0),
(8,  'Kiểu dáng classic vượt thời gian, không bao giờ lỗi mốt',   1),
(8,  'Cổ thuyền nhẹ, thanh lịch, phù hợp đi chơi đi học',         2),
(9,  'Vải denim 12oz bền bỉ, ngày càng đẹp theo thời gian',       0),
(9,  '2% elastane cho độ co giãn thoải mái cả ngày',              1),
(9,  'Đường may 5 túi truyền thống, chắc chắn',                    2),
(9,  'Wash đậm chuẩn indigo, bền màu, đặc trưng jeans cao cấp',   3),
(10, 'French Terry 280gsm dày dặn, ấm áp ngày se lạnh',           0),
(10, 'Túi hộp 2 bên chứa được điện thoại màn hình 6.7"',          1),
(10, 'Cạp thun co giãn thoải mái, gấu bó vừa vặn chuẩn jogger',   2),
(10, 'Đứng form tốt, không bị nhăn hay bai sau nhiều lần giặt',   3),
(11, '6 túi thực dụng: 2 trước, 2 sau, 2 túi hộp bên hông',      0),
(11, 'Ống rộng Y2K đang cực hot, phối chunky sneaker siêu đẹp',   1),
(11, 'Vải twill 240gsm cứng cáp, đứng form, ít nhăn',             2),
(12, 'Siêu nhẹ 130gsm, thoải mái như không mặc gì',               0),
(12, 'Lót lưới thoáng mát bên trong, chống ẩm hiệu quả',          1),
(12, 'Dây rút điều chỉnh vòng eo linh hoạt từ S đến XL',          2),
(12, 'Khô siêu nhanh, phù hợp bơi lội, thể thao nước',            3),
(13, 'Vải kaki 260gsm chống nhăn xuất sắc, phẳng cả ngày',        0),
(13, 'Form straight tôn dáng, hợp cả đi làm lẫn đi chơi',         1),
(13, 'Ống quần thẳng chuẩn, dễ phối mọi kiểu giày dép',           2),
(14, 'Denim 14oz cứng cáp, đứng form ống rộng hoàn hảo',          0),
(14, 'Wash vintage phai màu đặc trưng thập niên 90 đúng nghĩa',   1),
(14, 'Ống siêu rộng Y2K, phối chunky sneaker hoặc boots đều đẹp', 2),
(14, 'Càng mặc nhiều vải càng mềm, màu càng đẹp tự nhiên hơn',   3);

-- ──────────────────────────────────────────────────────────────────
-- [8] REVIEWS  — 25 đánh giá đa dạng cho 14 sản phẩm
-- ──────────────────────────────────────────────────────────────────
INSERT INTO reviews (product_id, user_id, reviewer_name, rating, content, created_at) VALUES
-- Product 1: Urban Minimal Tee
(1,  3,  'Nguyễn Thị Lan',   5, 'Áo đẹp lắm, chất vải mềm mịn mặc rất thoải mái. Size M vừa đúng người 60kg cao 1m68. Màu đen cực kỳ đẹp, không bị nhạt sau giặt.', '2025-03-12 10:20:00'),
(1,  4,  'Trần Quốc Bảo',    4, 'Áo đẹp, màu sắc chuẩn như hình. Giao hàng nhanh, đóng gói cẩn thận. Trừ 1 sao vì size hơi rộng hơn mình tưởng, lần sau lấy S thay vì M.', '2025-03-05 14:35:00'),
(1,  5,  'Lê Mỹ Duyên',      5, 'Mua lần 2 rồi, lần nào cũng hài lòng. Chất áo không bị nhăn sau khi giặt, màu giữ đẹp sau nhiều lần wash. Sẽ tiếp tục ủng hộ shop!', '2025-02-28 09:15:00'),
-- Product 2: Acid Wash Street
(2,  6,  'Phạm Minh Tuấn',   5, 'Áo đẹp vãi luôn, mỗi cái wash khác nhau nên mình có cảm giác uniqueness cực kỳ cao. Chất dày, không bị mỏng như lo ban đầu.', '2025-03-08 16:00:00'),
(2,  9,  'Đinh Thị Mai',     4, 'Màu tím rất đẹp và độc lạ. Áo wash đẹp, chất ổn. Giao nhanh. Sẽ mua thêm màu kem lần sau.', '2025-03-02 11:30:00'),
-- Product 3: Oversized Graphic Tee
(3,  7,  'Hoàng Thu Hương',  5, 'In siêu đẹp và sắc nét! Mình size S thường nhưng lấy M oversized vừa chuẩn phong cách. Vải dày không bị lộ trong.', '2025-03-10 08:45:00'),
(3,  10, 'Ngô Bảo Long',     5, 'Đây là cái áo đẹp nhất mình từng mua online. Ảnh thật chuẩn ảnh chụp 100%, thậm chí đẹp hơn. Rất hài lòng!', '2025-03-01 15:20:00'),
-- Product 4: Clean Line Unisex
(4,  3,  'Nguyễn Thị Lan',   4, 'Áo basic nhưng chất lượng tốt hơn mình nghĩ. Vải mỏng nhẹ mát mẻ, mùa hè mặc rất hợp. Sẽ mua thêm màu khác.', '2025-02-20 13:00:00'),
(4,  8,  'Vũ Thanh Long',    3, 'Áo bình thường, không có gì đặc biệt. Nhưng giá ổn so với chất lượng nhận được. Giao hàng đúng hẹn.', '2025-02-15 10:00:00'),
-- Product 5: Vintage Wash Crop
(5,  5,  'Lê Mỹ Duyên',     5, 'Áo crop cực xinh! Màu nâu đất hợp với mọi loại quần. Mình 50kg mua size S vừa ôm người rất đẹp. 10/10!', '2025-03-15 07:30:00'),
(5,  9,  'Đinh Thị Mai',     4, 'Vintage wash thật sự đẹp, tone màu rất tự nhiên không bị lòe loẹt. Crop vừa phải không quá ngắn. Ưng lắm!', '2025-03-07 12:45:00'),
-- Product 6: Bold Print Tee
(6,  4,  'Trần Quốc Bảo',    4, 'In đẹp, sắc nét — nhìn thật đẹp hơn ảnh render nhiều. Chất vải mềm, cổ áo không bị giãn sau khi giặt.', '2025-02-25 16:30:00'),
-- Product 7: Sport Performance Tee
(7,  10, 'Ngô Bảo Long',     5, 'Mặc đi gym một tháng rồi, vải không bị bai hay phai màu. DryFit thật sự thấm hút tốt, khô rất nhanh sau tập.', '2025-03-13 09:00:00'),
(7,  6,  'Phạm Minh Tuấn',   5, 'Mặc chạy bộ mỗi sáng, áo thoáng mát không bị bết dính. Mua 2 cái luôn để thay nhau mặc. Siêu đáng tiền!', '2025-03-05 07:15:00'),
-- Product 8: Stripe Nautical Tee
(8,  7,  'Hoàng Thu Hương',  4, 'Áo kẻ sọc rất classic, phối với quần trắng hoặc jeans đều đẹp. Chất vải ổn, màu sắc tươi giữ tốt.', '2025-02-18 14:00:00'),
-- Product 9: Slim Fit Jeans
(9,  5,  'Lê Mỹ Duyên',     5, 'Quần jeans siêu đẹp! Vải dày dặn, denim xịn thật sự. Size 28 vừa chuẩn người 54kg cao 1m62.', '2025-03-15 11:00:00'),
(9,  3,  'Nguyễn Thị Lan',   5, 'Slim fit tôn dáng cực kỳ. Vải có elastane nên không bị bó khó chịu. Mua 2 màu luôn vì quá đẹp!', '2025-03-10 16:20:00'),
(9,  4,  'Trần Quốc Bảo',    5, 'Quần jeans chất lượng cao, vải dày dặn không bị bai. Size 30 vừa chuẩn người 65kg. Rất hài lòng, sẽ mua thêm!', '2025-03-01 08:30:00'),
-- Product 10: Jogger Streetwear
(10, 9,  'Đinh Thị Mai',     5, 'Quần jogger đẹp và tiện dụng. Vải dày, không bị mỏng hay bai. Túi rộng đựng điện thoại Galaxy S24 Ultra vẫn vừa.', '2025-03-12 10:00:00'),
(10, 7,  'Hoàng Thu Hương',  4, 'Mặc mãn nhãn, form dáng đẹp. Chỉ tiếc size L hơi rộng so với người mình, lần sau sẽ lấy M.', '2025-03-03 13:45:00'),
-- Product 11: Wide Leg Cargo
(11, 5,  'Lê Mỹ Duyên',     5, 'Quần cargo wide leg siêu trendy! 6 túi thực sự tiện dụng, không chỉ để làm cảnh. Chất twill cứng cáp đứng form tốt.', '2025-03-14 15:00:00'),
-- Product 12: Shorts Thể Thao
(12, 10, 'Ngô Bảo Long',     5, 'Quần shorts nhẹ như không có, mặc đi gym thoải mái. Lót lưới mát hơn mình nghĩ. Giá rất ok cho chất lượng này!', '2025-03-09 06:45:00'),
-- Product 13: Kaki Straight Fit
(13, 3,  'Nguyễn Thị Lan',   5, 'Quần kaki đẹp, không nhăn cả ngày đúng như quảng cáo. Mặc đi làm cực kỳ phù hợp, thanh lịch mà không nhàm.', '2025-03-11 08:00:00'),
-- Product 14: Denim Baggy Y2K
(14, 4,  'Trần Quốc Bảo',    5, 'Quần baggy Y2K xịn thật sự! Vải denim dày, ống rộng đúng chuẩn. Phối chunky sneaker đẹp điên đảo luôn.', '2025-03-16 14:30:00'),
(14, 9,  'Đinh Thị Mai',     4, 'Quần đẹp, wash vintage rất chất. Hơi khó mặc lúc đầu vì ống quá rộng nhưng quen rồi thì mê luôn. Recommend!', '2025-03-08 11:15:00');

-- ──────────────────────────────────────────────────────────────────
-- [9] ORDERS  — 8 đơn hàng đa dạng trạng thái
-- ──────────────────────────────────────────────────────────────────
INSERT INTO orders (order_code, user_id, customer_name, customer_phone, customer_email,
                    address, ward, district, city,
                    status, payment_method, shipping_fee, subtotal, total, created_at) VALUES
('UNQ7F3K2', 3,  'Nguyễn Thị Lan',   '0901234567', 'lan.nguyen@email.com',
 '123 Nguyễn Huệ', 'P. Bến Nghé', 'Q.1', 'TP. Hồ Chí Minh',
 'delivered',  'momo', 0,      1257000, 1257000, '2025-03-15 09:00:00'),

('UNQ2M9P1', 4,  'Trần Quốc Bảo',    '0912345678', 'bao.tran@email.com',
 '45 Lê Lợi', 'P. Bến Thành', 'Q.1', 'TP. Hồ Chí Minh',
 'shipping',   'cod',  30000,  379000,  409000, '2025-03-14 11:30:00'),

('UNQ5X8Q4', 5,  'Lê Mỹ Duyên',      '0987654321', 'duyen.le@email.com',
 '78 Trần Hưng Đạo', 'P.2', 'Q.5', 'TP. Hồ Chí Minh',
 'processing', 'vnpay', 0,    1126000, 1126000, '2025-03-14 14:00:00'),

('UNQ9R1Z7', 6,  'Phạm Minh Tuấn',   '0932111222', 'tuan.pham@email.com',
 '12 Võ Văn Tần', 'P.6', 'Q.3', 'TP. Hồ Chí Minh',
 'delivered',  'momo', 0,      499000,  499000, '2025-03-13 08:20:00'),

('UNQ4K2W3', 7,  'Hoàng Thu Hương',  '0908888999', 'huong.hoang@email.com',
 '90 Đinh Tiên Hoàng', 'P.3', 'Bình Thạnh', 'TP. Hồ Chí Minh',
 'cancelled',  'card', 0,      938000,  938000, '2025-03-12 16:45:00'),

('UNQ6L8M2', 8,  'Vũ Thanh Long',    '0971222333', 'long.vu@email.com',
 '55 Cách Mạng Tháng 8', 'P.11', 'Q.10', 'TP. Hồ Chí Minh',
 'pending',    'cod',  30000,  349000,  379000, '2025-03-11 20:00:00'),

('UNQ3P7N5', 9,  'Đinh Thị Mai',     '0965444555', 'mai.dinh@email.com',
 '34 Phan Xích Long', 'P.2', 'Phú Nhuận', 'TP. Hồ Chí Minh',
 'delivered',  'vnpay', 0,    877000,  877000, '2025-03-10 10:15:00'),

('UNQ8Q2X1', 10, 'Ngô Bảo Long',     '0945333666', 'long.ngo@email.com',
 '67 Hoàng Diệu', 'P.12', 'Q.4', 'TP. Hồ Chí Minh',
 'processing', 'momo', 30000,  748000,  778000, '2025-03-09 13:30:00');

-- ──────────────────────────────────────────────────────────────────
-- [10] ORDER_ITEMS  — chi tiết từng đơn
-- ──────────────────────────────────────────────────────────────────
INSERT INTO order_items (order_id, product_id, product_name, product_sku, color, size, qty, unit_price, subtotal) VALUES
-- Đơn 1 UNQ7F3K2: Lan mua 3 sản phẩm (subtotal 1446000)
(1, 1,  'Urban Minimal Tee',       'UMT-001', 'Đen',          'M',  1, 299000, 299000),
(1, 9,  'Slim Fit Jeans',          'SFJ-009', 'Xanh chàm',   '28', 1, 499000, 499000),
(1, 13, 'Kaki Straight Fit',       'KSF-013', 'Be',           '28', 1, 459000, 459000),
-- Đơn 2 UNQ2M9P1: Bảo mua OGT (subtotal 379000)
(2, 3,  'Oversized Graphic Tee',   'OGT-003', 'Xám đậm',     'XL', 1, 379000, 379000),
-- Đơn 3 UNQ5X8Q4: Duyên mua 3 món (subtotal 1028000)
(3, 4,  'Clean Line Unisex',       'CLU-004', 'Trắng',        'S',  2, 259000, 518000),
(3, 5,  'Vintage Wash Crop',       'VWC-005', 'Nâu đất',      'S',  1, 319000, 319000),
(3, 6,  'Bold Print Tee',          'BPT-006', 'Trắng',        'M',  1, 289000, 289000),
-- Đơn 4 UNQ9R1Z7: Tuấn mua Jeans (subtotal 499000)
(4, 9,  'Slim Fit Jeans',          'SFJ-009', 'Xanh chàm',   '30', 1, 499000, 499000),
-- Đơn 5 UNQ4K2W3: Hương mua 2 món (subtotal 938000) — đơn bị cancelled
(5, 10, 'Jogger Streetwear',       'JSW-010', 'Đen',          'M',  1, 389000, 389000),
(5, 11, 'Wide Leg Cargo',          'WLC-011', 'Xanh olive',   'M',  1, 549000, 549000),
-- Đơn 6 UNQ6L8M2: Long mua Acid Wash (subtotal 349000)
(6, 2,  'Acid Wash Street',        'AWS-002', 'Kem',          'M',  1, 349000, 349000),
-- Đơn 7 UNQ3P7N5: Mai mua 3 món thể thao (subtotal 828000)
(7, 7,  'Sport Performance Tee',   'SPT-007', 'Đen',          'M',  1, 369000, 369000),
(7, 12, 'Shorts Thể Thao DryFit',  'STD-012', 'Đen',          'M',  1, 249000, 249000),
(7, 4,  'Clean Line Unisex',       'CLU-004', 'Xám',          'L',  1, 259000, 259000),
-- Đơn 8 UNQ8Q2X1: Ngô Bảo Long mua 2 món (subtotal 748000)
(8, 14, 'Denim Baggy Y2K',         'DBY-014', 'Xanh wash',   '30', 1, 529000, 529000),
(8, 8,  'Stripe Nautical Tee',     'SNT-008', 'Đỏ trắng',     'S',  1, 219000, 219000);

-- ──────────────────────────────────────────────────────────────────
-- [11] WISHLISTS  — 16 mục yêu thích
-- ──────────────────────────────────────────────────────────────────
INSERT INTO wishlists (user_id, product_id, created_at) VALUES
-- Lan yêu thích
(3,  3,  '2025-03-10 08:00:00'),
(3,  11, '2025-03-12 09:30:00'),
(3,  14, '2025-03-14 10:00:00'),
-- Bảo yêu thích
(4,  1,  '2025-03-01 14:00:00'),
(4,  9,  '2025-03-05 16:20:00'),
-- Duyên yêu thích nhiều nhất
(5,  1,  '2025-02-20 11:00:00'),
(5,  3,  '2025-02-22 12:00:00'),
(5,  7,  '2025-02-25 13:00:00'),
(5,  10, '2025-03-01 09:00:00'),
-- Hương yêu thích áo
(7,  2,  '2025-02-28 15:00:00'),
(7,  6,  '2025-03-05 10:30:00'),
-- Mai yêu thích quần
(9,  9,  '2025-03-08 08:00:00'),
(9,  11, '2025-03-10 09:00:00'),
(9,  14, '2025-03-12 11:00:00'),
-- Ngô Bảo Long
(10, 1,  '2025-03-09 07:30:00'),
(10, 7,  '2025-03-11 08:45:00');

-- ──────────────────────────────────────────────────────────────────
-- [12] PROMO_CODES  — 5 mã đa dạng
-- ──────────────────────────────────────────────────────────────────
INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, used_count, expires_at, is_active) VALUES
-- Mã thường trực, giảm 10%, không giới hạn
('UNIQ10',   'percent', 10.00,       0, NULL, 0,   NULL,                   1),
-- Mã VIP giảm 15% cho đơn từ 500k, hết 30/4
('UNIQ15',   'percent', 15.00,  500000,  200, 12,  '2025-04-30 23:59:59',  1),
-- Mã giảm cố định 50k cho đơn từ 300k
('SAVE50K',  'fixed',   50000,  300000,  500, 38,  '2025-05-31 23:59:59',  1),
-- Mã flash sale 20% chỉ còn 50 lượt
('FLASH20',  'percent', 20.00,       0,   50,  0,  '2025-04-05 23:59:59',  1),
-- Mã Tết đã hết hạn, tắt
('TETALE30', 'percent', 30.00,  200000,  300, 300, '2025-02-10 23:59:59',  0);

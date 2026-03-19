// ── Shared Product Data ──────────────────────────────────────────────────────
// Dùng chung cho ProductsPage, ProductDetailPage, HomePage

export const ALL_PRODUCTS = [
  {
    id: 1,
    name: "Urban Minimal Tee",
    price: 299000,
    originalPrice: 399000,
    tag: "Bán chạy",
    category: "Cơ bản",
    rating: 4.8,
    reviews: 124,
    sold: 312,
    sku: "UMT-001",
    material: "100% Cotton Premium, 180gsm",
    description:
      "Áo thun Urban Minimal Tee được thiết kế với phong cách tối giản hiện đại, phù hợp với mọi hoàn cảnh từ đường phố đến văn phòng. Chất liệu cotton cao cấp 100% mang lại cảm giác mềm mại, thoáng mát suốt cả ngày dài. Kiểu dáng regular fit không quá rộng, không quá ôm, phù hợp đa dạng vóc dáng.",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#f0f0f2", name: "Trắng" },
      { hex: "#4A90E2", name: "Xanh biển" },
      { hex: "#ff5fa3", name: "Hồng" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    unavailSizes: ["XS"],
    features: [
      "Chất liệu: 100% Cotton Premium, 180gsm",
      "Cổ tròn vừa phải, tay ngắn regular fit",
      "Màu bền, không phai sau nhiều lần giặt",
      "Xuất xứ: Việt Nam",
    ],
    reviewList: [
      { id: 1, name: "Nguyễn Minh Anh", rating: 5, date: "12/03/2025", text: "Áo đẹp lắm, chất vải mềm mịn, mặc rất thoải mái. Size M vừa đúng với người 60kg cao 1m68." },
      { id: 2, name: "Trần Thúy Hằng", rating: 4, date: "05/03/2025", text: "Áo đẹp, màu sắc chuẩn như hình. Giao hàng nhanh, đóng gói cẩn thận. Sẽ mua thêm màu khác." },
      { id: 3, name: "Lê Quốc Bảo", rating: 5, date: "28/02/2025", text: "Mua lần 2 rồi, lần nào cũng hài lòng. Chất áo không bị nhăn sau khi giặt. Highly recommend!" },
    ],
  },
  {
    id: 2,
    name: "Acid Wash Street",
    price: 349000,
    originalPrice: null,
    tag: "Mới",
    category: "Graphic",
    rating: 4.6,
    reviews: 89,
    sold: 178,
    sku: "AWS-002",
    material: "Cotton 65% / Polyester 35%, 200gsm",
    description:
      "Phong cách acid wash độc đáo, mang hơi thở đường phố thập niên 90. Màu sắc loang nhẹ tạo điểm nhấn thị giác ấn tượng, thích hợp với những ai yêu thích phong cách retro-vintage hiện đại.",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#7B68EE", name: "Tím" },
      { hex: "#F5F5DC", name: "Kem" },
      { hex: "#2C2C2C", name: "Xám đen" },
    ],
    sizes: ["S", "M", "L"],
    unavailSizes: [],
    features: [
      "Chất liệu: Cotton 65% / Polyester 35%, 200gsm",
      "Kỹ thuật nhuộm acid wash thủ công",
      "Mỗi chiếc có hoa văn loang độc đáo riêng",
      "Giặt tay hoặc máy chế độ nhẹ",
    ],
    reviewList: [
      { id: 1, name: "Phạm Thị Lan", rating: 5, date: "10/03/2025", text: "Chiếc áo này quá đỉnh! Màu tím loang rất đẹp, mặc đi chơi ai cũng hỏi mua ở đâu." },
      { id: 2, name: "Võ Minh Tuấn", rating: 4, date: "03/03/2025", text: "Chất lượng tốt, giao hàng nhanh. Màu sắc thực tế đẹp hơn hình một chút." },
    ],
  },
  {
    id: 3,
    name: "Oversized Graphic Tee",
    price: 379000,
    originalPrice: 450000,
    tag: "Sale",
    category: "Oversized",
    rating: 4.9,
    reviews: 201,
    sold: 445,
    sku: "OGT-003",
    material: "100% Cotton Combed, 220gsm",
    description:
      "Áo thun oversized với họa tiết graphic bold statement. Dáng áo rộng thoải mái, phù hợp phong cách streetwear, có thể phối với quần skinny hoặc biker shorts để tạo outfit cân bằng.",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#2C2C2C", name: "Xám đậm" },
      { hex: "#E8DCC8", name: "Kem vàng" },
      { hex: "#ffffff", name: "Trắng" },
    ],
    sizes: ["M", "L", "XL", "XXL"],
    unavailSizes: [],
    features: [
      "Chất liệu: 100% Cotton Combed, 220gsm dày dặn",
      "Dáng oversized — nên chọn size nhỏ hơn thường 1 size",
      "In lụa độ bền cao, không bong tróc",
      "Chiều dài áo +5cm so với regular fit",
    ],
    reviewList: [
      { id: 1, name: "Đặng Thu Hương", rating: 5, date: "14/03/2025", text: "Áo dày, chất đẹp, in sắc nét. Mặc oversized style rất chill!" },
      { id: 2, name: "Ngô Bảo Long", rating: 5, date: "07/03/2025", text: "Order size L dù thường mặc XL, vẫn rộng đúng kiểu oversized. Rất hài lòng." },
      { id: 3, name: "Lý Cẩm Tú", rating: 4, date: "01/03/2025", text: "Áo đẹp, nhưng màu thực tế hơi tối hơn ảnh một chút. Vẫn sẽ mua lại." },
    ],
  },
  {
    id: 4,
    name: "Clean Line Unisex",
    price: 259000,
    originalPrice: null,
    tag: null,
    category: "Cơ bản",
    rating: 4.7,
    reviews: 67,
    sold: 134,
    sku: "CLU-004",
    material: "Cotton Jersey 160gsm",
    description:
      "Thiết kế tối giản, đường may sạch sẽ, phù hợp mặc trong lẫn ngoài. Đây là chiếc áo thun cơ bản hoàn hảo cho tủ đồ capsule wardrobe — dễ phối, đa năng, bền bỉ theo thời gian.",
    images: [
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#ffffff", name: "Trắng" },
      { hex: "#F0E68C", name: "Vàng nhạt" },
      { hex: "#90EE90", name: "Xanh mint" },
      { hex: "#ff5fa3", name: "Hồng" },
    ],
    sizes: ["S", "M", "L"],
    unavailSizes: [],
    features: [
      "Chất liệu: Cotton Jersey 160gsm mềm nhẹ",
      "Cổ tròn classic, đường may kép bền chắc",
      "Màu sắc tươi sáng, không bị phai",
      "Phù hợp mặc 4 mùa, đặc biệt mùa hè",
    ],
    reviewList: [
      { id: 1, name: "Trương Mỹ Linh", rating: 5, date: "09/03/2025", text: "Giá tốt, chất ổn. Mua tặng bạn bè ai cũng thích!" },
      { id: 2, name: "Bùi Thanh Nam", rating: 4, date: "02/03/2025", text: "Vải mỏng nhẹ phù hợp thời tiết nóng ở Sài Gòn. Sẽ mua thêm màu khác." },
    ],
  },
  {
    id: 5,
    name: "Vintage Wash Crop",
    price: 319000,
    originalPrice: 380000,
    tag: "Sale",
    category: "Vintage",
    rating: 4.5,
    reviews: 58,
    sold: 97,
    sku: "VWC-005",
    material: "Cotton Vintage Wash 190gsm",
    description:
      "Áo thun crop vintage wash mang phong cách retro đậm chất. Được xử lý qua kỹ thuật washed đặc biệt tạo cảm giác cũ kỹ tự nhiên — như chiếc áo đã theo bạn qua nhiều năm tháng.",
    images: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#a0522d", name: "Nâu đất" },
      { hex: "#deb887", name: "Be cát" },
      { hex: "#8B7355", name: "Nâu vàng" },
    ],
    sizes: ["XS", "S", "M"],
    unavailSizes: [],
    features: [
      "Chất liệu: Cotton Vintage Wash 190gsm",
      "Kiểu dáng crop — dài khoảng 52–55cm",
      "Kỹ thuật washing tạo hiệu ứng vintage tự nhiên",
      "Phù hợp phối cùng quần high-waist",
    ],
    reviewList: [
      { id: 1, name: "Cao Ngọc Ánh", rating: 5, date: "11/03/2025", text: "Áo đẹp như vintage thật sự! Màu nâu đất rất hợp xu hướng 2025." },
    ],
  },
  {
    id: 6,
    name: "Bold Print Tee",
    price: 289000,
    originalPrice: null,
    tag: "Mới",
    category: "Graphic",
    rating: 4.4,
    reviews: 43,
    sold: 76,
    sku: "BPT-006",
    material: "Cotton Pima 175gsm",
    description:
      "In họa tiết đậm nét, táo bạo — dành cho những ai không ngại nổi bật. Chất liệu Cotton Pima cao cấp mềm mịn, thoáng khí. Thiết kế unisex phù hợp cả nam và nữ.",
    images: [
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#ff6b6b", name: "Đỏ" },
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#ffffff", name: "Trắng" },
    ],
    sizes: ["S", "M", "L", "XL"],
    unavailSizes: ["XL"],
    features: [
      "Chất liệu: Cotton Pima 175gsm",
      "In DTG (Direct to Garment) sắc nét, bền màu",
      "Dáng regular fit unisex",
      "Giặt máy bình thường, lật mặt trong",
    ],
    reviewList: [
      { id: 1, name: "Hồ Quang Minh", rating: 4, date: "08/03/2025", text: "In đẹp, màu sắc tươi. Áo mặc khá thoải mái." },
      { id: 2, name: "Đinh Thu Trang", rating: 5, date: "04/03/2025", text: "Rất nổi bật khi ra đường! Mọi người đều hỏi mua ở đâu." },
    ],
  },
  {
    id: 7,
    name: "Sport Performance Tee",
    price: 369000,
    originalPrice: null,
    tag: null,
    category: "Thể thao",
    rating: 4.6,
    reviews: 92,
    sold: 210,
    sku: "SPT-007",
    material: "Polyester DryFit 150gsm",
    description:
      "Áo thun thể thao công nghệ DryFit — thấm hút mồ hôi nhanh, khô thoáng ngay cả khi vận động mạnh. Thiết kế co giãn 4 chiều giúp bạn thoải mái tối đa trong mọi hoạt động từ gym đến chạy bộ.",
    images: [
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#0077b6", name: "Xanh navy" },
      { hex: "#ef233c", name: "Đỏ" },
      { hex: "#ffffff", name: "Trắng" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    unavailSizes: [],
    features: [
      "Chất liệu: Polyester DryFit 150gsm",
      "Công nghệ thấm hút mồ hôi nhanh",
      "Co giãn 4 chiều, không bó gò bó",
      "Kháng khuẩn, khử mùi",
    ],
    reviewList: [
      { id: 1, name: "Phan Văn Đức", rating: 5, date: "13/03/2025", text: "Đúng chuẩn áo gym! Mặc tập không ra mùi, khô nhanh." },
      { id: 2, name: "Lê Thị Xuân", rating: 4, date: "06/03/2025", text: "Chất liệu tốt, mặc chạy bộ buổi sáng rất thoải mái." },
    ],
  },
  {
    id: 8,
    name: "Stripe Nautical Tee",
    price: 279000,
    originalPrice: 329000,
    tag: "Sale",
    category: "Sọc kẻ",
    rating: 4.3,
    reviews: 31,
    sold: 55,
    sku: "SNT-008",
    material: "Cotton Breton 180gsm",
    description:
      "Áo thun kẻ sọc nautical truyền thống lấy cảm hứng từ thời trang hải quân Pháp. Họa tiết sọc ngang tinh tế, dễ phối đồ, mang phong cách Âu Á kết hợp hài hòa.",
    images: [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#1a1a1a", name: "Đen trắng" },
      { hex: "#0077b6", name: "Xanh trắng" },
      { hex: "#ef233c", name: "Đỏ trắng" },
    ],
    sizes: ["S", "M", "L"],
    unavailSizes: ["L"],
    features: [
      "Chất liệu: Cotton Breton 180gsm",
      "Sọc ngang cân đối, sắc nét không nhòe",
      "Cổ tròn, tay ngắn classic",
      "Phù hợp phối quần jean, chân váy",
    ],
    reviewList: [
      { id: 1, name: "Vũ Ngọc Hân", rating: 4, date: "07/03/2025", text: "Áo đẹp kiểu dáng cổ điển. Chất vải tốt, không bị bai sau giặt." },
    ],
  },
];

// Helper: lấy sản phẩm theo id
export const getProductById = (id) =>
  ALL_PRODUCTS.find((p) => p.id === Number(id)) || null;

// Helper: sản phẩm liên quan (cùng category, khác id)
export const getRelatedProducts = (product, limit = 4) =>
  ALL_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, limit);
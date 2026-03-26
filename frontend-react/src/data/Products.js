// ── Shared Product Data ──────────────────────────────────────────────────────
// Dùng chung cho ProductsPage, ProductDetailPage, HomePage
// Bao gồm cả Áo và Quần

export const ALL_PRODUCTS = [
  // ══════════════════════════════════════════════════════════════
  //  ÁO THUN
  // ══════════════════════════════════════════════════════════════
  {
    id: 1,
    type: "Áo",
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
    type: "Áo",
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
    type: "Áo",
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
    type: "Áo",
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
    type: "Áo",
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
    type: "Áo",
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
    type: "Áo",
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
    type: "Áo",
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

  // ══════════════════════════════════════════════════════════════
  //  QUẦN
  // ══════════════════════════════════════════════════════════════
  {
    id: 9,
    type: "Quần",
    name: "Slim Fit Jeans",
    price: 499000,
    originalPrice: 620000,
    tag: "Bán chạy",
    category: "Jeans",
    rating: 4.8,
    reviews: 156,
    sold: 289,
    sku: "SFJ-009",
    material: "Denim Cotton 98% / Elastane 2%, 12oz",
    description:
      "Quần jeans slim fit dáng ôm vừa phải, tôn dáng mà vẫn thoải mái khi vận động. Chất denim cao cấp pha elastane giúp co giãn nhẹ, không bó cứng. Màu xanh chàm đặc trưng, fade tự nhiên sau nhiều lần giặt tạo nét vintage riêng.",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#1a3a5c", name: "Xanh chàm" },
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#6b93c4", name: "Xanh nhạt" },
    ],
    sizes: ["28", "29", "30", "31", "32", "34"],
    unavailSizes: [],
    features: [
      "Chất liệu: Denim Cotton 98% / Elastane 2%, 12oz",
      "Dáng slim fit tôn dáng, không bó cứng",
      "5 túi cổ điển, khóa kim loại bền chắc",
      "Fade tự nhiên theo thời gian tạo nét vintage",
    ],
    reviewList: [
      { id: 1, name: "Nguyễn Hoàng Nam", rating: 5, date: "15/03/2025", text: "Quần jeans chất lượng cao, vải dày dặn không bị bai. Size 30 vừa chuẩn người 65kg." },
      { id: 2, name: "Trần Thị Mai", rating: 5, date: "10/03/2025", text: "Mặc đi làm, đi chơi đều ổn. Vải có độ co giãn nhẹ rất thoải mái." },
      { id: 3, name: "Lê Văn Hùng", rating: 4, date: "05/03/2025", text: "Chất lượng tốt, giao hàng nhanh. Màu xanh chàm rất đẹp, đúng như hình." },
    ],
  },
  {
    id: 10,
    type: "Quần",
    name: "Jogger Streetwear",
    price: 389000,
    originalPrice: null,
    tag: "Mới",
    category: "Jogger",
    rating: 4.7,
    reviews: 98,
    sold: 187,
    sku: "JSW-010",
    material: "French Terry Cotton 280gsm",
    description:
      "Quần jogger streetwear với thiết kế thun gấu co dãn thoải mái, túi hộp tiện dụng. Chất french terry dày dặn giữ form tốt, không bai không nhăn. Phù hợp mặc thường ngày hoặc dạo phố phong cách.",
    images: [
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#5a5a6e", name: "Xám đậm" },
      { hex: "#2d4a3e", name: "Xanh rêu" },
      { hex: "#c8a882", name: "Be khói" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    unavailSizes: [],
    features: [
      "Chất liệu: French Terry Cotton 280gsm",
      "Thun gấu co dãn thoải mái, không bó cổ chân",
      "Túi hộp 2 bên + túi kéo khóa sau",
      "Dây rút lưng điều chỉnh, khóa inox",
    ],
    reviewList: [
      { id: 1, name: "Phạm Quang Khải", rating: 5, date: "14/03/2025", text: "Quần mặc siêu thoải mái, chất dày vừa phải. Mua 2 cái luôn!" },
      { id: 2, name: "Đỗ Thùy Linh", rating: 4, date: "08/03/2025", text: "Màu đen rất đẹp, không bị bạc sau giặt máy. Giao hàng đúng hẹn." },
    ],
  },
  {
    id: 11,
    type: "Quần",
    name: "Wide Leg Cargo",
    price: 549000,
    originalPrice: 649000,
    tag: "Sale",
    category: "Cargo",
    rating: 4.6,
    reviews: 73,
    sold: 142,
    sku: "WLC-011",
    material: "Cotton Twill 240gsm",
    description:
      "Quần cargo wide leg phong cách Y2K trở lại mạnh mẽ. Thiết kế ống rộng, túi hộp 2 bên to bản thực dụng, lưng thun phối dây rút. Chất cotton twill dày dặn, giữ form, không bị xô lệch sau nhiều lần mặc.",
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#556b2f", name: "Xanh olive" },
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#c8a882", name: "Be cát" },
      { hex: "#5a4a3a", name: "Nâu đất" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    unavailSizes: ["XS"],
    features: [
      "Chất liệu: Cotton Twill 240gsm dày dặn",
      "Dáng wide leg, ống quần rộng thoải mái",
      "6 túi: 2 túi chéo trước, 2 túi hộp bên, 2 túi sau",
      "Lưng thun phối dây rút điều chỉnh",
    ],
    reviewList: [
      { id: 1, name: "Hoàng Văn Minh", rating: 5, date: "13/03/2025", text: "Quần cargo này chuẩn trend! Phối cùng crop tee trông rất xịn." },
      { id: 2, name: "Nguyễn Thị Bảo", rating: 4, date: "07/03/2025", text: "Chất dày, đứng form đẹp. Màu olive nhìn thực tế đẹp hơn ảnh nhiều." },
    ],
  },
  {
    id: 12,
    type: "Quần",
    name: "Shorts Thể Thao DryFit",
    price: 249000,
    originalPrice: null,
    tag: null,
    category: "Shorts",
    rating: 4.5,
    reviews: 61,
    sold: 119,
    sku: "STD-012",
    material: "Polyester DryFit 130gsm",
    description:
      "Quần shorts thể thao công nghệ DryFit thấm hút mồ hôi nhanh, khô ngay khi vận động. Lót lưới thoáng mát bên trong, thun lưng co giãn 4 chiều. Phù hợp gym, chạy bộ, đá bóng hay đơn giản là mặc thường ngày.",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#0077b6", name: "Xanh navy" },
      { hex: "#ef233c", name: "Đỏ" },
      { hex: "#2d7a2d", name: "Xanh lá" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    unavailSizes: [],
    features: [
      "Chất liệu: Polyester DryFit 130gsm siêu nhẹ",
      "Công nghệ thấm hút mồ hôi, khô nhanh",
      "Lót lưới thoáng mát, túi kéo khóa bên",
      "Co giãn 4 chiều tự do vận động",
    ],
    reviewList: [
      { id: 1, name: "Trần Quốc Dũng", rating: 5, date: "12/03/2025", text: "Mặc đi gym mỗi ngày, khô rất nhanh. Mua 3 cái luôn!" },
      { id: 2, name: "Lê Thị Hoa", rating: 4, date: "06/03/2025", text: "Nhẹ thoáng, thoải mái. Mặc mùa hè rất phù hợp." },
    ],
  },
  {
    id: 13,
    type: "Quần",
    name: "Kaki Straight Fit",
    price: 459000,
    originalPrice: 530000,
    tag: "Bán chạy",
    category: "Kaki",
    rating: 4.7,
    reviews: 84,
    sold: 163,
    sku: "KSF-013",
    material: "Cotton Kaki 260gsm",
    description:
      "Quần kaki straight fit thanh lịch, đa năng phối được cả outfits đi làm lẫn dạo phố. Chất cotton kaki dày dặn, không nhăn, giữ form cả ngày. Đường may tinh tế, phom chuẩn không lỗi mốt.",
    images: [
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#c8a882", name: "Be cát" },
      { hex: "#556b2f", name: "Xanh olive" },
      { hex: "#1a1a1a", name: "Đen" },
      { hex: "#8B7355", name: "Nâu" },
    ],
    sizes: ["28", "29", "30", "31", "32", "34"],
    unavailSizes: [],
    features: [
      "Chất liệu: Cotton Kaki 260gsm cao cấp",
      "Dáng straight fit đứng form, không nhăn",
      "Túi chéo trước, túi mổ sau tinh tế",
      "Phù hợp đi làm, đi chơi, đi tiệc",
    ],
    reviewList: [
      { id: 1, name: "Võ Thành Long", rating: 5, date: "11/03/2025", text: "Quần kaki chất lượng thật sự. Mặc đi làm ai cũng khen." },
      { id: 2, name: "Nguyễn Thu Nga", rating: 4, date: "04/03/2025", text: "Màu be rất đẹp, dễ phối đồ. Chất không nhăn sau nguyên ngày mặc." },
    ],
  },
  {
    id: 14,
    type: "Quần",
    name: "Denim Baggy Y2K",
    price: 529000,
    originalPrice: null,
    tag: "Mới",
    category: "Jeans",
    rating: 4.5,
    reviews: 47,
    sold: 89,
    sku: "DBY-014",
    material: "Denim Cotton 100%, 14oz",
    description:
      "Quần jeans baggy phong cách Y2K đang cực hot. Ống quần rộng, độ dài vừa phải, wash màu xanh nhạt vintage đặc trưng. Chất denim 14oz dày dặn đứng form, không bai. Mặc cùng sneaker hay boots đều đỉnh.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=750&fit=crop",
    ],
    colors: [
      { hex: "#6b93c4", name: "Xanh nhạt" },
      { hex: "#3a5a8a", name: "Xanh wash" },
      { hex: "#1a1a1a", name: "Đen" },
    ],
    sizes: ["28", "29", "30", "31", "32"],
    unavailSizes: ["28"],
    features: [
      "Chất liệu: Denim Cotton 100%, 14oz dày",
      "Dáng baggy ống rộng phong cách Y2K",
      "Màu wash vintage, fade đẹp theo thời gian",
      "5 túi cổ điển, nút kim loại bền",
    ],
    reviewList: [
      { id: 1, name: "Cao Thị Lan", rating: 5, date: "10/03/2025", text: "Quần Y2K chuẩn luôn! Mặc phối áo crop tee trông rất chill." },
      { id: 2, name: "Bùi Quốc Huy", rating: 4, date: "03/03/2025", text: "Denim dày, form đứng đẹp. Màu wash nhạt rất vintage." },
    ],
  },
];

// ── Category definitions (dùng cho filter) ─────────────────────────────────
export const CATEGORIES_AO = ["Cơ bản", "Graphic", "Oversized", "Vintage", "Thể thao", "Sọc kẻ"];
export const CATEGORIES_QUAN = ["Jeans", "Jogger", "Cargo", "Shorts", "Kaki"];
export const ALL_CATEGORIES = ["Tất cả", ...CATEGORIES_AO, ...CATEGORIES_QUAN];

// ── Helper: lấy sản phẩm theo id ──────────────────────────────────────────
export const getProductById = (id) =>
  ALL_PRODUCTS.find((p) => p.id === Number(id)) || null;

// ── Helper: sản phẩm liên quan (cùng type + category ưu tiên, khác id) ───
export const getRelatedProducts = (product, limit = 4) => {
  const sameCat = ALL_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  );
  if (sameCat.length >= limit) return sameCat.slice(0, limit);
  const sameType = ALL_PRODUCTS.filter(
    (p) => p.type === product.type && p.id !== product.id && p.category !== product.category
  );
  return [...sameCat, ...sameType].slice(0, limit);
};
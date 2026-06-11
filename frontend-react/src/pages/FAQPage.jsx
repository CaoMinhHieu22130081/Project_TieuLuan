import React, { useState } from 'react';
import './css/FAQpage.css';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`faq-card ${isOpen ? 'active' : ''}`}>
      <button className="faq-question-btn" onClick={onClick}>
        <span className="fq-text">{question}</span>
        <div className="fq-icon-wrap">
          <span className={`fq-icon ${isOpen ? 'rotate' : ''}`}>+</span>
        </div>
      </button>
      <div className="faq-answer-wrap" style={{ height: isOpen ? 'auto' : '0px' }}>
        <div className="faq-answer-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openIndexes, setOpenIndexes] = useState({});

  const faqData = [
    {
      category: "GIAO HÀNG & ĐƠN",
      icon: "01",
      questions: [
        {
          q: "Phí vận chuyển tại UniqTee là bao nhiêu?",
          a: "Chúng tôi áp dụng phí vận chuyển đồng giá 30.000đ cho đơn hàng nội thành TP.HCM và 45.000đ cho các tỉnh thành khác. Miễn phí vận chuyển cho đơn hàng từ 500.000đ."
        },
        {
          q: "Bao lâu thì tôi nhận được hàng?",
          a: "Thời gian giao hàng dự kiến là 1-2 ngày đối với khu vực TP.HCM và 3-5 ngày đối với các tỉnh thành khác. Hệ thống tự động theo dõi thời gian thực."
        },
        {
          q: "Làm thế nào để theo dõi lệnh xuất kho?",
          a: "Khi gói hàng rời kho, bạn sẽ nhận được một Mã Vận Đơn qua email hoặc tin nhắn. Bạn có thể sử dụng mã này để tra cứu trên hệ thống của đơn vị vận chuyển."
        }
      ]
    },
    {
      category: "SẢN PHẨM & KÍCH THƯỚC",
      icon: "02",
      questions: [
        {
          q: "Cách chọn kích cỡ áo chuẩn xác?",
          a: "UniqTee tung ra số đo chi tiết cho từng loại. Do thiết kế là dáng rộng phi giới tính, dáng áo mặc định đã tạo cảm giác phóng khoáng. Nếu bạn thích mặt rất rộng, hãy cộng thêm 1 kích cỡ."
        },
        {
          q: "Chất liệu vải được cấu tạo thế nào?",
          a: "Toàn bộ dải sản phẩm làm từ 100% Cotton 2 chiều hoặc 4 chiều cao cấp, định lượng 230-250gsm. Kết cấu bền vững, chống bai nhão, giữ dáng đứng tuyệt đối."
        }
      ]
    },
    {
      category: "BẢO HÀNH & ĐỔI TRẢ",
      icon: "03",
      questions: [
        {
          q: "Chính sách đổi trả trong 7 ngày?",
          a: "Thực hiện đổi trả trong 7 ngày sau khi ký nhận. Yêu cầu: Sản phẩm nguyên vẹn, Tem mác chưa bóc, chưa qua giặt tẩy. Hỗ trợ đổi kích cỡ miễn phí phí nếu trong kho còn hàng."
        },
        {
          q: "Có được kiểm tra hàng trước khi nhận không?",
          a: "Hoàn toàn được phép. Khách hàng có quyền kiểm tra sản phẩm cùng nhân viên giao nhận trước khi thanh toán bằng tiền mặt."
        }
      ]
    }
  ];

  const handleToggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndexes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="faq-cyber-wrapper">
      <div className="faq-grid-container">
        
        {/* LEFT COLUMN: HEADER & TABS */}
        <div className="faq-side-panel">
          <header className="faq-header-cyber">
            <div className="system-badge">[ KHO LƯU TRỮ ]</div>
            <h1>CÂU HỎI <br/><span className="accent-glitch" data-text="THƯỜNG GẶP">THƯỜNG GẶP</span></h1>
            <p>Truy xuất dữ liệu hệ thống. Những vướng mắc phổ biến trong quá trình vận hành đã được giải đáp tại đây.</p>
          </header>

          <div className="faq-tabs-cyber">
            {faqData.map((cat, idx) => (
              <button 
                key={idx} 
                className={`tab-cyber-btn ${activeCategory === idx ? 'active' : ''}`}
                onClick={() => setActiveCategory(idx)}
              >
                <span className="tab-icon">[{cat.icon}]</span>
                <span className="tab-label">{cat.category}</span>
                <span className="tab-indicator"></span>
              </button>
            ))}
          </div>

          <div className="faq-support-box">
            <div className="support-icon">[?]</div>
            <h3>CẦN THÊM THÔNG TIN?</h3>
            <p>Nếu kho dữ liệu không chứa câu trả lời bạn tìm kiếm, hãy thiết lập liên lạc trực tiếp với nhân viên hỗ trợ.</p>
            <a href="/contact" className="cyber-link-btn">KẾT NỐI NGAY <span className="arrow">→</span></a>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTENT */}
        <div className="faq-content-panel">
          <div className="faq-category-header">
            <h2>{faqData[activeCategory].category}</h2>
            <span className="doc-count">{faqData[activeCategory].questions.length} TÀI LIỆU</span>
          </div>

          <div className="faq-accordion-list">
            {faqData[activeCategory].questions.map((item, idx) => (
              <FAQItem 
                key={idx} 
                question={item.q} 
                answer={item.a} 
                isOpen={!!openIndexes[`${activeCategory}-${idx}`]}
                onClick={() => handleToggle(activeCategory, idx)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FAQPage;

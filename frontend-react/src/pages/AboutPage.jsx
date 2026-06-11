import React, { useEffect, useRef } from 'react';
import './css/Aboutpage.css';

const AboutPage = () => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  return (
    <div className="about-dystopia-wrapper" ref={scrollRef}>

      {/* --- HERO MARQUEE --- */}
      <section className="about-hero-glitch">
        <div className="marquee-container">
          <div className="marquee-content">
            {Array(10).fill(0).map((_, i) => (
              <span key={i}>
                UNIQTEE <span className="stroke">VƯỢT BẬC</span> &nbsp;&mdash;&nbsp;
              </span>
            ))}
          </div>
          <div className="marquee-content marquee-content-clone">
            {Array(10).fill(0).map((_, i) => (
              <span key={i}>
                UNIQTEE <span className="stroke">VƯỢT BẬC</span> &nbsp;&mdash;&nbsp;
              </span>
            ))}
          </div>
        </div>
        <div className="hero-subtext animate-on-scroll">
          <p>Không chỉ là thời trang. Chúng tôi là bản tuyên ngôn của sự bức phá, chuẩn thời trang phi giới tính. Tự tin bước qua mọi rào cản.</p>
        </div>
      </section>

      {/* --- ASYMMETRIC GRID: QUALITY --- */}
      <section className="about-asym-grid">
        <div className="asym-box image-box box-tall animate-on-scroll delay-1">
          <div className="overlay-glitch"></div>
          <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop" alt="Premium Quality" />
          <div className="photo-tag">[ CHẤT LIỆU CAO CẤP ]</div>
        </div>
        <div className="asym-box text-box animate-on-scroll delay-2">
          <h2 className="glitch-text" data-text="CHẤT LƯỢNG LÀ NỀN TẢNG">CHẤT LƯỢNG LÀ NỀN TẢNG</h2>
          <p>Mỗi sản phẩm tại UniqTee đều bắt đầu từ việc lựa chọn những sợi bông hữu cơ tốt nhất. Cảm giác trên làn da là thứ quyết định cái tôi tự tin.</p>
          <p>Quy trình chống co rút, xử lý enzym công nghệ cao đảm bảo độ mềm mại bền bỉ ngay cả trong những môi trường khắc nghiệt nhất. Bạn không chỉ mặc một chiếc áo, bạn đang khoác lên minh thẻ căn cước của sự thoải mái tối thượng.</p>
        </div>
      </section>

      {/* --- ASYMMETRIC GRID: DESIGN --- */}
      <section className="about-asym-grid reverse">
        <div className="asym-box text-box animate-on-scroll delay-2">
          <h2 className="glitch-text" data-text="NGHỆ THUẬT QUÁ KHÍCH">NGHỆ THUẬT QUÁ KHÍCH</h2>
          <p>UniqTee là sân khấu ngầm của sự sáng tạo. Chúng tôi bắt tay thiết kế cùng với các họa sĩ đương đại và nhà thiết kế độc lập tạc nên những tuyên ngôn nghệ thuật mãnh liệt nhất.</p>
          <p>Các bộ sưu tập giới hạn chỉ xuất hiện một lần. Chúng tôi đập tan đi khái niệm trào lưu, bởi vì chúng tôi đi trước, chúng tôi tạo ra nó.</p>
          <button className="cyber-btn" onClick={() => window.location.href = '/products'}>
            KHÁM PHÁ NGAY<span className="cyber-btn-glitch"></span>
          </button>
        </div>
        <div className="asym-box image-box box-wide animate-on-scroll delay-1">
          <div className="overlay-glitch"></div>
          <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop" alt="Unique Designs" />
          <div className="photo-tag type-2">[ BỘ SƯU TẬP NGHỆ THUẬT ]</div>
        </div>
      </section>

      {/* --- NEON STATS CARDS --- */}
      <section className="about-neon-stats">
        <div className="neon-stat-card animate-on-scroll">
          <div className="nsc-ring"></div>
          <span className="nsc-number">10K+</span>
          <span className="nsc-label">TÍN ĐỒ ĐỒNG HÀNH</span>
        </div>
        <div className="neon-stat-card animate-on-scroll delay-1">
          <div className="nsc-ring"></div>
          <span className="nsc-number">150+</span>
          <span className="nsc-label">THIẾT KẾ ĐỘC QUYỀN</span>
        </div>
        <div className="neon-stat-card animate-on-scroll delay-2">
          <div className="nsc-ring"></div>
          <span className="nsc-number">8H</span>
          <span className="nsc-label">GIAO HÀNG HỎA TỐC VN</span>
        </div>
      </section>

      {/* --- VISION STATEMENT --- */}
      <section className="about-vision-cyber animate-on-scroll">
        <div className="vision-glass-panel">
          <div className="v-header">
            <span>[ TÀI LIỆU LƯU TRỮ ]</span>
            <span>TAM_NHIN / DANG_GIAI_MA_</span>
          </div>
          <h2>TẦM NHÌN <span className="accent">THẾ KỶ</span></h2>
          <p>
            Trở thành tư tưởng thời trang hàng đầu dành cho giới trẻ, phá bỏ lằn ranh giới tính,
            và kích hoạt một môi trường thời trang dũng cảm – nơi mỗi người mang trang phục không vì che đậy thân thể, mà để bộc lộ hoàn toàn nhân dạng nguyên bản nhất.
          </p>
          <div className="v-footer">&gt;&gt; TRẠNG THÁI: SẴN SÀNG_</div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;

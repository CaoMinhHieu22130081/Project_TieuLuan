import React, { useState } from 'react';
import './css/Contactpage.css';
import { contactAPI } from '../services/api';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const messageData = {
      name: e.target[0].value,
      email: e.target[1].value,
      message: e.target[2].value
    };

    try {
      await contactAPI.sendMessage(messageData);
      setLoading(false);
      setSubmitted(true);
    } catch (err) {
      setLoading(false);
      setError("Không kết nối được Máy chủ. Vui lòng thử lại.");
      console.error(err);
    }
  };

  return (
    <div className="contact-cyber-wrapper">
      <div className="contact-grid-container">
        
        {/* LEFT COLUMN: INFO STATS */}
        <div className="contact-info-panel">
          <header className="contact-header-cyber">
            <div className="system-badge">[ TRẠNG THÁI: KẾT NỐI ]</div>
            <h1>BÁO CÁO <br/><span className="accent-glitch" data-text="SỰ CỐ">SỰ CỐ</span></h1>
            <p>Liên kết trực tiếp với Ban Quản Trị. Mọi yêu cầu, phản hồi hoặc hợp tác sẽ được xử lý qua biểu mẫu này.</p>
          </header>

          <div className="info-cyber-cards">
            <div className="inf-card">
              <div className="inf-icon"><span className="icon-pulse"></span>[V]</div>
              <div className="inf-text">
                <h3>VỊ TRÍ ĐỊA LÝ</h3>
                <p>Khu phố 6, Linh Trung, Thủ Đức<br/>TP. Hồ Chí Minh, VIỆT NAM</p>
              </div>
            </div>

            <div className="inf-card">
              <div className="inf-icon">[E]</div>
              <div className="inf-text">
                <h3>THƯ ĐIỆN TỬ</h3>
                <p className="highlight">22130081@st.hcmuaf.edu.vn</p>
              </div>
            </div>

            <div className="inf-card">
              <div className="inf-icon">[Đ]</div>
              <div className="inf-text">
                <h3>ĐƯỜNG DÂY NÓNG</h3>
                <p>+84 85 455 3708</p>
              </div>
            </div>
          </div>

          <div className="cyber-map-placeholder">
            <div className="radar-scan"></div>
            <div className="map-overlay-text">
              <span className="dot"></span> TỌA ĐỘ ĐƯỢC BẢO MẬT
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORM */}
        <div className="contact-form-panel">
          <div className="cyber-form-card">
            
            {submitted ? (
              <div className="form-success-cyber">
                <div className="fs-icon">///</div>
                <h3 className="glitch-text-small" data-text="ĐÃ GỬI DỮ LIỆU">ĐÃ GỬI DỮ LIỆU</h3>
                <p>Tin nhắn đã được mã hóa và gửi đến máy chủ thành công. Chúng tôi sẽ sớm phản hồi cho bạn.</p>
                <button 
                  onClick={() => setSubmitted(false)} 
                  className="cyber-btn-outline mt-20"
                >
                  <span className="btn-text">GỬI YÊU CẦU MỚI</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="cyber-form-inner">
                <div className="form-header">
                  <h3>KHU VỰC NHẬP LIỆU</h3>
                  <div className="status-dot-blink"></div>
                </div>

                {error && (
                  <div className="cyber-error-alert">
                    <span className="err-icon">[!]</span> {error}
                  </div>
                )}

                <div className="cyber-input-group">
                  <input type="text" id="cname" required disabled={loading} placeholder=" " />
                  <label htmlFor="cname">HỌ VÀ TÊN_</label>
                  <div className="input-glow"></div>
                </div>

                <div className="cyber-input-group">
                  <input type="email" id="cemail" required disabled={loading} placeholder=" " />
                  <label htmlFor="cemail">ĐỊA CHỈ EMAIL_</label>
                  <div className="input-glow"></div>
                </div>

                <div className="cyber-input-group">
                  <textarea id="cmsg" rows="5" required disabled={loading} placeholder=" "></textarea>
                  <label htmlFor="cmsg">NỘI DUNG_</label>
                  <div className="input-glow"></div>
                </div>

                <button 
                  type="submit" 
                  className={`cyber-btn-primary ${loading ? 'scanning' : ''}`}
                  disabled={loading}
                >
                  <span className="btn-text">{loading ? 'ĐANG MÃ HÓA...' : 'TIẾN HÀNH GỬI'}</span>
                  <div className="btn-scanner"></div>
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;

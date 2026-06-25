import React, { useState } from 'react';
import './css/Contactpage.css';
import { contactAPI } from '../services/api';
import OpenStreetMap from '../components/OpenStreetMap';

const STORE_INFO = {
  title: 'UniqTee Store',
  address: 'Khu phố 6, Linh Trung, Thủ Đức, TP. Hồ Chí Minh',
  center: [10.8702, 106.7922],
  searchQuery: 'Khu phố 6, Linh Trung, Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam',
};

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const messageData = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      message: String(formData.get('message') || '').trim()
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

        <div className="contact-info-panel">
          <header className="contact-header-cyber">
            <div className="system-badge">HỖ TRỢ KHÁCH HÀNG</div>
            <h1>LIÊN HỆ <br /><span className="accent-glitch" data-text="UNIQTEE">UNIQTEE</span></h1>
            <p>Gửi thắc mắc về sản phẩm, đơn hàng hoặc hợp tác. Đội ngũ UniqTee sẽ phản hồi qua email trong thời gian sớm nhất.</p>
          </header>

          <OpenStreetMap
            className="contact-store-map"
            center={STORE_INFO.center}
            title={STORE_INFO.title}
            address={STORE_INFO.address}
            searchQuery={STORE_INFO.searchQuery}
          />

          <div className="info-cyber-cards">
            <div className="inf-card">
              <div className="inf-icon"><span className="icon-pulse"></span>[V]</div>
              <div className="inf-text">
                <h3>VỊ TRÍ CỬA HÀNG</h3>
                <p>Khu phố 6, Linh Trung, Thủ Đức<br />TP. Hồ Chí Minh, Việt Nam</p>
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
                <h3>HOTLINE</h3>
                <p>+84 85 455 3708</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-panel">
          <div className="cyber-form-card">

            {submitted ? (
              <div className="form-success-cyber">
                <div className="fs-icon">OK</div>
                <h3 className="glitch-text-small" data-text="ĐÃ GỬI THÔNG TIN">ĐÃ GỬI THÔNG TIN</h3>
                <p>Tin nhắn đã được gửi thành công. Chúng tôi sẽ kiểm tra và phản hồi cho bạn trong thời gian sớm nhất.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="cyber-btn-outline mt-20"
                >
                  <span className="btn-text">GỬI LIÊN HỆ MỚI</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="cyber-form-inner">
                <div className="form-header">
                  <h3>THÔNG TIN LIÊN HỆ</h3>
                  <div className="status-dot-blink"></div>
                </div>

                {error && (
                  <div className="cyber-error-alert">
                    <span className="err-icon">[!]</span> {error}
                  </div>
                )}

                <div className="cyber-input-group">
                  <input type="text" id="cname" name="name" required disabled={loading} placeholder=" " />
                  <label htmlFor="cname">HỌ VÀ TÊN</label>
                  <div className="input-glow"></div>
                </div>

                <div className="cyber-input-group">
                  <input type="email" id="cemail" name="email" required disabled={loading} placeholder=" " />
                  <label htmlFor="cemail">ĐỊA CHỈ EMAIL</label>
                  <div className="input-glow"></div>
                </div>

                <div className="cyber-input-group">
                  <textarea id="cmsg" name="message" rows="5" required disabled={loading} placeholder=" "></textarea>
                  <label htmlFor="cmsg">NỘI DUNG</label>
                  <div className="input-glow"></div>
                </div>

                <button
                  type="submit"
                  className={`cyber-btn-primary ${loading ? 'scanning' : ''}`}
                  disabled={loading}
                >
                  <span className="btn-text">{loading ? 'ĐANG GỬI...' : 'GỬI THÔNG TIN'}</span>
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

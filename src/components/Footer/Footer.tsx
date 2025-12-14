import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      {/* Phần chính của Footer */}
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            
            {/* Cột 1: Thông tin cửa hàng */}
            <div className="footer-col">
              <Link to="/" className="footer-logo">
                <img src="src\img\logo 01.png" alt="PetCare Logo"/>
              </Link>
              <p className="footer-desc">
                PetCare - Hệ thống cửa hàng thú cưng uy tín hàng đầu. Chúng tôi cung cấp các sản phẩm tốt nhất cho người bạn nhỏ của bạn.
              </p>
              <div className="contact-info">
                <p><i className="fas fa-map-marker-alt"></i> 123 Đường Láng, Đống Đa, Hà Nội</p>
                <p><i className="fas fa-phone-alt"></i> 0832 234 628</p>
                <p><i className="fas fa-envelope"></i> contact@petcare.vn</p>
              </div>
            </div>

            {/* Cột 2: Liên kết nhanh */}
            <div className="footer-col">
              <h3>Liên kết nhanh</h3>
              <ul className="footer-links">
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/customer">Sản phẩm</Link></li>
                <li><Link to="/booking">Đặt lịch Spa</Link></li>
                <li><Link to="/promotions">Khuyến mãi</Link></li>
                <li><Link to="/blog">Tin tức thú cưng</Link></li>
              </ul>
            </div>

            {/* Cột 3: Chính sách */}
            <div className="footer-col">
              <h3>Chính sách</h3>
              <ul className="footer-links">
                <li><Link to="#">Chính sách đổi trả</Link></li>
                <li><Link to="#">Chính sách bảo mật</Link></li>
                <li><Link to="#">Điều khoản dịch vụ</Link></li>
                <li><Link to="#">Hướng dẫn mua hàng</Link></li>
                <li><Link to="#">Giao hàng & Thanh toán</Link></li>
              </ul>
            </div>

            {/* Cột 4: Đăng ký nhận tin & Mạng xã hội */}
            <div className="footer-col">
              <h3>Đăng ký nhận tin</h3>
              <p>Nhận thông tin khuyến mãi mới nhất từ chúng tôi.</p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Nhập email của bạn..." />
                <button type="submit"><i className="fas fa-paper-plane"></i></button>
              </form>
              
              <div className="social-links">
                <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                <a href="#" className="social-icon"><i className="fab fa-tiktok"></i></a>
                <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Phần bản quyền dưới cùng */}
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} PetCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useState, useEffect } from 'react';
import './HomeBanner.css'; // Import file CSS

// Định nghĩa kiểu dữ liệu cho Policy Item
interface PolicyItem {
  id: number;
  icon: string;
  title: string;
  desc: string;
}

const HomeBanner: React.FC = () => {
  // 1. Danh sách ảnh Banner (Bạn có thể thêm bao nhiêu ảnh tùy thích vào đây)
  const bannerImages = [
    "https://paddy.vn/cdn/shop/files/banner_web_1880_x_720_px_1.png?v=1763368743&width=1880",
    "https://paddy.vn/cdn/shop/files/paddy-silver-spoon_1880_x_720_px.jpg?v=1748850125&width=1880",
    "https://paddy.vn/cdn/shop/files/banner_web_1880_x_720_px_fda8c25f-aea1-4b7e-af96-e0bbd9e99e6d.png?v=1763008773&width=1880"
  ];

  // 2. State quản lý chỉ số (index) của slide hiện tại
  const [currentSlide, setCurrentSlide] = useState(0);

  // 3. Dữ liệu cho 4 ô tiện ích (Policy)
  const policies: PolicyItem[] = [
    {
      id: 1,
      icon: "fa-truck-fast", // Class icon FontAwesome
      title: "Miễn phí Vận chuyển",
      desc: "Đơn hàng từ 500k"
    },
    {
      id: 2,
      icon: "fa-certificate",
      title: "Sản phẩm Chính hãng",
      desc: "Cam kết 100%"
    },
    {
      id: 3,
      icon: "fa-credit-card",
      title: "Thanh toán Tiện lợi",
      desc: "Đa dạng hình thức"
    },
    {
      id: 4,
      icon: "fa-headset",
      title: "Hỗ trợ Chuyên nghiệp",
      desc: "Hotline 24/7"
    }
  ];

  // 4. Hàm chuyển đến slide tiếp theo
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === bannerImages.length - 1 ? 0 : prev + 1));
  };

  // 5. Hàm quay lại slide trước
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? bannerImages.length - 1 : prev - 1));
  };

  // 6. Hàm nhảy đến slide cụ thể (khi click vào dấu chấm)
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // 7. Tự động chuyển slide sau mỗi 5 giây
  useEffect(() => {
    const slideInterval = setInterval(() => {
      nextSlide();
    }, 5000);

    // Dọn dẹp timer khi component bị hủy hoặc slide thay đổi thủ công
    return () => clearInterval(slideInterval);
  }, [currentSlide]);

  return (
    <div className="banner-wrapper">
      <div className="container">
        
        {/* --- PHẦN 1: SLIDE BANNER --- */}
        <div className="main-banner">
          <div className="banner-image-container">
            {/* Hiển thị ảnh theo index hiện tại */}
            <img 
              key={currentSlide} // Key thay đổi để React trigger animation lại
              src={bannerImages[currentSlide]} 
              alt={`Slide ${currentSlide + 1}`} 
              className="banner-img fade-animation"
            />
            
            {/* Nút điều hướng */}
            <button className="banner-nav prev" onClick={prevSlide} aria-label="Previous Slide">
                <i className="fas fa-chevron-left"></i>
            </button>
            <button className="banner-nav next" onClick={nextSlide} aria-label="Next Slide">
                <i className="fas fa-chevron-right"></i>
            </button>
            
            {/* Dots (Chấm tròn chỉ dẫn) */}
            <div className="banner-dots">
              {bannerImages.map((_, index) => (
                <span 
                  key={index} 
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                ></span>
              ))}
            </div>
          </div>
        </div>

        {/* --- PHẦN 2: CÁC Ô TIỆN ÍCH (POLICY) --- */}
        <div className="policy-grid">
          {policies.map((item) => (
            <div key={item.id} className="policy-item">
              <div className="policy-icon-box">
                <i className={`fas ${item.icon}`}></i>
              </div>
              <div className="policy-text">
                <h4 className="policy-title">{item.title}</h4>
                <p className="policy-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HomeBanner;
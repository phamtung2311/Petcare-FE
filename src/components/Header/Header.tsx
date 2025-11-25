import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import Login from "../Login/Login";

const Header: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  // Lấy sẵn username & role nếu đã login trước đó
  const [currentUserName, setCurrentUserName] = useState<string | null>(() =>
    localStorage.getItem("username")
  );
  const [currentRole, setCurrentRole] = useState<string | null>(() =>
    localStorage.getItem("role")
  );

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  // Click vào icon user
  const handleUserButtonClick = () => {
    if (!currentUserName) {
      // chưa đăng nhập -> mở popup login
      setShowLogin(true);
    } else {
      // đã đăng nhập -> bật/tắt menu
      setUserMenuOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    // xóa thông tin login
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    setCurrentUserName(null);
    setCurrentRole(null);
    setUserMenuOpen(false);

    navigate("/"); // về trang chủ
  };

  // Xem thông tin người dùng -> sang trang profile
  const handleViewProfile = () => {
    navigate("/profile");
    setUserMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        {/* TOP BAR */}
        <div className="header-top">
          <div className="container header-top-inner">
            {/* Logo */}
            <div className="logo">
              <img
                src="https://placehold.co/120x40?text=Paddy"
                alt="Paddy"
              />
            </div>

            {/* Search */}
            <div className="search-box">
              <input type="text" placeholder="Tìm kiếm sản phẩm..." />
              <button className="search-btn">
                <i className="fas fa-search" />
              </button>
            </div>

            {/* Right side: hotline + icons */}
            <div className="header-right">
              <div className="hotline">
                <span className="hotline-title">Hotline </span>
                <span className="hotline-number">0832234628</span>
              </div>

              <div className="header-icons">
                {/* USER MENU WRAPPER */}
                <div className="user-menu-wrapper">
                  <button
                    className="icon-item login-btn"
                    onClick={handleUserButtonClick}
                  >
                    <i className="far fa-user" />
                    <span>{currentUserName || "Đăng Nhập"}</span>
                  </button>

                  {/* Dropdown chỉ hiện khi đã login */}
                  {currentUserName && userMenuOpen && (
                    <div className="user-dropdown">
                      <button onClick={handleViewProfile}>
                        Xem thông tin người dùng
                      </button>
                      <button onClick={handleLogout}>Đăng xuất</button>
                    </div>
                  )}
                </div>

                {/* Giỏ hàng */}
                <div className="icon-item cart">
                  <i className="fas fa-shopping-cart" />
                  <span>Giỏ Hàng</span>
                  <div className="cart-badge">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAV BAR */}
        <nav className="header-nav">
          <div className="container">
            <ul className="nav-menu">
              <li>Sản phẩm</li>
              <li>Thức ăn</li>
              <li>Quần áo</li>
              <li>Đồ chơi</li>
              <li>Vệ sinh</li>
              <li>Đặt lịch</li>
              <li>Khuyến Mãi Mới Nhất</li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Popup Login */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(name, role) => {
            setCurrentUserName(name);
            setCurrentRole(role);
            localStorage.setItem("role", role); // lưu role lại dùng sau
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
};

export default Header;

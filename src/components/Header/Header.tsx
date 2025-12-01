import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./Header.css";
import Login from "../Login/Login";
import logo from "../../img/Anh web.png";

interface Category {
  id: number;
  name: string;
}

const Header: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(localStorage.getItem("username"));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const navigate = useNavigate();

  // Load danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/list");
        const categoryData = res.data.data?.categories || res.data.data || [];
        setCategories(categoryData);
      } catch (err) {
        console.error("Lỗi load menu category", err);
      }
    };
    fetchCategories();
  }, []);

  // Load số lượng giỏ hàng
  const fetchCartCount = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        setCartCount(0);
        return;
    }
    try {
      const res = await api.get("/cart");
      if (res.data.data && Array.isArray(res.data.data.items)) {
        const total = res.data.data.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      setCartCount(0); 
    }
  };

  useEffect(() => {
    fetchCartCount();
    const handleCartChange = () => fetchCartCount();
    window.addEventListener("cartChange", handleCartChange);
    return () => {
        window.removeEventListener("cartChange", handleCartChange);
    };
  }, [currentUserName]); 

  // --- HANDLERS ---
  const handleUserButtonClick = () => {
    if (!currentUserName) {
      setShowLogin(true);
    } else {
      setUserMenuOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUserName(null);
    setUserMenuOpen(false);
    setCartCount(0);
    navigate("/");
  };

  const handleSearch = () => {
    if (keyword.trim()) {
      navigate(`/customer?search=${encodeURIComponent(keyword)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleGoToCart = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("Vui lòng đăng nhập để xem giỏ hàng!");
        setShowLogin(true);
        return;
    }
    navigate("/cart");
  };

  const handleLinkClick = () => {
    setKeyword(""); 
    setUserMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <div className="container header-top-inner">
            {/* LOGO */}
            <Link to="/" className="logo" onClick={handleLinkClick}>
              <img src={logo} alt="PetCare" />
            </Link>

            {/* SEARCH BOX */}
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Bạn đang tìm gì cho thú cưng..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="search-btn" onClick={handleSearch}>
                <i className="fas fa-search" />
              </button>
            </div>

            {/* HEADER RIGHT ACTIONS */}
            <div className="header-right">
              <div className="hotline">
                <span className="hotline-title">Tư vấn miễn phí</span>
                <span className="hotline-number">083.223.4628</span>
              </div>

              <div className="header-icons">
                {/* User Info */}
                <div className="user-menu-wrapper">
                  <button className="icon-item login-btn" onClick={handleUserButtonClick}>
                    <i className={currentUserName ? "fas fa-user-check" : "far fa-user"} />
                    <span>{currentUserName ? `Chào, ${currentUserName}` : "Đăng Nhập"}</span>
                  </button>

                  {currentUserName && userMenuOpen && (
                    <div className="user-dropdown">
                      <button onClick={() => { navigate("/profile"); setUserMenuOpen(false); }}>
                        <i className="fas fa-id-card"></i> Hồ sơ cá nhân
                      </button>
                      <button onClick={() => { navigate("/my-pets"); setUserMenuOpen(false); }}>
                        <i className="fas fa-paw"></i> Thú cưng của tôi
                      </button>
                      <button onClick={handleLogout} className="logout-btn">
                        <i className="fas fa-sign-out-alt"></i> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>

                {/* Cart Info */}
                <div className="icon-item cart" onClick={handleGoToCart}>
                  <i className="fas fa-shopping-basket" />
                  <span>Giỏ Hàng</span>
                  {cartCount > 0 && <div className="cart-badge">{cartCount}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION BAR - Đã xóa mục Thức ăn/Quần áo/Đồ chơi */}
        <nav className="header-nav">
          <div className="container">
            <ul className="nav-menu">
              <li>
                <Link to="/" onClick={handleLinkClick}>
                    <i className="fas fa-home"></i> Trang Chủ
                </Link>
              </li>
              
              <li className="has-sub-menu">
                <Link to="/customer" onClick={handleLinkClick}>
                  <i className="fas fa-boxes"></i> Sản phẩm <i className="fas fa-chevron-down" style={{fontSize: 12, marginLeft: 5}}></i>
                </Link>
                <ul className="sub-menu">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <li key={cat.id}>
                        <Link to={`/customer?categoryId=${cat.id}`} onClick={handleLinkClick}>
                           {cat.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li><span style={{padding: '10px 20px', display:'block', color:'#888'}}>Đang tải...</span></li>
                  )}
                </ul>
              </li>
              
              <li>
                <Link to="/booking" onClick={handleLinkClick}>
                    <i className="fas fa-calendar-check"></i> Đặt lịch Spa
                </Link>
              </li>
              
              <li className="promo-item">
                <Link to="/promotions" onClick={handleLinkClick}>
                  <i className="fas fa-gift"></i> Khuyến Mãi
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(name, role) => {
            setCurrentUserName(name);
            localStorage.setItem("role", role);
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
};

export default Header;
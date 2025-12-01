import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"; // 👈 1. Thêm useNavigate
import "./Admin.css";

const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const menuItems = [
    { path: "/admin/dashboard", label: "Tổng quan", icon: "📊" },
    { path: "/admin/products", label: "Sản phẩm", icon: "📦" },
    { path: "/admin/orders", label: "Đơn hàng", icon: "🛒" },
    { path: "/admin/services", label: "Dịch vụ & Spa", icon: "✂️" },
    { path: "/admin/calendar", label: "Lịch hẹn", icon: "📅" },
    { path: "/admin/customers", label: "Khách hàng", icon: "👥" },
    { path: "/admin/staff", label: "Nhân viên", icon: "👔" },
    { path: "/admin/couponManagement", label: "Khuyến mãi", icon: "👫" },
  ];

  // 👇 3. Hàm xử lý đăng xuất
  const handleLogout = () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (!confirmLogout) return;

    // === QUAN TRỌNG: Phải xóa đúng tên key đã lưu bên Login.tsx ===
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    // Nếu muốn chắc ăn nhất, dùng lệnh này để xóa sạch sành sanh mọi thứ:
    // localStorage.clear(); 

    // Sau khi xóa xong thì chuyển về trang chủ
    navigate("/"); 
    
    // Hoặc reload lại trang để reset toàn bộ state của React (đảm bảo sạch sẽ)
    // window.location.href = "/";
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2 className="brand-text">PetCare Admin</h2>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {/* 👇 4. Gắn sự kiện onClick vào nút */}
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h3>Hệ thống quản lý</h3>
          </div>
          <div className="header-right">
            <div className="admin-profile">
              <img
                src="https://via.placeholder.com/40"
                alt="Admin"
                className="avatar"
              />
              <span className="admin-name">Xin chào, Admin</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Admin;
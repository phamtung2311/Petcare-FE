import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import "./Staff.css"; // 🟢 Import file CSS vừa tạo

const Staff: React.FC = () => {
  return (
    <div className="staff-container">
      {/* --- SIDEBAR --- */}
      <aside className="staff-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">PetCare</h2>
          <span className="sidebar-subtitle">Kênh Nhân Viên</span>
        </div>

        <nav className="staff-nav">
          {/* NavLink tự động hỗ trợ isActive để thêm class 'active' */}
          <NavLink 
            to="/staff/orders" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">📦</span> Quản lý Đơn hàng
          </NavLink>

          
          

          <NavLink 
            to="/staff/calendar" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">📅</span> Lịch hẹn
          </NavLink>

          <NavLink 
            to="/staff/customers" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">👥</span> Khách hàng
          </NavLink>

          
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="logout-link">
            ⬅ Đăng xuất
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="staff-main">
        <header className="staff-header">
          <h3>Bảng làm việc</h3>
          <div className="staff-user-info">
             Xin chào, <strong>Nhân viên</strong>
          </div>
        </header>
        
        <div className="staff-content-area">
          {/* Các trang con (OrderList, ProductList...) sẽ hiển thị ở đây */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default Staff;
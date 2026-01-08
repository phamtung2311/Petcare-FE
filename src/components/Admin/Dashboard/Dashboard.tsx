import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Dashboard.css";

// --- 1. INTERFACES (Đồng bộ với Revenue.tsx) ---

// Interface cho thống kê tổng hợp (Lấy từ Revenue.tsx)
interface RevenueStats {
  totalRevenue: number;         // Tổng doanh thu (Đơn + Dịch vụ)
  totalOrderRevenue: number;    // Doanh thu đơn hàng
  totalServiceRevenue: number;  // Doanh thu dịch vụ
  totalOrders: number;
  successOrders: number;        // Đơn thành công
  cancelledOrders: number;      // Đơn hủy
  totalAppointments: number;
  completedAppointments: number;// Lịch hoàn thành
  cancelledAppointments: number;// Lịch hủy
  // Các trường array (chart, top list...) có thể bỏ qua nếu Dashboard không vẽ biểu đồ chi tiết
}

// Interface cho danh sách đơn hàng gần đây
interface OrderDetail {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Mock data Lịch hẹn (Giữ nguyên hiển thị)
  const upcomingBookings = [
    { id: 1, pet: "Mimi (Mèo)", service: "Tắm & Cắt tỉa", time: "14:00", owner: "Chị Lan" },
    { id: 2, pet: "Lu (Chó)", service: "Khám tổng quát", time: "15:30", owner: "Anh Hùng" },
    { id: 3, pet: "Bông", service: "Spa trọn gói", time: "16:00", owner: "Cô Mai" },
  ];

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Tính toán ngày đầu tháng và cuối tháng hiện tại
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth trả về 0-11
        
        // Format YYYY-MM-DD
        const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDayObj = new Date(year, month, 0); // Ngày cuối tháng
        const lastDay = `${year}-${String(month).padStart(2, '0')}-${lastDayObj.getDate()}`;

        console.log(`Fetching stats for: ${firstDay} to ${lastDay}`);

        // 2. Gọi song song API Thống kê và API Đơn hàng
        const [statsRes, ordersRes] = await Promise.all([
          api.get(`/orders/stats`, { 
              params: { fromDate: firstDay, toDate: lastDay } 
          }),
          api.get("/orders?page=1&size=5") // Lấy 5 đơn mới nhất
        ]);

        // 3. Cập nhật State
        if (statsRes.data && statsRes.data.status === 200) {
          setStats(statsRes.data.data);
        }
        if (ordersRes.data && ordersRes.data.status === 200) {
          setRecentOrders(ordersRes.data.data.content || ordersRes.data.data.orders || []);
        }

      } catch (error: any) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleStatClick = (path: string) => {
    navigate(path);
  };

  const handleOrderClick = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleViewAllOrders = () => {
    navigate("/admin/orders");
  };

  const handleBookingAction = () => {
    navigate("/admin/calendar");
  };

  // --- FORMAT HELPER ---
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN') + " " + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING": return { label: "Chờ duyệt", class: "pending" };
      case "PAID": return { label: "Đã thanh toán", class: "success" };
      case "SHIPPING": return { label: "Đang giao", class: "shipping" };
      case "COMPLETED": return { label: "Hoàn thành", class: "success" };
      case "CANCELLED": return { label: "Đã hủy", class: "cancel" };
      default: return { label: status, class: "default" };
    }
  };

  // --- CONFIG CARDS (Dựa trên dữ liệu có thật từ RevenueStats) ---
  const statsCards = [
    {
      label: `Doanh thu tháng ${new Date().getMonth() + 1}`,
      value: stats ? formatCurrency(stats.totalRevenue) : "0đ",
      subLabel: "Đơn hàng + Dịch vụ",
      icon: "💰",
      color: "#10b981", // Green
      path: "/admin/revenue"
    },
    {
      label: "Đơn hàng thành công",
      value: stats ? stats.successOrders : 0,
      subLabel: `Trên tổng ${stats ? stats.totalOrders : 0} đơn`,
      icon: "📦",
      color: "#3b82f6", // Blue
      path: "/admin/orders?status=COMPLETED"
    },
    {
      label: "Dịch vụ hoàn thành",
      value: stats ? stats.completedAppointments : 0,
      subLabel: `Trên tổng ${stats ? stats.totalAppointments : 0} lịch`,
      icon: "✂️",
      color: "#8b5cf6", // Purple
      path: "/admin/calendar"
    },
    {
      label: "Đã hủy (Đơn + Lịch)",
      value: stats ? (stats.cancelledOrders + stats.cancelledAppointments) : 0,
      subLabel: "Cần chú ý",
      icon: "⚠️",
      color: "#ef4444", // Red
      path: "/admin/orders?status=CANCELLED"
    },
  ];

  if (loading) return <div className="dashboard-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Tổng quan kinh doanh</h2>

      {/* --- 1. CARDS THỐNG KÊ --- */}
      <div className="stats-grid">
        {statsCards.map((stat, index) => (
          <div 
            className="stat-card" 
            key={index}
            onClick={() => handleStatClick(stat.path)}
            style={{ cursor: "pointer", borderLeft: `4px solid ${stat.color}` }}
          >
            <div className="stat-icon" style={{ backgroundColor: stat.color + "20", color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value" style={{color: stat.color}}>{stat.value}</h3>
              <p className="stat-sub">{stat.subLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- 2. GRID NỘI DUNG --- */}
      <div className="dashboard-content-grid">

        {/* CỘT TRÁI: BẢNG ĐƠN HÀNG */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h3>Đơn hàng gần đây</h3>
            <button className="view-all-btn" onClick={handleViewAllOrders}>
              Xem tất cả
            </button>
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => handleOrderClick(order.id)}
                      className="clickable-row"
                    >
                      <td>#{order.id}</td>
                      <td>
                        <div className="fw-500">{order.customerName}</div>
                        <div className="text-muted text-sm">{formatTime(order.createdAt)}</div>
                      </td>
                      <td className="fw-600">{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <span className={`status-badge status-${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CỘT PHẢI: LỊCH HẸN */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h3>Lịch hẹn sắp tới</h3>
            <button className="view-all-btn" onClick={handleBookingAction}>Xem lịch</button>
          </div>
          <div className="booking-list">
            {upcomingBookings.map((booking) => (
              <div className="booking-item" key={booking.id}>
                <div className="booking-time-box">
                    <span style={{fontWeight: 'bold', color: '#374151'}}>{booking.time}</span>
                </div>
                <div className="booking-info">
                  <div className="booking-service">{booking.service}</div>
                  <div className="booking-detail">
                    Bé <strong>{booking.pet}</strong> - Chủ: {booking.owner}
                  </div>
                </div>
                <button className="action-btn-sm" onClick={handleBookingAction}>➜</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
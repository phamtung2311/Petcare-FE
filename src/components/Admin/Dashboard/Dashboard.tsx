import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Dashboard.css";

// --- INTERFACES ---
interface OrderStatistic {
  revenue: number;
  newOrders: number;
  shippingOrders: number;
  cancelledOrders: number;
  totalOrders: number;
}

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
  const [stats, setStats] = useState<OrderStatistic | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Mock data Lịch hẹn
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
        const [statsRes, ordersRes] = await Promise.all([
          api.get("/orders/stats"),
          api.get("/orders?page=1&size=5")
        ]);

        if (statsRes.data && statsRes.data.status === 200) {
          setStats(statsRes.data.data);
        }
        if (ordersRes.data && ordersRes.data.status === 200) {
          setRecentOrders(ordersRes.data.data.orders);
        }
      } catch (error: any) {
        console.error("Lỗi tải Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN (ACTIONS) ---

  const handleStatClick = (statusFilter: string) => {
    navigate(`/admin/orders?status=${statusFilter}`);
  };

  const handleOrderClick = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleViewAllOrders = () => {
    navigate("/admin/orders");
  };

  // 🟢 ĐÃ SỬA: Chuyển hướng đến trang Lịch hẹn (/admin/calendar)
  const handleBookingAction = () => {
    navigate("/admin/calendar");
  };

  // --- HELPER FORMAT ---
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString('vi-VN');
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

  const statsCards = [
    {
      label: "Doanh thu tổng",
      value: stats ? formatCurrency(stats.revenue) : "0đ",
      icon: "💰",
      color: "#10b981",
      filterStatus: "",
      action: () => navigate("/admin/revenue")
    },
    {
      label: "Đơn chờ duyệt",
      value: stats ? stats.newOrders : 0,
      icon: "🛒",
      color: "#3b82f6",
      filterStatus: "PENDING",
      action: () => handleStatClick("PENDING")
    },
    {
      label: "Đang giao hàng",
      value: stats ? stats.shippingOrders : 0,
      icon: "🚚",
      color: "#f59e0b",
      filterStatus: "SHIPPING",
      action: () => handleStatClick("SHIPPING")
    },
    {
      label: "Đơn đã hủy",
      value: stats ? stats.cancelledOrders : 0,
      icon: "❌",
      color: "#ef4444",
      filterStatus: "CANCELLED",
      action: () => handleStatClick("CANCELLED")
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
            onClick={stat.action ? stat.action : undefined}
            style={{ cursor: "pointer" }}
          >
            <div className="stat-icon" style={{ backgroundColor: stat.color + "20", color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
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
                  <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>Chưa có đơn hàng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CỘT PHẢI: LỊCH HẸN */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h3>Lịch hẹn sắp tới</h3>
            {/* Nút Xem lịch sẽ dẫn đến /admin/calendar */}
            <button className="view-all-btn" onClick={handleBookingAction}>Xem lịch</button>
          </div>
          <div className="booking-list">
            {upcomingBookings.map((booking) => (
              <div className="booking-item" key={booking.id}>
                <div className="booking-time">
                  {booking.time}
                </div>
                <div className="booking-info">
                  <div className="booking-service">{booking.service}</div>
                  <div className="booking-detail">
                    Bé <strong>{booking.pet}</strong> - Chủ: {booking.owner}
                  </div>
                </div>
                {/* Nút Chi tiết cũng dẫn đến trang lịch hẹn */}
                <button className="action-btn-sm" onClick={handleBookingAction}>Chi tiết</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
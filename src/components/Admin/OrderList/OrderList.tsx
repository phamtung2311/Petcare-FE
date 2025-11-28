import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./OrderList.css";

// Interface
interface Order {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentStatus = searchParams.get("status") || "";

  // --- FETCH DATA ---
  const fetchOrders = async (page: number, status: string) => {
    setLoading(true);
    try {
      const params: any = { page: page, size: 10 };
      if (status && status !== "ALL") {
        params.status = status;
      }

      const res = await api.get("/orders", { params });
      
      if (res.data && res.data.status === 200) {
        setOrders(res.data.data.orders || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, currentStatus);
  }, [currentPage, currentStatus]);

  // --- ACTIONS ---
  const handleFilterChange = (status: string) => {
    setSearchParams({ status: status, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ status: currentStatus, page: String(newPage) });
    }
  };

  const handleQuickStatusUpdate = async (orderId: number, newStatus: string) => {
    if (!newStatus) return; // Nếu chọn dòng default thì bỏ qua
    
    if (!window.confirm(`Xác nhận chuyển trạng thái đơn #${orderId} sang "${newStatus}"?`)) return;

    try {
      await api.patch(`/orders/${orderId}/status`, null, {
        params: { status: newStatus }
      });
      alert("Cập nhật thành công!");
      fetchOrders(currentPage, currentStatus); // Load lại bảng
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  // --- LOGIC TRẠNG THÁI (STATE MACHINE) ---
  // Hàm này quyết định trạng thái tiếp theo được phép là gì
  const getNextOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING': // Chờ xử lý -> Có thể Giao hoặc Hủy
      case 'PAID':    // Đã thanh toán -> Có thể Giao hoặc Hủy
        return [
          { value: 'SHIPPING', label: '🚀 Giao hàng' },
          { value: 'CANCELLED', label: '❌ Hủy đơn' }
        ];
      
      case 'SHIPPING': // Đang giao -> Có thể Đã giao hoặc Hủy (nếu giao thất bại)
        return [
          { value: 'DELIVERED', label: '📦 Đã giao hàng' },
          { value: 'CANCELLED', label: '❌ Hủy (Thất bại)' }
        ];

      case 'DELIVERED': // Đã giao -> Chỉ có thể Hoàn thành
        return [
          { value: 'COMPLETED', label: '✅ Hoàn tất đơn' }
        ];

      case 'COMPLETED': // Kết thúc -> Không làm gì được nữa
      case 'CANCELLED':
      case 'REFUNDED':
        return []; // Trả về mảng rỗng

      default:
        return [];
    }
  };

  // --- FORMATTERS ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDateTime = (iso: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    return date.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Tab lọc
  const tabs = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xử lý", value: "PENDING" },
    { label: "Đang giao", value: "SHIPPING" },
    { label: "Đã giao", value: "DELIVERED" },
    { label: "Hoàn thành", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
  ];

  return (
    <div className="order-list-container">
      <h2 className="page-title">Quản lý đơn hàng</h2>

      <div className="status-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`tab-btn ${currentStatus === tab.value ? "active" : ""}`}
            onClick={() => handleFilterChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-text">Đang tải dữ liệu...</div>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày tạo</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Cập nhật trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(orders) && orders.length > 0 ? (
                orders.map((order) => {
                  // Lấy danh sách option dựa trên trạng thái hiện tại
                  const nextOptions = getNextOptions(order.status);

                  return (
                    <tr key={order.id}>
                      <td className="fw-bold">#{order.id}</td>
                      <td>
                        <div className="customer-name">{order.customerName}</div>
                        <div className="payment-method">{order.paymentMethod}</div>
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td className="fw-bold text-primary">{formatCurrency(order.totalAmount)}</td>
                      
                      {/* Badge hiển thị trạng thái hiện tại */}
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Dropdown hành động */}
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-view"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                          >
                            Chi tiết
                          </button>
                          
                          {/* Chỉ hiện dropdown nếu có trạng thái tiếp theo */}
                          {nextOptions.length > 0 && (
                            <select 
                              className="quick-status-select"
                              defaultValue="" // Luôn để mặc định là rỗng
                              onChange={(e) => handleQuickStatusUpdate(order.id, e.target.value)}
                            >
                              <option value="" disabled>-- Chọn hành động --</option>
                              {nextOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">Không có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button 
          disabled={currentPage === 1} 
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &laquo; Trước
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button 
          disabled={currentPage === totalPages} 
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Sau &raquo;
        </button>
      </div>
    </div>
  );
};

export default OrderList;
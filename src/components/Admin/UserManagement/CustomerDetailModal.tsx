import React, { useEffect, useState } from 'react';
import api from '../../../api/axiosInstance';
import './UserManagement.css';

// --- INTERFACES ---

// 1. Interface Đơn hàng (Product Order)
interface Order {
    id: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    paymentMethod?: string;
}

interface OrderPageResponse {
    orders: Order[];
    totalPages: number;
}

// 2. Interface Lịch hẹn (Service/Appointment) - Lấy từ code của bạn
interface Appointment {
    id: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    petId: number;
    petName: string;
    serviceId: number;
    serviceName: string;
    servicePrice: number;
    staffId: number | null;
    staffName: string | null;
    scheduledAt: string;
    status: string;
    note: string | null;
}

interface AppointmentPageResponse {
    appointments: Appointment[];
    totalPages: number;
}

interface Props {
    userId: number;
    userName: string;
    onClose: () => void;
}

const CustomerDetailModal: React.FC<Props> = ({ userId, userName, onClose }) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'ORDERS' | 'SERVICES'>('ORDERS');
    const [loading, setLoading] = useState(false);

    // Data State
    const [orders, setOrders] = useState<Order[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Pagination
    const [orderPage, setOrderPage] = useState(1);
    const [orderTotalPages, setOrderTotalPages] = useState(0);

    const [apptPage, setApptPage] = useState(1);
    const [apptTotalPages, setApptTotalPages] = useState(0);

    // --- API CALLS ---

    // 1. Lấy Lịch sử Đơn hàng
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders', {
                params: { userId: userId, page: orderPage, size: 5 }
            });
            const result = response.data.data as OrderPageResponse;
            if (result) {
                setOrders(result.orders || []);
                setOrderTotalPages(result.totalPages || 0);
            }
        } catch (error) {
            console.error("Lỗi lấy đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Lấy Lịch sử Dịch vụ (Appointment)
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Gọi API /appointments/list giống file bạn gửi
            // Thêm customerId hoặc userId vào params để lọc theo khách
            const response = await api.get('/appointments/list', {
                params: {
                    customerId: userId, // 🟢 Lọc theo ID khách hàng này
                    page: apptPage,
                    size: 5
                }
            });

            const result = response.data;
            if (result.status === 200) {
                setAppointments(result.data.appointments || []);
                setApptTotalPages(result.data.totalPages || 0);
            }
        } catch (error) {
            console.error("Lỗi lấy lịch hẹn:", error);
        } finally {
            setLoading(false);
        }
    };

    // Effect: Gọi API khi chuyển Tab hoặc đổi trang
    useEffect(() => {
        if (activeTab === 'ORDERS') {
            fetchOrders();
        } else {
            fetchAppointments();
        }
    }, [userId, activeTab, orderPage, apptPage]);

    // --- FORMATTERS ---
    const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    };

    // Style Badge cho Order
    const getOrderStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'badge-success';
            case 'PENDING': return 'badge-warning';
            case 'SHIPPING': return 'badge-info';
            case 'CANCELLED': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    // Style Badge cho Appointment (Mapping theo code bạn gửi)
    const getApptStatusStyle = (status: string) => {
        switch (status) {
            case 'BOOKED': return 'badge-primary';    // Mới đặt -> Xanh đậm
            case 'CHECKED_IN': return 'badge-warning'; // Đã đến -> Vàng
            case 'DONE': return 'badge-success';      // Xong -> Xanh lá
            case 'CANCELLED': return 'badge-danger';  // Hủy -> Đỏ
            default: return 'badge-secondary';
        }
    };

    const getApptStatusLabel = (status: string) => {
        switch (status) {
            case 'BOOKED': return 'Mới đặt';
            case 'CHECKED_IN': return 'Đã Check-in';
            case 'DONE': return 'Hoàn thành';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">
                        Khách hàng: <span className="highlight-name">{userName}</span>
                    </h2>
                    <button onClick={onClose} className="btn-close-icon">&times;</button>
                </div>

                {/* --- TABS --- */}
                <div className="tabs-container">
                    <button 
                        className={`tab-btn ${activeTab === 'ORDERS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ORDERS')}
                    >
                        Đơn Hàng (Products)
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'SERVICES' ? 'active' : ''}`}
                        onClick={() => setActiveTab('SERVICES')}
                    >
                        Lịch Hẹn Dịch Vụ
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="modal-body-scroll">
                    
                    {/* TAB 1: DANH SÁCH ĐƠN HÀNG */}
                    {activeTab === 'ORDERS' && (
                        <>
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Mã Đơn</th>
                                        <th>Ngày đặt</th>
                                        <th>TT</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan={5} className="text-center">Đang tải...</td></tr> : 
                                     orders.length === 0 ? <tr><td colSpan={5} className="text-center text-muted">Chưa có đơn hàng nào.</td></tr> :
                                     orders.map(o => (
                                        <tr key={o.id}>
                                            <td>#{o.id}</td>
                                            <td>{formatDate(o.createdAt)}</td>
                                            <td>{o.paymentMethod || 'COD'}</td>
                                            <td className="text-amount">{formatCurrency(o.totalAmount)}</td>
                                            <td><span className={`status-badge ${getOrderStatusStyle(o.status)}`}>{o.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination Orders */}
                            {orderTotalPages > 1 && (
                                <div className="pagination">
                                    <span className="pagination-info">Trang {orderPage}/{orderTotalPages}</span>
                                    <div>
                                        <button disabled={orderPage === 1} onClick={() => setOrderPage(p => p - 1)} className="btn-page">Trước</button>
                                        <button disabled={orderPage >= orderTotalPages} onClick={() => setOrderPage(p => p + 1)} className="btn-page">Sau</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* TAB 2: DANH SÁCH DỊCH VỤ (APPOINTMENTS) */}
                    {activeTab === 'SERVICES' && (
                        <>
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Dịch vụ & Thú cưng</th>
                                        <th>Ngày giờ hẹn</th>
                                        <th>Nhân viên</th>
                                        <th>Giá tiền</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan={5} className="text-center">Đang tải...</td></tr> : 
                                     appointments.length === 0 ? <tr><td colSpan={5} className="text-center text-muted">Chưa đặt dịch vụ nào.</td></tr> :
                                     appointments.map(appt => (
                                        <tr key={appt.id}>
                                            <td>
                                                <div style={{fontWeight: 600, color: '#374151'}}>{appt.serviceName}</div>
                                                <div style={{fontSize: '13px', color: '#6b7280'}}>🐾 {appt.petName}</div>
                                            </td>
                                            <td>{formatDate(appt.scheduledAt)}</td>
                                            <td>
                                                {appt.staffName ? (
                                                    <span style={{color: '#4b5563'}}>{appt.staffName}</span>
                                                ) : (
                                                    <span style={{color: '#9ca3af', fontStyle: 'italic'}}>-- Chưa gán --</span>
                                                )}
                                            </td>
                                            <td className="text-amount">{formatCurrency(appt.servicePrice)}</td>
                                            <td>
                                                <span className={`status-badge ${getApptStatusStyle(appt.status)}`}>
                                                    {getApptStatusLabel(appt.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {/* Pagination Appointments */}
                             {apptTotalPages > 1 && (
                                <div className="pagination">
                                    <span className="pagination-info">Trang {apptPage}/{apptTotalPages}</span>
                                    <div>
                                        <button disabled={apptPage === 1} onClick={() => setApptPage(p => p - 1)} className="btn-page">Trước</button>
                                        <button disabled={apptPage >= apptTotalPages} onClick={() => setApptPage(p => p + 1)} className="btn-page">Sau</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailModal;
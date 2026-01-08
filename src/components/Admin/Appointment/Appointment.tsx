import React, { useEffect, useState } from 'react';
import api from '../../../api/axiosInstance';
import './Appointment.css';

// Interface Appointment
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

interface PaginationData {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

const Appointment: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    
    const [pagination, setPagination] = useState<PaginationData>({
        pageNumber: 1, pageSize: 10, totalElements: 0, totalPages: 0
    });

    const [filterStatus, setFilterStatus] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
    
    // State form sửa
    const [editForm, setEditForm] = useState({ staffId: '', status: '', note: '' });

    const getAuthConfig = () => {
        const token = localStorage.getItem('accessToken');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    // --- 1. ĐÃ XÓA fetchStaffList VÌ KHÔNG CÒN DÙNG ---

    const fetchAppointments = async (page: number = 1) => {
        setLoading(true);
        try {
            const params: any = { page: page, size: pagination.pageSize };
            if (filterStatus) params.status = filterStatus;
            
            const response = await api.get(`/appointments/list`, { params, ...getAuthConfig() });
            const result = response.data;
            if (result.status === 200) {
                setAppointments(result.data.appointments);
                setPagination({
                    pageNumber: result.data.pageNumber,
                    pageSize: result.data.pageSize,
                    totalElements: result.data.totalElements,
                    totalPages: result.data.totalPages
                });
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAppointments(1); }, [filterStatus]);

    const handlePageChange = (newPage: number) => fetchAppointments(newPage);

    const handleEditClick = (appt: Appointment) => {
        setSelectedAppt(appt);
        setEditForm({
            staffId: appt.staffId ? appt.staffId.toString() : '', // Vẫn giữ ID cũ để khi lưu không bị mất
            status: appt.status,
            note: appt.note || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveUpdate = async () => {
        if (!selectedAppt) return;
        try {
            const bodyData = {
                // Giữ nguyên logic gửi staffId cũ lên (nếu có)
                staffId: editForm.staffId ? parseInt(editForm.staffId) : null,
                status: editForm.status,
                note: editForm.note
            };
            const response = await api.put(`/appointments/upd/${selectedAppt.id}`, bodyData, getAuthConfig());
            if (response.data.status === 200) {
                alert("Cập nhật thành công!");
                setIsModalOpen(false);
                fetchAppointments(pagination.pageNumber);
            } else { alert("Lỗi: " + response.data.message); }
        } catch (error) { alert("Có lỗi xảy ra."); }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'BOOKED': return 'status-booked';
            case 'CHECKED_IN': return 'status-checked-in';
            case 'DONE': return 'status-done';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'BOOKED': return 'Mới đặt';
            case 'CHECKED_IN': return 'Đã Check-in';
            case 'DONE': return 'Hoàn thành';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="admin-container">
            <div className="header-actions">
                <h1 className="page-title">Quản lý Lịch Hẹn</h1>
                <div className="filter-wrapper">
                    <span className="filter-label">Lọc trạng thái:</span>
                    <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="">-- Tất cả --</option>
                        <option value="BOOKED">Mới đặt</option>
                        <option value="CHECKED_IN">Đã Check-in</option>
                        <option value="DONE">Hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="appointment-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Khách hàng</th><th>Dịch vụ</th><th>Ngày giờ</th><th>Nhân viên</th><th>Trạng thái</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (<tr><td colSpan={7} style={{textAlign: 'center'}}>Đang tải...</td></tr>) : appointments.map((appt) => (
                            <tr key={appt.id}>
                                <td>#{appt.id}</td>
                                <td><p className="customer-name">{appt.customerName}</p><p className="customer-phone">📞 {appt.customerPhone}</p></td>
                                <td><p className="service-name">{appt.serviceName}</p><p className="pet-info">🐾 {appt.petName}</p><p className="price-text">{appt.servicePrice.toLocaleString()} đ</p></td>
                                <td>{new Date(appt.scheduledAt).toLocaleString('vi-VN')}</td>
                                <td>{appt.staffName || <span className="staff-unassigned">-- Chưa gán --</span>}</td>
                                <td><span className={`status-badge ${getStatusClass(appt.status)}`}>{getStatusLabel(appt.status)}</span></td>
                                <td><button onClick={() => handleEditClick(appt)} className="btn-edit">Sửa</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="pagination-container">
                <button disabled={pagination.pageNumber <= 1} onClick={() => handlePageChange(pagination.pageNumber - 1)} className="pagination-btn">Trước</button>
                <span>Trang {pagination.pageNumber} / {pagination.totalPages || 1}</span>
                <button disabled={pagination.pageNumber >= pagination.totalPages} onClick={() => handlePageChange(pagination.pageNumber + 1)} className="pagination-btn">Sau</button>
            </div>

            {isModalOpen && selectedAppt && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Sửa lịch hẹn #{selectedAppt.id}</h2>
                        <div className="modal-body">
                            
                            {/* 🟢 FORM CHỈ CÒN TRẠNG THÁI VÀ GHI CHÚ */}
                            <div className="form-group">
                                <label className="form-label">Trạng thái</label>
                                <select className="form-select" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                                    <option value="BOOKED">Mới đặt</option>
                                    <option value="CHECKED_IN">Đã Check-in</option>
                                    <option value="DONE">Hoàn thành</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                            </div>

                            {/* Đã xóa phần Phân công nhân viên ở đây */}

                            <div className="form-group">
                                <label className="form-label">Ghi chú</label>
                                <textarea className="form-textarea" rows={3} value={editForm.note} onChange={(e) => setEditForm({...editForm, note: e.target.value})}/>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Đóng</button>
                            <button onClick={handleSaveUpdate} className="btn-save">Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Appointment;
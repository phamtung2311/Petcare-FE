import React, { useEffect, useState } from 'react';
import api from '../../../api/axiosInstance';
import './StaffManagement.css'; // 🟢 Dùng file CSS mới

// Interface Appointment (Lịch sử làm việc)
interface WorkHistory {
    id: number;
    serviceName: string;
    customerName: string; // Tên khách hàng
    petName: string;      // Tên thú cưng
    scheduledAt: string;
    status: string;
    servicePrice: number;
}

interface Props {
    staffId: number;
    staffName: string;
    onClose: () => void;
}

const StaffDetailModal: React.FC<Props> = ({ staffId, staffName, onClose }) => {
    const [works, setWorks] = useState<WorkHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    
    // Bộ lọc trạng thái công việc
    const [filterStatus, setFilterStatus] = useState<string>(''); 

    const fetchWorkHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get('/appointments/list', {
                params: {
                    staffId: staffId, // 🟢 Lọc theo Staff ID
                    status: filterStatus || null,
                    page: page,
                    size: 5,
                    sort: 'scheduledAt:desc'
                }
            });

            const result = response.data;
            if (result.status === 200) {
                setWorks(result.data.appointments || []);
                setTotalPages(result.data.totalPages || 0);
            }
        } catch (error) {
            console.error("Lỗi tải lịch sử làm việc:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkHistory();
    }, [staffId, page, filterStatus]);

    // Formatters
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDate = (dateStr: string) => {
        if(!dateStr) return "-";
        return new Date(dateStr).toLocaleString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DONE': return 'badge-success';
            case 'CONFIRMED': return 'badge-info';
            case 'CHECKED_IN': return 'badge-warning';
            case 'CANCELLED': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">
                        Lịch sử làm việc: <span className="highlight-name">{staffName}</span>
                    </h2>
                    <button onClick={onClose} className="btn-close-icon">&times;</button>
                </div>

                {/* Filter Toolbar nhỏ trong Modal */}
                <div className="toolbar" style={{padding: '10px', marginBottom: '15px', background: '#f8fafc', boxShadow: 'none', border: '1px solid #e2e8f0'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <span style={{fontSize: '14px', fontWeight: 600, marginRight: '10px', color: '#64748b'}}>Trạng thái công việc:</span>
                        <select 
                            className="form-input" 
                            style={{width: '200px', padding: '6px'}}
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                        >
                            <option value="">-- Tất cả --</option>
                            <option value="DONE">Hoàn thành (Done)</option>
                            <option value="CHECKED_IN">Đang thực hiện (Checked-in)</option>
                            <option value="BOOKED">Mới phân công (Booked)</option>
                        </select>
                    </div>
                </div>

                {/* Body: Danh sách công việc */}
                <div className="modal-body-scroll">
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>Dịch vụ</th>
                                <th>Khách hàng & Pet</th>
                                <th>Thời gian</th>
                                <th>Doanh thu</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={5} className="text-center">Đang tải...</td></tr> :
                             works.length === 0 ? <tr><td colSpan={5} className="text-center text-muted">Chưa có lịch sử công việc nào.</td></tr> :
                             works.map(work => (
                                <tr key={work.id}>
                                    <td style={{fontWeight: 600, color: '#334155'}}>{work.serviceName}</td>
                                    <td>
                                        <div style={{fontWeight: 500}}>{work.customerName}</div>
                                        <div style={{fontSize: '12px', color: '#64748b'}}>🐾 {work.petName}</div>
                                    </td>
                                    <td>{formatDate(work.scheduledAt)}</td>
                                    <td className="text-amount">{formatCurrency(work.servicePrice)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusStyle(work.status)}`}>
                                            {work.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <span className="pagination-info">Trang {page}/{totalPages}</span>
                        <div>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-page">Trước</button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-page">Sau</button>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default StaffDetailModal;
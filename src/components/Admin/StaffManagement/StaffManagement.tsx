import React, { useEffect, useState } from 'react';
import api from '../../../api/axiosInstance'; 
import './StaffManagement.css'; // Import CSS chung
import StaffDetailModal from './StaffDetailModal'; // Import Modal

// --- INTERFACES ---
interface Staff {
  id: number;
  fistName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  status: string;
}

interface UserPageResponse {
  users: Staff[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}

interface StaffFormData {
  id?: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  password?: string;
  roleId: number;
}

const StaffManagement: React.FC = () => {
  // --- STATE ---
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [keyword, setKeyword] = useState<string>('');
  
  // Tab trạng thái (Active / Inactive)
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');

  // Modal Form (Thêm/Sửa)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  // 🟢 State cho Modal Lịch sử làm việc (Quan trọng)
  const [selectedStaffHistory, setSelectedStaffHistory] = useState<{id: number, name: string} | null>(null);

  const STAFF_ROLE_ID = 2; // ID của Role Staff

  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '', lastName: '', userName: '', email: '', phone: '', password: '', roleId: STAFF_ROLE_ID
  });

  // --- API ACTIONS ---
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/list', {
        params: { 
            keyword, 
            page: page + 1, // Backend page index bắt đầu từ 1 (theo logic fix trước đó)
            size: 10, 
            sort: 'id:desc',
            status: filterStatus,
            roleId: STAFF_ROLE_ID 
        }
      });
      const result = response.data.data as UserPageResponse;
      setStaffList(result.users || []);
      setTotalPages(result.totalPages || 0);
    } catch (error) {
      console.error("Lỗi tải danh sách nhân viên:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, [page, filterStatus]);

  const handleLock = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn KHÓA tài khoản nhân viên này?")) {
      try {
        await api.delete(`/user/del/${id}`);
        alert("Đã khóa nhân viên thành công!");
        fetchStaff();
      } catch (e: any) {
        alert(e.response?.data?.message || "Thao tác thất bại");
      }
    }
  };

  const handleRestore = async (id: number) => {
    if (window.confirm("Mở khóa tài khoản nhân viên này?")) {
        try {
            await api.patch(`/user/restore/${id}`); 
            alert("Đã khôi phục nhân viên thành công!");
            fetchStaff();
        } catch (e: any) {
            alert(e.response?.data?.message || "Khôi phục thất bại.");
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentMode === 'ADD') {
        const payload = {
            ...formData,
            roleId: STAFF_ROLE_ID,
            role_id: STAFF_ROLE_ID
        };
        await api.post('/user/add', payload);
        alert("Thêm nhân viên mới thành công!");
      } else {
        await api.put('/user/upd', {
            id: formData.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            userName: formData.userName,
            email: formData.email,
            phone: formData.phone
        });
        alert("Cập nhật thông tin thành công!");
      }
      setIsFormModalOpen(false);
      fetchStaff();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Có lỗi xảy ra.");
    }
  };

  // --- HANDLERS UI ---
  const openAdd = () => {
    setCurrentMode('ADD');
    setFormData({
        firstName: '', lastName: '', userName: '', email: '', phone: '', password: '', roleId: STAFF_ROLE_ID
    });
    setIsFormModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setCurrentMode('EDIT');
    setFormData({
      id: s.id, firstName: s.fistName, lastName: s.lastName, userName: s.userName,
      email: s.email, phone: s.phone, password: '', roleId: STAFF_ROLE_ID
    });
    setIsFormModalOpen(true);
  };

  return (
    <div className="staff-management-container">
      <div className="content-wrapper">
        <h1 className="page-title">Quản Lý Nhân Viên (Staff)</h1>

        {/* Tabs Trạng thái */}
        <div className="tabs-container">
            <button 
                className={`tab-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => { setFilterStatus('ACTIVE'); setPage(0); }}
            >
                Nhân viên đang hoạt động
            </button>
            <button 
                className={`tab-btn ${filterStatus === 'INACTIVE' ? 'active' : ''}`}
                onClick={() => { setFilterStatus('INACTIVE'); setPage(0); }}
            >
                Nhân viên đã khóa
            </button>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <input 
                className="search-input" 
                placeholder="Tìm nhân viên theo tên, email..." 
                value={keyword} 
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchStaff()}
            />
            <button onClick={fetchStaff} className="btn btn-primary">Tìm kiếm</button>
          </div>
          <button onClick={openAdd} className="btn btn-success">+ Thêm nhân viên</button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="staff-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ Tên</th>
                <th>Username</th>
                <th>Email</th>
                <th>SĐT</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">Đang tải...</td></tr>
              ) : staffList.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted">
                    {filterStatus === 'ACTIVE' ? 'Không tìm thấy nhân viên nào.' : 'Chưa có nhân viên bị khóa.'}
                </td></tr>
              ) : (
                staffList.map(s => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td className="font-bold text-blue-600">{s.fistName} {s.lastName}</td>
                  <td>{s.userName}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td className="action-buttons">
                    {/* 🟢 Nút Xem Lịch Sử */}
                    <button 
                        onClick={() => setSelectedStaffHistory({id: s.id, name: `${s.fistName} ${s.lastName}`})}
                        className="btn-view"
                        title="Xem lịch sử làm việc"
                    >
                        Xem
                    </button>

                    {filterStatus === 'ACTIVE' ? (
                        <>
                            <button onClick={() => openEdit(s)} className="btn-edit">Sửa</button>
                            <button onClick={() => handleLock(s.id)} className="btn-delete" title="Khóa">Khóa</button>
                        </>
                    ) : (
                        <button onClick={() => handleRestore(s.id)} className="btn-view" title="Mở khóa">Khôi phục</button>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
            <span className="pagination-info">Trang {page + 1} / {totalPages || 1}</span>
            <div>
                <button 
                    disabled={page === 0} 
                    onClick={() => setPage(p => p - 1)} 
                    className="btn-page"
                >
                    Trước
                </button>
                <button 
                    disabled={page >= totalPages - 1} 
                    onClick={() => setPage(p => p + 1)} 
                    className="btn-page"
                >
                    Sau
                </button>
            </div>
        </div>

        {/* 🟢 MODAL XEM LỊCH SỬ LÀM VIỆC */}
        {selectedStaffHistory && (
            <StaffDetailModal 
                staffId={selectedStaffHistory.id}
                staffName={selectedStaffHistory.name}
                onClose={() => setSelectedStaffHistory(null)}
            />
        )}

        {/* Modal Form Add/Edit */}
        {isFormModalOpen && (
          <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">
                {currentMode === 'ADD' ? 'Thêm Nhân Viên Mới' : 'Cập Nhật Thông Tin'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Họ (First Name)</label>
                        <input className="form-input" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tên (Last Name)</label>
                        <input className="form-input" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" disabled={currentMode==='EDIT'} required value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} />
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>

                {currentMode === 'ADD' && (
                    <div className="form-group">
                        <label className="form-label">Mật khẩu</label>
                        <input className="form-input" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                )}

                <div className="modal-actions">
                    <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn btn-secondary">Hủy</button>
                    <button type="submit" className="btn btn-primary">{currentMode === 'ADD' ? 'Lưu' : 'Cập nhật'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
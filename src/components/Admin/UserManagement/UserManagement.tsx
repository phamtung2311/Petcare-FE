import React, { useEffect, useState } from 'react';
import api from '../../../api/axiosInstance'; 
import './UserManagement.css';
import CustomerDetailModal from './CustomerDetailModal';

// --- INTERFACES ---
interface User {
  id: number;
  fistName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
}

interface UserPageResponse {
  users: User[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}

interface UserFormData {
  id?: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  password?: string;
  roleId: number;
}

const UserManagement: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [keyword, setKeyword] = useState<string>('');
  
  // 🟢 QUẢN LÝ TRẠNG THÁI TAB
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'ADD' | 'EDIT'>('ADD');
  
  // Role Customer là 1
  const DEFAULT_ROLE_ID = 1; 

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '', lastName: '', userName: '', email: '', phone: '', password: '', roleId: DEFAULT_ROLE_ID
  });

  const [selectedUserForHistory, setSelectedUserForHistory] = useState<{id: number, name: string} | null>(null);

  // --- API ACTIONS ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/list', {
        params: { 
            keyword, 
            page: page + 1, // Fix phân trang (Backend bắt đầu từ 1 nếu logic backend yêu cầu vậy)
            size: 10, 
            sort: 'id:desc',
            status: filterStatus,
            roleId: DEFAULT_ROLE_ID // 🟢 QUAN TRỌNG: Chỉ lấy Customer (ID=1)
        }
      });
      const result = response.data.data as UserPageResponse;
      setUsers(result.users || []);
      setTotalPages(result.totalPages || 0);
    } catch (error) {
      console.error("Lỗi tải danh sách user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload khi đổi trang hoặc đổi Tab Status
  useEffect(() => { fetchUsers(); }, [page, filterStatus]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn KHÓA tài khoản này không?")) {
      try {
        await api.delete(`/user/del/${id}`);
        alert("Đã khóa tài khoản thành công!");
        fetchUsers();
      } catch (e: any) {
        alert(e.response?.data?.message || "Thao tác thất bại");
      }
    }
  };

  // 🟢 HÀM KHÔI PHỤC TÀI KHOẢN
  const handleRestore = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn MỞ KHÓA tài khoản này không?")) {
        try {
            await api.patch(`/user/restore/${id}`); 
            alert("Đã khôi phục tài khoản thành công!");
            fetchUsers();
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.message || "Khôi phục thất bại.");
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentMode === 'ADD') {
        const roleValue = formData.roleId && formData.roleId > 0 ? formData.roleId : DEFAULT_ROLE_ID;
        const payload = {
            ...formData,
            roleId: roleValue,
            role_id: roleValue
        };
        await api.post('/user/add', payload);
        alert("Thêm người dùng thành công!");
      } else {
        await api.put('/user/upd', {
            id: formData.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            userName: formData.userName,
            email: formData.email,
            phone: formData.phone
        });
        alert("Cập nhật thành công!");
      }
      setIsFormModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Có lỗi xảy ra.");
    }
  };

  // --- HANDLERS UI ---
  const openAdd = () => {
    setCurrentMode('ADD');
    setFormData({
        firstName: '', lastName: '', userName: '', email: '', phone: '', password: '', roleId: DEFAULT_ROLE_ID
    });
    setIsFormModalOpen(true);
  };

  const openEdit = (u: User) => {
    setCurrentMode('EDIT');
    setFormData({
      id: u.id, firstName: u.fistName, lastName: u.lastName, userName: u.userName,
      email: u.email, phone: u.phone, password: '', roleId: 0
    });
    setIsFormModalOpen(true);
  };

  return (
    <div className="user-management-container">
      <div className="content-wrapper">
        <h1 className="page-title">Quản Lý Khách Hàng</h1>

        {/* 🟢 TABS CHUYỂN TRẠNG THÁI */}
        <div className="tabs-container" style={{marginBottom: '20px'}}>
            <button 
                className={`tab-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => { setFilterStatus('ACTIVE'); setPage(0); }}
            >
                Đang hoạt động
            </button>
            <button 
                className={`tab-btn ${filterStatus === 'INACTIVE' ? 'active' : ''}`}
                onClick={() => { setFilterStatus('INACTIVE'); setPage(0); }}
            >
                Đã khóa (Locked)
            </button>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <input 
                className="search-input" 
                placeholder="Tìm kiếm theo tên, email, sđt..." 
                value={keyword} 
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            />
            <button onClick={fetchUsers} className="btn btn-primary">Tìm kiếm</button>
          </div>
          <button onClick={openAdd} className="btn btn-success">+ Thêm mới</button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ Tên</th>
                <th>Username</th>
                <th>Email</th>
                <th>SĐT</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">Đang tải dữ liệu...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted">
                    {filterStatus === 'ACTIVE' ? 'Không tìm thấy người dùng đang hoạt động.' : 'Chưa có tài khoản nào bị khóa.'}
                </td></tr>
              ) : (
                users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td className="font-bold">{u.fistName} {u.lastName}</td>
                  <td>{u.userName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td className="action-buttons">
                    <button 
                        className="btn-view"
                        onClick={() => setSelectedUserForHistory({id: u.id, name: `${u.fistName} ${u.lastName}`})}
                        title="Xem lịch sử"
                    >
                        Xem
                    </button>
                    
                    {filterStatus === 'ACTIVE' && (
                        <button onClick={() => openEdit(u)} className="btn-edit">Sửa</button>
                    )}

                    {filterStatus === 'ACTIVE' ? (
                        <button 
                            onClick={() => handleDelete(u.id)} 
                            className="btn-delete" 
                            title="Khóa tài khoản"
                        >
                            Khóa
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleRestore(u.id)} 
                            className="btn-view" 
                            style={{color: '#059669', fontWeight: 'bold'}}
                            title="Mở lại tài khoản"
                        >
                            Khôi phục
                        </button>
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

        {/* Modal Xem Lịch Sử */}
        {selectedUserForHistory && (
            <CustomerDetailModal 
                userId={selectedUserForHistory.id}
                userName={selectedUserForHistory.name}
                onClose={() => setSelectedUserForHistory(null)}
            />
        )}

        {/* Modal Form Thêm/Sửa */}
        {isFormModalOpen && (
          <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">
                {currentMode === 'ADD' ? 'Thêm Khách Hàng Mới' : 'Cập Nhật Thông Tin'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Họ (First Name) <span className="text-danger">*</span></label>
                        <input 
                            className="form-input" 
                            required 
                            value={formData.firstName} 
                            onChange={e => setFormData({...formData, firstName: e.target.value})} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tên (Last Name) <span className="text-danger">*</span></label>
                        <input 
                            className="form-input" 
                            required 
                            value={formData.lastName} 
                            onChange={e => setFormData({...formData, lastName: e.target.value})} 
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Tên đăng nhập <span className="text-danger">*</span></label>
                    <input 
                        className="form-input" 
                        disabled={currentMode==='EDIT'} 
                        required 
                        value={formData.userName} 
                        onChange={e => setFormData({...formData, userName: e.target.value})} 
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input 
                        className="form-input" 
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input 
                        className="form-input" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                </div>

                {currentMode === 'ADD' && (
                    <div className="form-group">
                        <label className="form-label">Mật khẩu <span className="text-danger">*</span></label>
                        <input 
                            className="form-input" 
                            type="password" 
                            required 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                    </div>
                )}

                <div className="modal-actions">
                    <button 
                        type="button" 
                        onClick={() => setIsFormModalOpen(false)} 
                        className="btn btn-secondary"
                    >
                        Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {currentMode === 'ADD' ? 'Lưu' : 'Cập nhật'}
                    </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
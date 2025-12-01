import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import "./CouponManagement.css";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderValue: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  active: boolean;
  usedCount?: number; // 🟢 Trường mới từ API
}

interface CouponForm {
  id?: number;
  code: string;
  type: string;
  value: number;
  minOrderValue: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  active: boolean;
}

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 🟢 State lọc trạng thái
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'STOPPED'>('ALL');

  const [formData, setFormData] = useState<CouponForm>({
    code: "",
    type: "FIXED",
    value: 0,
    minOrderValue: 0,
    startsAt: "",
    endsAt: "",
    usageLimit: 100,
    active: true
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get("/coupons/admin");
      setCoupons(res.data.data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // --- Helper Format ---
  const isFixedType = (type: string) => type && type.toUpperCase() === 'FIXED';
  
  const formatValue = (coupon: Coupon) => {
    if (isFixedType(coupon.type)) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.value);
    }
    return `${Number(coupon.value)}%`;
  };
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- Lọc danh sách ---
  const filteredCoupons = coupons.filter(c => {
      if (filterStatus === 'ACTIVE') return c.active;
      if (filterStatus === 'STOPPED') return !c.active;
      return true;
  });

  // --- Actions ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    const now = new Date().toISOString().slice(0, 16);
    setFormData({
      code: "", type: "FIXED", value: 0, minOrderValue: 0,
      startsAt: now, endsAt: now, usageLimit: 100, active: true
    });
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setIsEditing(true);
    const formatForInput = (dateStr: string) => dateStr ? dateStr.replace(' ', 'T').slice(0, 16) : "";
    setFormData({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type.toUpperCase(),
      value: coupon.value,
      minOrderValue: coupon.minOrderValue,
      startsAt: formatForInput(coupon.startsAt),
      endsAt: formatForInput(coupon.endsAt),
      usageLimit: coupon.usageLimit,
      active: coupon.active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formatForApi = (dateStr: string) => dateStr.replace('T', ' ') + ':00';
      const payload = {
        ...formData,
        type: formData.type.toLowerCase(),
        value: Number(formData.value),
        minOrderValue: Number(formData.minOrderValue),
        usageLimit: Number(formData.usageLimit),
        startsAt: formatForApi(formData.startsAt),
        endsAt: formatForApi(formData.endsAt)
      };

      if (isEditing && formData.id) {
        await api.put(`/coupons/${formData.id}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post("/coupons", payload);
        alert("Tạo mới thành công!");
      }
      setShowModal(false);
      fetchCoupons();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || error.message));
    }
  };

  // 🟢 1. XỬ LÝ NÚT DỪNG / KÍCH HOẠT
  const handleToggleStatus = async (coupon: Coupon) => {
      const newStatus = !coupon.active;
      const action = newStatus ? "Kích hoạt" : "Dừng";
      if (!window.confirm(`Bạn có chắc muốn ${action} mã ${coupon.code}?`)) return;

      try {
          // Chúng ta dùng API update, giữ nguyên các thông tin khác, chỉ đổi active
          // Do BE bắt buộc gửi đủ field nên cần build payload đầy đủ
          const formatForApi = (dateStr: string) => dateStr ? dateStr.replace('T', ' ') : "";
          // Ở đây dateStr từ response là "yyyy-MM-dd HH:mm:ss", có thể gửi lại y nguyên
          
          const payload = {
              code: coupon.code,
              type: coupon.type.toLowerCase(),
              value: coupon.value,
              minOrderValue: coupon.minOrderValue,
              usageLimit: coupon.usageLimit,
              startsAt: coupon.startsAt,
              endsAt: coupon.endsAt,
              active: newStatus // Đảo trạng thái
          };

          await api.put(`/coupons/${coupon.id}`, payload);
          alert(`Đã ${action} thành công!`);
          fetchCoupons();
      } catch (error: any) {
          alert("Lỗi: " + (error.response?.data?.message || error.message));
      }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa vĩnh viễn? (Chỉ xóa được nếu chưa ai dùng)")) return;
    try {
      await api.delete(`/coupons/${id}`);
      alert("Đã xóa thành công!");
      fetchCoupons();
    } catch (error: any) {
      alert("Không thể xóa: " + (error.response?.data?.message || "Mã đã được sử dụng, vui lòng chọn Dừng."));
    }
  };

  return (
    <div className="coupon-page">
      <div className="page-header">
        <h2>Quản Lý Khuyến Mãi</h2>
        <button className="btn-add" onClick={openAddModal}>+ Thêm Mã Mới</button>
      </div>

      {/* 🟢 2. THANH LỌC TRẠNG THÁI */}
      <div className="coupon-filters">
          <button className={`filter-pill ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>Tất cả</button>
          <button className={`filter-pill ${filterStatus === 'ACTIVE' ? 'active' : ''}`} onClick={() => setFilterStatus('ACTIVE')}>Đang chạy</button>
          <button className={`filter-pill ${filterStatus === 'STOPPED' ? 'active' : ''}`} onClick={() => setFilterStatus('STOPPED')}>Đã dừng</button>
      </div>

      <div className="table-container">
        {loading ? <p style={{padding: 20}}>Đang tải...</p> : (
            <table className="coupon-table">
            <thead>
                <tr>
                <th>Mã Code</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng / Tổng</th> {/* 🟢 Cột mới */}
                <th>Hiệu lực</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {filteredCoupons.map(c => (
                <tr key={c.id} className={!c.active ? 'row-inactive' : ''}>
                    <td><strong>{c.code}</strong></td>
                    <td>
                        <span className={`type-badge ${isFixedType(c.type) ? 'type-fixed' : 'type-percent'}`}>
                             {formatValue(c)}
                        </span>
                    </td>
                    <td>{formatCurrency(c.minOrderValue)}</td>
                    
                    {/* 🟢 Hiển thị số lượng đã dùng */}
                    <td>
                        <div className="usage-bar-container">
                            <span style={{fontWeight:'bold', color: (c.usedCount || 0) >= c.usageLimit ? 'red' : 'inherit'}}>
                                {c.usedCount || 0}
                            </span> 
                            <span style={{color:'#888'}}> / {c.usageLimit}</span>
                        </div>
                    </td>

                    <td>
                        <div style={{fontSize:'0.85rem', color:'#555'}}>
                            {c.startsAt?.split(' ')[0]} ➝ {c.endsAt?.split(' ')[0]}
                        </div>
                    </td>
                    <td>
                        <span className={c.active ? "status-active" : "status-inactive"}>
                            {c.active ? "Đang chạy" : "Đã dừng"}
                        </span>
                    </td>
                    <td>
                        <button className="action-btn btn-edit" onClick={() => openEditModal(c)}>Sửa</button>
                        
                        {/* 🟢 Nút Dừng / Kích hoạt */}
                        {c.active ? (
                            <button className="action-btn btn-stop" onClick={() => handleToggleStatus(c)}>Dừng</button>
                        ) : (
                            <button className="action-btn btn-activate" onClick={() => handleToggleStatus(c)}>Mở lại</button>
                        )}

                        {/* Nút xóa chỉ hiện khi chưa dùng lần nào (optional) hoặc cứ để đó bấm vào báo lỗi */}
                        <button className="action-btn btn-delete-icon" title="Xóa vĩnh viễn" onClick={() => handleDelete(c.id)}>🗑️</button>
                    </td>
                </tr>
                ))}
                {filteredCoupons.length === 0 && <tr><td colSpan={7} style={{textAlign:'center'}}>Không có dữ liệu.</td></tr>}
            </tbody>
            </table>
        )}
      </div>

      {/* --- MODAL FORM (Giữ nguyên) --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content coupon-modal">
            <div className="modal-header">
                <h3>{isEditing ? "Cập Nhật Mã" : "Tạo Mã Mới"}</h3>
                <button className="close-modal-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                  <div className="form-group">
                    <label>Mã Code *</label>
                    <input name="code" value={formData.code} onChange={handleInputChange} required placeholder="VD: SALE50" style={{textTransform: 'uppercase'}} />
                  </div>
                  <div className="form-group">
                    <label>Loại giảm *</label>
                    <select name="type" value={formData.type} onChange={handleInputChange}>
                        <option value="FIXED">Giảm số tiền cố định</option>
                        <option value="PERCENT">Giảm theo phần trăm (%)</option>
                    </select>
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group">
                    <label>Giá trị giảm *</label>
                    <input type="number" name="value" value={formData.value} onChange={handleInputChange} min="0" required />
                  </div>
                  <div className="form-group">
                    <label>Đơn hàng tối thiểu</label>
                    <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleInputChange} min="0" />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group">
                    <label>Ngày bắt đầu *</label>
                    <input type="datetime-local" name="startsAt" value={formData.startsAt} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc *</label>
                    <input type="datetime-local" name="endsAt" value={formData.endsAt} onChange={handleInputChange} required />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group">
                    <label>Giới hạn số lượng *</label>
                    <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} min="1" required />
                  </div>
                  <div className="form-group checkbox-group" style={{justifyContent:'flex-start', marginTop:'30px'}}>
                    <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} id="chkActive" />
                    <label htmlFor="chkActive" style={{marginBottom:0, cursor:'pointer'}}>Kích hoạt ngay</label>
                  </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-save">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
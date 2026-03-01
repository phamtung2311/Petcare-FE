import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import "./ServiceandSpa.css";

// ... (Giữ nguyên các Interface: Service, PageResponse, ViewMode) ...
interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  imageUrl: string;
  active: boolean;
}

interface PageResponse {
  services: Service[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

type ViewMode = 'active' | 'paused';

const ServiceandSpa: React.FC = () => {
  // ... (Giữ nguyên State: services, loading, keyword, pagination...) ...
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const pageSize = 5;
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState<Omit<Service, "id">>({
    name: "", description: "", price: 0, durationMin: 30, imageUrl: "", active: true,
  });

  // ... (Giữ nguyên useEffect và các hàm API: fetchServices, handleDelete, handleRestore, handleSave...) ...
  useEffect(() => { fetchServices(); }, [currentPage, keyword, viewMode]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get("/services/list", {
        params: { page: currentPage, size: pageSize, keyword: keyword, sort: "id:desc", active: viewMode === 'active' },
      });
      const apiData = response.data;
      if (apiData.status === "OK" && apiData.data) {
        setServices(apiData.data.services || []);
        setTotalPages(apiData.data.totalPages);
      } else { setServices([]); setTotalPages(0); }
    } catch (error) { console.error(error); setServices([]); } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => { /* ... Giữ nguyên logic ... */ 
      if (!window.confirm("Bạn chắc chắn muốn tạm dừng?")) return;
      try { await api.delete(`/services/del/${id}`); alert("Đã tạm dừng!"); fetchServices(); } catch(e) { alert("Lỗi"); }
  };
  const handleRestore = async (service: Service) => { /* ... Giữ nguyên logic ... */ 
      if (!window.confirm("Khôi phục?")) return;
      try { await api.put(`/services/upd/${service.id}`, {...service, active: true}); alert("Đã khôi phục!"); fetchServices(); } catch(e) { alert("Lỗi"); }
  };
  const handleSave = async (e: React.FormEvent) => { /* ... Giữ nguyên logic ... */ 
     e.preventDefault();
     try {
         if (editingService) await api.put(`/services/upd/${editingService.id}`, formData);
         else await api.post("/services/add", { ...formData, active: true });
         alert("Thành công!"); closeModal(); fetchServices();
     } catch(e) { alert("Lỗi"); }
  };

  // ... (Giữ nguyên các hàm bổ trợ: handleSwitchMode, Modal handlers...) ...
  const handleSwitchMode = (mode: ViewMode) => { if (mode !== viewMode) { setViewMode(mode); setCurrentPage(1); setKeyword(""); } };
  const openModalAdd = () => { setEditingService(null); setFormData({ name: "", description: "", price: 0, durationMin: 30, imageUrl: "", active: true }); setIsModalOpen(true); };
  const openModalEdit = (service: Service) => { setEditingService(service); setFormData({ ...service }); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingService(null); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: name === "price" || name === "durationMin" ? Number(value) : value })); };


  // --- RENDER (ĐÃ SỬA GIAO DIỆN) ---
  return (
    <div className="service-spa-container">
      {/* 1. Header: Tiêu đề bên trái, Nút thêm bên phải */}
      <div className="service-header">
        <div className="header-left">
            <h1 className="service-title">Quản lý Dịch vụ & Spa</h1>
            <p className="service-subtitle">Quản lý danh sách các gói dịch vụ chăm sóc thú cưng</p>
        </div>
        
        {/* Nút thêm mới chỉ hiện khi ở tab Active */}
        {viewMode === 'active' && (
            <button onClick={openModalAdd} className="btn-primary icon-btn">
                <span className="plus-icon">+</span> Thêm Dịch vụ
            </button>
        )}
      </div>

      {/* 2. Tabs Group: Tách biệt hẳn với header */}
      <div className="tabs-wrapper">
          <div className="tabs-group">
              <button 
                  className={`tab-btn ${viewMode === 'active' ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('active')}>
                  Đang hoạt động
              </button>
              <button 
                  className={`tab-btn ${viewMode === 'paused' ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('paused')}>
                  Đã tạm dừng
              </button>
          </div>
          
          {/* Thanh tìm kiếm nằm cùng hàng với Tabs hoặc ngay dưới */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setCurrentPage(1)} 
            />
            <button onClick={() => { setCurrentPage(1); fetchServices(); }}>🔍</button>
          </div>
      </div>

      {/* 3. Table Wrapper (Giữ nguyên) */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">Đang tải dữ liệu...</div>
        ) : (
          <table className="service-table">
            <thead>
              <tr>
                <th style={{width: '50px'}}>ID</th>
                <th style={{ width: '30%' }}>Dịch vụ</th>
                <th>Giá</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">Không có dịch vụ nào.</td></tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className={!service.active ? "row-inactive" : ""}>
                    <td>#{service.id}</td>
                    <td>
                      <div className="service-info">
                        <img src={service.imageUrl || "https://placehold.co/50"} alt="" className="service-img" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <div>
                          <p className="service-name">{service.name}</p>
                          <p className="service-desc" title={service.description}>{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="price-cell">{service.price.toLocaleString("vi-VN")} đ</td>
                    <td><span className="badge-time">{service.durationMin}p</span></td>
                    <td>
                      {service.active 
                        ? <span className="status-badge status-active">● Hoạt động</span> 
                        : <span className="status-badge status-inactive">● Tạm dừng</span>}
                    </td>
                    <td className="action-cell">
                      <button onClick={() => openModalEdit(service)} className="btn-icon edit" title="Sửa">✎</button>
                      {viewMode === 'active' ? (
                        <button onClick={() => handleDelete(service.id)} className="btn-icon delete" title="Tạm dừng">✕</button>
                      ) : (
                        <button onClick={() => handleRestore(service)} className="btn-icon restore" title="Khôi phục">↻</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (Giữ nguyên logic) */}
      {totalPages > 0 && (
        <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-page">Prev</button>
            <span>{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-page">Next</button>
        </div>
      )}

      {/* Modal (Giữ nguyên form inputs) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{editingService ? "Cập nhật Dịch vụ" : "Thêm mới Dịch vụ"}</h2>
            <form onSubmit={handleSave}>
               {/* ... (Copy lại phần Form Inputs từ code cũ vào đây, không cần sửa style vì CSS mới sẽ lo) ... */}
               <div className="form-group"><label>Tên dịch vụ</label><input required className="form-input" name="name" value={formData.name} onChange={handleInputChange}/></div>
               <div className="form-row">
                   <div className="form-col"><label>Giá</label><input type="number" className="form-input" name="price" value={formData.price} onChange={handleInputChange}/></div>
                   <div className="form-col"><label>Phút</label><input type="number" className="form-input" name="durationMin" value={formData.durationMin} onChange={handleInputChange}/></div>
               </div>
               <div className="form-group"><label>Link Ảnh</label><input className="form-input" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange}/></div>
               <div className="form-group"><label>Mô tả</label><textarea className="form-textarea" name="description" value={formData.description} onChange={handleInputChange}></textarea></div>
               
               <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceandSpa;
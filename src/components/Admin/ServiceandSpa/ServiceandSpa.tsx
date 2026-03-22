import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import "./ServiceandSpa.css";

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

// 🟢 FIX 1: Tạo FormData riêng để price và durationMin có thể nhận chuỗi rỗng "" (Xóa số 0 mặc định)
interface ServiceFormData {
  name: string;
  description: string;
  price: number | string;
  durationMin: number | string;
  imageUrl: string;
  active: boolean;
}

const ServiceandSpa: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const pageSize = 5;
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // 🟢 FIX 2: Thêm state xử lý trạng thái đang upload
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "", description: "", price: "", durationMin: "", imageUrl: "", active: true,
  });

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

  const handleDelete = async (id: number) => { 
      if (!window.confirm("Bạn chắc chắn muốn tạm dừng?")) return;
      try { await api.delete(`/services/del/${id}`); alert("Đã tạm dừng!"); fetchServices(); } catch(e) { alert("Lỗi"); }
  };

  const handleRestore = async (service: Service) => { 
      if (!window.confirm("Khôi phục?")) return;
      try { await api.put(`/services/upd/${service.id}`, {...service, active: true}); alert("Đã khôi phục!"); fetchServices(); } catch(e) { alert("Lỗi"); }
  };

  // 🟢 FIX 3: Hàm xử lý Upload File ảnh lên Backend
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    setIsUploading(true);
    try {
        const res = await api.post("/files/upload", uploadData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        
        // Backend trả về: { status: 200, message: "...", url: "..." }
        if (res.data && res.data.url) {
            setFormData({ ...formData, imageUrl: res.data.url });
        }
    } catch (error: any) {
        console.error("Upload error:", error);
        alert("Lỗi upload ảnh: " + (error.response?.data || error.message));
    } finally {
        setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => { 
     e.preventDefault();
     try {
         // 🟢 FIX 4: Ép kiểu price và durationMin về Number trước khi gửi xuống DB
         const payload = {
             ...formData,
             price: Number(formData.price),
             durationMin: Number(formData.durationMin),
             active: true
         };

         if (editingService) await api.put(`/services/upd/${editingService.id}`, payload);
         else await api.post("/services/add", payload);
         alert("Thành công!"); closeModal(); fetchServices();
     } catch(e) { alert("Lỗi"); }
  };

  const handleSwitchMode = (mode: ViewMode) => { if (mode !== viewMode) { setViewMode(mode); setCurrentPage(1); setKeyword(""); } };
  
  const openModalAdd = () => { 
      setEditingService(null); 
      setFormData({ name: "", description: "", price: "", durationMin: "", imageUrl: "", active: true }); 
      setIsModalOpen(true); 
  };
  
  const openModalEdit = (service: Service) => { 
      setEditingService(service); 
      setFormData({ ...service }); 
      setIsModalOpen(true); 
  };
  
  const closeModal = () => { setIsModalOpen(false); setEditingService(null); };
  
  // 🟢 FIX 5: Sửa lại hàm handleInputChange để không ép kiểu Number sớm (giúp xóa được chữ số)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
      const { name, value } = e.target; 
      setFormData((prev) => ({ ...prev, [name]: value })); 
  };

  return (
    <div className="service-spa-container">
      {/* 1. Header: Tiêu đề bên trái, Nút thêm bên phải */}
      <div className="service-header">
        <div className="header-left">
            <h1 className="service-title">Quản lý Dịch vụ & Spa</h1>
            <p className="service-subtitle">Quản lý danh sách các gói dịch vụ chăm sóc thú cưng</p>
        </div>
        
        {viewMode === 'active' && (
            <button onClick={openModalAdd} className="btn-primary icon-btn">
                <span className="plus-icon">+</span> Thêm Dịch vụ
            </button>
        )}
      </div>

      {/* 2. Tabs Group */}
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

      {/* 3. Table Wrapper */}
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
                    <td>
                      <span className="badge-time">
                        {service.durationMin ? `${service.durationMin}p` : "---"}
                      </span>
                    </td>
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

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-page">Prev</button>
            <span>{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-page">Next</button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{editingService ? "Cập nhật Dịch vụ" : "Thêm mới Dịch vụ"}</h2>
            <form onSubmit={handleSave}>
               <div className="form-group">
                   <label>Tên dịch vụ</label>
                   <input required className="form-input" name="name" value={formData.name} onChange={handleInputChange}/>
               </div>
               
               {/* 🟢 Giao diện giá và phút đã được sửa để không dính số 0 */}
               <div className="form-row">
                   <div className="form-col">
                       <label>Giá (VNĐ)</label>
                       <input type="number" min="0" required className="form-input" name="price" value={formData.price} onChange={handleInputChange}/>
                   </div>
                   <div className="form-col">
                       <label>Phút (Thời gian thực hiện)</label>
                       <input type="number" min="0" required className="form-input" name="durationMin" value={formData.durationMin} onChange={handleInputChange}/>
                   </div>
               </div>

               {/* 🟢 Giao diện Ảnh (Upload máy + Paste Link) */}
               <div className="form-group">
                   <label>Ảnh dịch vụ (Tải lên từ máy hoặc dán link web)</label>
                   <input 
                       type="file" 
                       accept="image/*" 
                       onChange={handleFileUpload} 
                       style={{ marginBottom: '10px' }}
                   />
                   
                   {isUploading && <p style={{ color: '#4f46e5', fontSize: '13px', margin: '5px 0' }}>Đang tải ảnh lên hệ thống...</p>}
                   
                   <input 
                       className="form-input" 
                       name="imageUrl" 
                       placeholder="Hoặc dán trực tiếp link ảnh copy trên mạng vào đây..."
                       value={formData.imageUrl} 
                       onChange={handleInputChange}
                   />
                   
                   {formData.imageUrl && (
                       <img src={formData.imageUrl} alt="Preview" className="img-preview" 
                       style={{ marginTop: '10px', maxWidth: '100px', borderRadius: '8px', objectFit: 'cover' }}
                       onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Lỗi+Ảnh"}/>
                   )}
               </div>

               <div className="form-group">
                   <label>Mô tả chi tiết</label>
                   <textarea className="form-textarea" rows={4} name="description" value={formData.description} onChange={handleInputChange}></textarea>
               </div>
               
               <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary" disabled={isUploading}>
                    {isUploading ? "Đang xử lý..." : "Lưu lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceandSpa;
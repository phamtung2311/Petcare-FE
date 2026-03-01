import React, { useEffect, useState } from "react";
import api from "../../../../api/axiosInstance";
// Bạn có thể tái sử dụng file CSS của ProductList hoặc tạo file mới
import "../ProductList.css"; 

// --- INTERFACES ---
interface Category {
  id: number;
  name: string;
  description?: string; // Dấu ? vì có thể null
}

interface CategoryFormData {
  name: string;
  description: string;
}

const CategoryList: React.FC = () => {
  // --- STATE ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal & Form
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchCategories(page);
  }, [page]);

  const fetchCategories = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await api.get("/categories/list", {
        params: {
          page: pageNumber,
          size: 10,
          sort: "id:desc", // Sắp xếp mới nhất lên đầu
        },
      });

      if (res.data && res.data.status === "OK" && res.data.data) {
        // Lưu ý: Kiểm tra lại cấu trúc trả về của CategoryPageResponse trong Java
        // Ở đây mình giả định key trả về là 'categories' hoặc 'content'
        // Nếu CategoryPageResponse trả về field tên là 'content' thì sửa dòng dưới thành res.data.data.content
        setCategories(res.data.data.categories || res.data.data.content || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLERS ---
  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const handleEdit = (cat: Category) => {
    setIsEditMode(true);
    setCurrentId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? Lưu ý: Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.")) return;
    try {
      await api.delete(`/categories/del/${id}`);
      alert("Xóa danh mục thành công!");
      fetchCategories(page);
    } catch (error: any) {
      console.error(error);
      alert("Lỗi: " + (error.response?.data?.message || "Server error"));
    }
  };

  // --- 3. SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
      };

      if (isEditMode && currentId) {
        await api.put(`/categories/upd/${currentId}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post("/categories/add", payload);
        alert("Thêm mới thành công!");
      }

      setShowModal(false);
      fetchCategories(page);
    } catch (error: any) {
      console.error("Lỗi submit:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // --- RENDER ---
  return (
    <div className="product-list-container"> {/* Tái sử dụng class container */}
      <div className="page-header">
        <h2 className="page-title">Quản lý Danh mục</h2>
        <div className="header-actions">
          <button className="btn-add" onClick={handleAddNew}>+ Thêm danh mục</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th style={{ width: '250px' }}>Tên danh mục</th>
              <th>Mô tả</th>
              <th style={{ width: '150px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="no-data">Đang tải dữ liệu...</td></tr>
            ) : (
              categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>#{cat.id}</td>
                    <td className="product-name-cell">
                      <strong>{cat.name}</strong>
                    </td>
                    <td>{cat.description || "---"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(cat)}>Sửa</button>
                        <button className="btn-delete" onClick={() => handleDelete(cat.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="no-data">Không có danh mục nào.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>« Trước</button>
        <span>Trang {page} / {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau »</button>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{isEditMode ? "Cập nhật danh mục" : "Thêm danh mục mới"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label>Tên danh mục *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                  placeholder="Ví dụ: Thức ăn cho mèo"
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea 
                  rows={4}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả chi tiết về danh mục này..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
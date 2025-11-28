import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import "./ProductList.css";

// Interface hiển thị (Response)
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryName: string;
  images: { id: number; imageUrl: string }[];
}

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryId: number;
  thumbnail: string;
}

const ProductList: React.FC = () => {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // State quản lý chế độ xem (false = Đang bán, true = Thùng rác)
  const [viewDeleted, setViewDeleted] = useState<boolean>(false); 

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: 0,
    stock: 0,
    description: "",
    categoryId: 0,
    thumbnail: ""
  });

  // --- 1. FETCH DATA ---
  useEffect(() => {
    // Khi đổi chế độ xem (Đang bán <-> Thùng rác), reset về trang 1
    setPage(1);
    fetchProducts(1);
  }, [viewDeleted]); // Dependency: viewDeleted

  useEffect(() => {
    fetchProducts(page);
  }, [page]); // Dependency: page

  useEffect(() => {
    fetchCategories(); // Gọi 1 lần lúc mount
  }, []);

  const fetchProducts = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await api.get("/products/list", {
        params: { 
            page: pageNumber, 
            size: 10, 
            sort: "id:desc",
            // Gửi param isDeleted lên BE (true nếu đang xem thùng rác)
            isDeleted: viewDeleted 
        }
      });
      if (res.data && res.data.status === 200 && res.data.data) {
        setProducts(res.data.data.products || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories/list", {
        params: { sort: "id:asc", page: 1, size: 50 },
      });
      if (res.data && res.data.status === 200 && res.data.data) {
        setCategories(res.data.data.categories || []); 
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      setCategories([]);
    }
  };

  // --- 2. HANDLERS ---
  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: "", price: 0, stock: 0, description: "", categoryId: 0, thumbnail: "" });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setIsEditMode(true);
    setCurrentId(product.id);
    
    const cat = categories.find(c => c.name === product.categoryName);
    const catId = cat ? cat.id : 0;
    const imgUrl = (product.images && product.images.length > 0) ? product.images[0].imageUrl : "";

    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      categoryId: catId,
      thumbnail: imgUrl
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này vào thùng rác?")) return;
    try {
      await api.delete(`/products/del/${id}`);
      alert("Đã chuyển vào thùng rác!");
      fetchProducts(page);
    } catch (error: any) {
      console.error(error);
      alert("Lỗi: " + (error.response?.data?.message || "Server error"));
    }
  };

  // 🟢 HÀM KHÔI PHỤC
  const handleRestore = async (id: number) => {
    if (!window.confirm("Bạn muốn khôi phục sản phẩm này để bán lại?")) return;
    try {
      await api.put(`/products/restore/${id}`);
      alert("Khôi phục thành công!");
      fetchProducts(page);
    } catch (error: any) {
      alert("Lỗi: " + error.response?.data?.message);
    }
  };

  // --- 3. SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0 || formData.categoryId === 0) {
      alert("Vui lòng nhập đủ thông tin (Tên, Giá > 0, Danh mục)!");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        price: formData.price,
        stock: formData.stock,
        description: formData.description,
        categoryId: formData.categoryId,
        imageUrls: formData.thumbnail ? [formData.thumbnail] : [] 
      };

      if (isEditMode && currentId) {
        await api.put(`/products/upd/${currentId}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post("/products/add", payload);
        alert("Thêm mới thành công!");
      }

      setShowModal(false);
      fetchProducts(page);
    } catch (error: any) {
      console.error("Lỗi submit:", error);
      // Xử lý lỗi Data truncation (ảnh base64 quá dài)
      if (error.response?.data?.message?.includes("Data too long")) {
        alert("Link ảnh quá dài! Vui lòng dùng link ngắn hơn hoặc nâng cấp Database.");
      } else {
        alert(error.response?.data?.message || "Có lỗi xảy ra");
      }
    }
  };

  // --- 4. FORMATTERS ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="product-list-container">
      <div className="page-header">
        <h2 className="page-title">Quản lý Sản phẩm</h2>
        
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
            {/* 🟢 NÚT CHUYỂN CHẾ ĐỘ XEM */}
            <button 
                className={`view-mode-btn ${!viewDeleted ? 'active-mode' : ''}`}
                onClick={() => setViewDeleted(false)}
                style={{
                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer',
                    background: !viewDeleted ? '#e0e7ff' : 'white', fontWeight: !viewDeleted ? '600' : 'normal', color: !viewDeleted ? '#3730a3' : '#374151'
                }}
            >
                📦 Đang bán
            </button>
            <button 
                className={`view-mode-btn ${viewDeleted ? 'active-mode' : ''}`}
                onClick={() => setViewDeleted(true)}
                style={{
                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer',
                    background: viewDeleted ? '#fee2e2' : 'white', fontWeight: viewDeleted ? '600' : 'normal', color: viewDeleted ? '#991b1b' : '#374151'
                }}
            >
                🗑️ Thùng rác
            </button>

            {!viewDeleted && (
                <button className="btn-add" onClick={handleAddNew}>+ Thêm mới</button>
            )}
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Kho</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(products) && products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>
                    {/* 🟢 XỬ LÝ ẢNH LỖI (ON ERROR) */}
                    <img 
                      src={(p.images && p.images.length > 0 && p.images[0].imageUrl) ? p.images[0].imageUrl : "https://placehold.co/50x50?text=No+Img"} 
                      alt="" 
                      className="product-thumb"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "https://placehold.co/50x50?text=Error";
                      }}
                    />
                  </td>
                  <td className="product-name-cell">
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.categoryName || "---"}</td>
                  <td className="text-price">{formatCurrency(p.price)}</td>
                  <td>
                    <span className={`stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!viewDeleted ? (
                          // NẾU ĐANG BÁN: Hiện Sửa/Xóa
                          <>
                            <button className="btn-edit" onClick={() => handleEdit(p)}>Sửa</button>
                            <button className="btn-delete" onClick={() => handleDelete(p.id)}>Xóa</button>
                          </>
                      ) : (
                          // NẾU TRONG THÙNG RÁC: Hiện Khôi phục
                          <button 
                            className="btn-restore" 
                            onClick={() => handleRestore(p.id)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #16a34a', background: 'white', color: '#16a34a', cursor: 'pointer', fontWeight: '500' }}
                          >
                            ♻️ Khôi phục
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="no-data">
                {loading ? "Đang tải..." : (viewDeleted ? "Thùng rác trống." : "Không có sản phẩm nào.")}
              </td></tr>
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

      {/* MODAL FORM (Chỉ hiện khi không ở chế độ Thùng Rác) */}
      {showModal && !viewDeleted && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditMode ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label>Tên sản phẩm *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giá (VNĐ) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Số lượng kho *</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Danh mục *</label>
                <select 
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}
                  required
                >
                  <option value={0}>-- Chọn danh mục --</option>
                  {Array.isArray(categories) && categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Link ảnh (URL)</label>
                <input 
                  type="text" 
                  value={formData.thumbnail} 
                  onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                  placeholder="https://..."
                />
                {formData.thumbnail && (
                  <img 
                    src={formData.thumbnail} 
                    alt="Preview" 
                    className="img-preview" 
                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error"}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea 
                  rows={4}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
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

export default ProductList;
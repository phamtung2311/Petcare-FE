import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import "./ProductList.css";
import CategoryList from "./CategoryList/CategoryList"; 

// --- INTERFACES ---
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

// 🟢 FIX 2: Cho phép price và stock nhận string rỗng để sửa lỗi xóa số 0 bị kẹt
interface ProductFormData {
  name: string;
  price: number | string; 
  stock: number | string; 
  description: string;
  categoryId: number | string;
  thumbnail: string;
}

const ProductList: React.FC = () => {
  // --- STATE TAB QUẢN LÝ ---
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // --- STATE PRODUCT ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewDeleted, setViewDeleted] = useState<boolean>(false); 
  const [filterCategoryId, setFilterCategoryId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<string>("desc");

  // Modal & Form
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // 🟢 FIX 3: Thêm state loading khi đang upload ảnh
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "", price: "", stock: "", description: "", categoryId: "", thumbnail: ""
  });

  // --- EFFECTS ---
  useEffect(() => {
    fetchCategories(); 
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
        setPage(1);
        fetchProducts(1); 
    }
  }, [viewDeleted, activeTab, filterCategoryId]);

  useEffect(() => {
    if (activeTab === 'products') {
        fetchProducts(page);
    }
  }, [page, sortBy, sortDir]);

  // --- API CALLS ---
  const fetchProducts = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await api.get("/products/list", {
        params: { 
            page: pageNumber, 
            size: 10, 
            sort: `${sortBy}:${sortDir}`, 
            isDeleted: viewDeleted,
            categoryId: filterCategoryId > 0 ? filterCategoryId : undefined 
        }
      });
      if (res.data && res.data.data) {
        setProducts(res.data.data.products || res.data.data.content || res.data.data.items || []);
        setTotalPages(res.data.data.totalPages || 1);
      } else {
        setProducts([]);
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
        params: { sort: "id:asc", page: 1, size: 100 }, 
      });
      // 🟢 FIX 1: Bỏ check cứng status = 200, lấy data linh hoạt hơn
      if (res.data && res.data.data) {
        setCategories(res.data.data.categories || res.data.data.content || res.data.data.items || res.data.data || []); 
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      setCategories([]);
    }
  };

  // --- HANDLERS ---
  const handleSort = (field: string) => {
    if (sortBy === field) {
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(field);
        setSortDir('desc');
    }
    setPage(1); 
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <span style={{ opacity: 0.3, fontSize: '12px', marginLeft: '5px' }}>⇅</span>;
    return <span style={{ marginLeft: '5px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: "", price: "", stock: "", description: "", categoryId: "", thumbnail: "" });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setIsEditMode(true);
    setCurrentId(product.id);
    
    const cat = categories.find(c => c.name === product.categoryName);
    const catId = cat ? cat.id : "";
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
    if (!window.confirm("Chuyển vào thùng rác?")) return;
    try {
      await api.delete(`/products/del/${id}`);
      alert("Đã chuyển vào thùng rác!");
      fetchProducts(page);
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || "Server error"));
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm("Khôi phục sản phẩm này?")) return;
    try {
      await api.put(`/products/restore/${id}`);
      alert("Khôi phục thành công!");
      fetchProducts(page);
    } catch (error: any) {
      alert("Lỗi: " + error.response?.data?.message);
    }
  };

  // 🟢 FIX 3: Hàm xử lý Upload File ảnh lên Backend Spring Boot
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
            setFormData({ ...formData, thumbnail: res.data.url });
        }
    } catch (error: any) {
        console.error("Upload error:", error);
        alert("Lỗi upload ảnh: " + (error.response?.data || error.message));
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || Number(formData.price) <= 0 || !formData.categoryId) {
      alert("Vui lòng nhập đủ thông tin (Tên, Giá > 0, Danh mục)!");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price), // Ép kiểu lại thành Number khi submit
        stock: Number(formData.stock),
        description: formData.description,
        categoryId: Number(formData.categoryId),
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
        const msg = error.response?.data?.message || "Có lỗi xảy ra";
        alert(msg);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- RENDER ---
  return (
    <div className="product-list-container">
        {/* TABS HEADER */}
        <div className="main-tabs" style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px' }}>
            <button onClick={() => setActiveTab('products')}
                style={{
                    padding: '10px 24px', marginRight: '15px', border: 'none',
                    background: activeTab === 'products' ? '#4f46e5' : '#f3f4f6',
                    color: activeTab === 'products' ? 'white' : '#374151',
                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                }}>
                🛍️ Quản lý Sản phẩm
            </button>
            <button onClick={() => setActiveTab('categories')}
                style={{
                    padding: '10px 24px', border: 'none',
                    background: activeTab === 'categories' ? '#4f46e5' : '#f3f4f6',
                    color: activeTab === 'categories' ? 'white' : '#374151',
                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                }}>
                📂 Quản lý Danh mục
            </button>
        </div>

        {activeTab === 'categories' ? (
            <CategoryList />
        ) : (
            <>
                {/* HEADERS & FILTERS... (Giữ nguyên như cũ) */}
                <div className="page-header">
                    <h2 className="page-title">Sản phẩm</h2>
                    <div className="header-actions">
                        <select className="category-filter" value={filterCategoryId} onChange={(e) => setFilterCategoryId(Number(e.target.value))}>
                            <option value={0}>-- Tất cả danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <button className={`view-mode-btn ${!viewDeleted ? 'active-mode' : ''}`} onClick={() => setViewDeleted(false)}>
                            📦 Đang bán
                        </button>
                        <button className={`view-mode-btn ${viewDeleted ? 'active-mode' : ''}`} onClick={() => setViewDeleted(true)}>
                            🗑️ Thùng rác
                        </button>

                        {!viewDeleted && (
                            <button className="btn-add" onClick={handleAddNew}>+ Thêm mới</button>
                        )}
                    </div>
                </div>

                {/* TABLE (Giữ nguyên như cũ) */}
                <div className="table-wrapper">
                    <table className="product-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('id')} style={{cursor: 'pointer', userSelect: 'none'}}>ID {renderSortIcon('id')}</th>
                            <th>Ảnh</th>
                            <th onClick={() => handleSort('name')} style={{cursor: 'pointer', userSelect: 'none'}}>Tên sản phẩm {renderSortIcon('name')}</th>
                            <th>Danh mục</th>
                            <th onClick={() => handleSort('price')} style={{cursor: 'pointer', userSelect: 'none'}}>Giá bán {renderSortIcon('price')}</th>
                            <th onClick={() => handleSort('stock')} style={{cursor: 'pointer', userSelect: 'none', backgroundColor: sortBy === 'stock' ? '#f0fdf4' : ''}}>
                                Kho {renderSortIcon('stock')}
                            </th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan={7} className="no-data">Đang tải dữ liệu...</td></tr>
                        ) : (
                            Array.isArray(products) && products.length > 0 ? (
                            products.map((p) => (
                                <tr key={p.id}>
                                <td>#{p.id}</td>
                                <td>
                                    <img src={(p.images?.[0]?.imageUrl) || "https://placehold.co/50x50?text=No+Img"} 
                                    alt="" className="product-thumb"
                                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/50x50?text=Error"}/>
                                </td>
                                <td className="product-name-cell"><strong>{p.name}</strong></td>
                                <td>{p.categoryName || "---"}</td>
                                <td className="text-price">{formatCurrency(p.price)}</td>
                                <td style={{ backgroundColor: sortBy === 'stock' ? '#f0fdf4' : '' }}>
                                    <span className={`stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                    {!viewDeleted ? (
                                        <>
                                            <button className="btn-edit" onClick={() => handleEdit(p)}>Sửa</button>
                                            <button className="btn-delete" onClick={() => handleDelete(p.id)}>Xóa</button>
                                        </>
                                    ) : (
                                        <button className="btn-restore" onClick={() => handleRestore(p.id)}>♻️ Khôi phục</button>
                                    )}
                                    </div>
                                </td>
                                </tr>
                            ))
                            ) : (
                            <tr><td colSpan={7} className="no-data">
                                {viewDeleted ? "Thùng rác trống." : "Không tìm thấy sản phẩm phù hợp."}
                            </td></tr>
                            )
                        )}
                    </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>« Trước</button>
                    <span>Trang {page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau »</button>
                </div>

                {/* MODAL (ĐÃ CẬP NHẬT FORM) */}
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
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        
                        {/* 🟢 Sửa input thành kiểu text/number và chặn nhập chuỗi linh tinh */}
                        <div className="form-row">
                            <div className="form-group">
                            <label>Giá (VNĐ) *</label>
                            <input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                            </div>
                            <div className="form-group">
                            <label>Số lượng kho *</label>
                            <input type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Danh mục *</label>
                            <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                            </select>
                        </div>

                        {/* 🟢 Khu vực Upload File hoặc Nhập Link */}
                        <div className="form-group">
                            <label>Ảnh sản phẩm (Tải lên từ máy hoặc dán link web)</label>
                            {/* Input File */}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileUpload} 
                                style={{ marginBottom: '10px' }}
                            />
                            
                            {isUploading && <p style={{ color: 'blue', fontSize: '13px' }}>Đang tải ảnh lên hệ thống...</p>}
                            
                            {/* 🟢 Bỏ readOnly, cho phép nhập text trực tiếp */}
                            <input 
                                type="text" 
                                placeholder="Hoặc dán trực tiếp link ảnh copy trên mạng vào đây..."
                                value={formData.thumbnail} 
                                onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                            />

                            {formData.thumbnail && (
                                <img src={formData.thumbnail} alt="Preview" className="img-preview" 
                                style={{ marginTop: '10px', maxWidth: '100px', borderRadius: '8px', objectFit: 'cover' }}
                                onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Lỗi+Ảnh"}/>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                            {/* Disabled nút submit nếu đang upload dở ảnh */}
                            <button type="submit" className="btn-save" disabled={isUploading}>
                                {isUploading ? "Đang xử lý..." : "Lưu lại"}
                            </button>
                        </div>
                        </form>
                    </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default ProductList;
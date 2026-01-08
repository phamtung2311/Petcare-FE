import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Revenue.css"; // Tái sử dụng CSS

// Interface khớp với dữ liệu từ API
interface ProductStat {
  id: number;
  name: string;
  categoryName: string;
  price: number;
  totalSold: number;
  totalRevenue: number;
  stock?: number; // Dấu ? để tránh lỗi nếu BE chưa trả về
}

const ProductSales: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [products, setProducts] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Sort
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("totalSold"); 
  const [sortDir, setSortDir] = useState("desc");

  // --- EFFECT ---
  // Gọi lại API khi đổi trang, sort
  useEffect(() => {
    handleFilter();
  }, [page, sortBy, sortDir]);

  // Reset về trang 1 khi đổi tháng/năm
  useEffect(() => {
    setPage(1);
    handleFilter();
  }, [selectedMonth, selectedYear]);

  // --- FUNCTION ---
  const handleFilter = () => {
    const m = String(selectedMonth).padStart(2, '0');
    // Lấy ngày cuối cùng của tháng
    const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    const startStr = `${selectedYear}-${m}-01`;
    const endStr = `${selectedYear}-${m}-${lastDayOfMonth}`;

    fetchStats(startStr, endStr);
  };

  const fetchStats = async (fromDate: string, toDate: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/product-stats`, {
        params: {
          fromDate,
          toDate,
          page,
          size: 10,
          sortBy,
          sortDir
        }
      });

      if (response.data && response.data.status === 200) {
        setProducts(response.data.data.content);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Lỗi lấy thống kê sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc"); // Mặc định giảm dần khi click cột mới
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <span style={{opacity: 0.2, fontSize: '10px', marginLeft: '5px'}}>▼</span>;
    return <span style={{marginLeft: '5px', color: '#2563eb'}}>{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="revenue-container">
      {/* HEADER */}
      <div className="revenue-header">
        <button onClick={() => navigate("/admin/revenue")} className="back-btn">
            <span>⬅ Quay lại</span>
        </button>
        <h2 className="page-title">Hiệu quả kinh doanh & Tồn kho</h2>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Chọn tháng</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="filter-select"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Chọn năm</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="filter-select"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <button onClick={() => handleFilter()} className="filter-btn">
            Làm mới
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="card" style={{ marginTop: '20px', padding: '0', overflow: 'hidden' }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th style={{width: '50px'}}>#</th>
              
              <th onClick={() => handleSort('name')} style={{cursor: 'pointer', userSelect: 'none'}}>
                Tên sản phẩm {renderSortIcon('name')}
              </th>
              
              <th>Danh mục</th>
              
              <th style={{textAlign: 'right'}}>Giá bán</th>
              
              {/* 🟢 CỘT TỒN KHO */}
              <th 
                onClick={() => handleSort('stock')} 
                style={{textAlign: 'center', cursor: 'pointer', userSelect: 'none'}}
                title="Click sắp xếp theo tồn kho"
              >
                Tồn kho {renderSortIcon('stock')}
              </th>

              {/* CỘT SỐ LƯỢNG BÁN */}
              <th 
                onClick={() => handleSort('totalSold')} 
                style={{textAlign: 'center', backgroundColor: '#f0fdf4', cursor: 'pointer', userSelect: 'none'}}
              >
                Số lượng bán {renderSortIcon('totalSold')}
              </th>
              
              {/* CỘT DOANH THU */}
              <th 
                onClick={() => handleSort('revenue')} 
                style={{textAlign: 'center', backgroundColor: '#eff6ff', cursor: 'pointer', userSelect: 'none'}}
              >
                Doanh thu {renderSortIcon('revenue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={7} style={{textAlign:'center', padding:'30px'}}>Đang tải dữ liệu...</td></tr>
            ) : products.length > 0 ? (
                products.map((p, index) => (
                    <tr key={p.id}>
                        <td>{index + 1 + (page - 1) * 10}</td>
                        
                        {/* Tên SP */}
                        <td style={{fontWeight: '500', color: '#374151'}}>
                            {p.name}
                        </td>
                        
                        {/* Danh mục */}
                        <td>
                            <span style={{
                                backgroundColor: '#f3f4f6', padding: '4px 8px', 
                                borderRadius: '4px', fontSize: '12px', color: '#666'
                            }}>
                                {p.categoryName || 'Không rõ'}
                            </span>
                        </td>
                        
                        {/* Giá */}
                        <td style={{textAlign: 'right', color: '#666'}}>
                            {formatCurrency(p.price)}
                        </td>
                        
                        {/* 🟢 TỒN KHO (Có style cảnh báo) */}
                        <td style={{textAlign: 'center'}}>
                            {p.stock !== undefined ? (
                                <span style={{
                                    fontWeight: 'bold', 
                                    color: p.stock <= 10 ? '#dc2626' : '#374151',
                                    backgroundColor: p.stock <= 10 ? '#fee2e2' : 'transparent',
                                    padding: p.stock <= 10 ? '2px 8px' : '0',
                                    borderRadius: '10px',
                                    fontSize: p.stock <= 10 ? '12px' : '14px'
                                }}>
                                    {p.stock}
                                </span>
                            ) : (
                                <span style={{color: '#999', fontSize: '12px'}}>-</span>
                            )}
                        </td>

                        {/* Số lượng bán */}
                        <td style={{textAlign: 'center', fontWeight: 'bold', color: p.totalSold > 0 ? '#10b981' : '#ccc', backgroundColor: '#f0fdf4'}}>
                            {p.totalSold}
                        </td>
                        
                        {/* Doanh thu */}
                        <td style={{textAlign: 'center', fontWeight: 'bold', color: p.totalRevenue > 0 ? '#3b82f6' : '#ccc', backgroundColor: '#eff6ff'}}>
                            {formatCurrency(p.totalRevenue)}
                        </td>
                    </tr>
                ))
            ) : (
                <tr><td colSpan={7} style={{textAlign:'center', padding:'30px', color: '#999'}}>Không có sản phẩm nào.</td></tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {totalPages > 1 && (
            <div className="pagination" style={{padding: '20px', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                <button 
                    disabled={page === 1} 
                    onClick={() => setPage(page - 1)}
                    className="filter-btn"
                    style={{padding: '5px 15px', backgroundColor: page === 1 ? '#eee' : '#fff'}}
                >
                    Trước
                </button>
                <span style={{fontWeight: 'bold', alignSelf: 'center'}}>Trang {page} / {totalPages}</span>
                <button 
                    disabled={page === totalPages} 
                    onClick={() => setPage(page + 1)}
                    className="filter-btn"
                    style={{padding: '5px 15px', backgroundColor: page === totalPages ? '#eee' : '#fff'}}
                >
                    Sau
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductSales;
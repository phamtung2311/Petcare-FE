import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Revenue.css"; 

// --- INTERFACES ---
interface StatsItem {
  id: number;
  name: string;
  usageCount?: number;           // Dùng cho Dịch vụ
  completedAppointments?: number; // Dùng cho Nhân viên
  totalRevenue: number;          // Dùng cho Dịch vụ
  totalRevenueGenerated?: number; // Dùng cho Nhân viên
}

const AppointmentSales: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service'); // 🟢 Tab hiện tại

  const [dataList, setDataList] = useState<StatsItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Sort
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("totalRevenue"); 
  const [sortDir, setSortDir] = useState("desc");

  // --- EFFECT ---
  // Reset trang và sort khi đổi Tab
  useEffect(() => {
    setPage(1);
    setSortBy("totalRevenue");
    setSortDir("desc");
    handleFilter();
  }, [activeTab]);

  // Gọi lại API khi filter thay đổi
  useEffect(() => {
    handleFilter();
  }, [page, sortBy, sortDir, selectedMonth, selectedYear]);

  // --- FUNCTION ---
  const handleFilter = () => {
    const m = String(selectedMonth).padStart(2, '0');
    const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    const startStr = `${selectedYear}-${m}-01`;
    const endStr = `${selectedYear}-${m}-${lastDayOfMonth}`;

    fetchStats(startStr, endStr);
  };

  const fetchStats = async (fromDate: string, toDate: string) => {
    try {
      setLoading(true);
      
      // 🟢 Xác định API endpoint dựa trên Tab
      const endpoint = activeTab === 'service' 
        ? `/appointments/stats/page` 
        : `/appointments/stats/staff`;

      // 🟢 Mapping tham số sort cho khớp với backend
      let finalSortBy = sortBy;
      if (activeTab === 'staff') {
         if (sortBy === 'usageCount') finalSortBy = 'usageCount'; // Backend Staff dùng chung key này cho count
         if (sortBy === 'totalRevenue') finalSortBy = 'totalRevenue';
      }

      const response = await api.get(endpoint, {
        params: {
          fromDate,
          toDate,
          page,
          size: 10,
          sortBy: finalSortBy,
          sortDir
        }
      });

      if (response.data && response.data.status === 200) {
        setDataList(response.data.data.content);
        setTotalPages(response.data.data.totalPages);
      } else {
        setDataList([]);
      }
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <span style={{opacity: 0.2, fontSize: '10px', marginLeft: '5px'}}>▼</span>;
    return <span style={{marginLeft: '5px', color: activeTab === 'service' ? '#059669' : '#7c3aed'}}>
        {sortDir === 'asc' ? '▲' : '▼'}
    </span>;
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
        <h2 className="page-title" style={{color: '#1e293b'}}>
             Trung tâm Phân tích Dịch vụ & Nhân sự
        </h2>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar" style={{marginBottom: '10px'}}>
        <div className="filter-group">
          <label>Tháng</label>
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
          <label>Năm</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="filter-select"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <button onClick={() => handleFilter()} className="filter-btn">
            Làm mới
        </button>
      </div>

      {/* TABS SWITCHER */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button 
            onClick={() => setActiveTab('service')}
            style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'service' ? '#059669' : '#e5e7eb',
                color: activeTab === 'service' ? '#fff' : '#374151',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
          >
            💇 Thống kê Dịch vụ
          </button>
          
          <button 
            onClick={() => setActiveTab('staff')}
            style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'staff' ? '#7c3aed' : '#e5e7eb',
                color: activeTab === 'staff' ? '#fff' : '#374151',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
          >
            🥇 Hiệu suất Nhân viên
          </button>
      </div>

      {/* DATA TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderTop: `3px solid ${activeTab === 'service' ? '#059669' : '#7c3aed'}` }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th style={{width: '50px'}}>#</th>
              
              <th onClick={() => handleSort('name')} style={{cursor: 'pointer', userSelect: 'none'}}>
                {activeTab === 'service' ? 'Tên Dịch vụ' : 'Tên Nhân viên'} {renderSortIcon('name')}
              </th>
              
              {/* CỘT SỐ LƯỢNG */}
              <th 
                onClick={() => handleSort('usageCount')} 
                style={{
                    textAlign: 'center', 
                    cursor: 'pointer', userSelect: 'none',
                    backgroundColor: activeTab === 'service' ? '#f0fdf4' : '#f5f3ff'
                }}
              >
                {activeTab === 'service' ? 'Số lượt làm' : 'Ca hoàn thành'} {renderSortIcon('usageCount')}
              </th>
              
              {/* CỘT DOANH THU */}
              <th 
                onClick={() => handleSort('totalRevenue')} 
                style={{
                    textAlign: 'right', 
                    cursor: 'pointer', userSelect: 'none',
                    backgroundColor: activeTab === 'service' ? '#ecfdf5' : '#ede9fe'
                }}
              >
                {activeTab === 'service' ? 'Doanh thu' : 'Doanh số mang về'} {renderSortIcon('totalRevenue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'40px'}}>Đang tải dữ liệu...</td></tr>
            ) : dataList.length > 0 ? (
                dataList.map((item, index) => (
                    <tr key={item.id}>
                        <td>{index + 1 + (page - 1) * 10}</td>
                        
                        <td style={{fontWeight: '500', color: '#374151'}}>
                            {activeTab === 'staff' && index === 0 && page === 1 && <span style={{marginRight: '5px'}}>👑</span>}
                            {item.name}
                        </td>
                        
                        <td style={{
                            textAlign: 'center', fontWeight: 'bold',
                            color: activeTab === 'service' ? '#059669' : '#6d28d9',
                            backgroundColor: activeTab === 'service' ? '#f0fdf4' : '#f5f3ff'
                        }}>
                            {activeTab === 'service' ? item.usageCount : item.completedAppointments}
                        </td>
                        
                        <td style={{
                            textAlign: 'right', fontWeight: 'bold',
                            color: activeTab === 'service' ? '#047857' : '#5b21b6',
                            backgroundColor: activeTab === 'service' ? '#ecfdf5' : '#ede9fe'
                        }}>
                            {formatCurrency(
                                activeTab === 'service' ? (item.totalRevenue || 0) : (item.totalRevenueGenerated || 0)
                            )}
                        </td>
                    </tr>
                ))
            ) : (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'40px', color: '#999'}}>Không có dữ liệu trong tháng này.</td></tr>
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

export default AppointmentSales;
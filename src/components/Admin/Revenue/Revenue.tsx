import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import api from "../../../api/axiosInstance";
import "./Revenue.css";

// --- INTERFACES ---
interface ProductStats {
  id: number;
  name: string;
  price: number;
  totalSold: number;
}

interface LowStockDto {
  id: number;
  name: string;
  stock: number;
  price: number;
}

// [NEW] Interface cho Dịch vụ
interface ServiceStats {
  id: number;
  name: string;
  usageCount: number;    // Số lần sử dụng
  totalRevenue: number;  // Doanh thu từ dịch vụ này
}

// [NEW] Interface cho Nhân viên (để tính thưởng)
interface EmployeeStats {
  id: number;
  name: string;
  completedAppointments: number; // Số ca hoàn thành
  totalRevenueGenerated: number; // Doanh thu mang về
}

interface DailyRevenue {
  date: string;       
  orderRevenue: number; 
  serviceRevenue: number; 
  total: number;        
}

interface RevenueStats {
  totalRevenue: number;   
  totalOrderRevenue: number; 
  totalServiceRevenue: number; 
  totalOrders: number;
  successOrders: number;
  cancelledOrders: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  chartData: DailyRevenue[];
  topSellingProducts: ProductStats[];
  lowStockProducts: LowStockDto[];
  // [NEW] Thêm trường dữ liệu mới
  topServices: ServiceStats[];
  topEmployees: EmployeeStats[];
}

const Revenue: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    handleFilter();
  }, []); 

  const handleFilter = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0); 

    const startStr = formatDateISO(firstDay);
    const endStr = formatDateISO(lastDay);

    fetchRevenue(startStr, endStr);
  };

  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchRevenue = async (start: string, end: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/stats`, {
        params: { fromDate: start, toDate: end }
      });

      if (response.data && response.data.status === 200) {
        setStats(response.data.data);
      } else {
         setStats(null);
      }
    } catch (error) {
      console.error("Lỗi lấy báo cáo:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '13px' }}>
          <p className="label" style={{fontWeight: 'bold', marginBottom: '5px'}}>{`Ngày ${label}`}</p>
          <p style={{ color: payload[0].color }}>
            {`${payload[0].name}: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="revenue-container">
      {/* HEADER */}
      <div className="revenue-header">
        <button 
            onClick={() => navigate("/admin/dashboard")} 
            className="back-btn"
        >
            <span>⬅ Quay lại</span>
        </button>
        <h2 className="page-title">Báo cáo doanh thu tháng {selectedMonth}/{selectedYear}</h2>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Chọn tháng</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="filter-select"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleFilter}
          className="filter-btn"
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Thống kê"}
        </button>
      </div>

      {/* RESULT */}
      {loading ? (
          <div className="loading-text">Đang tính toán số liệu...</div>
      ) : stats ? (
        <>
          {/* 1. TỔNG QUAN TÀI CHÍNH */}
          <h3 className="section-title" style={{marginTop: '20px'}}>Tổng quan tài chính</h3>
          <div className="revenue-grid">
            <div className="stat-card revenue-card" style={{borderLeft: '5px solid #d97706'}}>
              <div className="card-label text-yellow-700">TỔNG DOANH THU</div>
              <div className="card-value" style={{color: '#d97706'}}>{formatCurrency(stats.totalRevenue)}</div>
              <div className="card-sub">Đơn hàng + Dịch vụ</div>
            </div>

            <div className="stat-card">
              <div className="card-label text-blue-600">Doanh thu Bán hàng</div>
              <div className="card-value">{formatCurrency(stats.totalOrderRevenue)}</div>
              <div className="card-sub">Từ {stats.successOrders} đơn thành công</div>
            </div>

            <div className="stat-card">
              <div className="card-label text-green-600">Doanh thu Dịch vụ</div>
              <div className="card-value">{formatCurrency(stats.totalServiceRevenue)}</div>
              <div className="card-sub">Từ {stats.completedAppointments} lịch hẹn xong</div>
            </div>
          </div>

          {/* 2. CHI TIẾT VẬN HÀNH */}
          <h3 className="section-title" style={{marginTop: '30px'}}>Chi tiết vận hành</h3>
          <div className="revenue-grid">
            <div 
                className="stat-card hover-card"
                onClick={() => navigate("/admin/orders")} 
                style={{cursor: 'pointer'}}
            >
              <div className="card-label">📦 Đơn hàng (Sản phẩm) <span style={{fontSize:'12px', color:'#2563eb'}}>(Xem chi tiết ➡)</span></div>
              <div className="detail-row"><span>Tổng đặt:</span> <strong>{stats.totalOrders}</strong></div>
              <div className="detail-row text-green-600"><span>Thành công:</span> <strong>{stats.successOrders}</strong></div>
              <div className="detail-row text-red-600"><span>Đã hủy:</span> <strong>{stats.cancelledOrders}</strong></div>
            </div>

            <div 
                className="stat-card hover-card"
                onClick={() => navigate("/admin/calendar")}
                style={{cursor: 'pointer'}}
            >
              <div className="card-label">✂️ Dịch vụ (Spa/Grooming) <span style={{fontSize:'12px', color:'#2563eb'}}>(Xem lịch ➡)</span></div>
              <div className="detail-row"><span>Tổng lịch hẹn:</span> <strong>{stats.totalAppointments}</strong></div>
              <div className="detail-row text-green-600"><span>Hoàn thành:</span> <strong>{stats.completedAppointments}</strong></div>
              <div className="detail-row text-red-600"><span>Đã hủy:</span> <strong>{stats.cancelledAppointments}</strong></div>
            </div>
          </div>

          {/* 3. KHỐI THỐNG KÊ SẢN PHẨM (GỘP CHUNG 1 CARD) */}
          <div className="stat-card" style={{
              marginTop: '30px', 
              padding: '0', 
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr', 
              gap: '0' 
          }}>
              {/* --- CỘT TRÁI: TOP 5 BÁN CHẠY --- */}
              <div style={{padding: '20px', borderRight: '1px solid #eee'}}>
                  <div style={{
                      borderBottom: '1px solid #eee', 
                      paddingBottom: '10px', 
                      marginBottom: '15px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                  }}>
                      <span style={{fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        🏆 Top 5 Sản phẩm <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666'}}>(Bán chạy)</span>
                      </span>
                      {/* LINK ĐẾN TRANG PRODUCT SALES */}
                      <span 
                          onClick={() => navigate("/admin/analytics/products")}
                          style={{fontSize: '13px', color: '#2563eb', cursor: 'pointer', fontWeight: '500'}}
                      >
                          Xem tất cả →
                      </span>
                  </div>

                  {stats.topSellingProducts && stats.topSellingProducts.length > 0 ? (
                      <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
                          <thead>
                              <tr style={{textAlign: 'left', color: '#666', borderBottom: '1px solid #f0f0f0'}}>
                                  <th style={{padding: '8px 5px'}}>Tên sản phẩm</th>
                                  <th style={{padding: '8px 5px', textAlign: 'right'}}>Đã bán</th>
                                  <th style={{padding: '8px 5px', textAlign: 'right'}}>Doanh thu</th>
                              </tr>
                          </thead>
                          <tbody>
                              {stats.topSellingProducts.map((p, idx) => (
                                  <tr key={p.id} style={{borderBottom: '1px solid #f9f9f9'}}>
                                      <td style={{padding: '10px 5px', fontWeight: '500'}}>
                                          <span style={{color: idx === 0 ? '#d97706' : '#6b7280', marginRight: '8px', fontWeight: 'bold'}}>#{idx + 1}</span>
                                          {p.name}
                                      </td>
                                      <td style={{padding: '10px 5px', textAlign: 'right', fontWeight: 'bold', color: '#10b981'}}>
                                          {p.totalSold}
                                      </td>
                                      <td style={{padding: '10px 5px', textAlign: 'right', color: '#4b5563'}}>
                                          {formatCurrency(p.price * p.totalSold)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : <div style={{textAlign: 'center', padding: '20px', color: '#999'}}>Chưa có dữ liệu.</div>}
              </div>

              {/* --- CỘT PHẢI: CẢNH BÁO TỒN KHO --- */}
              <div style={{padding: '20px'}}>
                  <div style={{
                      borderBottom: '1px solid #eee', 
                      paddingBottom: '10px', 
                      marginBottom: '15px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                  }}>
                      <span style={{fontWeight: '600', color: '#dc2626'}}>⚠️ Cảnh báo sắp hết hàng</span>
                      <span style={{fontSize: '12px', color: '#666'}}>(Tồn kho &le; 10)</span>
                  </div>

                  {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                      <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                          <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
                              <thead>
                                  <tr style={{textAlign: 'left', color: '#666', borderBottom: '1px solid #f0f0f0'}}>
                                      <th style={{padding: '8px 5px'}}>Tên sản phẩm</th>
                                      <th style={{padding: '8px 5px', textAlign: 'right'}}>Giá bán</th>
                                      <th style={{padding: '8px 5px', textAlign: 'right'}}>Tồn kho</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {stats.lowStockProducts.map((p) => (
                                      <tr key={p.id} style={{borderBottom: '1px solid #f9f9f9'}}>
                                          <td style={{padding: '10px 5px'}}>{p.name}</td>
                                          <td style={{padding: '10px 5px', textAlign: 'right', color: '#666'}}>{formatCurrency(p.price)}</td>
                                          <td style={{padding: '10px 5px', textAlign: 'right'}}>
                                              <span style={{
                                                  backgroundColor: p.stock === 0 ? '#fee2e2' : '#ffedd5',
                                                  color: p.stock === 0 ? '#991b1b' : '#c2410c',
                                                  padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px'
                                              }}>
                                                  {p.stock}
                                              </span>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  ) : <div style={{textAlign: 'center', padding: '20px', color: '#10b981'}}>Kho hàng ổn định.</div>}
              </div>
          </div>

          {/* 4. [NEW] KHỐI THỐNG KÊ DỊCH VỤ & NHÂN VIÊN */}
          <div className="stat-card" style={{
              marginTop: '30px', 
              padding: '0', 
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr', 
              gap: '0' 
          }}>
              {/* --- CỘT TRÁI: TOP DỊCH VỤ --- */}
              <div style={{padding: '20px', borderRight: '1px solid #eee', backgroundColor: '#f0fdf4'}}>
                  <div style={{
                      borderBottom: '1px solid #d1fae5', 
                      paddingBottom: '10px', 
                      marginBottom: '15px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                  }}>
                      <span style={{fontWeight: '600', color: '#047857', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        💇 Top Dịch vụ Spa <span style={{fontSize: '12px', fontWeight: 'normal', color: '#065f46'}}>(Theo doanh thu)</span>
                      </span>
                      {/* LINK ĐẾN TRANG APPOINTMENT SALES */}
                      <span 
                          onClick={() => navigate("/admin/analytics/appointments")}
                          style={{fontSize: '13px', color: '#059669', cursor: 'pointer', fontWeight: '500'}}
                      >
                          Xem tất cả →
                      </span>
                  </div>

                  {stats.topServices && stats.topServices.length > 0 ? (
                      <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
                          <thead>
                              <tr style={{textAlign: 'left', color: '#065f46', borderBottom: '1px solid #d1fae5'}}>
                                  <th style={{padding: '8px 5px'}}>Tên dịch vụ</th>
                                  <th style={{padding: '8px 5px', textAlign: 'right'}}>Số lượt</th>
                                  <th style={{padding: '8px 5px', textAlign: 'right'}}>Doanh thu</th>
                              </tr>
                          </thead>
                          <tbody>
                              {stats.topServices.map((s, idx) => (
                                  <tr key={s.id} style={{borderBottom: '1px solid #e7f5ef'}}>
                                      <td style={{padding: '10px 5px', fontWeight: '500'}}>
                                          <span style={{color: '#059669', marginRight: '8px', fontWeight: 'bold'}}>#{idx + 1}</span>
                                          {s.name}
                                      </td>
                                      <td style={{padding: '10px 5px', textAlign: 'right', fontWeight: '500'}}>
                                          {s.usageCount}
                                      </td>
                                      <td style={{padding: '10px 5px', textAlign: 'right', fontWeight: 'bold', color: '#047857'}}>
                                          {formatCurrency(s.totalRevenue)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : <div style={{textAlign: 'center', padding: '20px', color: '#999'}}>Chưa có dữ liệu dịch vụ.</div>}
              </div>

              {/* --- CỘT PHẢI: HIỆU SUẤT NHÂN VIÊN --- */}
              <div style={{padding: '20px', backgroundColor: '#f5f3ff'}}>
                  <div style={{
                      borderBottom: '1px solid #ede9fe', 
                      paddingBottom: '10px', 
                      marginBottom: '15px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                  }}>
                      <span style={{fontWeight: '600', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        🥇 Top Nhân viên <span style={{fontSize: '12px', fontWeight: 'normal', color: '#5b21b6'}}>(Xét thưởng)</span>
                      </span>
                  </div>

                  {stats.topEmployees && stats.topEmployees.length > 0 ? (
                      <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
                          <thead>
                              <tr style={{textAlign: 'left', color: '#5b21b6', borderBottom: '1px solid #ede9fe'}}>
                                  <th style={{padding: '8px 5px'}}>Nhân viên</th>
                                  <th style={{padding: '8px 5px', textAlign: 'right'}}>Ca xong</th>
                                  <th style={{padding: '8px 5px', textAlign: 'right'}}>Doanh số</th>
                              </tr>
                          </thead>
                          <tbody>
                              {stats.topEmployees.map((e, idx) => (
                                  <tr key={e.id} style={{borderBottom: '1px solid #ede9fe'}}>
                                      <td style={{padding: '10px 5px', fontWeight: '500'}}>
                                          {idx === 0 && <span style={{marginRight:'5px'}}>👑</span>}
                                          {e.name}
                                      </td>
                                      <td style={{padding: '10px 5px', textAlign: 'right'}}>
                                          {e.completedAppointments}
                                      </td>
                                      <td style={{padding: '10px 5px', textAlign: 'right', fontWeight: 'bold', color: '#7c3aed'}}>
                                          {formatCurrency(e.totalRevenueGenerated)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : <div style={{textAlign: 'center', padding: '20px', color: '#999'}}>Chưa có dữ liệu nhân viên.</div>}
              </div>
          </div>

          {/* 5. BIỂU ĐỒ */}
          <div className="chart-container" style={{marginTop: '30px'}}>
            <h3 style={{marginBottom: '15px', color: '#1e40af'}}>📊 Biểu đồ doanh thu Bán hàng (Đơn hàng)</h3>
            {stats.chartData && stats.chartData.length > 0 ? (
                <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer>
                    <BarChart data={stats.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            label={{ value: 'Ngày', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar name="Bán hàng" dataKey="orderRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : <div className="no-data">Không có dữ liệu bán hàng.</div>}
          </div>

          <div className="chart-container" style={{marginTop: '30px'}}>
            <h3 style={{marginBottom: '15px', color: '#047857'}}>💇 Biểu đồ doanh thu Dịch vụ (Spa)</h3>
            {stats.chartData && stats.chartData.length > 0 ? (
                <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer>
                    <BarChart data={stats.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            label={{ value: 'Ngày', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar name="Dịch vụ" dataKey="serviceRevenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : <div className="no-data">Không có dữ liệu dịch vụ.</div>}
          </div>

        </>
      ) : (
        <div className="no-data">Không có dữ liệu. Vui lòng bấm "Thống kê".</div>
      )}
    </div>
  );
};

export default Revenue;
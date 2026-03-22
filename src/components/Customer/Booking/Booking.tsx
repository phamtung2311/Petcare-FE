import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import "./Booking.css";

// --- INTERFACES ---
interface Appointment {
  id: number;
  petName: string;
  serviceName: string;
  servicePrice: number;
  staffName?: string;
  scheduledAt: string; // "yyyy-MM-dd HH:mm:ss"
  status: 'BOOKED' | 'DONE' | 'CANCELLED' | 'CHECKED_IN';
  note?: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  durationMin: number;
}

interface Pet {
  id: number;
  name: string;
}

// Form đặt lịch
interface BookingForm {
  petId: number | "";
  serviceId: number | "";
  scheduledAt: string;
  note: string;
}

const Booking: React.FC = () => {
  // Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'BOOKED' | 'HISTORY'>('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<BookingForm>({
    petId: "",
    serviceId: "",
    scheduledAt: "",
    note: ""
  });

  const userId = localStorage.getItem("userId");

  // --- 1. LOAD DỮ LIỆU BAN ĐẦU ---
  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchMyPets();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments/my");
      // Dữ liệu từ API AppointmentResponse
      if (res.data && Array.isArray(res.data.data)) {
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải lịch hẹn:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      // Lấy danh sách dịch vụ active, size lớn để lấy hết
      const res = await api.get("/services/list", {
        params: { active: true, size: 100 }
      });
      if (res.data && res.data.data && res.data.data.services) {
        setServices(res.data.data.services);
      }
    } catch (error) {
      console.error("Lỗi tải dịch vụ:", error);
    }
  };

  const fetchMyPets = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/pets/my-pets`);
      if (res.data && Array.isArray(res.data.data)) {
        setMyPets(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải thú cưng:", error);
    }
  };

  // --- 2. XỬ LÝ ĐẶT LỊCH ---
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.petId || !formData.serviceId || !formData.scheduledAt) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      // Format ngày giờ từ "yyyy-MM-ddTHH:mm" sang "yyyy-MM-dd HH:mm:ss" theo yêu cầu Backend
      const formattedDate = formData.scheduledAt.replace('T', ' ') + ':00';

      const payload = {
        petId: Number(formData.petId),
        serviceId: Number(formData.serviceId),
        scheduledAt: formattedDate,
        note: formData.note
      };

      await api.post("/appointments/book", payload);
      
      alert("🎉 Đặt lịch thành công! Vui lòng đến đúng giờ.");
      setShowModal(false);
      setFormData({ petId: "", serviceId: "", scheduledAt: "", note: "" }); // Reset form
      fetchAppointments(); // Reload list
    } catch (error: any) {
      console.error("Lỗi đặt lịch:", error);
      const msg = error.response?.data?.message || "Đặt lịch thất bại. Vui lòng thử lại.";
      alert(msg);
    }
  };

  // --- 3. XỬ LÝ HỦY LỊCH ---
  const handleCancel = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    try {
      await api.patch(`/appointments/cancel/${id}`);
      alert("Đã hủy lịch thành công.");
      fetchAppointments();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || "Không thể hủy lịch"));
    }
  };

  // --- 4. LỌC DANH SÁCH ---
  const getFilteredList = () => {
    const now = new Date();
    return appointments.filter(appt => {
      // Backend trả về chuỗi "yyyy-MM-dd HH:mm:ss", cần replace space bằng T để parse
      const apptDate = new Date(appt.scheduledAt.replace(' ', 'T'));
      
      if (filter === 'BOOKED') {
        return appt.status === 'BOOKED' && apptDate >= now;
      }
      if (filter === 'HISTORY') {
        return appt.status !== 'BOOKED' || apptDate < now;
      }
      return true;
    });
  };

  const filteredAppointments = getFilteredList();

  // --- Helpers ---
  const formatDateTime = (isoStr: string) => {
    if(!isoStr) return "";
    // Xử lý chuỗi ngày giờ từ BE
    const date = new Date(isoStr.replace(' ', 'T'));
    return date.toLocaleString('vi-VN', {
      weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'BOOKED': return <span className="status-badge status-booked">Sắp tới</span>;
      case 'DONE': return <span className="status-badge status-done">Hoàn thành</span>;
      case 'CHECKED_IN': return <span className="status-badge status-done">Đang thực hiện</span>;
      case 'CANCELLED': return <span className="status-badge status-cancelled">Đã hủy</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h2>📅 Lịch Hẹn Spa & Khám</h2>
        <button className="btn-new-booking" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Đặt Lịch Mới
        </button>
      </div>

      <div className="booking-tabs">
        <button className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>Tất cả</button>
        <button className={`tab-btn ${filter === 'BOOKED' ? 'active' : ''}`} onClick={() => setFilter('BOOKED')}>Sắp tới</button>
        <button className={`tab-btn ${filter === 'HISTORY' ? 'active' : ''}`} onClick={() => setFilter('HISTORY')}>Lịch sử</button>
      </div>

      {loading ? (
        <p style={{textAlign:'center'}}>Đang tải dữ liệu...</p>
      ) : filteredAppointments.length === 0 ? (
        <div className="empty-booking">
          <img src="https://cdn-icons-png.flaticon.com/512/7486/7486831.png" alt="Empty" width="80" style={{marginBottom:15, opacity:0.6}}/>
          <p>Bạn chưa có lịch hẹn nào ở mục này.</p>
        </div>
      ) : (
        <div className="booking-list">
          {filteredAppointments.map(appt => (
            <div key={appt.id} className="booking-card">
              <div className="booking-info">
                <div className="booking-service">{appt.serviceName}</div>
                <div className="booking-meta">
                  <span><i className="fas fa-paw"></i> Bé: <strong>{appt.petName}</strong></span>
                  <span><i className="far fa-clock"></i> {formatDateTime(appt.scheduledAt)}</span>
                </div>
                <div className="booking-price">
                    Giá dịch vụ: {appt.servicePrice.toLocaleString()}đ
                </div>
                {appt.staffName && appt.staffName !== "Unassigned" && (
                  <div className="booking-meta">
                    <span><i className="fas fa-user-md"></i> Bác sĩ/NV: {appt.staffName}</span>
                  </div>
                )}
                {appt.note && <div className="booking-note">📝 "{appt.note}"</div>}
              </div>

              <div className="booking-status-col">
                {getStatusLabel(appt.status)}
                {appt.status === 'BOOKED' && (
                  <button className="btn-cancel-booking" onClick={() => handleCancel(appt.id)}>
                    Hủy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL ĐẶT LỊCH --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content booking-modal">
            <h3>Đặt Lịch Hẹn Mới</h3>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Chọn Thú Cưng *</label>
                <select 
                    required 
                    value={formData.petId}
                    onChange={(e) => setFormData({...formData, petId: Number(e.target.value)})}
                >
                    <option value="">-- Chọn bé --</option>
                    {myPets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {myPets.length === 0 && <small style={{color:'red'}}>Bạn cần thêm thú cưng trước khi đặt lịch!</small>}
              </div>

              <div className="form-group">
                <label>Chọn Dịch Vụ *</label>
                <select 
                    required
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: Number(e.target.value)})}
                >
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.price.toLocaleString()}đ - {s.durationMin} phút)
                        </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Thời Gian Hẹn *</label>
                <input 
                    type="datetime-local" 
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)} // Không cho chọn quá khứ
                />
              </div>

              <div className="form-group">
                <label>Ghi Chú</label>
                <textarea 
                    rows={3}
                    placeholder="VD: Bé hơi nhát, cần cắt móng..." 
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit" disabled={myPets.length === 0}>Xác Nhận Đặt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
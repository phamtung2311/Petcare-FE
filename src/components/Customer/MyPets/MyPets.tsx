import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import "./MyPets.css";

// --- TỪ ĐIỂN DỮ LIỆU THÚ CƯNG ---
const PET_SPECIES = ["Chó", "Mèo", "Chim", "Hamster", "Khác"];

const PET_BREEDS: Record<string, string[]> = {
  "Chó": ["Poodle", "Pug", "Husky", "Corgi", "Golden Retriever", "Shiba", "Phốc sóc (Pomeranian)", "Chó ta", "Khác"],
  "Mèo": ["Anh lông ngắn (ALN)", "Anh lông dài (ALD)", "Mèo Ba Tư", "Mèo Xiêm", "Mèo ta", "Khác"],
  "Chim": ["Vẹt", "Chào mào", "Họa mi", "Khác"],
  "Hamster": ["Bear", "Winter White", "Robo", "Khác"],
  "Khác": ["Chưa xác định"]
};

// 1. Interface cho dữ liệu hiển thị
interface Pet {
  id: number;
  owner: string; 
  name: string;
  species: string; 
  breed: string;   
  color: string;
  sex: "male" | "female"; 
  birthDate: string; 
}

// Interface cho lịch sử dịch vụ
interface Appointment {
  id: number;
  petId: number;
  petName: string;
  serviceName: string;
  scheduledAt: string;
  status: string;
  totalAmount: number;
}

// 2. Interface cho dữ liệu gửi đi (Đã thêm biến custom để nhập tay)
interface PetFormData {
  id?: number;
  name: string;
  species: string;
  customSpecies?: string;
  breed: string;
  customBreed?: string;
  color: string;
  sex: string;
  birthDate: string;
}

const MyPets: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Thêm/Sửa
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State Modal Lịch sử
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<Appointment[]>([]);
  const [selectedPetName, setSelectedPetName] = useState("");

  const currentUserId = Number(localStorage.getItem("userId")); 

  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    species: "",
    customSpecies: "",
    breed: "",
    customBreed: "",
    color: "",
    sex: "male", 
    birthDate: "",
  });

  const navigate = useNavigate();

  // --- Helpers ---
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "Chưa rõ";
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 1 ? "Dưới 1 tuổi" : `${age} tuổi`;
  };

  const getPetImage = (species: string) => {
    if (!species) return "https://cdn-icons-png.flaticon.com/512/3048/3048122.png";
    const s = species.toLowerCase();
    if (s.includes("chó") || s.includes("dog")) 
      return "https://cdn-icons-png.flaticon.com/512/616/616408.png"; 
    if (s.includes("mèo") || s.includes("cat")) 
      return "https://cdn-icons-png.flaticon.com/512/616/616430.png"; 
    return "https://cdn-icons-png.flaticon.com/512/3048/3048122.png"; 
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return '#2ecc71'; // Green
      case 'BOOKED': return '#3498db'; // Blue
      case 'CANCELLED': return '#e74c3c'; // Red
      default: return '#95a5a6'; // Grey
    }
  };

  // --- API CALLS ---
  const fetchMyPets = async () => {
    try {
      const res = await api.get(`/pets/my-pets`);
      if (res.data && Array.isArray(res.data.data)) {
         setPets(res.data.data);
      } else {
         setPets([]);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thú cưng", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (pet: Pet) => {
    setSelectedPetName(pet.name);
    try {
      const res = await api.get("/appointments/my");
      const allAppointments: Appointment[] = res.data.data;
      const petHistory = allAppointments.filter(appt => appt.petId === pet.id);
      
      setHistoryList(petHistory);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      alert("Không thể tải lịch sử dịch vụ. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập!");
      navigate("/");
    } else {
      fetchMyPets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, navigate]);

  // --- HANDLERS FORM ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      species: "",
      customSpecies: "",
      breed: "",
      customBreed: "",
      color: "",
      sex: "male",
      birthDate: "",
    });
    setShowModal(true);
  };

  const openEditModal = (pet: Pet) => {
    setIsEditing(true);
    
    // Logic kiểm tra xem loài/giống của pet có nằm trong danh sách mặc định không
    const isSpeciesDefault = PET_SPECIES.includes(pet.species);
    const petSpecies = isSpeciesDefault ? pet.species : "Khác";
    const customSpecies = isSpeciesDefault ? "" : pet.species;

    const breedList = PET_BREEDS[petSpecies] || [];
    const isBreedDefault = breedList.includes(pet.breed);
    const petBreed = isBreedDefault ? pet.breed : "Khác";
    const customBreed = isBreedDefault ? "" : pet.breed;

    setFormData({
      id: pet.id,
      name: pet.name,
      species: petSpecies,
      customSpecies: customSpecies,
      breed: petBreed,
      customBreed: customBreed,
      color: pet.color,
      sex: pet.sex.toLowerCase(),
      birthDate: pet.birthDate,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Logic gộp dữ liệu: Chọn "Khác" thì lấy dữ liệu tự gõ
      const finalSpecies = formData.species === "Khác" ? formData.customSpecies : formData.species;
      const finalBreed = formData.breed === "Khác" ? formData.customBreed : formData.breed;

      if (!finalSpecies || !finalBreed) {
          alert("Vui lòng nhập đầy đủ Loài và Giống thú cưng!");
          return;
      }

      const payload = { 
          id: formData.id,
          name: formData.name,
          species: finalSpecies,
          breed: finalBreed,
          color: formData.color,
          sex: formData.sex,
          birthDate: formData.birthDate
      };

      if (isEditing) {
        await api.put("/pets/upd", payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post("/pets/add", payload);
        alert("Thêm thú cưng thành công!");
      }
      setShowModal(false);
      fetchMyPets();
    } catch (error: any) {
      console.error("Lỗi lưu thú cưng:", error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra";
      alert(`Thất bại: ${msg}`);
    }
  };

  const handleDelete = async (petId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thú cưng này?")) {
      try {
        await api.delete(`/pets/del/${petId}`);
        alert("Đã xóa thành công!");
        fetchMyPets();
      } catch (error) {
        console.error("Lỗi xóa thú cưng:", error);
        alert("Xóa thất bại");
      }
    }
  };

  if (loading) return <div className="loading-text" style={{textAlign:"center", padding:"50px"}}>Đang tải dữ liệu...</div>;

  return (
    <div className="my-pets-page-wrapper">
      <div className="my-pets-container">
        <div className="pets-header-flex">
          <h2 className="tab-title">🐾 Thú Cưng Của Tôi</h2>
          <button className="btn-modern primary" onClick={openAddModal}>+ Thêm Thú Cưng</button>
        </div>
        
        {pets.length === 0 ? (
          <div className="empty-state-glass">
             <p>Bạn chưa đăng ký thú cưng nào. Hãy thêm ngay để theo dõi sức khỏe nhé!</p>
          </div>
        ) : (
          <div className="pet-list-grid">
            {pets.map((pet) => (
              <div key={pet.id} className="pet-card glass-card">
                <div className="pet-avatar-wrapper">
                  <img src={getPetImage(pet.species)} alt={pet.name} />
                </div>
                <div className="pet-info">
                  <h3>{pet.name}</h3>
                  <div className="pet-details">
                      <p><strong>Loài:</strong> {pet.species} - {pet.breed}</p>
                      <p><strong>Giới tính:</strong> {pet.sex === "male" ? "Đực ♂" : "Cái ♀"}</p>
                      <p><strong>Màu sắc:</strong> {pet.color}</p>
                      <p><strong>Tuổi:</strong> {calculateAge(pet.birthDate)}</p>
                  </div>
                  
                  <div className="pet-actions">
                    <button className="btn-modern secondary small" onClick={() => handleViewHistory(pet)}>
                      📜 Lịch sử
                    </button>
                    <button className="btn-modern secondary small" onClick={() => openEditModal(pet)}>Sửa</button>
                    <button className="btn-modern delete small" onClick={() => handleDelete(pet.id)}>Xóa</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODAL THÊM / SỬA --- */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-modal">
              <h3>{isEditing ? "Cập Nhật Hồ Sơ" : "Thêm Thú Cưng Mới"}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Tên thú cưng *</label>
                  <input className="neo-input" type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Ví dụ: Milu" />
                </div>
                
                {/* 🟢 KHU VỰC CHỌN LOÀI VÀ GIỐNG ĐÃ NÂNG CẤP */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Loài (Species) *</label>
                    <select 
                        className="neo-input" 
                        name="species" 
                        value={formData.species} 
                        onChange={(e) => setFormData({ ...formData, species: e.target.value, breed: "", customSpecies: "" })} 
                        required
                    >
                        <option value="" disabled>-- Chọn loài --</option>
                        {PET_SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    
                    {formData.species === "Khác" && (
                        <input 
                            className="neo-input" 
                            type="text" 
                            style={{ marginTop: '10px' }}
                            placeholder="Nhập tên loài..." 
                            value={formData.customSpecies || ""} 
                            onChange={(e) => setFormData({ ...formData, customSpecies: e.target.value })} 
                            required 
                        />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Giống (Breed) *</label>
                    <select 
                        className="neo-input" 
                        name="breed" 
                        value={formData.breed} 
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value, customBreed: "" })} 
                        required
                        disabled={!formData.species}
                    >
                        <option value="" disabled>-- Chọn giống --</option>
                        {formData.species && PET_BREEDS[formData.species]?.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>

                    {formData.breed === "Khác" && (
                        <input 
                            className="neo-input" 
                            type="text" 
                            style={{ marginTop: '10px' }}
                            placeholder="Nhập tên giống..." 
                            value={formData.customBreed || ""} 
                            onChange={(e) => setFormData({ ...formData, customBreed: e.target.value })} 
                            required 
                        />
                    )}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Giới tính</label>
                    <select className="neo-input" name="sex" value={formData.sex} onChange={handleInputChange}>
                      <option value="male">Đực</option>
                      <option value="female">Cái</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Màu lông</label>
                    <input className="neo-input" type="text" name="color" value={formData.color} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ngày sinh *</label>
                  <input className="neo-input" type="date" name="birthDate" max={new Date().toISOString().split("T")[0]} value={formData.birthDate} onChange={handleInputChange} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-modern secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn-modern primary">{isEditing ? "Lưu Thay Đổi" : "Thêm Mới"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL LỊCH SỬ DỊCH VỤ --- */}
        {showHistoryModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-modal history-modal-wide">
              <button className="close-btn-abs" onClick={() => setShowHistoryModal(false)}>✕</button>
              <h3 className="history-title">Lịch sử dịch vụ: <span className="highlight-text">{selectedPetName}</span></h3>
              
              <div className="history-list-scroll">
                {historyList.length === 0 ? (
                  <div className="empty-state-simple">
                    <p>Chưa có dịch vụ nào được thực hiện.</p>
                  </div>
                ) : (
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Ngày thực hiện</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map(appt => (
                        <tr key={appt.id}>
                          <td>{appt.serviceName || "Dịch vụ spa/khám"}</td>
                          <td>{formatDateTime(appt.scheduledAt)}</td>
                          <td>
                            <span 
                              className="status-pill"
                              style={{
                                backgroundColor: getStatusColor(appt.status),
                              }}
                            >
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPets;
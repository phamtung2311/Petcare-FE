import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import "./UserProfile.css";

// --- INTERFACES ---
interface UserDetail {
  id: number;
  fistName: string;
  lastName: string;
  userName: string;
  email: string;
  phone: string;
}

interface UpdateInfoForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ChangePasswordForm {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

interface OrderDetailItem {
  id: number; // ID của OrderDetail
  productId: number; // 🟢 Cần thêm field này từ API để biết đánh giá sản phẩm nào
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  hasReviewed?: boolean; // (Optional) Nếu backend trả về để ẩn nút đánh giá
}

interface Order {
  id: number;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  address: string;
  items: OrderDetailItem[];
}

// 🟢 Interface cho Form Đánh giá
interface ReviewForm {
    productId: number;
    productName: string; // Để hiển thị tên trên modal
    rating: number;
    comment: string;
}

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Đơn hàng
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // State Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  
  // 🟢 State Modal Đánh giá
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
      productId: 0,
      productName: "",
      rating: 5,
      comment: ""
  });

  // State Form Data User
  const [editForm, setEditForm] = useState<UpdateInfoForm>({
    firstName: "", lastName: "", email: "", phone: ""
  });

  const [passForm, setPassForm] = useState<ChangePasswordForm>({
    oldPassword: "", password: "", confirmPassword: ""
  });

  // --- 1. LẤY THÔNG TIN USER ---
  const fetchUser = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("Bạn chưa đăng nhập.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/user/${userId}`);
      if (res.data && res.data.data) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // --- 2. LẤY DANH SÁCH ĐƠN HÀNG ---
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy đơn hàng:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  // --- 3. XỬ LÝ HỦY ĐƠN ---
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      alert("Đã hủy đơn hàng thành công!");
      fetchMyOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể hủy đơn hàng.");
    }
  };

  // --- 🟢 4. XỬ LÝ ĐÁNH GIÁ SẢN PHẨM ---
  const handleOpenReview = (item: OrderDetailItem) => {
      setReviewForm({
          productId: item.productId || item.id, // Fallback nếu API chưa có productId riêng
          productName: item.productName,
          rating: 5,
          comment: ""
      });
      setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
      if (!reviewForm.comment.trim()) {
          alert("Vui lòng nhập nội dung đánh giá!");
          return;
      }
      
      try {
          const payload = {
              productId: reviewForm.productId,
              rating: reviewForm.rating,
              comment: reviewForm.comment
          };
          
          await api.post("/reviews/comment", payload);
          alert("Cảm ơn bạn đã đánh giá sản phẩm!");
          setShowReviewModal(false);
          // Có thể reload lại orders nếu muốn cập nhật trạng thái "Đã đánh giá"
      } catch (error: any) {
          const msg = error.response?.data?.message || "Gửi đánh giá thất bại.";
          alert(msg);
      }
  };

  // --- CÁC HÀM UPDATE INFO / PASSWORD (GIỮ NGUYÊN) ---
  const handleOpenEdit = () => {
    if (user) {
      setEditForm({ firstName: user.fistName, lastName: user.lastName, email: user.email, phone: user.phone });
      setShowEditModal(true);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.put("/user/upd", { ...user, ...editForm });
      alert("Cập nhật thành công!");
      setShowEditModal(false);
      fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi cập nhật.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.password !== passForm.confirmPassword) {
      alert("Mật khẩu không khớp!"); return;
    }
    try {
      await api.patch("/user/change-pwd", passForm);
      alert("Đổi mật khẩu thành công!");
      setShowPassModal(false);
      setPassForm({ oldPassword: "", password: "", confirmPassword: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi đổi mật khẩu.");
    }
  };

  // --- HELPER ---
  const formatCurrency = (amount: number) => amount.toLocaleString() + 'đ';
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let label = s;
    let className = "badge-default";
    switch(s) {
      case 'PENDING': label = 'Chờ xác nhận'; className = 'badge-warning'; break;
      case 'PAID': label = 'Đã thanh toán'; className = 'badge-success'; break;
      case 'SHIPPING': label = 'Đang giao'; className = 'badge-info'; break;
      case 'DELIVERED': label = 'Đã giao'; className = 'badge-success'; break;
      case 'CANCELLED': label = 'Đã hủy'; className = 'badge-danger'; break;
      case 'COMPLETED': label = 'Hoàn thành'; className = 'badge-success'; break;
    }
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  const filterTabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ xác nhận' },
    { key: 'SHIPPING', label: 'Đang giao' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  if (loading && !user) return <div className="profile-loading">Đang tải...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return null;

  return (
    <div className="profile-container">
      {/* SIDEBAR (Giữ nguyên) */}
      <div className="profile-sidebar">
        <div className="user-brief">
            <div className="avatar-circle">{user.lastName.charAt(0).toUpperCase()}</div>
            <div className="brief-info">
                <h3>{user.fistName} {user.lastName}</h3>
                <p>@{user.userName}</p>
            </div>
        </div>
        <div className="profile-menu">
            <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
                <i className="far fa-user"></i> Thông tin cá nhân
            </button>
            <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                <i className="fas fa-shopping-bag"></i> Lịch sử đơn hàng
            </button>
        </div>
      </div>

      <div className="profile-content">
        {/* TAB 1: INFO (Giữ nguyên) */}
        {activeTab === 'info' && (
            <div className="info-tab">
                <h2 className="tab-title">Hồ Sơ Của Tôi</h2>
                <div className="info-card">
                    <div className="info-row"><label>Họ tên:</label><span>{user.fistName} {user.lastName}</span></div>
                    <div className="info-row"><label>Email:</label><span>{user.email}</span></div>
                    <div className="info-row"><label>SĐT:</label><span>{user.phone || "Chưa cập nhật"}</span></div>
                </div>
                <div className="action-buttons">
                    <button className="btn-primary" onClick={handleOpenEdit}>Cập nhật</button>
                    <button className="btn-secondary" onClick={() => setShowPassModal(true)}>Đổi mật khẩu</button>
                </div>
            </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
            <div className="orders-tab">
                <h2 className="tab-title">Đơn Hàng Của Tôi</h2>
                <div className="order-filters">
                    {filterTabs.map(tab => (
                        <button key={tab.key} 
                            className={`filter-btn ${filterStatus === tab.key ? 'active' : ''}`}
                            onClick={() => setFilterStatus(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loadingOrders ? <p>Đang tải...</p> : filteredOrders.length === 0 ? (
                    <div className="empty-orders"><p>Không có đơn hàng nào.</p></div>
                ) : (
                    <div className="order-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <div className="order-id">#{order.id}</div>
                                    <div className="order-date">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                                    <div className="order-status">{getStatusBadge(order.status)}</div>
                                </div>
                                
                                <div className="order-body">
                                    {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="order-item-row">
                                            <div className="item-info">
                                                <span className="item-name">{item.productName}</span>
                                                <span className="item-meta">x{item.quantity} | {formatCurrency(item.unitPrice)}</span>
                                            </div>
                                            
                                            {/* 🟢 NÚT ĐÁNH GIÁ: Chỉ hiện khi Đơn hàng HOÀN THÀNH */}
                                            {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                                                <button 
                                                    className="btn-review-item"
                                                    onClick={() => handleOpenReview(item)}
                                                >
                                                    Đánh giá
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        Tổng tiền: <strong>{formatCurrency(order.totalAmount)}</strong>
                                    </div>
                                    {order.status === 'PENDING' && (
                                        <button className="btn-cancel-order" onClick={() => handleCancelOrder(order.id)}>Hủy Đơn</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* MODAL EDIT INFO & PASSWORD (Giữ nguyên, tôi ẩn bớt để gọn code) */}
      {showEditModal && (
         <div className="modal-overlay">
             <div className="modal-content">
                 <h3>Cập nhật thông tin</h3>
                 <form onSubmit={handleUpdateInfo}>
                     <div className="form-group"><label>Họ</label><input required value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} /></div>
                     <div className="form-group"><label>Tên</label><input required value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} /></div>
                     <div className="form-group"><label>Email</label><input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
                     <div className="form-group"><label>SĐT</label><input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
                     <div className="modal-actions">
                         <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Hủy</button>
                         <button type="submit" className="btn-save">Lưu</button>
                     </div>
                 </form>
             </div>
         </div>
      )}
      {showPassModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <h3>Đổi mật khẩu</h3>
                  <form onSubmit={handleChangePassword}>
                      <div className="form-group"><label>Mật khẩu cũ</label><input type="password" required value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} /></div>
                      <div className="form-group"><label>Mật khẩu mới</label><input type="password" required value={passForm.password} onChange={e => setPassForm({...passForm, password: e.target.value})} /></div>
                      <div className="form-group"><label>Xác nhận</label><input type="password" required value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} /></div>
                      <div className="modal-actions">
                          <button type="button" className="btn-cancel" onClick={() => setShowPassModal(false)}>Hủy</button>
                          <button type="submit" className="btn-save">Lưu</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 🟢 MODAL ĐÁNH GIÁ SẢN PHẨM */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <h3>Đánh giá sản phẩm</h3>
            <p className="review-product-name">{reviewForm.productName}</p>
            
            <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map(star => (
                    <span 
                        key={star} 
                        className={`star ${star <= reviewForm.rating ? "filled" : ""}`}
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                    >
                        ★
                    </span>
                ))}
            </div>

            <textarea 
                className="review-textarea"
                placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                value={reviewForm.comment}
                onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>Đóng</button>
              <button className="btn-save" onClick={handleSubmitReview}>Gửi Đánh Giá</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;
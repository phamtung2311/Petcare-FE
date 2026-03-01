import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Checkout.css";

// --- 1. INTERFACE DỮ LIỆU ---
interface CheckoutItem {
  id?: number;
  productId: number;
  quantity: number | string; // Cho phép chuỗi rỗng để khách xóa số
  productName?: string;
  name?: string;
  price?: number;
  unitPrice?: number;
  image?: string;
  productImage?: string;
  images?: { id: number; imageUrl: string }[]; 
  stock?: number; // Hứng dữ liệu tồn kho từ trang Giỏ hàng truyền sang
}

interface Address {
  id: number;
  recipientName: string;
  recipientPhone: string;
  city: string;
  ward: string;
  addressDetail: string;
  isDefault?: boolean;
}

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderValue: number;
  usageLimit?: number;
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state as { buyNowItems?: CheckoutItem[], items?: CheckoutItem[] } | null;
  const buyNowItems = stateData?.buyNowItems || stateData?.items;

  const isBuyNowMode = buyNowItems && buyNowItems.length > 0;

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [merchandiseSubtotal, setMerchandiseSubtotal] = useState(0);
  const [shippingFee] = useState(30000); // Phí ship mặc định
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [note, setNote] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: "", recipientPhone: "", city: "", ward: "", addressDetail: ""
  });

  // Biến useRef chống spam gọi API khi gõ số lượng (Dùng number thay vì NodeJS.Timeout)
  const typingTimeoutRef = useRef<number | null>(null);

  // --- 2. LOGIC LOAD DỮ LIỆU ---
  useEffect(() => {
    if (isBuyNowMode && buyNowItems) {
      setItems(buyNowItems);
    } else {
      fetchMyCart();
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuyNowMode]);

  useEffect(() => {
    // Tính tổng tiền hàng
    const subtotal = items.reduce((sum, item) => {
      const price = item.price || item.unitPrice || 0;
      const qty = Number(item.quantity) || 1; // Đảm bảo luôn nhân với số hợp lệ
      return sum + price * qty;
    }, 0);
    setMerchandiseSubtotal(subtotal);

    // Tính toán mã giảm giá
    let discount = 0;
    if (appliedCoupon) {
      if (subtotal < appliedCoupon.minOrderValue) {
        setAppliedCoupon(null);
        setCouponCode("");
        alert(`Mã giảm giá đã hủy vì đơn hàng dưới ${appliedCoupon.minOrderValue.toLocaleString()}đ`);
      } else if (appliedCoupon.usageLimit !== undefined && appliedCoupon.usageLimit <= 0) {
        setAppliedCoupon(null);
        setCouponCode("");
        alert("Mã giảm giá này đã hết lượt sử dụng.");
      } else {
        const type = appliedCoupon.type.toLowerCase();
        if (type.includes('percent')) {
          discount = (subtotal * appliedCoupon.value) / 100;
        } else {
          discount = appliedCoupon.value;
        }
      }
    }

    if (discount > subtotal) discount = subtotal;
    setDiscountAmount(discount);
    setTotalPayment(subtotal + shippingFee - discount);
  }, [items, appliedCoupon, shippingFee]);

  const fetchMyCart = async () => {
    try {
      const res = await api.get("/cart");
      if (res.data.data && res.data.data.items) {
        setItems(res.data.data.items);
      }
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/addresses/list");
      const rawList = res.data.data || [];
      const list: Address[] = rawList.map((addr: any) => ({
        id: addr.id || addr.addressId,
        recipientName: addr.recipientName,
        recipientPhone: addr.recipientPhone,
        city: addr.city,
        ward: addr.ward,
        addressDetail: addr.addressDetail,
        isDefault: addr.isDefault
      }));
      setAddresses(list);

      if (list.length > 0 && !selectedAddressId) {
        const defaultAddr = list.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : list[0].id);
      }
    } catch (error) {
      console.error("Lỗi lấy địa chỉ:", error);
    }
  };

  // --- 3. LOGIC COUPON ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.get(`/coupons/check/${couponCode}`);
      const rawCoupon = res.data.data;
      if (!rawCoupon) { alert("Mã giảm giá không tồn tại!"); return; }

      const coupon: Coupon = {
        id: rawCoupon.id,
        code: rawCoupon.code,
        type: rawCoupon.type,
        value: rawCoupon.value,
        minOrderValue: rawCoupon.minOrderValue ?? rawCoupon.min_order_value ?? 0,
        usageLimit: rawCoupon.usageLimit ?? rawCoupon.usage_limit
      };

      if (merchandiseSubtotal < coupon.minOrderValue) {
        alert(`Mã này chỉ áp dụng cho đơn từ ${coupon.minOrderValue.toLocaleString()}đ`);
        setAppliedCoupon(null);
        return;
      }
      if (coupon.usageLimit !== undefined && coupon.usageLimit <= 0) {
        alert("Mã giảm giá đã hết lượt.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(coupon);
      alert("Áp dụng mã giảm giá thành công!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Mã giảm giá không hợp lệ!");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
  };

  // --- 4. LOGIC SỐ LƯỢNG (Cho phép gõ phím + Chặn Tồn Kho) ---
  const triggerQuantityUpdateAPI = (item: CheckoutItem, newQty: number) => {
    // Chỉ lưu tạm vào cart nếu đi từ giỏ hàng, nếu mua ngay (Buy Now) thì không cần
    if (!isBuyNowMode && item.id) {
      api.put(`/cart/upd/${item.id}`, null, { params: { quantity: newQty } })
         .catch(e => console.error("Lỗi update quantity:", e));
    }
  };

  const handleQuantityBtnClick = (index: number, change: number) => {
    const currentItem = items[index];
    const currentQty = Number(currentItem.quantity) || 1;
    let newQuantity = currentQty + change;
    
    if (newQuantity < 1) return;

    // Rào chắn kiểm tra tồn kho
    if (currentItem.stock !== undefined && newQuantity > currentItem.stock) {
        alert(`Rất tiếc, sản phẩm này chỉ còn ${currentItem.stock} cái trong kho!`);
        newQuantity = currentItem.stock; 
    }

    const newItems = [...items];
    newItems[index].quantity = newQuantity;
    setItems(newItems);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
        triggerQuantityUpdateAPI(currentItem, newQuantity);
    }, 300);
  };

  const handleQuantityInputTyping = (index: number, value: string) => {
    const inputValue = value.replace(/[^0-9]/g, ''); 
    const newItems = [...items];
    const currentItem = items[index];

    if (inputValue === '') {
        newItems[index].quantity = '';
        setItems(newItems);
        return;
    }

    let newQty = parseInt(inputValue, 10);
    if (newQty < 1) return;

    // Rào chắn kiểm tra tồn kho khi gõ trực tiếp
    if (currentItem.stock !== undefined && newQty > currentItem.stock) {
        alert(`Rất tiếc, sản phẩm này chỉ còn ${currentItem.stock} cái trong kho!`);
        newQty = currentItem.stock; 
    }

    newItems[index].quantity = newQty;
    setItems(newItems);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
        triggerQuantityUpdateAPI(currentItem, newQty);
    }, 600);
  };

  const handleInputBlur = (index: number) => {
    const currentItem = items[index];
    if (currentItem.quantity === '' || Number(currentItem.quantity) < 1) {
        const newItems = [...items];
        newItems[index].quantity = 1;
        setItems(newItems);
        triggerQuantityUpdateAPI(currentItem, 1);
    }
  };

  // --- 5. LOGIC ĐỊA CHỈ ---
  const handleAddAddress = async () => {
    const { recipientName, recipientPhone, city, ward, addressDetail } = newAddress;
    if (!recipientName || !recipientPhone || !city || !ward || !addressDetail) {
      alert("Vui lòng điền đầy đủ thông tin địa chỉ!");
      return;
    }
    try {
      await api.post("/addresses/add", { ...newAddress, isDefault: addresses.length === 0 });
      alert("Thêm địa chỉ thành công!");
      setShowAddressModal(false);
      setNewAddress({ recipientName: "", recipientPhone: "", city: "", ward: "", addressDetail: "" });
      fetchAddresses();
    } catch (error: any) {
      alert("Thêm thất bại: " + (error.response?.data?.message || "Lỗi hệ thống"));
    }
  };

  // --- 6. XỬ LÝ ĐẶT HÀNG ---
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Vui lòng chọn địa chỉ nhận hàng!");
      return;
    }

    // Kiểm tra ID sản phẩm tránh lỗi Backend
    for (const item of items) {
      if (!item.productId && !item.id) {
        alert(`Lỗi: Sản phẩm "${item.productName}" bị thiếu ID. Vui lòng thử lại.`);
        return;
      }
    }

    setLoading(true);
    try {
      // Dữ liệu tạo đơn
      const payload = {
        addressId: selectedAddressId,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        note: note,
        items: isBuyNowMode
          ? items.map(item => ({
            productId: item.productId || item.id,
            quantity: Number(item.quantity) || 1
          }))
          : null // Mua từ giỏ hàng thì gửi null để server tự lấy
      };

      const res = await api.post("/orders", payload);
      const newOrder = res.data.data;

      if (paymentMethod === "E_WALLET") {
        try {
          const paymentRes = await api.post("/payments/create", {
            orderId: newOrder.id,
            amount: totalPayment,
            method: "E_WALLET",
            note: note || "Thanh toán VNPay"
          });

          const paymentUrl = paymentRes.data.data.paymentUrl;
          if (paymentUrl) {
            window.location.href = paymentUrl;
            return;
          } else {
             alert("Tạo đơn thành công nhưng không lấy được link thanh toán. Vui lòng kiểm tra lại đơn hàng.");
             navigate(`/profile`); 
          }
        } catch (payError) {
          console.error("Lỗi VNPay:", payError);
          alert("Lỗi kết nối cổng thanh toán. Đơn hàng đã được tạo, vui lòng thanh toán lại sau.");
          navigate("/profile"); 
        }
      } else {
        alert(`🎉 Đặt hàng thành công! Mã đơn: ${newOrder.id}`);
        navigate("/"); 
      }
    } catch (error: any) {
      console.error("Order error:", error);
      const msg = error.response?.data?.message || "Đặt hàng thất bại.";
      alert("Lỗi: " + msg);
    } finally {
      setLoading(false);
    }
  };

  // --- GIAO DIỆN ---
  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Thanh Toán</h2>
      <div className="checkout-layout">
        
        {/* NỬA TRÁI */}
        <div className="checkout-left">
          
          {/* PHẦN ĐỊA CHỈ */}
          <div className="checkout-section">
            <h3><i className="fas fa-map-marker-alt"></i> Địa chỉ nhận hàng</h3>
            {addresses.length === 0 ? (
              <p className="empty-text">Bạn chưa có địa chỉ nào.</p>
            ) : (
              <div className="address-list">
                {addresses.map(addr => (
                  <label key={addr.id} className={`address-card ${Number(selectedAddressId) === Number(addr.id) ? 'selected' : ''}`} onClick={() => setSelectedAddressId(addr.id)}>
                    <input type="radio" name="address" value={addr.id} checked={Number(selectedAddressId) === Number(addr.id)} onChange={() => setSelectedAddressId(addr.id)} />
                    <div className="address-info">
                      <p className="addr-name">{addr.recipientName} | {addr.recipientPhone}</p>
                      <p className="addr-detail">{addr.addressDetail}, {addr.ward}, {addr.city}</p>
                      {addr.isDefault && <span className="default-badge">Mặc định</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button className="btn-add-address" onClick={() => setShowAddressModal(true)}>+ Thêm địa chỉ mới</button>
          </div>

          {/* PHẦN SẢN PHẨM */}
          <div className="checkout-section">
            <h3><i className="fas fa-box"></i> Sản phẩm ({items.length})</h3>
            
            <div className="checkout-items">
              {items.map((item, idx) => {
                const imageUrl = item.image 
                  || item.productImage 
                  || (item.images && item.images.length > 0 ? item.images[0].imageUrl : null)
                  || "https://placehold.co/60";

                return (
                  <div key={idx} className="checkout-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <img src={imageUrl} alt="img" style={{objectFit: 'cover', width: '60px', height: '60px', marginRight: '15px', borderRadius: '4px'}} />
                    <div className="item-details" style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{item.productName || item.name || "Sản phẩm"}</h4>
                      <span className="item-price" style={{ color: '#d97706', fontWeight: 'bold' }}>
                        {(item.price || item.unitPrice || 0).toLocaleString()}đ
                      </span>
                    </div>
                    
                    {/* BỘ ĐIỀU KHIỂN SỐ LƯỢNG */}
                    <div className="quantity-control" style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                      <button 
                        style={{ padding: '5px 10px', border: 'none', background: '#f5f5f5', cursor: 'pointer' }} 
                        onClick={() => handleQuantityBtnClick(idx, -1)}
                      >-</button>
                      
                      <input 
                        type="text"
                        style={{ width: '40px', textAlign: 'center', border: 'none', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', outline: 'none' }}
                        value={item.quantity === '' ? '' : item.quantity}
                        onChange={(e) => handleQuantityInputTyping(idx, e.target.value)}
                        onBlur={() => handleInputBlur(idx)}
                      />
                      
                      <button 
                        style={{ padding: '5px 10px', border: 'none', background: '#f5f5f5', cursor: 'pointer' }} 
                        onClick={() => handleQuantityBtnClick(idx, 1)}
                      >+</button>
                    </div>
                    
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* NỬA PHẢI: TỔNG KẾT & ĐẶT HÀNG */}
        <div className="checkout-right">
          <div className="order-summary">
            <h3>Tổng kết đơn hàng</h3>
            <div className="summary-row"><span>Tạm tính:</span><span>{merchandiseSubtotal.toLocaleString()}đ</span></div>
            <div className="summary-row"><span>Phí vận chuyển:</span><span>{shippingFee.toLocaleString()}đ</span></div>
            
            <div className="coupon-section">
              {appliedCoupon ? (
                <div className="applied-coupon">
                  <span>Mã: <strong>{appliedCoupon.code}</strong> (-{discountAmount.toLocaleString()}đ)</span>
                  <button onClick={handleRemoveCoupon} className="btn-remove-coupon">✕</button>
                </div>
              ) : (
                <div className="coupon-input">
                  <input type="text" placeholder="Nhập mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                  <button onClick={handleApplyCoupon}>Áp dụng</button>
                </div>
              )}
            </div>
            
            <div className="summary-total"><span>Tổng thanh toán:</span><span className="total-price">{totalPayment.toLocaleString()}đ</span></div>
            
            <div className="payment-methods">
              <p className="section-label">Phương thức thanh toán:</p>
              <label><input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} /> Thanh toán khi nhận hàng (COD)</label>
              <label><input type="radio" name="payment" value="E_WALLET" checked={paymentMethod === "E_WALLET"} onChange={(e) => setPaymentMethod(e.target.value)} /> Ví điện tử (VNPay/Momo)</label>
            </div>
            
            <div className="order-note"><textarea placeholder="Ghi chú cho người bán..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
            
            <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
              {loading ? "Đang xử lý..." : "ĐẶT HÀNG"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL THÊM ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content address-modal">
            <h3>Thêm địa chỉ mới</h3>
            <div className="form-group"><label>Họ tên người nhận *</label><input type="text" value={newAddress.recipientName} onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })} placeholder="Nguyễn Văn A" /></div>
            <div className="form-group"><label>Số điện thoại *</label><input type="text" value={newAddress.recipientPhone} onChange={e => setNewAddress({ ...newAddress, recipientPhone: e.target.value })} placeholder="09xx..." /></div>
            <div className="form-row">
              <div className="form-group"><label>Tỉnh / Thành phố *</label><input type="text" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="Hà Nội" /></div>
              <div className="form-group"><label>Quận / Huyện / Xã *</label><input type="text" value={newAddress.ward} onChange={e => setNewAddress({ ...newAddress, ward: e.target.value })} placeholder="Cầu Giấy" /></div>
            </div>
            <div className="form-group"><label>Địa chỉ chi tiết *</label><input type="text" value={newAddress.addressDetail} onChange={e => setNewAddress({ ...newAddress, addressDetail: e.target.value })} placeholder="Số nhà, tên đường..." /></div>
            <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowAddressModal(false)}>Hủy</button><button className="btn-submit" onClick={handleAddAddress}>Lưu Địa Chỉ</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Cart.css";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  name?: string; 
  productImage?: string;
  image?: string; 
  quantity: number | string; // Cho phép chuỗi rỗng để khách xóa số
  unitPrice: number;
  price?: number; 
  totalPrice: number;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const navigate = useNavigate();

  // Biến useRef dùng để hẹn giờ gọi API (chống spam click/gõ)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // --- 1. Load Giỏ hàng ---
  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      if (res.data.data && Array.isArray(res.data.data.items)) {
        setCartItems(res.data.data.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Lỗi tải giỏ hàng", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // --- 2. Xử lý Chọn sản phẩm ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(cartItems.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
    } else {
      setSelectedItemIds(prev => [...prev, id]);
    }
  };

  // --- 3. GỌI API CẬP NHẬT ---
  const callUpdateQuantityAPI = async (itemId: number, newQty: number) => {
    try {
      // Gọi API cập nhật
      const res = await api.put(`/cart/upd/${itemId}`, null, { params: { quantity: newQty } });
      
      // Lấy luôn giỏ hàng mới nhất từ Backend trả về đắp vào giao diện
      if (res.data && res.data.data && Array.isArray(res.data.data.items)) {
          setCartItems(res.data.data.items);
      } else {
          fetchCart(); // Backup nếu backend không trả về mảng items
      }

      window.dispatchEvent(new Event("cartChange"));
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      fetchCart(); // Trả lại giao diện cũ nếu API lỗi
    }
  };

  // --- 4. NÚT CLICK (+/-) ---
  const handleQuantityBtnClick = (item: CartItem, change: number) => {
    // Ép kiểu đề phòng quantity đang là chuỗi rỗng
    const currentQty = Number(item.quantity) || 1;
    const newQty = currentQty + change;
    
    if (newQty < 1) return;

    // Dùng (prev) để tránh lỗi Stale State
    setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
    
    // Hủy hẹn giờ gõ phím cũ
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Gọi API chống spam 300ms
    typingTimeoutRef.current = setTimeout(() => {
        callUpdateQuantityAPI(item.id, newQty);
    }, 300);
  };

  // --- 5. GÕ TRỰC TIẾP VÀO Ô INPUT ---
  const handleQuantityInputTyping = (item: CartItem, value: string) => {
    // Chỉ lấy số
    const inputValue = value.replace(/[^0-9]/g, ''); 

    if (inputValue === '') {
        // Cho phép xóa trắng ô input tạm thời
        setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: '' } : i));
        return;
    }

    const newQty = parseInt(inputValue, 10);
    if (newQty < 1) return;

    // Cập nhật giao diện mượt mà
    setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Chờ 600ms không gõ nữa thì mới gọi API
    typingTimeoutRef.current = setTimeout(() => {
        callUpdateQuantityAPI(item.id, newQty);
    }, 600);
  };

  // --- Xử lý khi người dùng click ra khỏi ô input (OnBlur) ---
  // Đề phòng khách hàng xóa trắng ô số lượng rồi bỏ đi chỗ khác
  const handleInputBlur = (item: CartItem) => {
    if (item.quantity === '' || Number(item.quantity) < 1) {
        setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: 1 } : i));
        callUpdateQuantityAPI(item.id, 1);
    }
  };

  // --- 6. Xử lý Xóa ---
  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Bạn muốn xóa sản phẩm này khỏi giỏ?")) return;
    try {
      await api.delete(`/cart/del/${id}`);
      setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
      fetchCart();
      window.dispatchEvent(new Event("cartChange"));
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  // --- 7. Tính toán Tổng tiền ---
  const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.id));
  const totalAmount = selectedItems.reduce((sum, item) => {
    const price = item.unitPrice || item.price || 0;
    const qty = Number(item.quantity) || 1; // Luôn đảm bảo quantity là số hợp lệ
    return sum + (price * qty);
  }, 0);

  // --- 8. Chuyển sang Checkout ---
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    const checkoutData = selectedItems.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        productName: item.productName || item.name || "Sản phẩm",
        price: item.unitPrice || item.price || 0,
        image: item.productImage || item.image
    }));

    navigate("/checkout", { state: { buyNowItems: checkoutData } });
  };

  if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Đang tải giỏ hàng...</div>;

  if (!cartItems || cartItems.length === 0) {
    return (
        <div className="cart-page">
            <div className="empty-cart">
                <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" />
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p>Hãy thêm vài người bạn nhỏ hoặc đồ dùng vào đây nhé!</p>
                <Link to="/customer" className="btn-continue">Tiếp tục mua sắm</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="cart-page">
      <h2 className="cart-title">Giỏ Hàng Của Bạn</h2>
      
      <div className="cart-container">
        {/* LIST ITEMS */}
        <div className="cart-items-section">
            <div className="cart-header-row">
                <div className="col-checkbox">
                    <input 
                        type="checkbox" 
                        checked={cartItems.length > 0 && selectedItemIds.length === cartItems.length}
                        onChange={handleSelectAll}
                    />
                </div>
                <div>Sản phẩm</div>
                <div>Đơn giá</div>
                <div>Số lượng</div>
                <div>Thành tiền</div>
                <div></div>
            </div>

            {cartItems.map(item => {
                const displayPrice = item.unitPrice || item.price || 0;
                const safeQty = Number(item.quantity) || 1;
                const displayTotal = displayPrice * safeQty;
                const displayName = item.productName || item.name || "Sản phẩm";
                const displayImage = item.productImage || item.image || "https://placehold.co/80";

                return (
                    <div key={item.id} className="cart-item-row">
                        <div className="col-checkbox">
                            <input 
                                type="checkbox" 
                                checked={selectedItemIds.includes(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                            />
                        </div>
                        <div className="col-info">
                            <img src={displayImage} alt={displayName} className="cart-img" />
                            <div>
                                <div className="item-name">{displayName}</div>
                            </div>
                        </div>
                        <div className="col-price">{displayPrice.toLocaleString()}đ</div>
                        
                        <div className="col-qty">
                            <div className="qty-control">
                                <button className="qty-btn" onClick={() => handleQuantityBtnClick(item, -1)}>-</button>
                                
                                <input 
                                    className="qty-input" 
                                    type="text"
                                    value={item.quantity === '' ? '' : item.quantity} 
                                    onChange={(e) => handleQuantityInputTyping(item, e.target.value)}
                                    onBlur={() => handleInputBlur(item)} // Đảm bảo tự điền lại số 1 nếu khách xóa rỗng rồi bỏ đi
                                />
                                
                                <button className="qty-btn" onClick={() => handleQuantityBtnClick(item, 1)}>+</button>
                            </div>
                        </div>

                        <div className="col-total">{displayTotal.toLocaleString()}đ</div>
                        <div className="col-action">
                            <button className="btn-delete-item" onClick={() => handleDeleteItem(item.id)}>
                                <i className="far fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* SUMMARY */}
        <div className="cart-summary-section">
            <h3 className="summary-title">Tổng Cộng</h3>
            <div className="summary-row">
                <span>Đã chọn:</span>
                <span>{selectedItemIds.length} sản phẩm</span>
            </div>
            <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{totalAmount.toLocaleString()}đ</span>
            </div>
            <div className="summary-total">
                <span>Tổng tiền:</span>
                <span className="total-val">{totalAmount.toLocaleString()}đ</span>
            </div>
            
            <button 
                className="btn-checkout" 
                onClick={handleCheckout}
                disabled={selectedItemIds.length === 0}
            >
                Mua Hàng ({selectedItemIds.length})
            </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import HomeBanner from "./components/HomeBanner"; 
import "./App.css"; 
import "./index.css"; 

// --- Import các trang Customer ---
import Customer from "./components/Customer/Customer";
import UserProfile from "./components/User/UserProfile";
import Register from "./components/Register/Register";
import ForgotPassword from "./components/Login/ForgotPassword";
import MyPets from "./components/Customer/MyPets/MyPets";
import Promotions from "./components/Header/Promotions/Promotions";
import Checkout from "./components/Customer/Checkout/Checkout";
import Cart from "./components/Customer/Cart/Cart";
import Booking from "./components/Customer/Booking/Booking";
import Footer from "./components/Footer/Footer";
import PaymentCallback from "./components/Customer/Checkout/PaymentCallback";

// --- Import các trang Layout ---
import Staff from "./components/Staff/Staff"; 
import Admin from "./components/Admin/Admin"; 

// --- Import các component Admin/Staff ---
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import Revenue from "./components/Admin/Revenue/Revenue";
import OrderDetail from "./components/Admin/OrderDetail/OrderDetail";
import OrderList from "./components/Admin/OrderList/OrderList";
import ProductList from "./components/Admin/ProductList/ProductList";
import CategoryList from "./components/Admin/ProductList/CategoryList/CategoryList"; 
import ServiceandSpa from "./components/Admin/ServiceandSpa/ServiceandSpa";
import Appointment from "./components/Admin/Appointment/Appointment";
import UserManagement from "./components/Admin/UserManagement/UserManagement";
import StaffManagement from "./components/Admin/StaffManagement/StaffManagement";
import CouponManagement from "./components/Admin/CouponManagement/CouponManagement";

// --- Import Chat ---
import ChatWidget from "./components/ChatWidget/ChatWidget"; 
import ContactButtons from "./components/ChatWidget/ContactButtons";

// --- Import Trang Thống Kê Mới ---
import ProductSales from "./components/Admin/Revenue/ProductSales";
import AppointmentSales from "./components/Admin/Revenue/AppointmentSales";
import ResetPassword from "./components/Login/ResetPassword";

const MainLayout: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation(); 

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const showBanner = location.pathname === "/" || location.pathname === "/customer";

  return (
    <div className="app-wrapper">
      <Header />
      {showBanner && <HomeBanner />}
      
      <div className="main-content">
        <Outlet />
      </div>
      
      <Footer />
      
      {/* Chat Widget */}
      {isChatOpen && (
        <div style={{ 
            position: 'fixed', 
            bottom: '90px', 
            right: '130px', 
            zIndex: 1999 
        }}>
           <ChatWidget />
        </div>
      )}

      <ContactButtons 
          isOpen={isChatOpen} 
          onToggleChat={toggleChat} 
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* === NHÓM 1: KHÁCH HÀNG (Dùng MainLayout có Header/Footer) === */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Customer />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/register" element={<Register />} />
          
          {/* 🟢 HAI ROUTE MỚI CHO QUÊN MẬT KHẨU */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/my-pets" element={<MyPets />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/payment-result" element={<PaymentCallback />} />
        </Route>

        {/* === NHÓM 2: ADMIN === */}
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="products" element={<ProductList />} />
          <Route path="services" element={<ServiceandSpa />} />
          <Route path="calendar" element={<Appointment />} />
          <Route path="customers" element={<UserManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="couponManagement" element={<CouponManagement />} />
          
          <Route path="categories" element={<CategoryList />} />
          <Route path="analytics/products" element={<ProductSales />} />
          <Route path="analytics/appointments" element={<AppointmentSales />} />
        </Route>

        {/* === NHÓM 3: STAFF === */}
        <Route path="/staff" element={<Staff />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="calendar" element={<Appointment />} />
          <Route path="customers" element={<UserManagement />} />
          <Route path="couponManagement" element={<CouponManagement />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default App;
import React from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Header from "./components/Header/Header";
import "./App.css";
import "./index.css";

// Import các trang Customer
import Customer from "./components/Customer/Customer";
import UserProfile from "./components/User/UserProfile";
import Register from "./components/Register/Register";
import MyPets from "./components/Customer/MyPets/MyPets";
import Promotions from "./components/Header/Promotions/Promotions";
import Checkout from "./components/Customer/Checkout/Checkout";
import Cart from "./components/Customer/Cart/Cart";
import Booking from "./components/Customer/Booking/Booking";
import Footer from "./components/Footer/Footer";

// Import các trang Layout
import Staff from "./components/Staff/Staff"; // Layout cho Staff
import Admin from "./components/Admin/Admin"; // Layout cho Admin

// Import các component chức năng (Dùng chung cho cả Admin và Staff)
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import Revenue from "./components/Admin/Revenue/Revenue";
import OrderDetail from "./components/Admin/OrderDetail/OrderDetail";
import OrderList from "./components/Admin/OrderList/OrderList";
import ProductList from "./components/Admin/ProductList/ProductList";
import ServiceandSpa from "./components/Admin/ServiceandSpa/ServiceandSpa";
import Appointment from "./components/Admin/Appointment/Appointment";
import UserManagement from "./components/Admin/UserManagement/UserManagement";
import StaffManagement from "./components/Admin/StaffManagement/StaffManagement";
import CouponManagement from "./components/Admin/CouponManagement/CouponManagement";

const MainLayout: React.FC = () => {
  return (
    <div className="app-wrapper">
      <Header />
      <div style={{ padding: "24px 40px", minHeight: "80vh" }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* === NHÓM 1: KHÁCH HÀNG (Main Layout) === */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Customer />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-pets" element={<MyPets />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/booking" element={<Booking />} />
        </Route>

        {/* === NHÓM 2: ADMIN (Toàn quyền) === */}
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
        </Route>

        {/* === NHÓM 3: STAFF (Quyền hạn chế) === */}
        {/* Staff dùng layout riêng, chỉ chứa các menu cho phép */}
        <Route path="/staff" element={<Staff />}>
          {/* Mặc định vào trang Đơn hàng hoặc Lịch hẹn tùy bạn chọn */}
          <Route index element={<Navigate to="orders" replace />} />
          
          {/* Tái sử dụng các component của Admin nhưng ở route của Staff */}
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
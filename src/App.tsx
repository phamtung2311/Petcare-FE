import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Header/Header";
import "./App.css";
import "./index.css";

// Import các trang
import Customer from "./components/Customer/Customer";
import Staff from "./components/Staff/Staff";
import UserProfile from "./components/User/UserProfile";
import Register from "./components/Register/Register";


import Admin from "./components/Admin/Admin"; 
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import Revenue from "./components/Admin/Revenue/Revenue";
import OrderDetail from "./components/Admin/OrderDetail/OrderDetail";
import OrderList from "./components/Admin/OrderList/OrderList";
import ProductList from "./components/Admin/ProductList/ProductList";
import ServiceandSpa from "./components/Admin/ServiceandSpa/ServiceandSpa";
import Appointment from "./components/Admin/Appointment/Appointment";
const MainLayout: React.FC = () => {
  return (
    <>
      <Header />
      {/* Chỉ trang khách hàng mới có padding đệm */}
      <div style={{ padding: "24px 40px" }}>
        {/* Outlet là nơi nội dung các trang con (Customer, Profile...) sẽ hiện ra */}
        <Outlet /> 
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* === NHÓM 1: CÁC TRANG DÙNG MAIN LAYOUT (Có Header) === */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Customer />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* === NHÓM 2: CÁC TRANG DÙNG ADMIN LAYOUT (Không Header chung) === */}
        {/* Lưu ý: AdminLayout phải có <Outlet /> bên trong như hướng dẫn trước */}
        <Route path="/admin" element={<Admin />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="products" element={<ProductList />} /> {/* 👈 Route mới */}
        <Route path="services" element={<ServiceandSpa />} /> 
        <Route path="calendar" element={<Appointment />} />
           {/* Tại đây bạn sẽ định nghĩa các trang con của Admin sau này */}
           {/* Ví dụ: <Route path="dashboard" element={<Dashboard />} /> */}
        </Route>

        {/* Trang staff nếu cần giao diện riêng thì để ra ngoài, hoặc gom vào nhóm nào tùy ý */}
        <Route path="/staff" element={<Staff />} />
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;
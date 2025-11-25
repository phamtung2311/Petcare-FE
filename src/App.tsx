import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import "./App.css";
import "./index.css";
import Customer from "./components/Customer/Customer";
import Staff from "./components/Staff/Staff";
import Admin from "./components/Admin/Admin";
import UserProfile from "./components/User/UserProfile"; // 👈 thêm

const Home: React.FC = () => (
  <h1 className="text-3xl font-bold">Chào mừng đến với PetCare!</h1>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Header />

      <div style={{ padding: "24px 40px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<UserProfile />} /> {/* 👈 thêm */}
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

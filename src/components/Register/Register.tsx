import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./Register.css";
import Login from "../Login/Login";

interface RegisterResponse {
    status: number;
    message: string;
    data?: any;
}

const Register: React.FC = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userName, setUserName] = useState(""); // ⚠️ đúng tên field BE: userName
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const [showLogin, setShowLogin] = useState(false);



    const [message, setMessage] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");

        if (
            !firstName ||
            !lastName ||
            !userName ||
            !email ||
            !phone ||
            !password ||
            !confirmPassword
        ) {
            setMessage("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Mật khẩu nhập lại không khớp.");
            return;
        }

        const payload = {
            firstName,
            lastName,
            userName,   // phải trùng tên BE
            email,
            phone,
            password,
            role_id: 1, // role mặc định là 1
            // addresses: [] // 👉 khi khách mua online mới gửi kèm địa chỉ + recipientName + recipientPhone
        };

        setLoading(true);
        try {
            const res = await api.post<RegisterResponse>("/user/add", payload);
            console.log("REGISTER RESPONSE >>>", res.data);

            if (res.data.status === 200 || res.data.status === 201) {
                setSuccess(true);
                setTimeout(() => {
                    navigate("/customer");
                }, 1000);
            } else {
                setMessage(res.data.message || "Đăng ký không thành công.");
            }
        } catch (error: any) {
            console.error("REGISTER ERROR >>>", error);
            const errorMsg =
                error?.response?.data?.message || "Có lỗi xảy ra khi đăng ký.";
            setMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-box">
                <h2>Đăng ký tài khoản</h2>

                {message && <div className="register-message">{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Họ</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Nhập họ (VD: Phạm)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tên</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Nhập tên (VD: Tùng)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tên đăng nhập (userName)</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="VD: tung123"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="VD: email@gmail.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="VD: 0823xxxxxx"
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    <div className="form-group">
                        <label>Nhập lại mật khẩu</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Đăng ký"}
                    </button>
                </form>

                <p className="register-switch">
                    Đã có tài khoản?
                    <span
                        className="register-link"
                        onClick={() => setShowLogin(true)}   // 👈 MỞ POPUP LOGIN
                    >
                        Đăng nhập
                    </span>
                </p>

            </div>
            {showLogin && (
                <Login
                    onClose={() => setShowLogin(false)}
                    onLoginSuccess={() => {
                        // Ở đây Login.tsx đã tự lưu token + điều hướng rồi,
                        // mình chỉ cần đóng popup là đủ.
                        setShowLogin(false);
                    }}
                />
            )}

            {success && (
                <div className="register-success-overlay">
                    <div className="register-success-box">
                        <h1>Đăng ký thành công!</h1>
                        <p>Bạn sẽ được chuyển sang trang đăng nhập...</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Register;

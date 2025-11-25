import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";

interface UserDetail {
  id: number;
  fistName: string;   // BE đang đánh sai chính tả fistName thì FE cứ theo đúng key
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  // nếu BE có trường role thì thêm vào đây
  // role: string;
}

interface ApiUserResponse {
  status: number;
  message: string;
  data: UserDetail;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const accessToken = localStorage.getItem("accessToken");

    if (!userId || !accessToken) {
      setError("Bạn chưa đăng nhập.");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await api.get<ApiUserResponse>(`/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("USER DETAIL >>>", res.data);
        setUser(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Không lấy được thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <p>Đang tải thông tin người dùng...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!user) {
    return <p>Không có dữ liệu người dùng.</p>;
  }

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: 8,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
        Thông tin người dùng
      </h2>

      <div style={{ marginBottom: 8 }}>
        <strong>Họ và tên:</strong>{" "}
        {user.fistName} {user.lastName}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Tên đăng nhập:</strong> {user.userName}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Email:</strong> {user.email}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Số điện thoại:</strong> {user.phone}
      </div>
      {/* Nếu BE trả role:
      <div style={{ marginBottom: 8 }}>
        <strong>Quyền:</strong> {user.role}
      </div>
      */}
    </div>
  );
};

export default UserProfile;

import axios from 'axios';

// 1. Lấy base URL từ tệp .env.local mà bạn vừa tạo (Bước 3)
const baseURL = import.meta.env.VITE_API_BASE_URL;

// 2. Tạo một instance (thể hiện) của axios
// Instance này sẽ sử dụng URL của backend làm URL cơ sở
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Bật dòng này nếu bạn dùng session/cookie
});

/* 3. (TÙY CHỌN NÂNG CAO - ĐỂ SAU)
  Đây là nơi bạn có thể thêm "interceptors" (bộ can thiệp)
  Ví dụ: Tự động đính kèm token (JWT) vào header của MỌI yêu cầu
  
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
*/

// 4. Xuất (export) instance này để các component khác có thể dùng
export default api;

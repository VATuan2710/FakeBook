import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8080/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor cho request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    console.log("📡 API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor cho response
instance.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error("❌ API Error:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log("🔄 Attempting to refresh token...");

      try {
        const refreshResponse = await instance.post("/auth/refresh-token");
        const newAccessToken = refreshResponse.data.accessToken;

        localStorage.setItem("token", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        
        console.log("✅ Token refreshed successfully");
        return instance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        
        // Xóa token cũ và chuyển hướng đến trang login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Thông báo cho user
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        
        // Chuyển hướng sau 1 giây
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        
        return Promise.reject(refreshError);
      }
    }

    // Xử lý các lỗi khác
    if (error.response?.status === 403) {
      alert("Bạn không có quyền truy cập tài nguyên này!");
    } else if (error.response?.status === 404) {
      console.error("❌ API endpoint not found:", error.config?.url);
    } else if (error.response?.status >= 500) {
      alert("Lỗi server! Vui lòng thử lại sau.");
    }

    return Promise.reject(error);
  }
);

export default instance;

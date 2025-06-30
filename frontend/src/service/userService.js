import api from './index.js';

export const getUserProfile = async () => {
  try {
    const response = await api.get("/user/profile");
    console.log("User profile data: ", response);
    return response.data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error.response?.data || { message: 'Lỗi khi lấy thông tin người dùng' };
  }
};

export const fetchUsers = async () => {
  try {
    const response = await api.get("/user");
    console.log("Users list:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách người dùng' };
  }
};

// Alias for getAllUsers (for compatibility)
export const getAllUsers = async () => {
  try {
    const response = await api.get("/user");
    return {
      users: response.data?.users || response.data || [],
      count: response.data?.count || response.data?.length || 0
    };
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách người dùng' };
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error.response?.data || { message: 'Lỗi khi lấy thông tin người dùng' };
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put("/user/profile", userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error.response?.data || { message: 'Lỗi khi cập nhật thông tin' };
  }
};

// Upload avatar
export const uploadAvatar = async (formData) => {
  try {
    const response = await api.post("/user/avatar", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error.response?.data || { message: 'Lỗi khi tải ảnh đại diện' };
  }
};

// Search users (alternative to friend service search)
export const searchUsersByName = async (query) => {
  try {
    const response = await api.get('/user/search', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error.response?.data || { message: 'Lỗi khi tìm kiếm người dùng' };
  }
};

export default {
  getUserProfile,
  fetchUsers,
  getAllUsers,
  getUserById,
  updateUserProfile,
  uploadAvatar,
  searchUsersByName
};

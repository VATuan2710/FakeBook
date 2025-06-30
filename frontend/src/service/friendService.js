import instance from './index.js';

// 🚀 Friend Request Functions

// Gửi lời mời kết bạn
export const sendFriendRequest = async (senderId, receiverId) => {
  try {
    const response = await instance.post('/friend/request', {
      sender: senderId,
      receiver: receiverId
    });
    return response.data;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error.response?.data || { message: 'Lỗi khi gửi lời mời kết bạn' };
  }
};

// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await instance.put(`/friend/request/${requestId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error.response?.data || { message: 'Lỗi khi chấp nhận lời mời' };
  }
};

// Từ chối lời mời kết bạn
export const declineFriendRequest = async (requestId) => {
  try {
    const response = await instance.delete(`/friend/request/${requestId}/decline`);
    return response.data;
  } catch (error) {
    console.error('Error declining friend request:', error);
    throw error.response?.data || { message: 'Lỗi khi từ chối lời mời' };
  }
};

// Hủy lời mời kết bạn đã gửi
export const cancelFriendRequest = async (senderId, receiverId) => {
  try {
    const response = await instance.delete('/friend/request/cancel', {
      data: { sender: senderId, receiver: receiverId }
    });
    return response.data;
  } catch (error) {
    console.error('Error canceling friend request:', error);
    throw error.response?.data || { message: 'Lỗi khi hủy lời mời' };
  }
};

// 👥 Friend Management Functions

// Lấy danh sách bạn bè
export const getFriends = async (userId) => {
  try {
    const response = await instance.get(`/friend/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách bạn bè' };
  }
};

// Xóa bạn bè
export const removeFriend = async (userId, friendId) => {
  try {
    const response = await instance.delete('/friend/remove', {
      data: { userId, friendId }
    });
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error.response?.data || { message: 'Lỗi khi xóa bạn bè' };
  }
};

// Lấy lời mời kết bạn đã nhận
export const getReceivedFriendRequests = async (userId) => {
  try {
    const response = await instance.get(`/friend/${userId}/requests/received`);
    return response.data;
  } catch (error) {
    console.error('Error getting received requests:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy lời mời đã nhận' };
  }
};

// Lấy lời mời kết bạn đã gửi
export const getSentFriendRequests = async (userId) => {
  try {
    const response = await instance.get(`/friend/${userId}/requests/sent`);
    return response.data;
  } catch (error) {
    console.error('Error getting sent requests:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy lời mời đã gửi' };
  }
};

// 🔍 Friend Discovery Functions

// Kiểm tra trạng thái kết bạn
export const checkFriendship = async (user1, user2) => {
  try {
    const response = await instance.get(`/friend/check/${user1}/${user2}`);
    return response.data;
  } catch (error) {
    console.error('Error checking friendship:', error);
    throw error.response?.data || { message: 'Lỗi khi kiểm tra trạng thái' };
  }
};

// Lấy bạn chung
export const getMutualFriends = async (user1, user2) => {
  try {
    const response = await instance.get(`/friend/mutual/${user1}/${user2}`);
    return response.data;
  } catch (error) {
    console.error('Error getting mutual friends:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy bạn chung' };
  }
};

// Tìm kiếm người dùng
export const searchUsers = async (query, userId) => {
  try {
    const response = await instance.get('/friend/search/users', {
      params: { query, userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error.response?.data || { message: 'Lỗi khi tìm kiếm người dùng' };
  }
};

// 🎯 Helper Functions

// Format tên hiển thị
export const getDisplayName = (user) => {
  if (user.displayName && user.displayName !== 'New User') {
    return user.displayName;
  }
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username || 'Unknown User';
};

// Format thời gian online
export const getOnlineStatus = (user) => {
  if (!user.lastSeen) return 'offline';
  
  const now = new Date();
  const lastSeen = new Date(user.lastSeen);
  const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
  
  if (user.status === 'online' || diffMinutes <= 5) {
    return 'online';
  } else if (diffMinutes <= 30) {
    return 'recently';
  } else {
    return 'offline';
  }
};

// Format nút friend request dựa trên status
export const getFriendButtonConfig = (status) => {
  switch (status) {
    case 'friends':
      return { text: 'Bạn bè', variant: 'success', disabled: false };
    case 'sent':
      return { text: 'Đã gửi lời mời', variant: 'secondary', disabled: true };
    case 'received':
      return { text: 'Chấp nhận', variant: 'primary', disabled: false };
    case 'none':
    default:
      return { text: 'Kết bạn', variant: 'primary', disabled: false };
  }
};

export default {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend,
  getReceivedFriendRequests,
  getSentFriendRequests,
  checkFriendship,
  getMutualFriends,
  searchUsers,
  getDisplayName,
  getOnlineStatus,
  getFriendButtonConfig
};

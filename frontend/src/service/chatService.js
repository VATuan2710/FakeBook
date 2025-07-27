import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Tạo axios instance với authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 API Request:', config.method.toUpperCase(), config.url);
  return config;
});

// 📌 **Lấy lịch sử tin nhắn giữa 2 người**
export const getMessages = async (userId, friendId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/message/${userId}/${friendId}`, {
      params: { page, limit }
    });
    
    if (response.data && response.data.messages) {
      // Transform messages to match frontend expectations
      const transformedMessages = response.data.messages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        receiver: { _id: friendId }, // Add receiver info for compatibility
        message: msg.content?.text || '',
        createdAt: msg.createdAt,
        readBy: msg.readBy || [],
        type: msg.type || 'text',
        conversationId: response.data.conversation?._id
      }));
      
      return {
        messages: transformedMessages,
        conversation: response.data.conversation,
        hasMore: response.data.hasMore
      };
    }
    
    return { messages: [], conversation: null, hasMore: false };
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    throw error;
  }
};

// 📌 **Gửi tin nhắn mới**
export const sendMessage = async (senderId, receiverId, messageText, type = 'text', replyTo = null) => {
  try {
    console.log('🚀 Sending message:', { senderId, receiverId, messageText, type });
    
    const response = await api.post('/message/send-message', {
      sender: senderId,
      receiver: receiverId,
      message: messageText,
      type: type,
      replyTo: replyTo
    });
    
    console.log('✅ Message sent successfully:', response.data);
    
    if (response.data && response.data.data) {
      // Transform message to match frontend expectations
      const message = response.data.data;
      return {
        _id: message._id,
        sender: message.sender,
        receiver: { _id: receiverId },
        message: message.content?.text || '',
        createdAt: message.createdAt,
        readBy: message.readBy || [],
        type: message.type || 'text',
        conversationId: response.data.conversationId
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('❌ Error sending message:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

// 📌 **Lấy danh sách conversations**
export const getConversations = async (userId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/message/conversations/${userId}`, {
      params: { page, limit }
    });
    
    if (response.data && response.data.conversations) {
      return {
        conversations: response.data.conversations,
        hasMore: response.data.hasMore
      };
    }
    
    return { conversations: [], hasMore: false };
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    throw error;
  }
};

// 📌 **Đánh dấu tin nhắn đã đọc**
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    await api.post('/message/mark-read', {
      conversationId,
      userId
    });
    return true;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    throw error;
  }
};

// 📌 **Upload file/image for messages** (for future use)
export const uploadMessageMedia = async (file, type = 'image') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post('/upload/message-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error uploading media:', error);
    throw error;
  }
};

// 📌 **Search messages** (for future use)
export const searchMessages = async (userId, query, conversationId = null) => {
  try {
    const response = await api.get('/message/search', {
      params: { 
        userId, 
        query, 
        conversationId 
      }
    });
    
    return response.data.messages || [];
  } catch (error) {
    console.error('❌ Error searching messages:', error);
    throw error;
  }
};

export default {
  getMessages,
  sendMessage,
  getConversations,
  markMessagesAsRead,
  uploadMessageMedia,
  searchMessages
};

import { io } from "socket.io-client";
import instance from ".";

// Kết nối WebSocket
const socket = io("http://127.0.0.1:8080", {
  withCredentials: true,
  transports: ["websocket"],
});

// 📌 **Kết nối lại WebSocket nếu bị mất kết nối**
export const reconnectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// 📌 **Tham gia phòng chat của user**
export const joinRoom = (userId) => {
  socket.emit("join", userId);
};

// 📌 **Rời khỏi phòng chat**
export const leaveRoom = (userId) => {
  socket.emit("leave", userId);
};

// 📌 **Lấy lịch sử tin nhắn giữa 2 người dùng**
export const getMessages = async (userId, friendId) => {
  try {
    const response = await instance.get(`/messages/${userId}/${friendId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    throw error;
  }
};

// 📌 **Gửi tin nhắn qua WebSocket**
export const sendMessage = (messageData) => {
  socket.emit("send_message", messageData);
};

// 📌 **Lắng nghe tin nhắn mới từ WebSocket**
export const receiveMessages = (callback) => {
  socket.on("receive_message", (message) => {
    callback(message);
  });
};

// 📌 **Lắng nghe sự kiện user online/offline**
export const listenUserStatus = (callback) => {
  socket.on("user_status", (status) => {
    callback(status);
  });
};

// 📌 **Rời khỏi WebSocket khi không cần nữa**
export const disconnectSocket = () => {
  socket.off("receive_message");
  socket.off("user_status");
  socket.disconnect();
};

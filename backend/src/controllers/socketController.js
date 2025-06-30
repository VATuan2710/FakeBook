import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";

// Store online users
const onlineUsers = new Map();

export const socketController = (io) => {
  io.on("connection", (socket) => {
    console.log(`📡 User Connected: ${socket.id}`);

    // Người dùng tham gia phòng riêng của họ
    socket.on("join", async (userId) => {
      if (userId) {
        socket.join(userId); // Tham gia phòng với ID của user
        socket.userId = userId; // Store userId in socket
        onlineUsers.set(userId, socket.id);
        
        console.log(`👤 User ${userId} đã vào phòng ${userId}`);
        
        // Update user online status
        try {
          await User.findByIdAndUpdate(userId, { 
            status: 'online',
            lastSeen: new Date()
          });
          
          // Broadcast user online status to friends
          socket.broadcast.emit("user_online", { userId, status: 'online' });
        } catch (error) {
          console.error("❌ Error updating user status:", error);
        }
      }
    });

    // Nhận tin nhắn từ client
    socket.on("send_message", async (data) => {
      console.log("📩 Tin nhắn nhận được:", data);

      try {
        const newMessage = new Message({
          sender: new mongoose.Types.ObjectId(data.sender),
          receiver: new mongoose.Types.ObjectId(data.receiver),
          message: data.message,
        });

        await newMessage.save();
        console.log("✅ Tin nhắn đã lưu vào MongoDB:", newMessage);

        // Gửi tin nhắn đến phòng của người nhận
        io.to(data.receiver).emit("receive_message", newMessage);
        io.to(data.sender).emit("receive_message", newMessage);
      } catch (error) {
        console.error("❌ Lỗi khi lưu tin nhắn vào MongoDB:", error);
      }
    });

    // 🔔 FRIEND REQUEST NOTIFICATIONS
    socket.on("send_friend_request", (data) => {
      console.log(`👥 Friend request: ${data.fromUser} → ${data.toUser}`);
      
      // Send real-time notification to the receiver
      io.to(data.toUser).emit("new_friend_request", {
        _id: data.requestId,
        fromUser: data.fromUserData,
        message: `${data.fromUserData.displayName} đã gửi lời mời kết bạn`,
        type: 'friend_request',
        createdAt: new Date(),
        isRead: false
      });
    });

    // 🎉 FRIEND REQUEST ACCEPTED
    socket.on("friend_request_accepted", (data) => {
      console.log(`✅ Friend request accepted: ${data.toUser} → ${data.fromUser}`);
      
      // Notify the original sender
      io.to(data.fromUser).emit("friend_request_status", {
        type: 'friend_accept',
        fromUser: data.toUserData,
        message: `${data.toUserData.displayName} đã chấp nhận lời mời kết bạn`,
        createdAt: new Date()
      });
    });

    // ❌ FRIEND REQUEST DECLINED  
    socket.on("friend_request_declined", (data) => {
      console.log(`❌ Friend request declined: ${data.toUser} → ${data.fromUser}`);
      
      // Optional: Notify the original sender (or not for privacy)
      // io.to(data.fromUser).emit("friend_request_status", {
      //   type: 'friend_decline',
      //   message: `Lời mời kết bạn đã bị từ chối`,
      //   createdAt: new Date()
      // });
    });

    // 🔔 GENERAL NOTIFICATIONS
    socket.on("send_notification", (data) => {
      console.log(`🔔 Notification: ${data.type} → ${data.toUser}`);
      
      io.to(data.toUser).emit("new_notification", {
        _id: data._id,
        type: data.type,
        fromUser: data.fromUser,
        message: data.message,
        actionData: data.actionData,
        createdAt: new Date(),
        isRead: false
      });
    });

    // 📖 MARK NOTIFICATION AS READ
    socket.on("mark_notification_read", (data) => {
      // Broadcast to all user's devices that notification was read
      io.to(data.userId).emit("notification_read", { 
        notificationId: data.notificationId 
      });
    });

    // 👀 TYPING INDICATORS
    socket.on("typing_start", (data) => {
      socket.to(data.receiverId).emit("user_typing", {
        userId: data.senderId,
        isTyping: true
      });
    });

    socket.on("typing_stop", (data) => {
      socket.to(data.receiverId).emit("user_typing", {
        userId: data.senderId,
        isTyping: false
      });
    });

    // Khi người dùng ngắt kết nối
    socket.on("disconnect", async () => {
      console.log(`❌ User Disconnected: ${socket.id}`);
      
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        try {
          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, { 
            status: 'offline',
            lastSeen: new Date()
          });
          
          // Broadcast user offline status
          socket.broadcast.emit("user_offline", { 
            userId: socket.userId, 
            status: 'offline',
            lastSeen: new Date()
          });
        } catch (error) {
          console.error("❌ Error updating user offline status:", error);
        }
      }
    });
  });

  // Helper function to get online users
  io.getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
  };

  // Helper function to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(userId).emit(event, data);
  };
};

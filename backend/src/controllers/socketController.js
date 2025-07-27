import mongoose from "mongoose";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// Store online users
const onlineUsers = new Map();

// 📌 **Tìm hoặc tạo conversation giữa 2 người**
const findOrCreateConversation = async (userId1, userId2) => {
  try {
    // Tìm conversation đã tồn tại giữa 2 người
    let conversation = await Conversation.findOne({
      type: "direct",
      $and: [
        { "participants.user": userId1 },
        { "participants.user": userId2 },
      ],
    });

    // nếu chưa có conversation, tạo mới
    if (!conversation) {
      conversation = new Conversation({
        type: "direct",
        participants: [
          { user: userId1, role: "member" },
          { user: userId2, role: "member" },
        ],
        directParticipants: [userId1, userId2],
        createdBy: userId1,
        lastActivity: new Date(),
      });
      await conversation.save();
    }

    return conversation;
  } catch (error) {
    console.error("❌ Error trong findOrCreateConversation:", error);
    throw error;
  }
};

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
            status: "online",
            lastSeen: new Date(),
          });

          // Broadcast user online status to friends
          socket.broadcast.emit("user_online", { userId, status: "online" });
        } catch (error) {
          console.error("❌ Error updating user status:", error);
        }
      }
    });

    // 📤 Broadcast tin nhắn realtime - KHÔNG LÀM GÌ VỚI DATABASE (API đã handle)
    socket.on("send_message", async (data) => {
      console.log("📡 Broadcasting realtime message:", data);

      try {
        // CHỈ broadcast message đến receiver cho realtime
        // Database đã được handle bởi API call

        const messageToSend = {
          _id: data.tempId || `temp_${Date.now()}`, // Sử dụng tempId từ frontend
          sender: { _id: data.sender },
          receiver: { _id: data.receiver },
          message: data.message,
          createdAt: new Date().toISOString(),
          isTemporary: true, // Đánh dấu là temporary để frontend biết
        };

        // CHỈ gửi tin nhắn đến người nhận để hiển thị realtime
        io.to(data.receiver).emit("receive_message", messageToSend);
        console.log(
          `📤 Broadcasted realtime message to receiver: ${data.receiver}`
        );
      } catch (error) {
        console.error("❌ Lỗi khi broadcast tin nhắn:", error);

        // Gửi lỗi về cho client
        socket.emit("message_error", {
          error: "Không thể broadcast tin nhắn",
          originalMessage: data,
        });
      }
    });

    // 📖 Đánh dấu tin nhắn đã đọc
    socket.on("mark_messages_read", async (data) => {
      try {
        const { conversationId, userId } = data;

        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: userId },
            "readBy.user": { $ne: userId },
          },
          {
            $push: {
              readBy: {
                user: userId,
                readAt: new Date(),
              },
            },
          }
        );

        // Thông báo cho người gửi rằng tin nhắn đã được đọc
        socket.broadcast.emit("messages_read", {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("❌ Error marking messages as read:", error);
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
        type: "friend_request",
        createdAt: new Date(),
        isRead: false,
      });
    });

    // 🎉 FRIEND REQUEST ACCEPTED
    socket.on("friend_request_accepted", (data) => {
      console.log(
        `✅ Friend request accepted: ${data.toUser} → ${data.fromUser}`
      );

      // Notify the original sender
      io.to(data.fromUser).emit("friend_request_status", {
        type: "friend_accept",
        fromUser: data.toUserData,
        message: `${data.toUserData.displayName} đã chấp nhận lời mời kết bạn`,
        createdAt: new Date(),
      });
    });

    // ❌ FRIEND REQUEST DECLINED
    socket.on("friend_request_declined", (data) => {
      console.log(
        `❌ Friend request declined: ${data.toUser} → ${data.fromUser}`
      );

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
        isRead: false,
      });
    });

    // 📖 MARK NOTIFICATION AS READ
    socket.on("mark_notification_read", (data) => {
      // Broadcast to all user's devices that notification was read
      io.to(data.userId).emit("notification_read", {
        notificationId: data.notificationId,
      });
    });

    // 👀 TYPING INDICATORS
    socket.on("typing_start", (data) => {
      socket.to(data.receiverId).emit("user_typing", {
        userId: data.senderId,
        isTyping: true,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing_stop", (data) => {
      socket.to(data.receiverId).emit("user_typing", {
        userId: data.senderId,
        isTyping: false,
        conversationId: data.conversationId,
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
            status: "offline",
            lastSeen: new Date(),
          });

          // Broadcast user offline status
          socket.broadcast.emit("user_offline", {
            userId: socket.userId,
            status: "offline",
            lastSeen: new Date(),
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

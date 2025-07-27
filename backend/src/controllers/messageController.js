import mongoose from "mongoose";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// **Tìm hoặc tạo conversation giữa 2 người**
const findOrCreateConversation = async (userId1, userId2) => {
  try {
    // Tìm conversation đã tồn tại giữa 2 người
    let conversation = await Conversation.findOne({
      type: "direct",
      $and: [
        { "participants.user": userId1 },
        { "participants.user": userId2 }
      ]
    }).populate('participants.user', 'username displayName avatarUrl');

    // Nếu chưa có conversation, tạo mới
    if (!conversation) {
      conversation = new Conversation({
        type: "direct",
        participants: [
          { user: userId1, role: "member" },
          { user: userId2, role: "member" }
        ],
        directParticipants: [userId1, userId2],
        createdBy: userId1,
        lastActivity: new Date()
      });
      await conversation.save();
      
      // Populate sau khi save
      conversation = await Conversation.findById(conversation._id)
        .populate('participants.user', 'username displayName avatarUrl');
    }

    return conversation;
  } catch (error) {
    console.error("❌ Error trong findOrCreateConversation:", error);
    throw error;
  }
};

// 📌 **Lấy lịch sử tin nhắn giữa 2 người**
export const getMessages = async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Kiểm tra xem userId & friendId có hợp lệ không
    if (!userId || !friendId) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin người gửi hoặc nhận" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(friendId)
    ) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ!" });
    }

    // Tìm conversation giữa 2 người
    const conversation = await findOrCreateConversation(userId, friendId);

    // Lấy tin nhắn trong conversation này
    const messages = await Message.find({
      conversation: conversation._id,
      isDeleted: false
    })
    .populate('sender', 'username displayName avatarUrl')
    .populate('replyTo', 'content.text sender')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    // Reverse để có thứ tự từ cũ đến mới
    const reversedMessages = messages.reverse();

    // Đánh dấu tin nhắn là đã đọc cho user hiện tại
    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: userId },
        "readBy.user": { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({
      messages: reversedMessages,
      conversation: conversation,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 📌 **Gửi tin nhắn mới**
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message, type = "text", replyTo } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!sender || !receiver || !message) {
      return res.status(400).json({ message: "Thiếu dữ liệu cần thiết!" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sender) ||
      !mongoose.Types.ObjectId.isValid(receiver)
    ) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ!" });
    }

    // Tìm hoặc tạo conversation
    const conversation = await findOrCreateConversation(sender, receiver);

    // Tạo tin nhắn mới
    const newMessage = new Message({
      conversation: conversation._id,
      sender: new mongoose.Types.ObjectId(sender),
      type: type,
      content: {
        text: message
      },
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
      readBy: [
        {
          user: sender,
          readAt: new Date()
        }
      ]
    });

    await newMessage.save();

    // Populate thông tin sender để trả về
    await newMessage.populate('sender', 'username displayName avatarUrl');
    if (replyTo) {
      await newMessage.populate('replyTo', 'content.text sender');
    }

    // Cập nhật lastMessage và lastActivity cho conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: newMessage._id,
      lastActivity: new Date()
    });

    res.status(201).json({ 
      message: "Tin nhắn đã được gửi!", 
      data: newMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 📌 **Lấy danh sách conversations của user**
export const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ!" });
    }

    const conversations = await Conversation.find({
      "participants.user": userId,
      "participants.isActive": true
    })
    .populate('participants.user', 'username displayName avatarUrl status lastSeen')
    .populate('lastMessage', 'content type sender createdAt')
    .populate('lastMessage.sender', 'displayName')
    .sort({ lastActivity: -1 })
    .limit(limit)
    .skip(skip);

    // Tính số tin nhắn chưa đọc cho mỗi conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          "readBy.user": { $ne: userId },
          isDeleted: false
        });

        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json({
      conversations: conversationsWithUnread,
      hasMore: conversations.length === limit
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy conversations:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 📌 **Đánh dấu tin nhắn đã đọc**
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ!" });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        "readBy.user": { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({ message: "Đã đánh dấu tin nhắn là đã đọc" });
  } catch (error) {
    console.error("❌ Lỗi khi đánh dấu đã đọc:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

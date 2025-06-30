import mongoose from "mongoose";
import Message from "../models/Message.js";

// 📌 **Lấy lịch sử tin nhắn giữa 2 người**
export const getMessages = async (req, res) => {
  try {
    const { userId, friendId } = req.params;

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

    // Truy vấn tin nhắn giữa 2 người từ MongoDB
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ],
    })
    .populate('sender', 'username displayName avatarUrl')
    .populate('receiver', 'username displayName avatarUrl')
    .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

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

    // Lưu tin nhắn vào MongoDB
    const newMessage = new Message({
      sender: new mongoose.Types.ObjectId(sender),
      receiver: new mongoose.Types.ObjectId(receiver),
      message,
    });

    await newMessage.save();

    res
      .status(201)
      .json({ message: "Tin nhắn đã được gửi!", data: newMessage });
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

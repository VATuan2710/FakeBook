import { Router } from "express";
import { 
  getMessages, 
  sendMessage, 
  getConversations, 
  markMessagesAsRead 
} from "../controllers/messageController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";

const messageRoute = Router();

// Lấy tin nhắn giữa 2 người
messageRoute.get("/:userId/:friendId", verifyToken, getMessages);

// Gửi tin nhắn
messageRoute.post("/send-message", verifyToken, sendMessage);

// Lấy danh sách conversations
messageRoute.get("/conversations/:userId", verifyToken, getConversations);

// Đánh dấu tin nhắn đã đọc
messageRoute.post("/mark-read", verifyToken, markMessagesAsRead);

export default messageRoute;

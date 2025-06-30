import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/messageController.js";

const messageRoute = Router();

messageRoute.get("/:userId/:friendId", getMessages);
messageRoute.post("/send-message", sendMessage);

export default messageRoute;

import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  getUserInfo,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh-token", refreshToken);
authRoutes.get("/userinfo", verifyToken, getUserInfo);

export default authRoutes;

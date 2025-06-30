import express from "express";
import { 
  getUserProfile, 
  getAllUsers,
  getUserById,
  updateUserProfile,
  searchUsers
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Get current user profile
router.get("/profile", verifyToken, getUserProfile);

// Get all users
router.get("/", verifyToken, getAllUsers);

// Search users
router.get("/search", verifyToken, searchUsers);

// Get user by ID
router.get("/:userId", verifyToken, getUserById);

// Update user profile
router.put("/profile", verifyToken, updateUserProfile);

export default router;

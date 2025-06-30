import { Router } from "express";

import {
  createPost,
  getAllPosts,
  getUserPosts,
  toggleReaction,
  deletePost,
  updatePost,
} from "../controllers/postsController.js";
import { verifyToken } from "../middlewares/authMiddlewares.js";
import upload from "../middlewares/uploadMiddleware.js";

const postRoutes = Router();

// Create post
postRoutes.post("/create", verifyToken, upload.single("image"), createPost);

// Get posts
postRoutes.get("/get-post", verifyToken, getUserPosts);
postRoutes.get("/get-all-posts", verifyToken, getAllPosts);

// Reaction routes
postRoutes.post("/:postId/reaction", verifyToken, toggleReaction);

// Update and delete posts
postRoutes.put("/:postId", verifyToken, updatePost);
postRoutes.delete("/:postId", verifyToken, deletePost);

export default postRoutes;

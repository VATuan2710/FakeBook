import { Router } from "express";

import {
  createPost,
  getAllPosts,
  getUserPosts,
  toggleReaction,
  deletePost,
  updatePost,
  createComment,
  getPostComments,
  toggleCommentReaction,
  sharePost,
  deleteComment,
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

// Comment routes
postRoutes.post("/:postId/comment", verifyToken, createComment);
postRoutes.get("/:postId/comments", verifyToken, getPostComments);
postRoutes.post("/comments/:commentId/reaction", verifyToken, toggleCommentReaction);
postRoutes.delete("/comments/:commentId", verifyToken, deleteComment);

// Share routes
postRoutes.post("/:postId/share", verifyToken, sharePost);

// Update and delete posts
postRoutes.put("/:postId", verifyToken, updatePost);
postRoutes.delete("/:postId", verifyToken, deletePost);

export default postRoutes;

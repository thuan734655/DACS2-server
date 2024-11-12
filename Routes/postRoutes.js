import express from "express";
import {
  createPost,
  likePost,
  getLikes,
  getAllPosts,
  addComment,
  replyToComment,
} from "../controllers/postController.js";
import { uploadMultiple } from "../middlewares/upload.js"; // Import middleware cho upload nhiều file

const router = express.Router();

// Route tạo bài viết (hỗ trợ upload nhiều file)
router.post("/posts", uploadMultiple, createPost);  // Upload multiple files for creating posts

// Route lấy tất cả các bài viết với thông tin người dùng
router.get("/posts", getAllPosts);  // Get all posts

// Route thích bài viết
router.post("/posts/:postId/like", likePost);  // Like a post

// Route lấy danh sách người đã thích bài viết
router.get("/posts/:postId/likes", getLikes);  // Get users who liked a post

// Route thêm bình luận vào bài viết
router.post("/posts/:postId/comments", addComment);  // Add a comment to a post

// Route trả lời bình luận
router.post("/posts/:postId/comments/:commentId/reply", replyToComment);  // Reply to a comment

export default router;

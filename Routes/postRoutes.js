// routes/postRoutes.js
import express from "express";
import {
  createPost,
  likePost,
  getLikes,
  getAllPosts,
} from "../controllers/postController.js";
import { uploadMultiple } from "../middlewares/upload.js"; // Import middleware cho upload nhiều file

const router = express.Router();

// Route tạo bài viết (hỗ trợ upload nhiều file)
router.post("/posts", uploadMultiple, createPost);
router.get("/posts", getAllPosts);

// Route thích bài viết
router.post("/posts/:postId/like", likePost);

// Route lấy danh sách người đã thích bài viết
router.get("/posts/:postId/likes", getLikes);

export default router;

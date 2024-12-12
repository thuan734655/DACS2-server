const express = require("express");
const {
  createPost,
  likePost,
  getLikes,
  getAllPosts,
  addComment,
  replyToComment,
} = require("../controllers/postController");
const { uploadMultiple } = require("../middlewares/upload"); // Import middleware cho upload nhiều file

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
router.post("/posts/:postId/comments/:commentId/replies", replyToComment);  // Reply to a comment

module.exports = router;

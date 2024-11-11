// controllers/postController.js
import Post from "../models/postModel.js";

// Đăng bài viết
export const createPost = async (req, res) => {
  const { text, userId } = req.body;
  // Kiểm tra xem có tệp nào được tải lên hay không
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  // Tạo mảng các đường dẫn media (cho ảnh và video)
  const mediaUrls = req.files.map((file) => `/images/${file.filename}`);

  const newPost = {
    text,
    userId,
    mediaUrls,
    likes: {},
    shares: 0,
    comments: [],
    createdAt: Date.now(),
  };

  try {
    await Post.createPost(newPost);
    res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to create post", error });
  }
};

// Thích bài viết
export const likePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body; // userId là người thích bài viết

  try {
    await Post.likePost(postId, userId);
    res.status(200).json({ message: "Post liked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách người đã thích bài viết
export const getLikes = async (req, res) => {
  const { postId } = req.params;

  try {
    const likes = await Post.getLikes(postId);
    res.status(200).json({ likes });
  } catch (error) {
    res.status(500).json({ message: "Failed to get likes", error });
  }
};

// Trả lời bình luận
export const replyToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { userId, text } = req.body; // userId là người trả lời và text là nội dung trả lời

  const replyData = {
    userId,
    text,
    createdAt: Date.now(),
  };

  try {
    await Post.replyToComment(postId, commentId, replyData);
    res.status(200).json({ message: "Reply added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  const result =  Post.getAllPosts();
  result
    .then((data) => {
      res.status(200).json({ data });
    })
    .catch((data) => {
      console.log("err");
    });
  return res;
};

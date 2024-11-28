import Post from "../models/postModel.js";
import UserModel from "../models/userModel.js";
import { handleResponse } from "../utils/createResponse.js";

// Tạo bài viết mới
export const createPost = async (req, res) => {
  const { text, idUser, textColor, backgroundColor, comments, likes } = req.body;

  let mediaUrls;
  if (!req.files || req.files.length === 0) {
    mediaUrls = null;
  } else {
    mediaUrls = req.files.map((file) => `/images/${file.filename}`);
  }

  const newPost = {
    text,
    idUser,
    textColor,
    backgroundColor,
    mediaUrls,
    likes: likes || {}, // Đảm bảo likes là một đối tượng
    shares: 0,
    comments: comments || [], // Đảm bảo comments là một mảng
    createdAt: Date.now(),
  };

  try {
    const postId = await Post.createPost(newPost); // Tạo bài viết và lấy ID bài viết
    return handleResponse(res, 201, true, "Post created successfully", { postId });
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to create post", error);
  }
};

// Thích bài viết
export const likePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body; // userId là người thích bài viết

  try {
    const result = await Post.likePost(postId, userId);
    return handleResponse(res, 200, true, "Post liked", { result });
  } catch (error) {
    return handleResponse(res, 500, false, error.message);
  }
};

// Lấy danh sách người đã thích bài viết
export const getLikes = async (req, res) => {
  const { postId } = req.params;

  try {
    const likes = await Post.getLikes(postId);
    return handleResponse(res, 200, true, "Likes retrieved", likes);
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to get likes", error);
  }
};

// Thêm bình luận vào bài viết
export const addComment = async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body; // comment là nội dung bình luận

  const commentData = {
    userId: comment.userId, // userId của người bình luận
    text: comment.text, // Nội dung bình luận
    createdAt: Date.now(),
  };

  try {
    const commentId = await Post.addComment(postId, commentData); // Thêm bình luận vào bài viết
    return handleResponse(res, 201, true, "Comment added successfully", { commentId });
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to add comment", error);
  }
};

// Trả lời bình luận
export const replyToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { reply } = req.body; // reply chứa thông tin phản hồi

  const replyData = {
    userId: reply.userId,
    text: reply.text,
    createdAt: Date.now(),
  };

  try {
    const replyId = await Post.replyToComment(postId, commentId, replyData); // Thêm phản hồi vào bình luận
    return handleResponse(res, 201, true, "Reply added successfully", { replyId });
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to add reply", error);
  }
};

// Lấy tất cả bài viết
export const getAllPosts = async (req, res) => {
  try {
    const postsData = await Post.getAllPosts();
    if (!postsData || Object.keys(postsData).length === 0) {
      return handleResponse(res, 404, false, "No posts found");
    }
    const postInfo = await Promise.all(
      Object.keys(postsData).map(async (postId) => {
        const idUser = postsData[postId].idUser;
        const infoUser = await UserModel.getInfoByIdUser(idUser); // Lấy thông tin người dùng

        return { postId, post: postsData[postId], user: infoUser[0] };
      })
    );

    return handleResponse(res, 200, true, "Posts retrieved successfully", postInfo);
  } catch (err) {
    console.log("Error fetching posts:", err);
    return handleResponse(res, 500, false, "Error fetching posts", err);
  }
};

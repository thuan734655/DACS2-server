const Post = require("../models/postModel");
const { handleResponse } = require("../utils/createResponse");

// Tạo bài viết mới
const createPost = async (req, res) => {
  const { text, idUser, textColor, backgroundColor, comments } = req.body;

  let mediaUrls;
  if (!req.files || req.files.length === 0) {
    mediaUrls = null;
  } else {
    mediaUrls = req.files.map((file) => `/images/${file.filename}`);
  }

  try {
    const newPost = {
      text,
      idUser,
      textColor,
      backgroundColor,
      mediaUrls,
      likes: {
        "👍": 0,
        "❤️": 0,
        "😂": 0,
        "😢": 0,
        "😡": 0,
        "😲": 0,
        "🥳": 0,
      },
      shares: 0,
      comments: comments ? [] : 0, // Đảm bảo comments là một mảng
      createdAt: Date.now(),
    };

    const postId = await Post.createPost(newPost); // Tạo bài viết và lấy ID bài viết
    return handleResponse(res, 201, true, "Post created successfully", {
      postId,
    });
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to create post", error);
  }
};

// Lấy danh sách người đã thích bài viết
const getLikes = async (postId) => {
  try {
    const likes = await Post.getLikes(postId);
    return likes;
  } catch (error) {
    console.log("error when get likes ");
  }
};

// Thêm bình luận vào bài viết
const addComment = async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body; // comment là nội dung bình luận

  const commentData = {
    userId: comment.userId, // userId của người bình luận
    text: comment.text, // Nội dung bình luận
    createdAt: Date.now(),
  };

  try {
    const commentId = await Post.addComment(postId, commentData); // Thêm bình luận vào bài viết
    return handleResponse(res, 201, true, "Comment added successfully", {
      commentId,
    });
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to add comment", error);
  }
};

// Trả lời bình luận
const replyToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { reply } = req.body; // reply chứa thông tin phản hồi

  const replyData = {
    userId: reply.userId,
    text: reply.text,
    createdAt: Date.now(),
  };

  try {
    const replyId = await Post.replyToComment(postId, commentId, replyData); // Thêm phản hồi vào bình luận
    return handleResponse(res, 201, true, "Reply added successfully", {
      replyId,
    });
  } catch (error) {
    return handleResponse(res, 500, false, "Failed to add reply", error);
  }
};

// Lấy tất cả bài viết
// export const getAllPosts = async (req, res) => {
//   try {
//     const postsData = await Post.getAllPosts();
//     if (!postsData || Object.keys(postsData).length === 0) {
//       return handleResponse(res, 404, false, "No posts found");
//     }
//     const postInfo = await Promise.all(
//       Object.keys(postsData).map(async (postId) => {
//         const idUser = postsData[postId].idUser;
//         const infoUser = await UserModel.getInfoByIdUser(idUser); // Lấy thông tin người dùng

//         return { postId, post: postsData[postId], user: infoUser[0] };
//       })
//     );

//     return handleResponse(
//       res,
//       200,
//       true,
//       "Posts retrieved successfully",
//       postInfo
//     );
//   } catch (err) {
//     console.log("Error fetching posts:", err);
//     return handleResponse(res, 500, false, "Error fetching posts", err);
//   }
// };

// Thích bài viết với emoji cụ thể, không cần `res` cho WebSocket
const likePost = async (postId, emoji, idUser) => {
  // Kiểm tra nếu emoji không thuộc danh sách emoji hợp lệ
  const validEmojis = ["👍", "❤️", "😂", "😢", "😡", "😲", "🥳"];
  if (!validEmojis.includes(emoji)) {
    return handleResponse(res, 400, false, "Invalid emoji");
  }

  try {
    // Gọi phương thức likePost từ model Post để cập nhật trong cơ sở dữ liệu
    const updatedLikes = await Post.likePost(postId, emoji, idUser);

    // Kiểm tra nếu việc cập nhật không thành công
    if (!updatedLikes) {
      return "Failed to update like";
    }

    // Trả về kết quả đã được cập nhật (số lượng likes mới)
    return (
      "Post liked successfully",
      {
        updatedLikes,
      }
    );
  } catch (error) {
    // Bắt lỗi và trả về phản hồi
    console.error("Error liking post:", error);
  }
};

// Lấy tất cả bài viết
const getAllPosts = async (req, res) => {
  try {
    const postsData = await Post.getAllPosts();
    if (!postsData || Object.keys(postsData).length === 0) {
      return handleResponse(res, 404, false, "No posts found");
    }
    const postInfo = Object.entries(postsData)[0][0];
    console.log(postsData[postInfo].comments);

    return handleResponse(
      res,
      200,
      true,
      "Posts retrieved successfully",
      postsData
    );
  } catch (err) {
    console.log("Error fetching posts:", err);
    return handleResponse(res, 500, false, "Error fetching posts", err);
  }
};

module.exports = {
  createPost,
  getLikes,
  addComment,
  replyToComment,
  likePost,
  getAllPosts,
};

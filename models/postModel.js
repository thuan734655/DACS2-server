import db from "../config/firebaseConfig.js";
import UserModel from "./userModel.js";

class Post {
  // Tạo bài viết mới
  static async createPost(postData) {
    try {
      const postRef = db.ref("posts").push();
      await postRef.set({ ...postData, comments: [] });
      return postRef.key;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  // Thêm bình luận mới vào bài viết
  static async addComment(commentData) {
    try {
      const { postId, ...commentInfo } = commentData;

      // Tạo comment mới trong bảng `comments`
      const commentRef = db.ref("commentsList").push();
      const commentId = commentRef.key;

      // Lưu dữ liệu comment
      await commentRef.set({
        ...commentInfo,
        postId,
        replies: [], // Ban đầu không có phản hồi
        timestamp: Date.now(),
      });

      // Thêm commentId vào mảng comments của bài viết
      const postCommentsRef = db.ref(`posts/${postId}/comments`);
      await postCommentsRef.transaction((comments) => {
        if (!comments) comments = [];
        comments.push(commentId);
        return comments;
      });

      return commentId;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Thích một bài viết với emoji
  static async likePost(postId, emoji, userId) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const userLikeRef = postRef.child(`likedBy/${userId}`);

      // Lấy emoji hiện tại của người dùng
      const currentEmojiSnapshot = await userLikeRef.once("value");
      const currentEmoji = currentEmojiSnapshot.val();

      if (currentEmoji === emoji) {
        return "duplicate";
      }

      // Tăng lượt thích cho emoji mới
      await postRef
        .child(`likes/${emoji}`)
        .transaction((current) => (current || 0) + 1);

      // Giảm lượt thích cho emoji cũ (nếu có)
      if (currentEmoji) {
        await postRef
          .child(`likes/${currentEmoji}`)
          .transaction((current) => Math.max((current || 1) - 1, 0));
      }

      // Cập nhật emoji mới của người dùng
      await userLikeRef.set(emoji);

      // Trả về lượt thích hiện tại
      const likesSnapshot = await postRef.child("likes").once("value");
      return likesSnapshot.val() || {};
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  }

  // Xóa lượt thích
  static async deleteLike(userId, postId, emoji) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const userLikeRef = postRef.child(`likedBy/${userId}`);

      // Kiểm tra xem người dùng đã thích bằng emoji này chưa
      const currentEmojiSnapshot = await userLikeRef.once("value");
      const currentEmoji = currentEmojiSnapshot.val();

      if (currentEmoji === emoji) {
        // Xóa lượt thích của người dùng
        await userLikeRef.remove();

        // Giảm số lượng thích của emoji
        await postRef.child(`likes/${emoji}`).transaction((current) => {
          const newCount = (current || 1) - 1;
          return newCount > 0 ? newCount : null; // Xóa emoji nếu không còn lượt thích
        });
      }
    } catch (error) {
      console.error("Error deleting like:", error);
      throw error;
    }
  }

  // Lấy toàn bộ bài viết
  static async getAllPosts() {
    try {
      // Lấy tất cả bài viết từ Firebase
      const postsSnapshot = await db.ref("posts").once("value");
      const posts = postsSnapshot.val() || {};

      const infoPost = {};

      // Duyệt qua từng bài viết
      await Promise.all(
        Object.entries(posts).map(async ([postId, post]) => {
          const groupedLikes = {};
          const infoUserList = {};
          const comments = [];

          // Nhóm các lượt thích theo emoji
          if (post.likedBy) {
            for (const [userId, emoji] of Object.entries(post.likedBy)) {
              if (!groupedLikes[emoji]) {
                groupedLikes[emoji] = [];
              }
              groupedLikes[emoji].push(userId);
            }
          }

          // Lấy thông tin người dùng
          if (post.idUser) {
            const [user] = await UserModel.getInfoByIdUser(post.idUser);
            infoUserList[post.idUser] = {
              id: post.idUser,
              ...user[0],
            };
          }

          // Lấy danh sách bình luận của bài viết
          if (post.comments && Array.isArray(post.comments)) {
            for (const commentId of post.comments) {
              const commentSnapshot = await db
                .ref(`commentsList/${commentId}`)
                .once("value");
              const comment = commentSnapshot.val();

              if (comment) {
                const replies = [];
                // Lấy danh sách phản hồi của bình luận
                if (comment.replies && Array.isArray(comment.replies)) {
                  for (const replyId of comment.replies) {
                    const replySnapshot = await db
                      .ref(`replies/${replyId}`)
                      .once("value");
                    const reply = replySnapshot.val();
                    if (reply) {
                      const replyReplies = [];
                      // Lấy phản hồi cho mỗi phản hồi
                      if (reply.replies && Array.isArray(reply.replies)) {
                        for (const replyId2 of reply.replies) {
                          const replyReplySnapshot = await db
                            .ref(`replies/${replyId2}`)
                            .once("value");
                          const replyReply = replyReplySnapshot.val();
                          if (replyReply) replyReplies.push(replyReply);
                        }
                      }

                      // Thêm phản hồi vào danh sách
                      replies.push({
                        ...reply,
                        replies: replyReplies,
                      });
                    }
                  }
                }

                // Thêm bình luận vào danh sách
                comments.push({
                  commentId,
                  ...comment,
                  replies,
                });
              }
            }
          }

          // Thêm bài viết và các thông tin liên quan vào kết quả
          infoPost[postId] = {
            post,
            groupedLikes,
            infoUserList,
            comments,
          };
        })
      );

      return infoPost;
    } catch (error) {
      console.error("Error getting all posts:", error);
      throw error;
    }
  }

  // Trả lời bình luận
  static async replyToComment({ commentId, replyData }) {
    try {
      // Tạo reply mới trong bảng `replies`
      const replyRef = db.ref("replies").push();
      const replyId = replyRef.key;

      // Làm sạch dữ liệu replyData trước khi lưu
      const cleanedReplyData = {
        ...replyData,
        commentId, // Đảm bảo commentId luôn có giá trị
        timestamp: Date.now(),
      };

      // Lưu replyData vào bảng `replies`
      await replyRef.set(cleanedReplyData);

      // Thêm replyId vào mảng replies của comment
      const commentRepliesRef = db.ref(`commentsList/${commentId}/replies`);
      await commentRepliesRef.transaction((replies) => {
        if (!replies) replies = [];
        // Thêm replyId vào mảng replies của comment
        replies.push(replyId);
        return replies;
      });

      return replyId;
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  }

  // Trả lời một phản hồi (reply to reply)
  static async replyToReply({ replyId, replyData }) {
    try {
      // Tạo reply mới trong bảng `replies`
      const replyRef = db.ref("replies").push();
      const newReplyId = replyRef.key;

      await replyRef.set({ ...replyData, replyId, timestamp: Date.now() });

      // Thêm newReplyId vào mảng replies của reply
      const replyRepliesRef = db.ref(`replies/${replyId}/replies`);
      await replyRepliesRef.transaction((replies) => {
        if (!replies) replies = [];
        replies.push(newReplyId);
        return replies;
      });

      return newReplyId;
    } catch (error) {
      console.error("Error replying to reply:", error);
      throw error;
    }
  }

  // Lấy bình luận của bài viết
  static async getComments(postId) {
    try {
      const commentsRef = db.ref(`posts/${postId}/comments`);
      const snapshot = await commentsRef.once("value");
      const commentIds = snapshot.val() || [];

      const comments = await Promise.all(
        commentIds.map(async (commentId) => {
          const commentSnapshot = await db
            .ref(`commentsList/${commentId}`)
            .once("value");
          return commentSnapshot.val();
        })
      );

      return comments;
    } catch (error) {
      console.error("Error getting comments:", error);
      throw error;
    }
  }

  // Lấy trả lời của bình luận
  static async getReplies(commentId) {
    try {
      const repliesRef = db.ref(`commentsList/${commentId}/replies`);
      const snapshot = await repliesRef.once("value");
      const replyIds = snapshot.val() || [];

      const replies = await Promise.all(
        replyIds.map(async (replyId) => {
          const replySnapshot = await db
            .ref(`replies/${replyId}`)
            .once("value");
          return replySnapshot.val();
        })
      );

      return replies;
    } catch (error) {
      console.error("Error getting replies:", error);
      throw error;
    }
  }
}

export default Post;

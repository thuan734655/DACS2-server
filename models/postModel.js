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

      const commentRef = db.ref("commentsList").push();
      const commentId = commentRef.key;

      await commentRef.set({
        ...commentInfo,
        postId,
        replies: [],
        timestamp: Date.now(),
      });

      await db
        .ref(`posts/${postId}/comments`)
        .transaction((comments) => [...(comments || []), commentId]);

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
      const currentEmoji = (await userLikeRef.once("value")).val();

      if (currentEmoji === emoji) return "duplicate";

      await postRef
        .child(`likes/${emoji}`)
        .transaction((count) => (count || 0) + 1);

      if (currentEmoji) {
        await postRef
          .child(`likes/${currentEmoji}`)
          .transaction((count) => Math.max((count || 1) - 1, 0));
      }

      await userLikeRef.set(emoji);

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
      const currentEmoji = (await userLikeRef.once("value")).val();

      if (currentEmoji === emoji) {
        await userLikeRef.remove();
        await postRef
          .child(`likes/${emoji}`)
          .transaction((count) => (count > 1 ? count - 1 : null));
      }
    } catch (error) {
      console.error("Error deleting like:", error);
      throw error;
    }
  }

  // Lấy toàn bộ bài viết
  static async getAllPosts() {
    try {
      const postsSnapshot = await db.ref("posts").once("value");
      const posts = postsSnapshot.val() || {};
      const infoPost = {};

      await Promise.all(
        Object.entries(posts).map(async ([postId, post]) => {
          const groupedLikes = {};
          const infoUserList = {};
          const comments = [];

          // Xử lý likedBy
          if (post.likedBy) {
            for (const [userId, emoji] of Object.entries(post.likedBy)) {
              if (!groupedLikes[emoji]) groupedLikes[emoji] = [];
              groupedLikes[emoji].push(userId);
            }
          }

          // Lấy thông tin user của bài viết
          if (post.idUser) {
            const [user] = await UserModel.getInfoByIdUser(post.idUser);
            infoUserList[post.idUser] = { id: post.idUser, ...user[0] };
          }

          // Hàm đệ quy để lấy tất cả các replies
          const fetchReplies = async (replyIds) => {
            if (!replyIds || replyIds.length === 0) return [];

            const replies = await Promise.all(
              replyIds.map(async (replyId) => {
                const replySnapshot = await db
                  .ref(`replies/${replyId}`)
                  .once("value");
                const reply = replySnapshot.val();

                if (reply) {
                  // Đệ quy để lấy replies con của reply hiện tại
                  const nestedReplies = await fetchReplies(reply.replies || []);
                  return { ...reply, replies: nestedReplies };
                }
                return null;
              })
            );

            // Loại bỏ null trong trường hợp reply không tồn tại
            return replies.filter((reply) => reply !== null);
          };

          // Lấy danh sách comments và replies của từng comment
          if (Array.isArray(post.comments)) {
            for (const commentId of post.comments) {
              const commentSnapshot = await db
                .ref(`commentsList/${commentId}`)
                .once("value");
              const comment = commentSnapshot.val();

              if (comment) {
                // Gọi hàm đệ quy để lấy replies của comment
                const replies = await fetchReplies(comment.replies || []);
                comments.push({ commentId, ...comment, replies });
              }
            }
          }

          // Đưa dữ liệu đã xử lý vào infoPost
          infoPost[postId] = { post, groupedLikes, infoUserList, comments };
        })
      );

      return infoPost;
    } catch (error) {
      console.error("Error getting all posts:", error);
      throw error;
    }
  }

  // Trả lời bình luận
  static async replyToComment({ commentId, newReplyData }) {
    try {
      const replyRef = db.ref("replies").push();
      const replyId = replyRef.key;

      await replyRef.set({ ...newReplyData, replyId, commentId });

      await db
        .ref(`commentsList/${commentId}/replies`)
        .transaction((replies) => [...(replies || []), replyId]);

      return replyId;
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  }

  // Trả lời một phản hồi (reply to reply)
  static async replyToReply({ replyId, newReplyData }) {
    try {
      const replyRef = db.ref("replies").push();
      const newReplyId = replyRef.key;

      await replyRef.set({ ...newReplyData, replyId: newReplyId });

      await db
        .ref(`replies/${replyId}/replies`)
        .transaction((replies) => [...(replies || []), newReplyId]);

      return newReplyId;
    } catch (error) {
      console.error("Error replying to reply:", error);
      throw error;
    }
  }

  // Lấy bình luận của bài viết
  static async getComments(postId) {
    try {
      const commentIds =
        (await db.ref(`posts/${postId}/comments`).once("value")).val() || [];
      return await Promise.all(
        commentIds.map(async (commentId) => {
          const commentSnapshot = await db
            .ref(`commentsList/${commentId}`)
            .once("value");
          return commentSnapshot.val();
        })
      );
    } catch (error) {
      console.error("Error getting comments:", error);
      throw error;
    }
  }

  // Lấy trả lời của bình luận
  static async getReplies(commentId) {
    try {
      const replyIds =
        (
          await db.ref(`commentsList/${commentId}/replies`).once("value")
        ).val() || [];
      return await Promise.all(
        replyIds.map(async (replyId) => {
          const replySnapshot = await db
            .ref(`replies/${replyId}`)
            .once("value");
          return replySnapshot.val();
        })
      );
    } catch (error) {
      console.error("Error getting replies:", error);
      throw error;
    }
  }
}

export default Post;

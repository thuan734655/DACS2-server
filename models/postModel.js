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
  // Lấy danh sách người đã thích bài viết
  static async getLikes(postId) {
    try {
      const postRef = db.ref("posts").child(postId).child("likedBy");
      const snapshot = await postRef.once("value");

      const likes = snapshot.val() || {};
      console.log(likes);
      return likes;
    } catch (error) {
      throw new Error("Error fetching likes: " + error.message);
    }
  }
  // Thích một bài viết với emoji
  static async likePost(postId, emoji, idUser) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const userLikeRef = postRef.child(`likedBy/${idUser}`);
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

  static async getAllPosts() {
    try {
      // Lấy tất cả các bài viết từ Firebase
      const postsSnapshot = await db.ref("posts").once("value");
      const posts = postsSnapshot.val() || {};
      const infoPost = {};

      await Promise.all(
        Object.entries(posts).map(async ([postId, post]) => {
          const groupedLikes = {}; // Chứa thông tin like theo emoji
          const infoUserList = {}; // Thông tin người dùng
          let commentCount = 0; // Số lượng bình luận
          let replyCount = 0; // Số lượng phản hồi

          // Xử lý thông tin lượt thích (like) theo emoji
          if (post.likedBy) {
            for (const [userId, emoji] of Object.entries(post.likedBy)) {
              if (!groupedLikes[emoji]) groupedLikes[emoji] = [];
              groupedLikes[emoji].push(userId);
            }
          }

          // Lấy thông tin người dùng của bài viết
          if (post.idUser) {
            const [user] = await UserModel.getInfoByIdUser(post.idUser);
            infoUserList[post.idUser] = { id: post.idUser, ...user[0] };
          }

          // Hàm đệ quy để đếm số lượng phản hồi (replies)
          const countReplies = async (replyIds) => {
            if (!replyIds || replyIds.length === 0) return 0;

            const replies = await Promise.all(
              replyIds.map(async (replyId) => {
                const replySnapshot = await db
                  .ref(`replies/${replyId}`)
                  .once("value");
                const reply = replySnapshot.val();
                if (reply) {
                  // Đệ quy để đếm các replies con của reply hiện tại
                  const nestedReplies = await countReplies(reply.replies || []);
                  return nestedReplies + 1; // Đếm reply hiện tại
                }
                return 0;
              })
            );

            // Trả về tổng số reply
            return replies.reduce((total, count) => total + count, 0);
          };

          // Đếm số lượng comment và reply của từng comment
          if (Array.isArray(post.comments)) {
            commentCount = post.comments.length; // Số lượng bình luận

            // Đếm số lượng replies cho từng bình luận
            for (const commentId of post.comments) {
              const commentSnapshot = await db
                .ref(`commentsList/${commentId}`)
                .once("value");
              const comment = commentSnapshot.val();
              if (comment) {
                // Đếm replies cho bình luận
                const replies = await countReplies(comment.replies || []);
                replyCount += replies;
              }
            }
          }

          // Đưa dữ liệu đã xử lý vào infoPost (chỉ chứa số lượng comment và reply)
          infoPost[postId] = {
            post,
            groupedLikes,
            infoUserList,
            commentCount: commentCount + replyCount,
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
      // Lấy danh sách ID của các bình luận cho bài viết từ "posts/{postId}/comments"
      const commentIds =
        (await db.ref(`posts/${postId}/comments`).once("value")).val() || [];
      // Hàm đệ quy để lấy tất cả các trả lời của bình luận
      const getRepliesRecursively = async (replyIds) => {
        try {
          // Nếu không có trả lời, trả về mảng rỗng
          if (!replyIds || replyIds.length === 0) return [];

          // Dùng Promise.all để xử lý tất cả các reply đồng thời
          const replies = await Promise.all(
            replyIds.map(async (replyId) => {
              // Lấy dữ liệu của từng reply từ "replies/{replyId}"
              const replySnapshot = await db
                .ref(`replies/${replyId}`)
                .once("value");

              const reply = replySnapshot.val();

              // Lấy thông tin người dùng của reply
              const userInfo = await UserModel.getInfoByIdUser(reply.idUser);
              console.log(userInfo, reply, 124);
              reply.user = userInfo[0]; // Gán thông tin người dùng vào reply

              // Nếu reply có trả lời con (nested replies), gọi đệ quy để lấy các trả lời con
              if (reply.replies && reply.replies.length > 0) {
                reply.replies = await getRepliesRecursively(reply.replies); // Gọi đệ quy để lấy các trả lời con
              }

              return reply; // Trả về reply với trả lời con nếu có
            })
          );

          return replies; // Trả về mảng các reply đã được xử lý
        } catch (error) {
          console.error("Error getting replies:", error);
          throw error;
        }
      };
      // Sử dụng Promise.all để xử lý tất cả các comment đồng thời
      return await Promise.all(
        commentIds.map(async (commentId) => {
          // Lấy dữ liệu của bình luận từ "commentsList/{commentId}"
          const commentSnapshot = await db
            .ref(`commentsList/${commentId}`)
            .once("value");

          const comment = commentSnapshot.val();

          // Lấy thông tin người dùng từ cơ sở dữ liệu qua idUser
          const userInfo = await UserModel.getInfoByIdUser(comment.idUser);
          comment.user = userInfo[0]; // Gán thông tin người dùng vào bình luận

          // Nếu bình luận có trả lời, gọi đệ quy để lấy các trả lời (replies)
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = await getRepliesRecursively(comment.replies); // Gọi hàm đệ quy để lấy các trả lời
          }

          return comment; // Trả về bình luận đã có thông tin người dùng và trả lời
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

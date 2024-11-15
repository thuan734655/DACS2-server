import db from "../config/firebaseConfig.js";

class Post {
  // Tạo bài viết mới
  static async createPost(postData) {
    try {
      const postRef = db.ref("posts");
      const newPostRef = postRef.push();
      await newPostRef.set(postData);
      return newPostRef.key;
    } catch (error) {
      throw new Error("Error creating post: " + error.message);
    }
  }

  // Thêm bình luận vào bài viết
  static async addComment(postId, commentData) {
    try {
      const commentRef = db.ref("posts").child(postId).child("comments");
      const newCommentRef = commentRef.push();
      await newCommentRef.set(commentData);
      return newCommentRef.key;
    } catch (error) {
      throw new Error("Error adding comment: " + error.message);
    }
  }

  // Thích bài viết với emoji// Thích bài viết với emoji
  static async likePost(postId, emoji, userId) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const likesRef = postRef.child("likes");
      const likedByRef = postRef.child("likedBy");

      // Lấy emoji hiện tại mà người dùng đã thích
      const likedBySnapshot = await likedByRef.child(userId).once("value");
      const userLikedEmoji = likedBySnapshot.val();

      if (userLikedEmoji === emoji) {
        // Nếu người dùng đã thích với cùng emoji trước đó, không cần cập nhật gì thêm
        throw new Error("User has already liked this post with the same emoji");
      } else if (userLikedEmoji) {
        // Nếu người dùng đã thích với emoji khác, giảm số lượng của emoji đó
        await likesRef.child(userLikedEmoji).transaction((currentValue) => {
          return (currentValue || 1) - 1;
        });
      }

      // Tăng số lượng cho emoji mới
      await likesRef.child(emoji).transaction((currentValue) => {
        return (currentValue || 0) + 1;
      });

      // Cập nhật emoji mới cho người dùng
      await likedByRef.update({ [userId]: emoji });

      // Lấy lại số lượng like để trả về
      const updatedLikesSnapshot = await likesRef.once("value");
      const updatedLikes = updatedLikesSnapshot.val();

      return updatedLikes;
    } catch (error) {
      throw new Error("Error liking post: " + error.message);
    }
  }

  // Lấy danh sách người đã thích bài viết
  static async getLikes(postId) {
    try {
      const postRef = db.ref("posts").child(postId).child("likes");
      const snapshot = await postRef.once("value");
      const likes = snapshot.val() || {};
      return likes;
    } catch (error) {
      throw new Error("Error fetching likes: " + error.message);
    }
  }

  // Lấy tất cả bài viết
  static async getAllPosts() {
    try {
      const postsRef = db.ref("posts");
      const snapshot = await postsRef.once("value");
      const posts = snapshot.val() || {};
      return posts;
    } catch (error) {
      throw new Error("Error fetching posts: " + error.message);
    }
  }

  // Chia sẻ bài viết
  static async sharePost(postId) {
    try {
      const postRef = db.ref("posts").child(postId);
      const snapshot = await postRef.once("value");
      const post = snapshot.val();

      if (post) {
        const updatedShares = post.shares ? post.shares + 1 : 1;
        await postRef.update({ shares: updatedShares });
        return true;
      }
      throw new Error("Post not found");
    } catch (error) {
      throw new Error("Error sharing post: " + error.message);
    }
  }

  // Trả lời bình luận
  static async replyToComment(postId, commentId, replyData) {
    try {
      const replyRef = db
        .ref("posts")
        .child(postId)
        .child("comments")
        .child(commentId)
        .child("replies");
      const newReplyRef = replyRef.push();
      await newReplyRef.set(replyData);
      return newReplyRef.key;
    } catch (error) {
      throw new Error("Error replying to comment: " + error.message);
    }
  }

  // Lấy tất cả bình luận của bài viết
  static async getComments(postId) {
    try {
      const commentsRef = db.ref("posts").child(postId).child("comments");
      const snapshot = await commentsRef.once("value");
      const comments = snapshot.val() || {};
      return comments;
    } catch (error) {
      throw new Error("Error fetching comments: " + error.message);
    }
  }

  // Lấy tất cả phản hồi của một bình luận
  static async getReplies(postId, commentId) {
    try {
      const repliesRef = db
        .ref("posts")
        .child(postId)
        .child("comments")
        .child(commentId)
        .child("replies");
      const snapshot = await repliesRef.once("value");
      const replies = snapshot.val() || {};
      return replies;
    } catch (error) {
      throw new Error("Error fetching replies: " + error.message);
    }
  }
}

export default Post;

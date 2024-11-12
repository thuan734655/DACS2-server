import db from "../config/firebaseConfig.js";

class Post {
  // Tạo bài viết mới
  static async createPost(postData) {
    try {
      const postRef = db.ref("posts");
      const newPostRef = postRef.push(); // Tạo ID tự động cho bài viết
      await newPostRef.set(postData); // Lưu dữ liệu bài viết vào Firebase
      return newPostRef.key; // Trả về ID của bài viết vừa tạo
    } catch (error) {
      throw new Error("Error creating post: " + error.message);
    }
  }

  // Thêm bình luận vào bài viết
  static async addComment(postId, commentData) {
    try {
      const commentRef = db.ref("posts").child(postId).child("comments");
      const newCommentRef = commentRef.push(); // Tạo ID tự động cho bình luận
      await newCommentRef.set(commentData); // Lưu dữ liệu bình luận vào Firebase
      return newCommentRef.key; // Trả về ID của bình luận vừa tạo
    } catch (error) {
      throw new Error("Error adding comment: " + error.message);
    }
  }

  // Người dùng thích bài viết
  static async likePost(postId, userId) {
    try {
      const postRef = db.ref("posts").child(postId);
      const snapshot = await postRef.once("value");
      const post = snapshot.val();

      if (post && post.likes && !post.likes[userId]) {
        // Nếu chưa thích, thêm vào likes
        await postRef.child("likes").update({ [userId]: true });
        return true;
      } else if (post && post.likes && post.likes[userId]) {
        // Nếu đã thích rồi
        throw new Error("User already liked this post");
      } else {
        // Nếu bài viết không tồn tại
        throw new Error("Post not found");
      }
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
      return Object.keys(likes); // Trả về danh sách userIds đã thích bài viết
    } catch (error) {
      throw new Error("Error fetching likes: " + error.message);
    }
  }

  // Lấy tất cả bài viết
  static async getAllPosts() {
    try {
      const postsRef = db.ref("posts");
      const snapshot = await postsRef.once("value");
      const posts = snapshot.val() || {}; // Nếu không có bài viết, trả về đối tượng trống
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
        const updatedShares = post.shares ? post.shares + 1 : 1; // Nếu không có lượt chia sẻ, khởi tạo là 1
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
      const newReplyRef = replyRef.push(); // Tạo ID tự động cho phản hồi
      await newReplyRef.set(replyData); // Lưu dữ liệu phản hồi vào Firebase
      return newReplyRef.key; // Trả về ID của phản hồi
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

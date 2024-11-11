// models/postModel.js
import db from "../config/firebaseConfig.js";

class Post {
  static async createPost(postData) {
    const postRef = db.ref("posts");
    return postRef.push(postData);
  }

  static async addComment(postId, commentData) {
    const commentRef = db.ref("posts").child(postId).child("comments");
    return commentRef.push(commentData);
  }

  static async likePost(postId, userId) {
    const postRef = db.ref("posts").child(postId);
    const snapshot = await postRef.once("value");
    const post = snapshot.val();

    if (post && !post.likes[userId]) {
      await postRef.child("likes").update({ [userId]: true });
      return true;
    }
    throw new Error("User already liked this post or post not found");
  }

  static async getLikes(postId) {
    const postRef = db.ref("posts").child(postId).child("likes");
    const snapshot = await postRef.once("value");
    const likes = snapshot.val() || {};
    return Object.keys(likes); // Return list of userIds who liked the post
  }
  static async getAllPosts() {
    const postsRef = db.ref("posts"); // Tham chiếu đến tất cả các bài viết trong 'posts'
    const snapshot = await postsRef.once("value"); // Lấy dữ liệu một lần từ 'posts'

    const posts = snapshot.val() || {}; // Nếu không có dữ liệu, trả về đối tượng trống
    console.log(posts);
    return posts; // Trả về danh sách các bài viết dưới dạng đối tượng
  }

  static async sharePost(postId) {
    const postRef = db.ref("posts").child(postId);
    const snapshot = await postRef.once("value");
    const post = snapshot.val();

    if (post) {
      const updatedShares = post.shares + 1;
      await postRef.update({ shares: updatedShares });
      return true;
    }
    throw new Error("Post not found");
  }

  static async replyToComment(postId, commentId, replyData) {
    const replyRef = db
      .ref("posts")
      .child(postId)
      .child("comments")
      .child(commentId)
      .child("replies");
    return replyRef.push(replyData);
  }
}

export default Post;

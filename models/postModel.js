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
      console.log(userLikedEmoji, emoji);
      if (userLikedEmoji === emoji) {
        return "duplicate";
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
  static async deleteLike(idUser, postId, emoji) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const likedByRef = postRef.child("likedBy");
      const likesRef = postRef.child("likes");

      // Kiểm tra giá trị của likedBy[idUser]
      console.log("Checking likedBy for idUser:", idUser);
      const userReactionSnapshot = await likedByRef.child(idUser).get();
      console.log(
        "User reaction snapshot exists:",
        userReactionSnapshot.exists()
      );
      if (!userReactionSnapshot.exists()) {
        console.warn("User has not liked this post.");
        return; // Dừng nếu user chưa like
      }

      const userReaction = userReactionSnapshot.val(); // Emoji mà user đã like
      console.log("User reaction value:", userReaction);

      // Chỉ giảm lượt like nếu emoji khớp
      if (userReaction === emoji) {
        // Lấy giá trị hiện tại của emoji trong likes
        const emojiSnapshot = await likesRef.child(emoji).get();
        if (emojiSnapshot.exists()) {
          const currentCount = emojiSnapshot.val() || 0;

          // Giảm số lượt like nếu giá trị lớn hơn 0
          if (currentCount > 0) {
            console.log("Decreasing like count for emoji:", emoji);
            await likesRef.child(emoji).set(currentCount - 1);
          }
        }

        // Xóa user khỏi likedBy
        console.log("Removing user from likedBy:", idUser);
        await likedByRef.child(idUser).remove();
      } else {
        console.warn("User reaction does not match the provided emoji.");
      }
    } catch (error) {
      throw new Error("Error deleting like: " + error.message);
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
  static async getAllPosts() {
    try {
      const postsRef = db.ref("posts");
      const snapshot = await postsRef.once("value");
      const posts = snapshot.val() || {};

      // Khởi tạo đối tượng để lưu thông tin bài viết và nhóm likes
      const postsWithGroupedLikes = {};

      // Duyệt qua tất cả các bài viết
      for (const postId in posts) {
        const post = posts[postId];

        // Khởi tạo đối tượng nhóm likes cho bài viết này
        const groupedLikes = {};

        // Kiểm tra nếu bài viết có trường likedBy
        if (post.likedBy) {
          // Duyệt qua likedBy để nhóm idUser theo emoji
          for (const userId in post.likedBy) {
            const emoji = post.likedBy[userId];

            // Nếu emoji chưa có trong groupedLikes, tạo mới mảng cho nó
            if (!groupedLikes[emoji]) {
              groupedLikes[emoji] = [];
            }

            // Thêm userId vào mảng thích emoji này
            groupedLikes[emoji].push(userId);
          }
        }

        // Lưu thông tin bài viết và nhóm like vào đối tượng postsWithGroupedLikes
        postsWithGroupedLikes[postId] = {
          post: post, // Thông tin bài viết
          groupedLikes: groupedLikes, // Nhóm các idUser theo emoji
        };
      }

      // Trả về kết quả đã được nhóm
      return postsWithGroupedLikes;
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

import db from "../config/firebaseConfig.js";
import UserModel from "./userModel.js";

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
  static async addComment(commentData) {
    const { postId } = commentData;
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

      const infoPost = {};

      for (const postId in posts) {
        const post = posts[postId];

        const infoUserList = {};
        const groupedLikes = {};

        //get info user
        if (post.idUser) {
          const infoUser = await UserModel.getInfoByIdUser(post.idUser);
          infoUserList[post.idUser] = infoUser[0];
        }

        if (post.likedBy) {
          for (const userId in post.likedBy) {
            const emoji = post.likedBy[userId];

            if (!groupedLikes[emoji]) {
              groupedLikes[emoji] = [];
            }
            groupedLikes[emoji].push(userId);
          }
        }

        infoPost[postId] = {
          post: post,
          groupedLikes: groupedLikes,
          infoUserList: infoUserList,
        };
      }
      console.log(infoPost);
      return infoPost;
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
  static async replyToComment(postId, commentId, replyID, replyData) {
    try {
      const replyRef = db
        .ref("posts")
        .child(postId)
        .child("comments")
        .child(commentId);
      if (replyID) {
        replyRef.child(replies).child(replyID).child(replies);
      } else {
        replyRef.child(replies);
      }
      const newReplies = replyRef.push;
      await newReplies.set(replyData);
      return newReplies.key;
    } catch (error) {
      throw new Error("Error creating reply: " + error.message);
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

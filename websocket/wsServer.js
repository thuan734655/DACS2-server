import db from "../config/firebaseConfig.js";
import NotificationModel from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import UserModel from "../models/userModel.js";
import handleFileWebSocket from "../utils/handleFileWebSocket.js";

// Track connected users to avoid duplicate connections
const connectedUsers = new Map();

const handleSocketEvents = (socket, io) => {
  // Check if socket is already connected
  if (connectedUsers.has(socket.id)) {
    console.log("Socket already connected:", socket.id);
    return;
  }

  // Add to connected users
  connectedUsers.set(socket.id, true);
  console.log("User connected:", socket.id);

  socket.on("newPost", async ({ post }) => {
    console.log("Post creation started");
    try {
      // Handle file uploads using existing utility
      let mediaUrls = [];
      if (post.listFileUrl && post.listFileUrl.length > 0) {
        mediaUrls = handleFileWebSocket(post.listFileUrl);
      }

      // Get user info
      const [userInfo] = await UserModel.getInfoByIdUser(post.idUser);

      // Create final post object
      const postData = {
        text: post.text,
        idUser: post.idUser,
        textColor: post.textColor,
        backgroundColor: post.backgroundColor,
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
        comments: [],
        createdAt: Date.now(),
      };

      // Save post to database
      const postId = await Post.createPost(postData);

      // Create response with user info
      const postResponse = {
        postId: postId,
        ...postData,
        infoUserList: {
          [post.idUser]: { id: post.idUser, ...userInfo[0] },
        },
        groupedLikes: {},
        commentCount: 0,
      };

      // Broadcast to all clients
      io.emit("receiveNewPost", { post: postResponse });
      console.log("New post broadcasted successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      socket.emit("postError", { message: "Failed to create post" });
    }
  });

  socket.on("newComment", async (data) => {
    const { postId, idUser, text, listFileUrl, user } = data.comment;

    try {
      const fileUrls = handleFileWebSocket(listFileUrl);

      const commentContainer = {
        postId,
        idUser,
        text,
        fileUrls,
        timestamp: Date.now(),
      };
      const commentId = await Post.addComment(commentContainer);
      const newComment = {
        commentId: commentId,
        postId,
        user: [user],
        ...commentContainer,
      };
      io.emit("receiveComment", { newComment });
      console.log("Bình luận đã được thêm và gửi đi:", newComment);
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  });

  socket.on("replyComment", async ({ commentId, replyData }) => {
    const { postId, idUser, text, listFileUrl, user } = replyData;
    try {
      const fileUrls = handleFileWebSocket(listFileUrl);

      const newReplyData = {
        postId,
        idUser,
        text,
        fileUrls,
        timestamp: Date.now(),
      };
      const replyId = await Post.replyToComment({ commentId, newReplyData });

      const newReply = {
        id: replyId,
        user: [user],
        ...newReplyData,
        timestamp: Date.now(),
      };

      io.emit("receiveReplyToComment", { commentId, newReply });
      console.log("Phản hồi đã được thêm và gửi đi:", newReply);
    } catch (error) {
      console.error("Lỗi khi thêm phản hồi:", error);
    }
  });

  socket.on("replyToReply", async ({ replyId, replyData }) => {
    const { postId, idUser, text, listFileUrl, user } = replyData;
    try {
      const fileUrls = handleFileWebSocket(listFileUrl);
      const newReplyData = {
        postId,
        idUser,
        text,
        fileUrls,
        timestamp: Date.now(),
        replies: [],
      };

      const replyKey = await Post.replyToReply({ replyId, newReplyData });

      const newReply = {
        replyId: replyKey,
        user: Array.isArray(user) ? user : [user],
        ...newReplyData,
        parentReplyId: replyId,
      };

      io.emit("receiveReplyToReply", { replyId, newReply });
      console.log("Reply to reply added successfully:", newReply);
    } catch (err) {
      console.error("Error in reply to reply:", err);
      socket.emit("replyError", {
        message: "Failed to add reply",
        error: err.message,
      });
    }
  });

  socket.on("newReaction", async ({ postId, emoji, idUser }) => {
    try {
      const updatedLikes = await Post.likePost(postId, emoji, idUser);

      if (updatedLikes === "duplicate") {
        await Post.deleteLike(idUser, postId, emoji);
        console.log(`Đã xóa like của người dùng: ${idUser}`);
      }

      const listLikes = await Post.getLikes(postId);

      const groupedLikes = {};
      if (listLikes) {
        Object.entries(listLikes).forEach(([userId, userEmoji]) => {
          if (!groupedLikes[userEmoji]) groupedLikes[userEmoji] = [];
          groupedLikes[userEmoji].push(userId);
        });
      }

      io.emit("receiveReaction", { postId, groupedLikes });

      socket.emit("reactionSuccess", { postId, emoji, updatedLikes });
    } catch (error) {
      console.error("Lỗi trong quá trình xử lý cảm xúc:", error);
      socket.emit("reactionError", {
        message: "Không thể cập nhật lượt thích. Vui lòng thử lại.",
      });
    }
  });

  socket.on("getCommentsAll", async ({ postId }) => {
    console.log(postId);
    const comments = await Post.getComments(postId);
    io.emit("receiveCommentsList", comments);
    console.log("Danh sách bình luận đã được gửi đi:", comments);
  });

  socket.on("sharePost", async ({ postId, idUser, shareText }) => {
    try {
      console.log("[DEBUG] Bắt đầu quá trình chia sẻ bài viết:", {
        postId,
        idUser,
      });

      // 1. Chia sẻ bài viết và lấy kết quả
      const result = await Post.sharePost(postId, idUser, shareText);
      console.log("[DEBUG] Kết quả chia sẻ bài viết:", result);

      // 2. Lấy thông tin bài viết gốc từ Firebase
      const originalPost = await db.ref("posts").child(postId).once("value");
      if (!originalPost.exists()) {
        throw new Error("Post not found");
      }
      const postData = originalPost.val();
      console.log("[DEBUG] Thông tin bài viết gốc từ Firebase:", postData);

      // 3. Chuẩn bị dữ liệu thông báo
      const userInfo = await UserModel.getInfoByIdUser(idUser);
      const notificationData = {
        postId,
        postTitle: postData.title,
        preview: postData.text.substring(0, 50),
        senderAvatar: userInfo[0].avatar || "",
        senderName: userInfo[0].name,
        shareText: shareText,
        userAvatar: postData.userAvatar || "",
        userName: postData.userName,
      };

      // 4. Gửi thông báo về sự kiện chia sẻ cho client
      io.emit("postShared", {
        idUserShare: idUser,
        postId,
        shareCount: postData.shares || 0,
        sharedPostId: result.sharedPostId,
        success: true,
      });

      // 5. Gửi thông báo cho người tạo bài viết gốc (nếu không phải người chia sẻ)
      if (postData && postData.idUser !== idUser) {
        console.log(
          "[DEBUG] Gửi thông báo cho người tạo bài viết gốc:",
          postData.idUser
        );

        // Tạo thông báo chia sẻ bài viết trong Firebase
        const shareData = await NotificationModel.createShareNotification(
          idUser,
          postId,
          postData.idUser,
          notificationData
        );

        // Phát thông báo về sự kiện chia sẻ bài viết cho người nhận thông báo
        io.emit("notification", {
          originPostIdUser: postData.idUser,
          type: "postShared",
          data: shareData,
        });
      }
    } catch (error) {
      console.error("[ERROR] Lỗi khi chia sẻ bài viết:", error);

      // Gửi thông báo lỗi cho client
      socket.emit("postShared", {
        postId,
        success: false,
        error: error.message,
      });
    }
  });

  // Sự kiện đánh dấu thông báo đã đọc
  socket.on("markNotificationRead", async (notificationId) => {
    try {
      // Cập nhật trạng thái đã đọc trong cơ sở dữ liệu (có thể sử dụng Firebase hoặc MySQL)
      await Post.updateNotificationStatus(notificationId, { read: true });
      io.emit("notificationRead", { notificationId });
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
    }
  });

  // Revoke share event
  socket.on("revokeShare", async ({ shareId }) => {
    try {
      const shareInfo = await Post.getShareInfo(shareId);
      await Post.revokeShare(shareId);

      // Thông báo cho người được share
      io.to(`user_${shareInfo.sharedWith}`).emit("shareRevoked", {
        shareId,
        postId: shareInfo.postId,
      });

      socket.emit("revokeShareSuccess", { shareId });
    } catch (error) {
      console.error("Error revoking share:", error);
      socket.emit("revokeShareError", {
        message: error.message,
      });
    }
  });
  // Xử lý đánh dấu notification đã đọc
  socket.on("markNotificationAsRead", async ({ notificationId, userId }) => {
    try {
      const notificationRef = db.ref(`notifications/${notificationId}`);
      await notificationRef.update({ read: true });
      console.log(
        `Marked notification ${notificationId} as read for user ${userId}`
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      socket.emit("error", { message: "Failed to mark notification as read" });
    }
  });

  // Xử lý đánh dấu tất cả notifications đã đọc
  socket.on("markAllNotificationsAsRead", async ({ userId }) => {
    try {
      const userNotificationsRef = db
        .ref("notifications")
        .orderByChild("recipientId")
        .equalTo(userId);

      const snapshot = await userNotificationsRef.once("value");
      const updates = {};

      snapshot.forEach((child) => {
        if (!child.val().read) {
          updates[`notifications/${child.key}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
        console.log(`Marked all notifications as read for user ${userId}`);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      socket.emit("error", {
        message: "Failed to mark all notifications as read",
      });
    }
  });
  // Lắng nghe sự kiện lấy danh sách thông báo
  socket.on("getNotifications", async ({ idUser, limit = 20 }) => {
    try {
      console.log("[DEBUG] Lấy danh sách thông báo cho người dùng:", idUser);

      // Gọi hàm getNotifications từ model để lấy danh sách thông báo
      const notifications = await NotificationModel.getNotifications(
        idUser,
        limit
      );

      // Gửi danh sách thông báo cho client
      socket.emit("notifications", { notifications });
    } catch (error) {
      console.error("[ERROR] Lỗi khi lấy thông báo:", error);
      socket.emit("error", { message: "Lỗi khi lấy thông báo" });
    }
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    connectedUsers.delete(socket.id);
  });
};

export default handleSocketEvents;

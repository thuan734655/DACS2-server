import Post from "../models/postModel.js";
import UserModel from "../models/userModel.js";
import handleFileWebSocket from "../utils/handleFileWebSocket.js";
import NotificationModel from '../models/notificationModel.js';

const handleSocketEvents = (socket, io) => {
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

 // In notificationHandler.js
socket.on('newComment', async (data) => {
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
    io.emit('receiveComment', { newComment });

    // Get post info from Firebase instead of MySQL
    const postSnapshot = await db.ref(`posts/${postId}`).once('value');
    const post = postSnapshot.val();
    
    if (post && post.idUser !== idUser) {
      await createNotification(
        'comment',
        {
          userId: idUser,
          userName: user.name,
          userAvatar: user.avatar,
          postId,
          commentId,
          text
        },
        post.idUser
      );
      io.to(`user_${post.idUser}`).emit('newNotification');
    }

  } catch (error) {
    console.error('Error handling comment:', error);
    socket.emit('error', { message: 'Failed to add comment' });
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
      console.log("[DEBUG] Line 165 - wsServer.js - newReaction event");
      console.log("[DEBUG] Input data:", { postId, emoji, idUser });
      
      const updatedLikes = await Post.likePost(postId, emoji, idUser);
      console.log("[DEBUG] Line 169 - wsServer.js - likePost result:", updatedLikes);

      if (updatedLikes === "duplicate") {
        await Post.deleteLike(idUser, postId, emoji);
        console.log("[DEBUG] Line 173 - wsServer.js - Deleted duplicate like");
      } else {
        console.log("[DEBUG] Line 175 - wsServer.js - Creating notification");
        const post = await Post.getPostById(postId);
        console.log("[DEBUG] Line 177 - wsServer.js - Found post:", post);
        
        const [userInfo] = await UserModel.getInfoByIdUser(idUser);
        console.log("[DEBUG] Line 180 - wsServer.js - Found user info:", userInfo);

        if (!userInfo || !userInfo[0].fullName) {
          console.error("[DEBUG] Line 183 - wsServer.js - Invalid user info:", userInfo);
          throw new Error("Invalid user info");
        }

        if (post && post.idUser !== idUser) {
          console.log("[DEBUG] Line 188 - wsServer.js - Creating notification for post owner:", post.idUser);
          try {
            const notificationData = {
              postId,
              userId: idUser,
              userName: userInfo[0].fullName,
              userAvatar: userInfo[0].avatar || '',
              emoji
            };
            console.log("[DEBUG] Line 197 - wsServer.js - Notification data:", notificationData);
            const notification = await NotificationModel.createNotification(
             { type:'like',
             data: notificationData,
              recipientId:  post.idUser}
            );
            console.log("[DEBUG] Line 204 - wsServer.js - Created notification:", notification);
            
            io.to(`user_${post.idUser}`).emit('newNotification', notification);
            console.log("[DEBUG] Line 207 - wsServer.js - Emitted newNotification event");
          } catch (notifError) {
            console.error("[DEBUG] Line 209 - wsServer.js - Error creating notification:", notifError);
            throw notifError;
          }
        } else {
          console.log("[DEBUG] Line 213 - wsServer.js - Skipping notification");
          if (!post) console.log("[DEBUG] Line 214 - wsServer.js - Post not found");
          if (post.idUser === idUser) console.log("[DEBUG] Line 215 - wsServer.js - Same user");
        }
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
      console.error("[DEBUG] Line 221 - wsServer.js - Main error in newReaction:", error);
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

  // Share post event
  socket.on("sharePost", async ({ postId, idUser, shareText }) => {
    try {
      console.log("Sharing post:", { postId, idUser, shareText });
      const result = await Post.sharePost(postId, idUser, shareText);

      // Lấy thông tin bài viết gốc và số lượt share mới
      const originalPost = await Post.getPostById(postId);
      console.log("Original post:", originalPost);

      // Emit event cập nhật số lượt share cho tất cả client
      io.emit("postShared", {
        postId,
        shareCount: originalPost.shares || 0,
      });

      // Nếu người share khác với người tạo bài viết gốc, gửi thông báo
      if (originalPost && originalPost.idUser !== idUser) {
        io.to(`user_${originalPost.idUser}`).emit("postSharedNotification", {
          postId,
          sharedBy: idUser,
          sharedPostId: result.sharedPostId,
        });
      }

      // Tạo thông báo khi có người share
      const [userInfo] = await UserModel.getInfoByIdUser(idUser);
      if (originalPost && originalPost.idUser !== idUser) {
        await NotificationModel.createNotification('share', {
          postId,
          sharedPostId: result.sharedPostId,
          userId: idUser,
          userName: userInfo.name,
          userAvatar: userInfo.avatar
        }, originalPost.idUser);
        io.to(`user_${originalPost.idUser}`).emit('newNotification');
      }

      socket.emit("sharePostSuccess", result);
    } catch (error) {
      console.error("Error sharing post:", error);
      socket.emit("sharePostError", {
        message: "Failed to share post",
        error: error.message,
      });
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

  // Notification Events
  socket.on('getNotifications', async ({ idUser }) => {
    if (!idUser) {
      console.error('No idUser provided in getNotifications event');
      socket.emit('notificationsList', []);
      return;
    }

    try {
      const notifications = await NotificationModel.getNotifications(idUser);
      socket.emit('notificationsList', notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      socket.emit('notificationsList', []);
    }
  });

  socket.on('markNotificationRead', async ({ notificationId, idUser }) => {
    if (!notificationId || !idUser) {
      console.error('Missing notificationId or idUser in markNotificationRead event');
      return;
    }

    try {
      await NotificationModel.markAsRead(notificationId);
      const notifications = await NotificationModel.getNotifications(idUser);
      socket.emit('notificationsList', notifications || []);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  socket.on('markAllNotificationsRead', async ({ idUser }) => {
    try {
      await NotificationModel.markAllAsRead(idUser);
      const notifications = await NotificationModel.getNotifications(idUser);
      socket.emit('notificationsList', notifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });

  socket.on('deleteNotification', async ({ notificationId, idUser }) => {
    try {
      await NotificationModel.deleteNotification(notificationId);
      const notifications = await NotificationModel.getNotifications(idUser);
      socket.emit('notificationsList', notifications);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  });

  socket.on('deleteAllNotifications', async ({ idUser }) => {
    try {
      await NotificationModel.deleteAllNotifications(idUser);
      socket.emit('notificationsList', []);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  });

  // Thêm event để join room cho notifications
  socket.on('joinNotificationRoom', ({ idUser }) => {
    console.log(`User ${idUser} joining notification room`);
    socket.join(`user_${idUser}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

export default handleSocketEvents;

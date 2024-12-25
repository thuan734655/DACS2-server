import connectDB from "../config/ConnectDB.js";
import db from "../config/firebaseConfig.js";
import NotificationModel from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import ReportModel from "../models/reportModel.js";
import ReportMode from "../models/reportModel.js";
import handleEmail from "../models/sendEmailModel.js";
import UserModel from "../models/userModel.js";
import handleFileWebSocket from "../utils/handleFileWebSocket.js";
import { createAndEmitNotification } from "../utils/notificationForm.js";

const handleSocketEvents = (socket, io, onlineUsers) => {
  socket.on("newPost", async ({ post }) => {
    console.log("Post creation started");
    try {
      // Xử lý tệp tin nếu có
      let mediaUrls = [];
      if (post.listFileUrl && post.listFileUrl.length > 0) {
        mediaUrls = handleFileWebSocket(post.listFileUrl);
      }

      // Lấy thông tin người dùng
      const [userInfo] = await UserModel.getInfoByIdUser(post.idUser);

      // Chuẩn bị dữ liệu bài đăng
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
        privacy: post.privacy || "public", // Quyền riêng tư mặc định là "public"
      };

      // Lưu bài đăng vào cơ sở dữ liệu
      const postId = await Post.createPost(postData);

      // Dữ liệu trả về
      const postResponse = {
        postId: postId,
        ...postData,
        infoUserList: {
          [post.idUser]: { id: post.idUser, ...userInfo[0] },
        },
        groupedLikes: {},
        commentCount: 0,
      };

      // Lấy danh sách bạn bè
      const friendsList = await UserModel.getFriendsList(post.idUser);

      // Phát bài đăng dựa trên quyền riêng tư
      if (postData.privacy === "public") {
        io.emit("receiveNewPost", { post: postResponse });
      } else if (postData.privacy === "friends") {
        console.log(onlineUsers, "fdsf");
        // Lặp qua danh sách bạn bè và gửi thông báo cho những người đang online
        friendsList.forEach((idUser) => {
          // Tìm socket.id của user dựa trên idUser trong onlineUsers
          let targetSocketId = null;

          // Duyệt qua các phần tử trong onlineUsers để tìm socketId tương ứng với idUser
          onlineUsers.forEach((userId, socketId) => {
            if (userId == idUser.idUser || userId == post.idUser) {
              targetSocketId = socketId;
            }
          });

          // Kiểm tra nếu tìm thấy socket.id của user đó và gửi bài đăng
          if (targetSocketId) {
            io.to(targetSocketId).emit("receiveNewPost", {
              post: postResponse,
            });
          } else {
            console.log(`User ${idUser} is not online.`);
          }
        });
      } else if (postData.privacy === "private") {
        let targetSocketId = null;
        onlineUsers.forEach((userId, socketId) => {
          if (userId == post.idUser) {
            targetSocketId = socketId;
          }
        });
        if (targetSocketId) {
          io.to(targetSocketId).emit("receiveNewPost", { post: postResponse });
        }
      }
      console.log(`Post broadcasted with privacy: ${postData.privacy}`);
    } catch (error) {
      console.error("Error creating post:", error);
      socket.emit("postError", { message: "Failed to create post" });
    }
  });
  socket.on(
    "getPosts",
    async (userId, fetchedPostIdsFromClient, limit, page) => {
      try {
        const results = await Post.getAllPosts(
          userId,
          fetchedPostIdsFromClient,
          page,
          limit
        );

        console.log(results.posts, "hasMore");

        socket.emit("receivePosts", {
          posts: results.posts,
          page: page,
          hasMorePosts: results.hasMore,
        });
      } catch (error) {
        console.error("Error fetching posts:", error);
        socket.emit("error", { message: "Error fetching posts" });
      }
    }
  );
  socket.on(
    "getPostOfUser",
    async (userId, fetchedPostIdsFromClient, limit, page, isFriendRequest) => {
      try {
        const results = await Post.getAllUserPostsAndShares(
          userId,
          fetchedPostIdsFromClient,
          page,
          limit,
          isFriendRequest
        );
        console.log(results.hasMore, "hasMore");
        socket.emit("receivePostsAndSharePostOfUser", {
          posts: results.posts,
          page: page,
          hasMorePosts: results.hasMore,
        });
      } catch (error) {
        console.error("Error fetching posts:", error);
        socket.emit("error", { message: "Error fetching posts" });
      }
    }
  );
  socket.on("newComment", async (data) => {
    const { postId, idUser, text, listFileUrl, user } = data.comment;
    const TYPE = "POST_COMMENT";
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
      //  Lấy thông tin bài viết gốc từ Firebase
      const originalPost = await db.ref("posts").child(postId).once("value");
      if (!originalPost.exists()) {
        throw new Error("Post not found");
      }

      const postData = originalPost.val();
      if (postData.idUser !== idUser) {
        const userInfo = await UserModel.getInfoByIdUser(idUser);
        const notificationData = {
          type: TYPE,
          commentId,
          createdAt: Date.now(),
          postId: postId,
          read: false,
          senderAvatar: userInfo[0][0].avatar || "",
          senderName: userInfo[0][0].fullName || "",
          senderId: idUser,
          recipientId: postData.idUser,
        };
        await createAndEmitNotification(io, notificationData);
      }
      io.emit("receiveComment", { newComment });
      console.log("Bình luận đã được thêm và gửi đi:", newComment);
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  });
  socket.on("replyComment", async ({ commentId, replyData }) => {
    const { postId, idUser, text, listFileUrl, user } = replyData;
    const TYPE = "POST_REPLY_COMMENT";
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

      //  Lấy thông tin bài viết gốc từ Firebase
      const originalComment = await db
        .ref("commentsList")
        .child(commentId)
        .once("value");
      if (!originalComment.exists()) {
        throw new Error("Post not found");
      }
      const commentData = originalComment.val();
      if (commentData.idUser !== idUser) {
        if (commentData.idUser !== idUser) {
          const userInfo = await UserModel.getInfoByIdUser(idUser);
          const notificationData = {
            type: TYPE,
            replyId,
            commentId,
            createdAt: Date.now(),
            postId: postId,
            read: false,
            senderAvatar: userInfo[0][0].avatar || "",
            senderName: userInfo[0][0].fullName || "",
            senderId: idUser,
            recipientId: commentData.idUser,
          };
          await createAndEmitNotification(io, notificationData);
        }
      }
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
    const TYPE = "POST_REPLY_TO_REPLY";
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
      //  Lấy thông tin bài viết gốc từ Firebase
      const originalComment = await db
        .ref("replies")
        .child(replyId)
        .once("value");
      if (!originalComment.exists()) {
        throw new Error("Post not found");
      }
      const commentData = originalComment.val();

      const userInfo = await UserModel.getInfoByIdUser(idUser);
      const notificationData = {
        type: TYPE,
        replyId: replyKey,
        parentReplyID: replyId,
        createdAt: Date.now(),
        postId: postId,
        read: false,
        senderAvatar: userInfo[0][0].avatar || "",
        senderName: userInfo[0][0].fullName || "",
        senderId: idUser,
        recipientId: commentData.idUser,
      };
      await createAndEmitNotification(io, notificationData);

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
      const TYPE = "POST_REACTION";
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
      //  Lấy thông tin bài viết gốc từ Firebase
      const originalPost = await db.ref("posts").child(postId).once("value");
      if (!originalPost.exists()) {
        throw new Error("Post not found");
      }
      const postData = originalPost.val();

      const userInfo = await UserModel.getInfoByIdUser(idUser);
      if (idUser !== postData.idUser) {
        const notificationData = {
          type: TYPE,
          content: `${emoji}`,
          createdAt: Date.now(),
          postId: postId,
          read: false,
          senderAvatar: userInfo[0][0].avatar || "",
          senderName: userInfo[0][0].fullName || "",
          senderId: idUser,
          recipientId: postData.idUser,
        };
        await createAndEmitNotification(io, notificationData);
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

  socket.on("getPostById", async ({ postId }) => {
    if (postId) {
      const postData = await Post.getPostById(postId);

      socket.emit("res_getPostById", postData);
    } else {
      console.log("postId invalid");
    }
  });

  socket.on("sharePost", async ({ postId, idUser, shareText }) => {
    try {
      const TYPE = "POST_SHARE";
      const result = await Post.sharePost(postId, idUser, shareText);

      //  Lấy thông tin bài viết gốc từ Firebase
      const originalPost = await db.ref("posts").child(postId).once("value");
      if (!originalPost.exists()) {
        throw new Error("Post not found");
      }
      const postData = originalPost.val();
      if (postData.idUser !== idUser) {
        const userInfo = await UserModel.getInfoByIdUser(idUser);
        const notificationData = {
          senderAvatar: userInfo[0][0].avatar || "",
          senderName: userInfo[0][0].fullName || "",
          senderId: idUser,
          shareText: shareText,
          recipientId: postData.idUser,
          type: TYPE,
          createdAt: Date.now(),
          postId: postId,
          read: false,
        };
        await createAndEmitNotification(io, notificationData);
      }
      io.emit("postShared", {
        senderId: idUser,
        postId,
        shareCount: postData.shares || 0,
        sharedPostId: result.sharedPostId,
        success: true,
      });
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
  socket.on("getNotificationNoRead", async () => {});
  socket.on("deteleNotificaiton", async ({ idNotification }) => {
    try {
      console.log(idNotification);
      await NotificationModel.deleteNotification(idNotification);
      console.log(`Deleted notification ${idNotification}`);
    } catch (error) {
      console.error("Error deleting notification:", error);
      socket.emit("errorDeleteNotification", {
        message: "Failed to delete notification",
      });
    }
  });
  socket.on("report", async (content) => {
    const result = await ReportModel.createReportPost(content);

    if (content.type === "POST") {
      socket.emit("responseReportPost", result);
    } else if (content.type === "COMMENT") {
      socket.emit("responseReportComment", result);
    } else {
      socket.emit("responseReportReply", result);
    }
  });

  socket.on("SetPrivacyPost", async ({ postId, privacy, idUser }) => {
    try {
      const success = await Post.setPrivacyPost(postId, privacy);
      onlineUsers.forEach((userId, socketId) => {
        if (userId == idUser && userId) {
          io.to(socketId).emit("responsePrivacyPost", {
            postId,
            privacy,
            success,
          });
        }
      });
    } catch (error) {
      console.error("Error setting privacy for post:", error);
    }
  });
  socket.on("setContentPost", async ({ postId, text, idUser }) => {
    try {
      const resultUpdate = await Post.setContentPost(postId, text);
      onlineUsers.forEach((userId, socketId) => {
        if (userId == idUser && userId) {
          io.to(socketId).emit("responseContentPost", {
            postId,
            text,
            success: resultUpdate,
          });
        }
      }); // Gửi thông tin bài viết đã được cập nhật cho client
    } catch (error) {
      console.error("Error setting content for post:", error);
    }
  });
  socket.on("deletePost", async ({ postId, idUser }) => {
    const result = await Post.deletePost(postId);
    if (result) {
      onlineUsers.forEach((userId, socketId) => {
        if (userId == idUser && userId) {
          io.to(socketId).emit("responseDeletePost", {
            postId,
            success: result,
          });
        }
      });
    }
  });
  socket.on("getAllReport", async ({ limit, lastKey }) => {
    const reports = await ReportModel.getAllReport(limit, lastKey);
    socket.emit("responseAllReport", reports);
  });
  socket.on("deleteReport", async (idReport) => {
    const result = await ReportModel.deleteReport(idReport);
    socket.emit("responseDeleteReport", result);
  });
  socket.on("deleteComment", async ({ commentId, idUser }) => {
    console.log("deleteComment", commentId);
    const result = await Post.deleteComment(commentId);
    if (result) {
      onlineUsers.forEach((userId, socketId) => {
        if (userId == idUser && userId) {
          io.to(socketId).emit("responseDeleteComment", {
            success: result,
          });
        }
      });
    }
  });
  socket.on("setReadReport", async ({ idReport, status, idUser }) => {
    const result = await ReportModel.updateReportStatus(idReport, status);
    if (result) {
      onlineUsers.forEach((userId, socketId) => {
        if (userId == idUser && userId) {
          io.to(socketId).emit("responseUpdateReadReport", {
            success: result,
          });
        }
      });
    }
  });
  socket.on("sendMail", async (data, type, idUser) => {
    let socketIdIdOfUser = "";
    onlineUsers.forEach((userId, socketId) => {
      if (userId == idUser && userId) {
        socketIdIdOfUser = socketId;
      }
    });
    try {
      const { id, dataMail } = data; // id là postId hoặc commentId
      let postIduser = null;
      // 1. Xác định idUser dựa trên loại (type: POST hoặc COMMENT)
      if (type === "POST") {
        const postSnapshot = await db.ref(`posts/${id}`).once("value");
        const postData = postSnapshot.val();

        if (!postData) {
          throw new Error("Post not found");
        }
        postIduser = postData.idUser;
      } else if (type === "COMMENT") {
        const commentSnapshot = await db
          .ref(`commentsList/${id}`)
          .once("value");
        const commentData = commentSnapshot.val();

        if (!commentData) {
          throw new Error("Comment not found");
        }
        postIduser = commentData.idUser;
      }

      if (!postIduser) {
        throw new Error("User ID not found");
      }

      // 2. Truy vấn email từ bảng account trong MySQL
      const query = "SELECT email FROM account WHERE idUser = ?";
      const [rows] = await connectDB.execute(query, [postIduser]);

      if (rows.length === 0 || !rows[0].email) {
        throw new Error("Email not found for user");
      }

      dataMail.email = rows[0].email;
      console.log(dataMail);
      await handleEmail(dataMail);

      // 4. Phản hồi thành công qua socket
      io.to(socketIdIdOfUser).emit("responseSendEmail", { success: true });
    } catch (error) {
      // Phản hồi lỗi qua socket
      console.error("Error sending email:", error);
      io.to(socketIdIdOfUser).emit("responseSendEmail", { success: false });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    onlineUsers.delete(socket.id);
  });
};

export default handleSocketEvents;

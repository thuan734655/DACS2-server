import Post from "../models/postModel.js";
import UserModel from "../models/userModel.js";
import handleFileWebSocket from "../utils/handleFileWebSocket.js";

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
        post: postData,
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
        shareCount: originalPost.shares || 0 
      });

      // Nếu người share khác với người tạo bài viết gốc, gửi thông báo
      if (originalPost && originalPost.idUser !== idUser) {
        io.to(`user_${originalPost.idUser}`).emit("postSharedNotification", {
          postId,
          sharedBy: idUser,
          sharedPostId: result.sharedPostId
        });
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
        postId: shareInfo.postId
      });

      socket.emit("revokeShareSuccess", { shareId });
    } catch (error) {
      console.error("Error revoking share:", error);
      socket.emit("revokeShareError", {
        message: error.message
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

export default handleSocketEvents;

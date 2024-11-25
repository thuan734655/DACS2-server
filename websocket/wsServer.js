import Post from "../models/postModel.js";
import handleFileWebSocket from "../utils/handleFileWebSocket.js";

const handleSocketEvents = (socket, io) => {
  console.log("User connected:", socket.id);

  socket.on("newComment", async (data) => {
    const { postId, user, text, listFileUrl } = data.comment;

    try {
      const fileUrls = handleFileWebSocket(listFileUrl);

      const commentContainer = {
        postId,
        user,
        text,
        fileUrls,
        timestamp: Date.now(),
      };
      const commentId = await Post.addComment(commentContainer);

      const newComment = {
        id: commentId,
        ...commentContainer,
      };

      io.emit("receiveComment", { postId, newComment });
      console.log("Bình luận đã được thêm và gửi đi:", newComment);
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  });
  socket.on("replyComment", async ({ commentId, replyData }) => {
    const { postId, user, text, listFileUrl } = replyData;

    try {
      const fileUrls = handleFileWebSocket(listFileUrl);

      const newReplyData = {
        postId,
        user,
        text,
        fileUrls,
        timestamp: Date.now(),
      };
      const replyId = await Post.replyToComment({ commentId, newReplyData });

      const newReply = {
        id: replyId,
        ...replyData,
        timestamp: Date.now(),
      };

      io.emit("receiveReplyToComment", { commentId, newReply });
      console.log("Phản hồi đã được thêm và gửi đi:", newReply);
    } catch (error) {
      console.error("Lỗi khi thêm phản hồi:", error);
    }
  });
  socket.on("replyToReply", async ({ replyId, replyData }) => {
    console.log(replyId, 123);
    const { postId, user, text, listFileUrl } = replyData;
    try {
      const fileUrls = handleFileWebSocket(listFileUrl);
      const newReplyData = {
        postId,
        user,
        text,
        fileUrls,
        timestamp: Date.now(),
      };
      const replyKey = await Post.replyToReply({ replyId, newReplyData });

      const newReplyToReply = { replyId: replyKey, newReplyData };
      io.emit("receiveReplyToReply", { replyId, newReplyToReply });
      console.log("Phản hồi dã được thêm và gửi đi:", newReplyToReply);
    } catch (err) {
      console.error("reply to reply failed", err);
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

export default handleSocketEvents;

import Post from "../models/postModel.js";
import handleFileWebSocket from "../utils/handleFileWebSocket.js";

const handleSocketEvents = (socket, io) => {
  console.log("User connected:", socket.id);

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
      console.log(user);
      const newComment = {
        commentId: commentId,
        postId,
        user,
        ...commentContainer,
      };
      console.log(Object.entries(newComment));
      io.emit("receiveComment", { newComment });
      console.log("Bình luận đã được thêm và gửi đi:", newComment);
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  });
  socket.on("replyComment", async ({ commentId, replyData }) => {
    const { postId, idUser, text, listFileUrl } = replyData;
    console.log(replyData, commentId, 111);
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
    console.log(replyData, 123);
    const { postId, idUser, text, listFileUrl } = replyData;
    try {
      const fileUrls = handleFileWebSocket(listFileUrl);
      const newReplyData = {
        postId,
        idUser,
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
  socket.on("getCommentsAll", async ({ postId }) => {
    const comments = await Post.getComments(postId);
    console.log(comments, 123);
    io.emit("receiveCommentsList", comments);
    console.log("Danh sách bình luận đã được gửi đi:", comments);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};

export default handleSocketEvents;

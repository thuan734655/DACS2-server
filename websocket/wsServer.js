import { getLikes, likePost } from "../controllers/postController.js";
import Post from "../models/postModel.js";

// Hàm xử lý các sự kiện WebSocket
const handleSocketEvents = (socket, io) => {
  console.log("User connected:", socket.id);

  // Lắng nghe sự kiện bình luận mới
  socket.on("newComment", async ({ postId, comment }) => {
    try {
      // Thêm bình luận vào cơ sở dữ liệu
      await addComment(postId, comment);
      // Phát sự kiện nhận bình luận mới đến tất cả các client
      socket.broadcast.emit("receiveComment", { postId, comment });
      console.log("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  });

  // WebSocket event handling for likePost
  socket.on("newReaction", async ({ postId, emoji, idUser }) => {
    try {
      // Call the `likePost` function to handle updating likes
      const updatedLikes = await likePost(postId, emoji, idUser);
      if (updatedLikes.updatedLikes === "duplicate") {
        await Post.deleteLike(idUser, postId, emoji);
        console.log("Delete");
      }
      const listLikes = await getLikes(postId);
      // Nhóm các userId theo emoji
      const grouped = listLikes ? {} : listLikes;

      Object.entries(listLikes).forEach(([userId, emoji]) => {
        if (!grouped[emoji]) {
          grouped[emoji] = []; // Nếu chưa có emoji này trong nhóm, tạo mới một mảng
        }
        grouped[emoji].push(userId); // Thêm userId vào mảng tương ứng với emoji
      });

      // Emit `receiveReaction` to all clients to update the reactions
      io.emit("receiveReaction", { postId, grouped });

      // Emit `reactionSuccess` to the client that triggered the event
      socket.emit("reactionSuccess", { postId, emoji, updatedLikes });
    } catch (error) {
      console.error("Error in liking post:", error);

      // Emit `reactionError` to the client if an error occurs
      socket.emit("reactionError", {
        message: "Failed to update like. Please try again.",
      });
    }
  });

  // Xử lý khi người dùng ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
};

export default handleSocketEvents;

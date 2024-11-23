import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import path from "path";
import Post from "../models/postModel.js";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const handleSocketEvents = (socket, io) => {
  console.log("User connected:", socket.id);

  socket.on("newComment", async (data) => {
    console.log(12);
    const { postId, user, text, listFileUrl } = data.comment;

    try {
      const fileUrls = [];
      if (listFileUrl && listFileUrl.length > 0) {
        listFileUrl.forEach((file) => {
          const { name, type, data } = file;

          const base64Data = data.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");

          // Tạo tên file duy nhất bằng cách sử dụng thời gian hiện tại và UUID
          const fileExtension = path.extname(name); // Lấy phần mở rộng của file (ví dụ: .jpg, .png)
          const sanitizedFileName = `${Date.now()}_${uuidv4()}${fileExtension}`; // Tên file duy nhất
          const uploadDir = path.join(__dirname, "../images");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, sanitizedFileName);

          // Lưu file
          fs.writeFileSync(filePath, buffer);
          console.log(`File đã lưu tại: ${filePath}`);

          // Lưu đường dẫn file
          fileUrls.push(`/images/${sanitizedFileName}`);
        });
      }

      const commentContainer = { postId, user, text, fileUrls };
      const commentId = await Post.addComment(commentContainer);
      const newComment = {
        [commentId]: commentContainer,
      };
      socket.emit("receiveComment", { newComment });
      console.log("Bình luận đã được thêm và gửi đi.");
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  });

  socket.on("newReaction", async ({ postId, emoji, idUser }) => {
    try {
      // Call the `likePost` function to handle updating likes
      const updatedLikes = await Post.likePost(postId, emoji, idUser);
      if (updatedLikes === "duplicate") {
        await Post.deleteLike(idUser, postId, emoji);
        console.log("Delete");
      }
      const listLikes = await Post.getLikes(postId);
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

  socket.on(
    "replyComment",
    async ({ postId, commentId, replyId, replyData }) => {
      const result = await Post.replyToComment(
        postId,
        commentId,
        replyId,
        replyData
      );
      if (result) {
        socket.emit("receiveReply", { postId, commentId, replyId, replyData });
        console.log("Phản hồi đã được thêm và gửi đi.");
      } else {
        console.log("repply error");
      }
    }
  );

  // Xử lý khi người dùng ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
};

export default handleSocketEvents;
